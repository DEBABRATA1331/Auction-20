import { Player, Character } from '../types/game';
import { CHARACTERS_DATABASE } from '../data/characters';

export const TOTAL_BUDGET = 20.0;
export const MIN_BID = 1.0;
export const BID_STEP = 0.25;
export const MIN_TEAM_SIZE = 5;
export const MAX_ROSTER_SIZE = 50; // Unlimited bonus players allowed

export const PLAYER_COLORS = [
  '#e11d2e', // Red
  '#ffc21a', // Yellow
  '#3b82f6', // Electric Blue
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ec4899', // Pink
];

export const CHAR_BY_ID: Record<string, Character> = {};
CHARACTERS_DATABASE.forEach(c => {
  CHAR_BY_ID[c.id] = c;
});

export function purse(player: Player): number {
  return Math.max(0, Number((TOTAL_BUDGET - player.spent).toFixed(2)));
}

/**
 * Calculates max allowable bid for player.
 * If player has fewer than 5 characters, reserves ₹1 for remaining future mandatory slots.
 */
export function maxBid(player: Player): number {
  const currentPurse = purse(player);
  const slotsAfterThis = player.roster.length + 1;
  const remainingSlotsNeeded = Math.max(0, MIN_TEAM_SIZE - slotsAfterThis);
  const reserveNeeded = remainingSlotsNeeded * MIN_BID;
  
  const allowed = Math.floor((currentPurse - reserveNeeded) * 100) / 100;
  return Math.max(0, allowed);
}

/**
 * Bonus point percentage rule:
 * Bonus player provides 10% to 25% of their real value (rating), depending on character rarity/strength.
 */
export function getCharacterBonusPoints(c: Character): number {
  // Scale dynamically from 10% (for rating 10) to 25% (for rating 25)
  const pct = 0.10 + Math.max(0, Math.min(1, (c.totalRating - 10) / 15)) * 0.15;
  return Number((c.totalRating * pct).toFixed(2));
}

export function money(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
