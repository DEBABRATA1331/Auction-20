import { Player, PlayerScore, BattleCategory } from '../types/game';
import { CHAR_BY_ID } from './rules';

const CATEGORIES: BattleCategory[] = ['Power', 'Defence', 'Speed', 'Intelligence', 'Special'];

export function evaluatePlayers(players: Player[]): PlayerScore[] {
  // First pass: compute hidden internal team totals
  const rawList = players.map(player => {
    // Sort player's roster internally by totalRating descending
    const allChars = player.roster.map(id => CHAR_BY_ID[id]).filter(Boolean);
    allChars.sort((a, b) => b.totalRating - a.totalRating);

    // Top 5 characters form the primary combat core
    const coreChars = allChars.slice(0, 5);
    const coreRating = coreChars.reduce((sum, c) => sum + c.totalRating, 0);

    const categoryTotals: Record<BattleCategory, number> = {
      Power: 0,
      Defence: 0,
      Speed: 0,
      Intelligence: 0,
      Special: 0,
    };

    coreChars.forEach(c => {
      categoryTotals.Power += c.attributes.power;
      categoryTotals.Defence += c.attributes.defence;
      categoryTotals.Speed += c.attributes.speed;
      categoryTotals.Intelligence += c.attributes.intelligence;
      categoryTotals.Special += c.attributes.special;
    });

    let strongestCategory: BattleCategory = 'Power';
    let weakestCategory: BattleCategory = 'Power';
    let maxCatVal = -1;
    let minCatVal = 999;

    CATEGORIES.forEach(cat => {
      const val = categoryTotals[cat];
      if (val > maxCatVal) {
        maxCatVal = val;
        strongestCategory = cat;
      }
      if (val < minCatVal) {
        minCatVal = val;
        weakestCategory = cat;
      }
    });

    // Extra players bonus: each character beyond 5 awards +1.0 bonus, capped strictly at 3.0
    const extraCount = Math.max(0, player.roster.length - 5);
    const extraBonus = Math.min(3.0, Number((extraCount * 1.0).toFixed(1)));

    // Budget efficiency
    const spentAmount = Math.max(1, player.spent);
    const roiEfficiency = Number((coreRating / spentAmount).toFixed(2));

    // Best buy: highest ratio of rating to price (keep rating hidden, store name & price only)
    let bestBuyName = '';
    let bestBuyPrice = 0;
    let bestRatio = 0;
    player.roster.forEach(id => {
      const c = CHAR_BY_ID[id];
      const p = player.prices[id] || 1;
      if (c) {
        const ratio = c.totalRating / p;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestBuyName = c.name;
          bestBuyPrice = p;
        }
      }
    });

    return {
      player,
      coreRating,
      extraCount,
      extraBonus,
      categoryTotals,
      strongestCategory,
      weakestCategory,
      minCatVal,
      roiEfficiency,
      bestBuy: bestBuyName ? { name: bestBuyName, price: bestBuyPrice, rating: 0 } : undefined,
    };
  });

  const maxEfficiency = Math.max(...rawList.map(r => r.roiEfficiency), 1);

  // Second pass: compute normalized scores
  const scoredList = rawList.map(raw => {
    // 1. Squad Combat Power (60 pts max) - out of 125 theoretical max
    const combatScore = Number(((raw.coreRating / 125) * 60).toFixed(1));

    // 2. Extra Squad Bonus (10 pts max) - based on extra players (max 3.0 bonus points scaled)
    const bonusScore = Number(((raw.extraBonus / 3.0) * 10).toFixed(1));

    // 3. Tactical Balance (15 pts max) - based on weakest category
    const balanceScore = Number(((raw.minCatVal / 25) * 15).toFixed(1));

    // 4. Budget Efficiency (15 pts max) - relative to highest efficiency
    const valueScore = Number(((raw.roiEfficiency / maxEfficiency) * 15).toFixed(1));

    const totalScore = Number((combatScore + bonusScore + balanceScore + valueScore).toFixed(1));

    // Archetype
    let archetype = 'Balanced Contender';
    if (raw.extraBonus >= 3.0) archetype = 'Deep Bench Legion';
    else if (raw.categoryTotals.Power >= 20) archetype = 'Titan Heavyweights';
    else if (raw.categoryTotals.Speed >= 20) archetype = 'Lightning Blitzers';
    else if (raw.categoryTotals.Defence >= 20) archetype = 'Ironclad Fortress';
    else if (raw.categoryTotals.Intelligence >= 20) archetype = 'Master Tacticians';
    else if (raw.categoryTotals.Special >= 20) archetype = 'Mystic Disruptors';
    else if (raw.roiEfficiency > 5.5) archetype = 'Moneyball Efficiency Masters';

    const metrics = [
      { name: 'Squad Power', score: combatScore, max: 60, description: 'Core 5 Roster Combat' },
      { name: 'Extra Squad Bonus', score: bonusScore, max: 10, description: `+${raw.extraBonus.toFixed(1)}/3.0 Bonus (${raw.extraCount} Extra)` },
      { name: 'Tactical Balance', score: balanceScore, max: 15, description: `Synergy in ${raw.strongestCategory}` },
      { name: 'Budget Value', score: valueScore, max: 15, description: 'Auction Purse ROI' },
    ];

    return {
      player: raw.player,
      totalScore,
      rank: 1,
      metrics,
      activeRating: raw.coreRating,
      categoryTotals: raw.categoryTotals,
      strongestCategory: raw.strongestCategory,
      weakestCategory: raw.weakestCategory,
      benchDepth: raw.extraBonus,
      roiEfficiency: raw.roiEfficiency,
      archetype,
      bestBuy: raw.bestBuy,
      reason: '',
    };
  });

  // Sort descending by totalScore, then coreRating, then lowest spent
  scoredList.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.activeRating !== a.activeRating) return b.activeRating - a.activeRating;
    return a.player.spent - b.player.spent;
  });

  // Assign ranks & generate narrative reasons without revealing character-wise scores
  const winner = scoredList[0];
  const runnerUp = scoredList[1];

  scoredList.forEach((item, idx) => {
    item.rank = idx + 1;
    const bonusText = item.benchDepth > 0 ? ` with +${item.benchDepth.toFixed(1)} Extra Squad Bonus` : '';
    if (idx === 0) {
      if (runnerUp) {
        const lead = (item.totalScore - runnerUp.totalScore).toFixed(1);
        item.reason = `Secures 1st place (+${lead} lead) through superior combat strength and tactical cohesion${bonusText}.`;
      } else {
        item.reason = `Dominant champion with top-tier tactical squad construction${bonusText}.`;
      }
    } else {
      const gap = (winner.totalScore - item.totalScore).toFixed(1);
      item.reason = `Trails champion by ${gap} pts; lagged in tactical balance and squad depth compared to leader.`;
    }
  });

  return scoredList;
}
