import { Player, Character } from '../types/game';
import { CHARACTERS_DATABASE } from '../data/characters';

export const TOTAL_BUDGET = 20.0;
export const MIN_BID = 1.0;
export const BID_STEP = 0.25;
export const MIN_TEAM_SIZE = 5;
export const MAX_ROSTER_SIZE = 8;

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
 * Calculates max allowable bid for player so they can still field at least MIN_TEAM_SIZE (5) characters.
 * Each required future character requires at least MIN_BID (₹1.00).
 */
export function maxBid(player: Player): number {
  if (player.roster.length >= MAX_ROSTER_SIZE) return 0;
  
  const currentPurse = purse(player);
  const slotsAfterThis = player.roster.length + 1;
  const remainingSlotsNeeded = Math.max(0, MIN_TEAM_SIZE - slotsAfterThis);
  const reserveNeeded = remainingSlotsNeeded * MIN_BID;
  
  const allowed = Math.floor((currentPurse - reserveNeeded) * 100) / 100;
  return allowed >= MIN_BID ? allowed : 0;
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
