import { POKEMON_CARDS_GEN1 } from './pokemonCardsGen1';
import { POKEMON_CARDS_GEN23 } from './pokemonCardsGen23';
import { POKEMON_CARDS_GEN456 } from './pokemonCardsGen456';
import { POKEMON_CARDS_GEN789 } from './pokemonCardsGen789';

export type CardRarity = 'SSR' | 'UR' | 'SR' | 'R';

export interface PokemonCardData {
  id: number; // National Pokedex ID
  nameZh: string; // Cantonese Name
  nameEn: string;
  nameJa: string;
  type: string; // e.g. '電', '火', '水', '草', '超能力', '龍', '幽靈', '妖精', '格鬥', '惡', '飛行', '冰', '岩石', '地面', '鋼鐵', '一般', '毒'
  typeColor: string;
  bgGradient: string;
  rarity: CardRarity;
  hp: number;
  imageUrl: string;
  moves: {
    nameZh: string;
    nameEn: string;
    damage: number | string;
    desc: string;
  }[];
  weakness: string;
  resistance?: string;
  quote: string;
}

// 100 Unique Pokemon Cards across All Generations (Gen 1 - Gen 9)
export const POKEMON_CARDS_DATA: PokemonCardData[] = [
  ...POKEMON_CARDS_GEN1,
  ...POKEMON_CARDS_GEN23,
  ...POKEMON_CARDS_GEN456,
  ...POKEMON_CARDS_GEN789,
];
