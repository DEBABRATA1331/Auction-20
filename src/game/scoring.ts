import { Player, PlayerScore, BattleCategory } from '../types/game';
import { CHAR_BY_ID, getCharacterBonusPoints } from './rules';

const CATEGORIES: BattleCategory[] = ['Power', 'Defence', 'Speed', 'Intelligence', 'Special'];

export function evaluatePlayers(players: Player[]): PlayerScore[] {
  // First pass: compute hidden internal team totals
  const rawList = players.map(player => {
    // Player's chosen Best 5 Core heroes (fallback to top 5 if not selected)
    let coreIds = player.active && player.active.length === 5 ? [...player.active] : [];
    if (coreIds.length !== 5) {
      const sortedRoster = [...player.roster].sort((a, b) => {
        return (CHAR_BY_ID[b]?.totalRating || 0) - (CHAR_BY_ID[a]?.totalRating || 0);
      });
      coreIds = sortedRoster.slice(0, 5);
    }

    const coreChars = coreIds.map(id => CHAR_BY_ID[id]).filter(Boolean);
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

    // All characters NOT in Best 5 Core are BONUS players
    // Each bonus player earns 10% - 25% of their real value based on character strength
    const bonusIds = player.roster.filter(id => !coreIds.includes(id));
    const bonusPointsTotal = bonusIds.reduce((sum, id) => {
      const c = CHAR_BY_ID[id];
      return sum + (c ? getCharacterBonusPoints(c) : 0);
    }, 0);

    const totalBonus = Number(bonusPointsTotal.toFixed(1));

    // Budget efficiency (Core rating generated per Rupee spent)
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
      bonusCount: bonusIds.length,
      totalBonus,
      categoryTotals,
      strongestCategory,
      weakestCategory,
      minCatVal,
      roiEfficiency,
      bestBuy: bestBuyName ? { name: bestBuyName, price: bestBuyPrice, rating: 0 } : undefined,
    };
  });

  const maxEfficiency = Math.max(...rawList.map(r => r.roiEfficiency), 1);
  const maxBonusFound = Math.max(...rawList.map(r => r.totalBonus), 1);

  // Second pass: compute normalized scores
  const scoredList = rawList.map(raw => {
    // 1. Squad Combat Power (55 pts max) - out of 125 theoretical max (5 chars * 25)
    const combatScore = Number(((raw.coreRating / 125) * 55).toFixed(1));

    // 2. Bonus Players Value (15 pts max) - based on 10%-25% real value of bonus characters
    const bonusScore = Number(((raw.totalBonus / Math.max(15, maxBonusFound)) * 15).toFixed(1));

    // 3. Tactical Balance (15 pts max) - based on weakest category in Best 5
    const balanceScore = Number(((raw.minCatVal / 25) * 15).toFixed(1));

    // 4. Budget Efficiency (15 pts max) - relative to highest efficiency
    const valueScore = Number(((raw.roiEfficiency / maxEfficiency) * 15).toFixed(1));

    const totalScore = Number((combatScore + bonusScore + balanceScore + valueScore).toFixed(1));

    // Archetype assignment
    let archetype = 'Balanced Contender';
    if (raw.bonusCount >= 3) archetype = 'Deep Bench Legion';
    else if (raw.categoryTotals.Power >= 20) archetype = 'Titan Heavyweights';
    else if (raw.categoryTotals.Speed >= 20) archetype = 'Lightning Blitzers';
    else if (raw.categoryTotals.Defence >= 20) archetype = 'Ironclad Fortress';
    else if (raw.categoryTotals.Intelligence >= 20) archetype = 'Master Tacticians';
    else if (raw.categoryTotals.Special >= 20) archetype = 'Mystic Disruptors';
    else if (raw.roiEfficiency > 5.5) archetype = 'Moneyball Efficiency Masters';

    const metrics = [
      { name: 'Best 5 Power', score: combatScore, max: 55, description: 'Core Combat Rating' },
      { name: 'Bonus Bench', score: bonusScore, max: 15, description: `+${raw.totalBonus.toFixed(1)} Pts (${raw.bonusCount} Bonus Heroes)` },
      { name: 'Tactical Balance', score: balanceScore, max: 15, description: `Synergy in ${raw.strongestCategory}` },
      { name: 'Budget Value', score: valueScore, max: 15, description: 'Purse ROI' },
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
      benchDepth: raw.totalBonus,
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

  // Assign ranks & generate narrative reasons without revealing individual scores
  const winner = scoredList[0];
  const runnerUp = scoredList[1];

  scoredList.forEach((item, idx) => {
    item.rank = idx + 1;
    const bonusText = item.benchDepth > 0 ? ` plus +${item.benchDepth.toFixed(1)} Bonus Bench points` : '';
    if (idx === 0) {
      if (runnerUp) {
        const lead = (item.totalScore - runnerUp.totalScore).toFixed(1);
        item.reason = `Secures 1st place (+${lead} lead) through superior core combat power and tactical balance${bonusText}.`;
      } else {
        item.reason = `Dominant champion with top-tier tactical Best 5 selection${bonusText}.`;
      }
    } else {
      const gap = (winner.totalScore - item.totalScore).toFixed(1);
      item.reason = `Trails champion by ${gap} pts; lagged in core combat and bonus bench depth compared to 1st place.`;
    }
  });

  return scoredList;
}
