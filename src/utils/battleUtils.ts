import { PlayerProfile, PlayerStats, LeaderboardUser, BattleQuestion, BattleQuestionType } from '../types/battle';
import { VOCAB_PRACTICE_LIST } from '../data/vocabPracticeList';
import { SCRAMBLE_SENTENCES_DATA } from '../data/scrambleSentences';
import { READING_STORY_LIST } from '../data/readingComprehension';
import { POKEMON_CARDS_DATA, PokemonCardData } from '../data/pokemonCards';

const ADJECTIVES = [
  '機智', '神勇', '無敵', '閃電', '超級', '勇敢', '幽默', '得意', '聰明', '元氣',
  '星光', '迅捷', '暴風', '烈火', '極速', '開心', '幸運', '頑皮', '威風', '熱血',
  '古靈', '精靈', '霸氣', '靈巧', '無畏', '閃亮', '活力', '神奇', '天才', '萌萌'
];

const NOUNS = [
  '噴火龍', '比卡超', '戰鬥機械人', '獨角獸', '貓咪', '恐龍', '小精靈', '外星人', '超人', '忍者',
  '大師', '熊貓', '神獸', '火箭', '戰神', '魔法師', '探險家', '小隊長', '獵鷹', '劍客',
  '戰士', '海豚', '獅子', '猛虎', '飛龍', '雷鳥', '巨象', '赤狐', '海豹', '樹熊'
];

const SUFFIXES = [
  'Plus', 'Ultra', 'Pro', 'Max', 'Star', 'King', 'VMax', 'Prime', 'Ace', 'Elite',
  'Master', 'Nova', 'Titan', 'Champion', 'Hero', 'Spark', 'Flash', 'X', 'Zero', 'Alpha'
];

