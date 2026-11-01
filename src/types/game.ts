export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type BattleCategory = 'Power' | 'Defence' | 'Speed' | 'Intelligence' | 'Special';

export interface CharacterAttributes {
  power: number;        // 1 to 5
  defence: number;      // 1 to 5
  speed: number;        // 1 to 5
  intelligence: number; // 1 to 5
  special: number;      // 1 to 5
}

export interface Character {
  id: string;
  name: string;
  franchise: string;
  rarity: Rarity;
  alignment: string;
  attributes: CharacterAttributes;
  totalRating: number;
  abilityName: string;
  abilityDescription: string;
  abilityTiming: string;
  reserveMerit: number;
  avatarColor: string;
  icon: string;
  imageFallback: string;
  quote?: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  spent: number;
  roster: string[]; // character IDs
  prices: Record<string, number>; // characterId -> purchase price
  active: string[]; // character IDs of chosen 5 active characters
}

export type ActionLog =
  | { type: 'sale'; charId: string; playerId: string; amount: number }
  | { type: 'skip'; charId: string };

export interface ScoreMetric {
  name: string;
  score: number;
  max: number;
  description: string;
}

export interface PlayerScore {
  player: Player;
  totalScore: number;
  rank: number;
  metrics: ScoreMetric[];
  activeRating: number;
  categoryTotals: Record<BattleCategory, number>;
  strongestCategory: BattleCategory;
  weakestCategory: BattleCategory;
  benchDepth: number;
  roiEfficiency: number; // Rating per Rupee
  archetype: string;
  bestBuy?: { name: string; price: number; rating: number };
  reason: string;
}
