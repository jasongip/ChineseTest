export interface PlayerProfile {
  id: string;
  name: string;
  avatarSeed: string;
  createdAt: number;
  rerollsRemaining: number;
}

export interface PlayerStats {
  allTimeAnswered: number;
  allTimeCorrect: number;
  allTimeCardsCount: number;
  weeklyAnswered: number;
  weeklyCorrect: number;
  weeklyCardsCount: number;
  battleWins: number;
  battleLosses: number;
  battleScore: number;
  lastUpdated: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  isCurrentPlayer?: boolean;
  avatarBg: string;
  badge: string;
  allTimeAnswered: number;
  allTimeCorrect: number;
  accuracy: number;
  cardsCount: number;
  weeklyAnswered: number;
  weeklyCorrect: number;
  battleWins: number;
  battleScore: number;
  deckCardIds: number[]; // 4 cards for battle
  lastUpdated?: number;
}

export type BattleQuestionType = 
  | 'audio_mc'       // 聽音四揀一
  | 'missing_mc'     // 缺字
  | 'english_mc'     // 英文對照
  | 'read_aloud'     // 朗讀特訓
  | 'scramble'       // 重組句子
  | 'comprehension'; // 短文理解

export interface BattleQuestion {
  id: string;
  type: BattleQuestionType;
  prompt: string;
  subPrompt?: string;
  targetWord?: string;
  questionText?: string;
  jyutping?: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  scrambleWords?: string[];
}