export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suf = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${adj} ${noun} ${suf}`;
}

const STORAGE_PROFILE_KEY = 'cantonese_academy_player_profile_v1';
const STORAGE_STATS_KEY = 'cantonese_academy_player_stats_v1';
const STORAGE_DECK_KEY = 'cantonese_academy_battle_deck_v1';

export function getPlayerBattleDeck(cardInventory?: Record<number, number>): {
  deckCardIds: number[];
  isCustom: boolean;
} {
  // 1. Check if user explicitly configured and saved a custom deck
  try {
    const saved = localStorage.getItem(STORAGE_DECK_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        const validIds = parsed
          .map(Number)
          .filter((id) => POKEMON_CARDS_DATA.some((c) => c.id === id));
        if (validIds.length >= 4) {
          return { deckCardIds: validIds.slice(0, 4), isCustom: true };
        }
      }
    }
  } catch {}

  // 2. Anti-foolproof Fallback (方向 1): Randomly pick 4 cards from player's unlocked collection
  const unlockedIds = Object.keys(cardInventory || {})
    .map(Number)
    .filter((id) => (cardInventory?.[id] || 0) > 0 && POKEMON_CARDS_DATA.some((c) => c.id === id));

  if (unlockedIds.length >= 4) {
    // Shuffle and pick 4 random unique cards from owned inventory
    const shuffled = [...unlockedIds].sort(() => Math.random() - 0.5);
    return { deckCardIds: shuffled.slice(0, 4), isCustom: false };
  }

  // 3. Fallback for new players with < 4 unlocked cards: combine owned cards with default starters
  const starters = [25, 6, 9, 3];
  const combined = Array.from(new Set([...unlockedIds, ...starters]));
  return { deckCardIds: combined.slice(0, 4), isCustom: false };
}

export function savePlayerBattleDeck(deckIds: number[]): void {
  try {
    const cleanIds = deckIds.slice(0, 4).map(Number);
    localStorage.setItem(STORAGE_DECK_KEY, JSON.stringify(cleanIds));
  } catch {}
}

export function getOrCreatePlayerProfile(): PlayerProfile {
  try {
    const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  const newProfile: PlayerProfile = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: generateRandomName(),
    avatarSeed: 'seed_' + Math.floor(Math.random() * 1000),
    createdAt: Date.now(),
    rerollsRemaining: 3,
  };

  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
  } catch {}

  return newProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getPlayerStats(): PlayerStats {
  try {
    const saved = localStorage.getItem(STORAGE_STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  const initial: PlayerStats = {
    allTimeAnswered: 0,
    allTimeCorrect: 0,
    allTimeCardsCount: 0,
    weeklyAnswered: 0,
    weeklyCorrect: 0,
    weeklyCardsCount: 0,
    battleWins: 0,
    battleLosses: 0,
    battleScore: 1000,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

export function updatePlayerStats(updater: (prev: PlayerStats) => PlayerStats): PlayerStats {
  const current = getPlayerStats();
  const updated = updater(current);
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

// 5 Fixed NPC Rivals with pre-configured Pokemon decks (Guaranteed 4 valid cards per deck)
export const NPC_RIVALS: LeaderboardUser[] = [
  {
    id: 'npc_1',
    name: '閃電 小霞 Ace',
    avatarBg: 'from-amber-400 to-orange-500',
    badge: '⚡ 雷系館主',
    allTimeAnswered: 382,
    allTimeCorrect: 355,
    accuracy: 93,
    cardsCount: 42,
    weeklyAnswered: 88,
    weeklyCorrect: 82,
    battleWins: 24,
    battleScore: 1350,
    deckCardIds: [25, 26, 135, 785], // 比卡超(SSR), 雷超(UR), 雷伊貝(UR), 卡璞・鳴鳴(SSR)
  },
  {
    id: 'npc_2',
    name: '烈火 赤紅 Master',
    avatarBg: 'from-rose-500 to-red-600',
    badge: '🔥 火焰冠軍',
    allTimeAnswered: 520,
    allTimeCorrect: 490,
    accuracy: 94,
    cardsCount: 65,
    weeklyAnswered: 115,
    weeklyCorrect: 108,
    battleWins: 38,
    battleScore: 1580,
    deckCardIds: [6, 4, 59, 257], // 噴火龍(SSR), 小火龍(R), 風速狗(UR), 火焰雞(SSR)
  },
  {
    id: 'npc_3',
    name: '碧水 大木博士 Pro',
    avatarBg: 'from-cyan-500 to-blue-600',
    badge: '🌊 潮水導師',
    allTimeAnswered: 290,
    allTimeCorrect: 260,
    accuracy: 90,
    cardsCount: 36,
    weeklyAnswered: 65,
    weeklyCorrect: 59,
    battleWins: 18,
    battleScore: 1220,
    deckCardIds: [9, 7, 130, 658], // 水箭龜(SSR), 車輪龜(R), 暴鯉龍(UR), 甲賀忍蛙(SSR)
  },
  {
    id: 'npc_4',
    name: '超能 娜姿 Ultra',
    avatarBg: 'from-purple-500 to-pink-600',
    badge: '🔮 念力天王',
    allTimeAnswered: 440,
    allTimeCorrect: 418,
    accuracy: 95,
    cardsCount: 54,
    weeklyAnswered: 96,
    weeklyCorrect: 92,
    battleWins: 31,
    battleScore: 1470,
    deckCardIds: [150, 151, 65, 282], // 超夢(SSR), 夢幻(SSR), 胡地(UR), 沙奈朵(SSR)
  },
  {
    id: 'npc_5',
    name: '森之 莉莉艾 Star',
    avatarBg: 'from-emerald-400 to-teal-600',
    badge: '🌿 草系新星',
    allTimeAnswered: 195,
    allTimeCorrect: 172,
    accuracy: 88,
    cardsCount: 28,
    weeklyAnswered: 45,
    weeklyCorrect: 40,
    battleWins: 12,
    battleScore: 1110,
    deckCardIds: [3, 1, 254, 497], // 妙蛙花(SSR), 奇異種子(R), 蜥蜴王(UR), 君主蛇(UR)
  },
];

// Helper: Ensure opponent has exactly 4 valid Pokemon cards
// If not enough attribute cards, dynamically fill with same-attribute or random R / SR cards
export function resolveOpponentDeck(
  deckCardIds?: number[],
  fallbackType?: string,
  unlockedCardPool?: number[]
): PokemonCardData[] {
  const result: PokemonCardData[] = [];
  const existingIds = new Set<number>();

  // If opponent has an unlocked card pool and no custom deck was fixed, pick 4 randomly from their pool
  if (unlockedCardPool && unlockedCardPool.length >= 4 && (!deckCardIds || deckCardIds.length === 0)) {
    const shuffled = [...unlockedCardPool].sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
      const card = POKEMON_CARDS_DATA.find((c) => c.id === id);
      if (card && !existingIds.has(card.id)) {
        result.push(card);
        existingIds.add(card.id);
        if (result.length >= 4) break;
      }
    }
  } else if (deckCardIds && deckCardIds.length > 0) {
    for (const id of deckCardIds) {
      const card = POKEMON_CARDS_DATA.find((c) => c.id === id);
      if (card && !existingIds.has(card.id)) {
        result.push(card);
        existingIds.add(card.id);
      }
    }
  }

  // Determine main attribute theme if available
  const themeType = fallbackType || result[0]?.type;

  // 1. Try filling with cards of the same attribute
  if (result.length < 4 && themeType) {
    const sameTypeCandidates = POKEMON_CARDS_DATA.filter(
      (c) => c.type === themeType && !existingIds.has(c.id)
    );
    for (const c of sameTypeCandidates) {
      if (result.length >= 4) break;
      result.push(c);
      existingIds.add(c.id);
    }
  }

  // 2. If still not enough, randomly fill with R / SR / UR cards
  if (result.length < 4) {
    const rSrCards = POKEMON_CARDS_DATA
      .filter((c) => !existingIds.has(c.id) && (c.rarity === 'R' || c.rarity === 'SR' || c.rarity === 'UR'))
      .sort(() => Math.random() - 0.5);

    for (const c of rSrCards) {
      if (result.length >= 4) break;
      result.push(c);
      existingIds.add(c.id);
    }
  }

  // 3. Absolute fallback to ensure exactly 4 cards
  while (result.length < 4) {
    const anyCard = POKEMON_CARDS_DATA.find((c) => !existingIds.has(c.id)) || POKEMON_CARDS_DATA[0];
    result.push(anyCard);
    existingIds.add(anyCard.id);
  }

  return result.slice(0, 4);
}

// Helper: Type Effectiveness Table
// Water (水) -> Fire (火) -> Grass (草) -> Water (水)
// Electric (電) -> Water (水) / Flying (飛行)
// Dragon (龍) -> Dragon (龍)
// Psychic (超能力) -> Fighting (格鬥) / Poison (毒)
// Fairy (妖精) -> Dragon (龍) / Dark (惡) / Fighting (格鬥)
export function getAttackMultiplier(attackerType: string, defenderType: string): { multiplier: number; text: string; color: string } {
  const superEffectiveMap: Record<string, string[]> = {
    '水': ['火', '地面', '岩石'],
    '火': ['草', '冰', '鋼鐵'],
    '草': ['水', '地面', '岩石'],
    '電': ['水', '飛行'],
    '冰': ['草', '地面', '飛行', '龍'],
    '格鬥': ['一般', '冰', '岩石', '惡', '鋼鐵'],
    '毒': ['草', '妖精'],
    '地面': ['火', '電', '毒', '岩石', '鋼鐵'],
    '飛行': ['草', '格鬥', '蟲'],
    '超能力': ['格鬥', '毒'],
    '蟲': ['草', '超能力', '惡'],
    '岩石': ['火', '冰', '飛行', '蟲'],
    '幽靈': ['超能力', '幽靈'],
    '龍': ['龍'],
    '惡': ['超能力', '幽靈'],
    '鋼鐵': ['冰', '岩石', '妖精'],
    '妖精': ['格鬥', '龍', '惡'],
    '一般': [],
  };

  const resistedMap: Record<string, string[]> = {
    '火': ['水', '火', '岩石', '龍'],
    '水': ['水', '草', '龍'],
    '草': ['火', '草', '毒', '飛行', '蟲', '龍', '鋼鐵'],
    '電': ['草', '電', '龍', '地面'],
    '冰': ['火', '水', '冰', '鋼鐵'],
    '格鬥': ['毒', '飛行', '超能力', '蟲', '妖精'],
    '超能力': ['超能力', '鋼鐵', '惡'],
    '妖精': ['火', '毒', '鋼鐵'],
    '龍': ['鋼鐵', '妖精'],
    '一般': ['岩石', '鋼鐵', '幽靈'],
  };

  const supers = superEffectiveMap[attackerType] || [];
  if (supers.includes(defenderType)) {
    return { multiplier: 2.0, text: '💥 屬性絕佳！雙倍傷害 (2.0x)', color: 'text-amber-300 font-black' };
  }

  const resists = resistedMap[attackerType] || [];
  if (resists.includes(defenderType)) {
    return { multiplier: 0.5, text: '🛡️ 屬性受阻，半減傷害 (0.5x)', color: 'text-blue-300 font-semibold' };
  }

  return { multiplier: 1.0, text: '⚡ 正常命中 (1.0x)', color: 'text-slate-200' };
}

// Generate a random question strictly from the 6 requested learning modes:
// 1. 聽音四揀一 (audio_mc)
// 2. 缺字 (missing_mc)
// 3. 英文對照 (english_mc)
// 4. 朗讀特訓 (read_aloud)
// 5. 重組句子 (scramble)
// 6. 短文理解 (comprehension)
export function generateRandomBattleQuestion(): BattleQuestion {
  const questionTypes: BattleQuestionType[] = [
    'audio_mc',
    'missing_mc',
    'english_mc',
    'read_aloud',
    'scramble',
    'comprehension',
  ];

  const pickedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  // 1. 重組句子 (scramble)
  if (pickedType === 'scramble') {
    const item = SCRAMBLE_SENTENCES_DATA[Math.floor(Math.random() * SCRAMBLE_SENTENCES_DATA.length)];
    return {
      id: 'bq_' + Math.random().toString(36).substring(2, 8),
      type: 'scramble',
      prompt: '重組句子：請按正確廣東話語序排好句子：',
      subPrompt: item.english || item.hint,
      correctAnswer: item.targetSentence,
      scrambleWords: [...item.segments].sort(() => Math.random() - 0.5),
      explanation: item.targetSentence,
    };
  }

  // 2. 短文理解 (comprehension)
  if (pickedType === 'comprehension') {
    const story = READING_STORY_LIST[Math.floor(Math.random() * READING_STORY_LIST.length)];
    return {
      id: 'bq_' + Math.random().toString(36).substring(2, 8),
      type: 'comprehension',
      prompt: `短文理解：《${story.title}》`,
      subPrompt: `${story.passage}\n\n👉 問題：${story.question}`,
      targetWord: story.passage,
      questionText: story.question,
      options: [...story.options],
      correctAnswer: story.options[story.correctIndex],
      explanation: `${story.question} -> 正確答案：${story.options[story.correctIndex]} (${story.explanation})`,
    };
  }

  // Vocab based questions
  const randomVocab = VOCAB_PRACTICE_LIST[Math.floor(Math.random() * VOCAB_PRACTICE_LIST.length)];
  const distractors = VOCAB_PRACTICE_LIST
    .filter((v) => v.id !== randomVocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // 3. 聽音四揀一 (audio_mc)
  if (pickedType === 'audio_mc') {
    const allOptions = [randomVocab.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
    return {
      id: 'bq_' + Math.random().toString(36).substring(2, 8),
      type: 'audio_mc',
      prompt: '聽音四揀一：請聽廣東話發音，選出正確的中文詞語：',
      subPrompt: '請點擊下方播放按鈕聆聽發音 🔊',
      targetWord: randomVocab.word,
      jyutping: randomVocab.jyutping,
      options: allOptions,
      correctAnswer: randomVocab.word,
      explanation: `${randomVocab.word} (${randomVocab.jyutping}) - ${randomVocab.english}`,
    };
  }

  // 4. 缺字 (missing_mc)
  if (pickedType === 'missing_mc') {
    const chars = randomVocab.chars;
    const blankIdx = Math.floor(Math.random() * chars.length);
    const maskedWord = chars.map((c, i) => (i === blankIdx ? '（ ？ ）' : c)).join('');
    const correctChar = chars[blankIdx];
    const charPool = ['心', '手', '日', '月', '水', '火', '木', '金', '土', '天', '山', '人', '門', '口', '子'];
    const distChars = charPool.filter((c) => c !== correctChar).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correctChar, ...distChars].sort(() => Math.random() - 0.5);

    return {
      id: 'bq_' + Math.random().toString(36).substring(2, 8),
      type: 'missing_mc',
      prompt: `缺字填空：請選出括號內缺少的字：【 ${maskedWord} 】`,
      subPrompt: `英文：${randomVocab.english} ｜ 粵拼：${randomVocab.jyutping}`,
      options,
      correctAnswer: correctChar,
      explanation: `完整詞語為：${randomVocab.word} (${randomVocab.jyutping})`,
    };
  }

  // 5. 英文對照 (english_mc)
  if (pickedType === 'english_mc') {
    const options = [randomVocab.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
    return {
      id: 'bq_' + Math.random().toString(36).substring(2, 8),
      type: 'english_mc',
      prompt: `英文對照：請選出對應英文意義的中文詞語：【 ${randomVocab.english} 】`,
      subPrompt: '請由以下四個中文詞語中選出正確答案',
      options,
      correctAnswer: randomVocab.word,
      explanation: `${randomVocab.word} = ${randomVocab.english} (${randomVocab.jyutping})`,
    };
  }

  // 6. 句意填空 (read_aloud / sentence_fill)
  const maskedSentence = randomVocab.exampleSentence.replace(randomVocab.word, '【 ___ 】');
  const options = [randomVocab.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
  return {
    id: 'bq_' + Math.random().toString(36).substring(2, 8),
    type: 'read_aloud',
    prompt: '句意填空：請閱讀例句，選出最適合填入空格中的詞語：',
    subPrompt: `例句：${maskedSentence}\n\n（提示：英文為 ${randomVocab.english}）`,
    targetWord: randomVocab.word,
    jyutping: randomVocab.jyutping,
    options,
    correctAnswer: randomVocab.word,
    explanation: `正確答案：【 ${randomVocab.word} 】 (${randomVocab.jyutping})。完整例句：${randomVocab.exampleSentence}`,
  };
}
