import React, { useState, useEffect, useMemo } from 'react';
import { VOCAB_PRACTICE_LIST, VOCAB_CATEGORIES, VocabItem } from '../data/vocabPracticeList';
import { SCRAMBLE_SENTENCES_DATA, ScrambleSentenceItem } from '../data/scrambleSentences';
import { READING_STORY_LIST, StoryComprehensionItem } from '../data/readingComprehension';
import { POKEMON_CARDS_DATA, PokemonCardData, CardRarity } from '../data/pokemonCards';
import { PokemonBinder } from './PokemonBinder';
import { PokemonGachaModal } from './PokemonGachaModal';
import { SentenceScramblePractice } from './SentenceScramblePractice';
import { ReadingComprehensionPractice } from './ReadingComprehensionPractice';
import { DictationCanvasPractice } from './DictationCanvasPractice';
import { StrokeTracerPractice } from './StrokeTracerPractice';
import { PasswordAuthModal } from './PasswordAuthModal';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Star,
  Search,
  Layers,
  ArrowRight,
  Check,
  RefreshCw,
  Trophy,
  Gift,
  AlertTriangle,
  Play,
  BarChart3,
  Edit3,
  Lock,
} from 'lucide-react';

type PracticeMode =
  | 'mode_audio'
  | 'mode_missing'
  | 'mode_english'
  | 'mode_scramble'
  | 'mode_story'
  | 'mode_dictation'
  | 'mode_tracer'
  | 'mode_library';

export interface ModeStat {
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
}

const STORAGE_KEY_CARDS = 'jovan_pokemon_collection_v1';
const STORAGE_KEY_INVENTORY = 'jovan_pokemon_inventory_v1';
const STORAGE_KEY_PACKS = 'jovan_pokemon_unopened_packs_v1';
const STORAGE_KEY_STATS = 'jovan_practice_stats_v2';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const VocabPracticePage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<PracticeMode>('mode_audio');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [libraryCategory, setLibraryCategory] = useState<string>('all');

  // Session Control (Ready Screen vs Active Practice)
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [quizSize, setQuizSize] = useState<number>(10);

  // Interruption Confirmation Modal state
  const [pendingModeSwitch, setPendingModeSwitch] = useState<PracticeMode | null>(null);
  const [showInterruptModal, setShowInterruptModal] = useState<boolean>(false);

  // Stroke Practice Modes (Mode 6 & Mode 7) Password Lock Gate (Password: 10030627)
  const [isStrokeUnlocked, setIsStrokeUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('jovan_stroke_modes_unlocked') === 'true';
    } catch {}
    return false;
  });
  const [showStrokePasswordModal, setShowStrokePasswordModal] = useState<boolean>(false);
  const [pendingLockedMode, setPendingLockedMode] = useState<PracticeMode | null>(null);

  // Quiz Questions & State (No duplicates in the same session)
  const [vocabQuestions, setVocabQuestions] = useState<VocabItem[]>([]);
  const [scrambleQuestions, setScrambleQuestions] = useState<ScrambleSentenceItem[]>([]);
  const [storyQuestions, setStoryQuestions] = useState<StoryComprehensionItem[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongVocabItems, setWrongVocabItems] = useState<VocabItem[]>([]);
  const [wrongScrambleItems, setWrongScrambleItems] = useState<ScrambleSentenceItem[]>([]);
  const [wrongStoryItems, setWrongStoryItems] = useState<StoryComprehensionItem[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [blankIndex, setBlankIndex] = useState<number>(1);

  // Historical Statistics per Mode (localStorage)
  const [practiceStats, setPracticeStats] = useState<Record<string, ModeStat>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      mode_audio: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_missing: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_english: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_scramble: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_story: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_dictation: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
      mode_tracer: { totalAnswered: 0, correctCount: 0, wrongCount: 0 },
    };
  });

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(practiceStats));
    } catch {}
  }, [practiceStats]);

  // Record question result
  const recordStat = (modeKey: string, isCorrect: boolean) => {
    setPracticeStats((prev) => {
      const current = prev[modeKey] || { totalAnswered: 0, correctCount: 0, wrongCount: 0 };
      return {
        ...prev,
        [modeKey]: {
          totalAnswered: current.totalAnswered + 1,
          correctCount: current.correctCount + (isCorrect ? 1 : 0),
          wrongCount: current.wrongCount + (isCorrect ? 0 : 1),
        },
      };
    });
  };

  // Pokemon Rewards State
  const [cardInventory, setCardInventory] = useState<Record<number, number>>(() => {
    try {
      const savedInv = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (savedInv) {
        const parsedInv = JSON.parse(savedInv);
        if (parsedInv && typeof parsedInv === 'object' && Object.keys(parsedInv).length > 0) {
          return parsedInv;
        }
      }
      const savedLegacy = localStorage.getItem(STORAGE_KEY_CARDS);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated: Record<number, number> = {};
          parsed.forEach((id: number) => {
            migrated[id] = (migrated[id] || 0) + 1;
          });
          return migrated;
        }
      }
    } catch {}
    return { 25: 1 }; // Starter Pikachu
  });

  const unlockedCardIds = useMemo(() => {
    return Object.keys(cardInventory).map(Number).filter((id) => (cardInventory[id] || 0) > 0);
  }, [cardInventory]);

  const [availablePacks, setAvailablePacks] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKS);
      if (saved) {
        return parseInt(saved, 10) || 0;
      }
    } catch {}
    return 0;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(cardInventory));
      localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(unlockedCardIds));
    } catch {}
  }, [cardInventory, unlockedCardIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PACKS, String(availablePacks));
    } catch {}
  }, [availablePacks]);

  const [gachaModalOpen, setGachaModalOpen] = useState<boolean>(false);
  const [drawnCard, setDrawnCard] = useState<PokemonCardData | null>(null);
  const [isNewCard, setIsNewCard] = useState<boolean>(false);
  const [drawnCardCount, setDrawnCardCount] = useState<number>(1);

  // Trigger Pokemon Gacha Draw
  const triggerPokemonDraw = (streakNum: number = 10) => {
    const roll = Math.random() * 100;
    let targetRarity: CardRarity;

    if (streakNum >= 20) {
      if (roll < 20) targetRarity = 'SSR';
      else if (roll < 55) targetRarity = 'UR';
      else if (roll < 85) targetRarity = 'SR';
      else targetRarity = 'R';
    } else {
      if (roll < 8) targetRarity = 'SSR';
      else if (roll < 25) targetRarity = 'UR';
      else if (roll < 60) targetRarity = 'SR';
      else targetRarity = 'R';
    }

    const rarityCards = POKEMON_CARDS_DATA.filter((c) => c.rarity === targetRarity);
    const candidatePool = rarityCards.length > 0 ? rarityCards : POKEMON_CARDS_DATA;
    const chosen = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    const previousCount = cardInventory[chosen.id] || 0;
    const isNew = previousCount === 0;
    const newCount = previousCount + 1;

    setCardInventory((prev) => ({
      ...prev,
      [chosen.id]: newCount,
    }));

    setDrawnCard(chosen);
    setIsNewCard(isNew);
    setDrawnCardCount(newCount);
    setGachaModalOpen(true);
  };

  const handleManualOpenPack = () => {
    if (availablePacks > 0) {
      const nextPacks = Math.max(0, availablePacks - 1);
      setAvailablePacks(nextPacks);
      triggerPokemonDraw(10);
    }
  };

  const scrollToBinder = () => {
    const el = document.getElementById('jovan-pokemon-binder');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Start a new practice session: guarantees NO duplicate questions in the session
  const handleStartSession = (customList?: any[]) => {
    audioService.playCelebration();
    setIsSessionActive(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsQuizCompleted(false);

    if (activeMode === 'mode_scramble') {
      const pool = customList || SCRAMBLE_SENTENCES_DATA;
      const count = quizSize >= 999 ? pool.length : Math.min(quizSize, pool.length);
      const shuffled = shuffleArray(pool).slice(0, count);
      setScrambleQuestions(shuffled);
      setWrongScrambleItems([]);
    } else if (activeMode === 'mode_story') {
      const pool = customList || READING_STORY_LIST;
      const count = quizSize >= 999 ? pool.length : Math.min(quizSize, pool.length);
      const shuffled = shuffleArray(pool).slice(0, count);
      setStoryQuestions(shuffled);
      setWrongStoryItems([]);
    } else if (
      activeMode === 'mode_audio' ||
      activeMode === 'mode_missing' ||
      activeMode === 'mode_english' ||
      activeMode === 'mode_dictation'
    ) {
      const pool = customList || VOCAB_PRACTICE_LIST;
      const count = quizSize >= 999 ? pool.length : Math.min(quizSize, pool.length);
      const shuffled = shuffleArray(pool).slice(0, count);
      setVocabQuestions(shuffled);
      setWrongVocabItems([]);
      setBlankIndex(Math.random() > 0.5 ? 1 : 0);

      // Auto play audio only in audio mode (mode 1)
      if (activeMode === 'mode_audio' && shuffled.length > 0) {
        setTimeout(() => {
          speakCantonese(shuffled[0].word);
        }, 300);
      }
    }
  };

  // Handle Mode Change request (intercept if in active session or if locked)
  const requestModeChange = (targetMode: PracticeMode) => {
    audioService.playClick();
    if (targetMode === activeMode) return;

    // Check if target is Stroke Mode (Mode 6 or Mode 7) and locked
    if ((targetMode === 'mode_dictation' || targetMode === 'mode_tracer') && !isStrokeUnlocked) {
      setPendingLockedMode(targetMode);
      setShowStrokePasswordModal(true);
      return;
    }

    if (isSessionActive && !isQuizCompleted) {
      // Prompt warning about losing streak & resetting session
      setPendingModeSwitch(targetMode);
      setShowInterruptModal(true);
    } else {
      // Safe to switch
      setActiveMode(targetMode);
      setIsSessionActive(false);
      setIsQuizCompleted(false);
    }
  };

  // Stroke Mode Password Success Handler
  const handleStrokePasswordSuccess = () => {
    try {
      sessionStorage.setItem('jovan_stroke_modes_unlocked', 'true');
    } catch {}
    setIsStrokeUnlocked(true);
    setShowStrokePasswordModal(false);
    if (pendingLockedMode) {
      setActiveMode(pendingLockedMode);
      setPendingLockedMode(null);
      setIsSessionActive(false);
      setIsQuizCompleted(false);
    }
  };

  // Confirm leave / switch mode
  const confirmInterruptAndSwitch = () => {
    audioService.playPop();
    setStreak(0); // Clear streak to prevent exploiting
    setIsSessionActive(false);
    setIsQuizCompleted(false);
    setShowInterruptModal(false);
    if (pendingModeSwitch) {
      if ((pendingModeSwitch === 'mode_dictation' || pendingModeSwitch === 'mode_tracer') && !isStrokeUnlocked) {
        setPendingLockedMode(pendingModeSwitch);
        setShowStrokePasswordModal(true);
      } else {
        setActiveMode(pendingModeSwitch);
      }
      setPendingModeSwitch(null);
    }
  };

  const cancelInterrupt = () => {
    audioService.playClick();
    setShowInterruptModal(false);
    setPendingModeSwitch(null);
  };

  // Multiple Choice Options Generator with RANDOMIZED OPTIONS (A, B, C, D)
  const currentVocabItem = vocabQuestions && vocabQuestions.length > 0 ? vocabQuestions[currentIndex] : undefined;

  const randomizedOptions = useMemo(() => {
    if (!currentVocabItem) return [];

    if (activeMode === 'mode_missing') {
      const chars = currentVocabItem.chars || [];
      const targetChar = chars[blankIndex] || chars[0] || '';
      const otherChars = VOCAB_PRACTICE_LIST.flatMap((v) => v.chars || []).filter(
        (c) => c !== targetChar && c && c.trim() !== ''
      );
      const uniqueDistractors = shuffleArray(Array.from(new Set(otherChars))).slice(0, 3);
      const allChoices = shuffleArray([targetChar, ...uniqueDistractors]);

      return allChoices.map((char) => ({
        id: char,
        text: char,
        isCorrect: char === targetChar,
      }));
    }

    // Modes 1 & 3: Word choices (發音四揀一 或 英文四揀一)
    const distractors = shuffleArray(
      VOCAB_PRACTICE_LIST.filter((v) => v.id !== currentVocabItem.id)
    ).slice(0, 3);
    const choices = shuffleArray([currentVocabItem, ...distractors]);

    return choices.map((c) => ({
      id: c.id,
      text: c.word,
      jyutping: c.jyutping,
      english: c.english,
      isCorrect: c.id === currentVocabItem.id,
    }));
  }, [currentVocabItem, activeMode, blankIndex]);

  // Handle selecting an option (Modes 1, 2, 3)
  const handleSelectOption = (option: { id: string; text: string; isCorrect: boolean }) => {
    if (isAnswered) {
      audioService.playPop();
      speakCantonese(option.text);
      return;
    }

    setSelectedAnswer(option.id);
    setIsAnswered(true);
    recordStat(activeMode, option.isCorrect);

    if (option.isCorrect) {
      audioService.playSuccess();
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Trigger reward on 10 streak
      if (newStreak > 0 && newStreak % 10 === 0) {
        setTimeout(() => {
          triggerPokemonDraw(newStreak);
        }, 500);
      }
    } else {
      audioService.playError();
      setStreak(0);
      if (currentVocabItem && !wrongVocabItems.find((w) => w.id === currentVocabItem.id)) {
        setWrongVocabItems((prev) => [...prev, currentVocabItem]);
      }
    }

    setTimeout(() => {
      speakCantonese(option.text);
    }, 150);
  };

  // Next question
  const handleNextQuestion = () => {
    audioService.playClick();
    const totalQ = vocabQuestions ? vocabQuestions.length : 0;
    if (currentIndex + 1 >= totalQ) {
      setIsQuizCompleted(true);
      audioService.playCelebration();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setBlankIndex(Math.random() > 0.5 ? 1 : 0);

      if (activeMode === 'mode_audio' && vocabQuestions && vocabQuestions[nextIdx]) {
        setTimeout(() => {
          speakCantonese(vocabQuestions[nextIdx].word);
        }, 200);
      }
    }
  };

  // Modes definitions with icons & descriptions
  const MODES_CONFIG: {
    id: PracticeMode;
    num: string;
    title: string;
    desc: string;
    icon: string;
    maxPoolCount: number;
    color: string;
  }[] = [
    {
      id: 'mode_audio',
      num: '1',
      title: '聽音四揀一',
      desc: '聆聽純正廣東話發音，選出正確中文字詞',
      icon: '🎧',
      maxPoolCount: VOCAB_PRACTICE_LIST.length,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'mode_missing',
      num: '2',
      title: '缺字填空',
      desc: '根據詞語與拼音，填補缺漏的漢字',
      icon: '🧩',
      maxPoolCount: VOCAB_PRACTICE_LIST.length,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'mode_english',
      num: '3',
      title: '英文對照',
      desc: '根據英文釋義，選出對應的中文詞彙',
      icon: '🇬🇧',
      maxPoolCount: VOCAB_PRACTICE_LIST.length,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'mode_scramble',
      num: '4',
      title: '重組句子',
      desc: '字卡排列通順完整句子•連對5題即獲抽卡',
      icon: '✍️',
      maxPoolCount: SCRAMBLE_SENTENCES_DATA.length,
      color: 'from-purple-500 to-violet-600',
    },
    {
      id: 'mode_story',
      num: '5',
      title: '短文理解',
      desc: '150篇精選生活科普短文•累積10題抽卡',
      icon: '📖',
      maxPoolCount: READING_STORY_LIST.length,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'mode_dictation',
      num: '6',
      title: '補筆畫特訓',
      desc: isStrokeUnlocked ? '補上漢字缺漏筆畫•連續對10題抽卡' : '補上漢字缺漏筆畫 (內部測試・需密碼)',
      icon: '✏️',
      maxPoolCount: VOCAB_PRACTICE_LIST.length,
      color: 'from-red-500 to-orange-600',
    },
    {
      id: 'mode_tracer',
      num: '7',
      title: '筆順跟寫 (模式B)',
      desc: isStrokeUnlocked ? '標準筆順逐步跟寫•練夠20字送卡包' : '標準筆順逐步跟寫 (內部測試・需密碼)',
      icon: '🖌️',
      maxPoolCount: 20,
      color: 'from-amber-600 to-rose-600',
    },
    {
      id: 'mode_library',
      num: '8',
      title: '詞庫總覽點讀',
      desc: '180+ 核心詞彙即時點讀速查與複習',
      icon: '📚',
      maxPoolCount: VOCAB_PRACTICE_LIST.length,
      color: 'from-slate-700 to-slate-900',
    },
  ];

  const currentModeConfig = MODES_CONFIG.find((m) => m.id === activeMode) || MODES_CONFIG[0];
  const currentModeStat = practiceStats[activeMode] || { totalAnswered: 0, correctCount: 0, wrongCount: 0 };
  const accuracyPercent =
    currentModeStat.totalAnswered > 0
      ? Math.round((currentModeStat.correctCount / currentModeStat.totalAnswered) * 100)
      : 0;

  // Filtered vocabulary for mode_library
  const filteredLibraryList = useMemo(() => {
    return VOCAB_PRACTICE_LIST.filter((item) => {
      const matchCat = libraryCategory === 'all' || item.category === libraryCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.word.includes(searchQuery) ||
        item.jyutping.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.english.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [libraryCategory, searchQuery]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER BAR & MODE NAVIGATION */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-sm space-y-2.5">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {MODES_CONFIG.map((mode) => {
            const isActive = activeMode === mode.id;
            const isStrokeLockedMode = (mode.id === 'mode_dictation' || mode.id === 'mode_tracer') && !isStrokeUnlocked;
            return (
              <button
                key={mode.id}
                type="button"
                id={`mode-btn-${mode.id}`}
                onClick={() => requestModeChange(mode.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-base select-none">{mode.icon}</span>
                <span>{mode.title}</span>
                {isStrokeLockedMode && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>鎖定</span>
                  </span>
                )}
                {mode.id === 'mode_scramble' && (
                  <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-black">
                    5連抽
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Quick Info & Collection Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-900 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>當前連對：<strong className="text-sm font-mono">{streak}</strong></span>
            </div>

            {availablePacks > 0 && (
              <button
                type="button"
                onClick={handleManualOpenPack}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black flex items-center gap-1 shadow-xs animate-bounce cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>拆卡包 ({availablePacks})</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={scrollToBinder}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>寶可夢卡冊 ({unlockedCardIds.length}/{POKEMON_CARDS_DATA.length})</span>
          </button>
        </div>
      </div>

      {/* INTERRUPTION WARNING MODAL */}
      {showInterruptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">⚠️ 練習正在進行中！</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                如果現在離開或切換問題類別，當前練習將會立即終止，並且<strong>連對紀錄（Streak: {streak}）將會清空歸零</strong>。
              </p>
              <p className="text-xs text-rose-600 font-bold">
                （此規則為避免遇到不熟悉的題目時隨意切換重洗）
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={cancelInterrupt}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                繼續答題
              </button>
              <button
                type="button"
                onClick={confirmInterruptAndSwitch}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                確認離開 (清空連對)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW ROUTING */}
      {activeMode === 'mode_library' ? (
        /* MODE 7: VOCABULARY LIBRARY BROWSER */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋詞語、粵拼或英文 (如: 太陽, taai3, butterfly)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
              {VOCAB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setLibraryCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 border ${
                    libraryCategory === cat.id
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-bold">
            <span>找到 {filteredLibraryList.length} 個詞語</span>
            <span>點擊任意卡片喇叭即可聆聽純正廣東話發音 🔊</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredLibraryList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  audioService.playClick();
                  speakCantonese(item.word);
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400">{item.jyutping}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      audioService.playClick();
                      speakCantonese(item.word);
                    }}
                    className="p-1 rounded-full text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-center py-2">
                  <div className="text-2xl font-bold font-serif text-slate-800 group-hover:text-amber-700 transition">
                    {item.word}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 text-center">
                  <div className="text-[11px] text-slate-500 font-medium truncate" title={item.english}>
                    {item.english}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeMode === 'mode_tracer' ? (
        /* MODE 7: STROKE-BY-STROKE GUIDED TRACER (20-CHAR REWARD) */
        <StrokeTracerPractice
          onTriggerPokemon={(streakOrCount) => triggerPokemonDraw(streakOrCount)}
        />
      ) : !isSessionActive ? (
        /* READY SCREEN / PREPARATION PANEL (BEFORE PRACTICE STARTS) */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 max-w-3xl mx-auto">
          {/* Mode Banner */}
          <div className={`bg-gradient-to-r ${currentModeConfig.color} rounded-2xl p-6 text-white shadow-md relative overflow-hidden`}>
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                <span>題型 {currentModeConfig.num}</span>
                <span>• 全題庫覆蓋 ({currentModeConfig.maxPoolCount} 題)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentModeConfig.icon}</span>
                <h2 className="text-2xl sm:text-3xl font-black">{currentModeConfig.title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                {currentModeConfig.desc}
              </p>
            </div>
          </div>

          {/* Historical Stats Dashboard for Current Mode */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>本題型累積練習歷史戰績：</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-[11px] text-slate-400 font-bold">總答題數</div>
                <div className="text-xl font-mono font-black text-slate-800">
                  {currentModeStat.totalAnswered}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-[11px] text-slate-400 font-bold">歷史正確率</div>
                <div className="text-xl font-mono font-black text-amber-600">
                  {accuracyPercent}%
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-[11px] text-slate-400 font-bold">答對題數</div>
                <div className="text-xl font-mono font-black text-emerald-600">
                  {currentModeStat.correctCount}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-[11px] text-slate-400 font-bold">答錯題數</div>
                <div className="text-xl font-mono font-black text-rose-500">
                  {currentModeStat.wrongCount}
                </div>
              </div>
            </div>
          </div>

          {/* Question Count Selection */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600">請選擇本輪練習題數：</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { count: 10, label: '10 題' },
                { count: 20, label: '20 題' },
                { count: 30, label: '30 題' },
                { count: 50, label: '50 題' },
                { count: 999, label: `全部 (${currentModeConfig.maxPoolCount})` },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    setQuizSize(item.count);
                  }}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-black transition-all border cursor-pointer ${
                    quizSize === item.count
                      ? 'bg-slate-900 text-white border-slate-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Practice Big Button */}
          <button
            type="button"
            id="start-practice-btn"
            onClick={() => handleStartSession()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-black text-base sm:text-lg shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>開始練習（隨機無重複題目）🚀</span>
          </button>
        </div>
      ) : isQuizCompleted ? (
        /* QUIZ COMPLETED SUMMARY SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 shadow-md max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              太棒了！完成本輪挑戰 🎉
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              Jovan 在本輪題目中，答對了：
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 inline-block w-full max-w-sm">
            <div className="text-4xl sm:text-5xl font-black font-mono text-amber-600">
              {score}{' '}
              <span className="text-2xl text-slate-400">
                /{' '}
                {(vocabQuestions?.length || 0) ||
                  (scrambleQuestions?.length || 0) ||
                  (storyQuestions?.length || 0) ||
                  0}
              </span>
            </div>
            <div className="text-xs font-bold text-amber-800 mt-2">
              正確率：
              {Math.round(
                (score /
                  Math.max(
                    1,
                    (vocabQuestions?.length || 0) ||
                      (scrambleQuestions?.length || 0) ||
                      (storyQuestions?.length || 0) ||
                      1
                  )) *
                  100
              )}
              %
            </div>
          </div>

          {/* Mistake review prompt */}
          {((wrongVocabItems?.length || 0) > 0 ||
            (wrongScrambleItems?.length || 0) > 0 ||
            (wrongStoryItems?.length || 0) > 0) && (
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <HelpCircle className="w-4 h-4" />
                <span>
                  需要加強鞏固的題目（共{' '}
                  {(wrongVocabItems?.length || 0) ||
                    (wrongScrambleItems?.length || 0) ||
                    (wrongStoryItems?.length || 0)}{' '}
                  題）：
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(wrongVocabItems || []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      speakCantonese(item.word);
                    }}
                    className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-900 font-bold text-xs flex items-center gap-1 hover:bg-rose-100"
                  >
                    <span>{item.word}</span>
                    <Volume2 className="w-3 h-3 text-rose-500" />
                  </button>
                ))}
                {wrongScrambleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      speakCantonese(item.targetSentence);
                    }}
                    className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-900 font-bold text-xs flex items-center gap-1 hover:bg-rose-100 text-left"
                  >
                    <span>{item.targetSentence}</span>
                    <Volume2 className="w-3 h-3 text-rose-500 shrink-0" />
                  </button>
                ))}
                {wrongStoryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      speakCantonese(item.question);
                    }}
                    className="px-2.5 py-1 bg-white rounded-lg border border-rose-200 text-rose-900 font-bold text-xs flex items-center gap-1 hover:bg-rose-100 text-left"
                  >
                    <span>{item.title}</span>
                    <Volume2 className="w-3 h-3 text-rose-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleStartSession()}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>再來一輪練習</span>
            </button>

            {(wrongVocabItems.length > 0 || wrongScrambleItems.length > 0 || wrongStoryItems.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  if (activeMode === 'mode_scramble') {
                    handleStartSession(wrongScrambleItems);
                  } else if (activeMode === 'mode_story') {
                    handleStartSession(wrongStoryItems);
                  } else {
                    handleStartSession(wrongVocabItems);
                  }
                }}
                className="px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  專項複習錯題 (
                  {wrongVocabItems.length || wrongScrambleItems.length || wrongStoryItems.length})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audioService.playClick();
                setIsSessionActive(false);
              }}
              className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>返回題型設定</span>
            </button>
          </div>
        </div>
      ) : activeMode === 'mode_scramble' ? (
        /* MODE 4: SENTENCE SCRAMBLE (5-STREAK REWARD) */
        <SentenceScramblePractice
          questions={scrambleQuestions}
          onStreakUpdate={(newStreak) => setStreak(newStreak)}
          onTriggerPokemon={(streakNum) => triggerPokemonDraw(streakNum)}
          currentStreak={streak}
          onRecordResult={(isCorrect) => recordStat('mode_scramble', isCorrect)}
          onSessionComplete={(finalScore) => {
            setScore(finalScore);
            setIsQuizCompleted(true);
          }}
        />
      ) : activeMode === 'mode_story' ? (
        /* MODE 5: SHORT STORY COMPREHENSION (150 STORIES) */
        <ReadingComprehensionPractice
          questions={storyQuestions}
          onTriggerPokemon={(streakOrCount) => triggerPokemonDraw(streakOrCount)}
          unlockedCardsCount={unlockedCardIds.length}
          totalCardsCount={POKEMON_CARDS_DATA.length}
          onRecordResult={(isCorrect) => recordStat('mode_story', isCorrect)}
          currentStreak={streak}
          onStreakUpdate={(newStreak) => setStreak(newStreak)}
          onSessionComplete={(finalScore, wrongItems) => {
            setScore(finalScore);
            setWrongStoryItems(wrongItems);
            setIsQuizCompleted(true);
          }}
        />
      ) : activeMode === 'mode_dictation' ? (
        /* MODE 6: MISSING STROKE COMPLETION CHALLENGE */
        <DictationCanvasPractice
          questions={vocabQuestions}
          onStreakUpdate={(newStreak) => setStreak(newStreak)}
          onTriggerPokemon={(streakNum) => triggerPokemonDraw(streakNum)}
          currentStreak={streak}
          onRecordResult={(isCorrect) => recordStat('mode_dictation', isCorrect)}
          onSessionComplete={(finalScore, wrongItems) => {
            setScore(finalScore);
            setWrongVocabItems(wrongItems);
            setIsQuizCompleted(true);
          }}
        />
      ) : activeMode === 'mode_tracer' ? (
        /* MODE 7: STROKE-BY-STROKE GUIDED TRACER (20-CHAR REWARD) */
        <StrokeTracerPractice
          onTriggerPokemon={(streakOrCount) => triggerPokemonDraw(streakOrCount)}
        />
      ) : currentVocabItem ? (
        /* MODES 1, 2, 3: ACTIVE 4-CHOICE MULTIPLE CHOICE QUESTION */
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">進度</span>
              <span className="font-mono font-black text-amber-600 text-sm">
                {currentIndex + 1}
              </span>
              <span className="text-slate-400 text-xs">/ {vocabQuestions ? vocabQuestions.length : 0}</span>
            </div>

            <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / Math.max(1, vocabQuestions ? vocabQuestions.length : 1)) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-900">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>連對: {streak}</span>
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
                得分: {score}
              </div>
            </div>
          </div>

          {/* QUESTION PROMPT CARD */}
          <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-slate-50 rounded-2xl p-4 sm:p-6 border border-amber-200/80 text-center space-y-3 shadow-inner">
            {activeMode === 'mode_audio' ? (
              <div className="space-y-3">
                <div className="text-xs font-black text-amber-800">
                  🎧 聽音選詞：請點擊喇叭聆聽發音，選出正確的中文字詞
                </div>
                <button
                  type="button"
                  id="speak-current-btn"
                  onClick={() => {
                    audioService.playClick();
                    speakCantonese(currentVocabItem.word);
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all active:scale-95 cursor-pointer"
                  title="點擊重複聆聽發音"
                >
                  <Volume2 className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
                <div className="text-xs font-mono font-bold text-amber-900">
                  粵拼: {currentVocabItem.jyutping}
                </div>
              </div>
            ) : activeMode === 'mode_missing' ? (
              <div className="space-y-3">
                <div className="text-xs font-black text-amber-800">
                  🧩 缺字填空：請選出「？」處缺失的正確漢字
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {(currentVocabItem.chars || []).map((char, idx) => {
                    const isBlank = idx === blankIndex;
                    return isBlank ? (
                      <div
                        key={idx}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100/50 flex items-center justify-center text-amber-600 shadow-inner animate-pulse"
                      >
                        <span className="text-2xl sm:text-3xl font-black font-mono">?</span>
                      </div>
                    ) : (
                      <div
                        key={idx}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-300 shadow-xs flex items-center justify-center text-3xl sm:text-4xl font-serif font-bold text-slate-800"
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  粵拼：<span className="font-mono font-bold">{currentVocabItem.jyutping}</span> • 英文：
                  <span className="font-bold">{currentVocabItem.english}</span>
                </div>
              </div>
            ) : (
              /* MODE 3: ENGLISH TRANSLATION */
              <div className="space-y-3">
                <div className="text-xs font-black text-emerald-800">
                  🇬🇧 英文對照：請選出符合下方英文釋義的中文詞彙
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 py-1">
                  {currentVocabItem.english}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  詞彙粵拼：{currentVocabItem.jyutping}
                </div>
              </div>
            )}
          </div>

          {/* 4-CHOICE OPTIONS GRID (RANDOMIZED ORDER) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {randomizedOptions.map((opt, idx) => {
              const isSelected = selectedAnswer === opt.id;
              const isCorrect = opt.isCorrect;

              let btnStyle =
                'bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-800';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200';
                } else {
                  btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-500';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`vocab-opt-${idx}`}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 sm:p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-98 ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-500">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-serif">
                    {opt.text}
                  </div>
                  {isAnswered && (
                    <div className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                      <Volume2 className="w-3 h-3" />
                      <span>點擊朗讀</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* NEXT STEP BUTTON */}
          {isAnswered && (
            <div className="pt-2 animate-fadeIn">
              <button
                type="button"
                id="next-vocab-btn"
                onClick={handleNextQuestion}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{currentIndex + 1 >= (vocabQuestions ? vocabQuestions.length : 0) ? '查看本輪成績' : '下一題'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* POKEMON BINDER EMBED */}
      <PokemonBinder
        unlockedCardIds={unlockedCardIds}
        cardInventory={cardInventory}
        currentStreak={streak}
        availablePacks={availablePacks}
        onOpenPack={handleManualOpenPack}
      />

      {/* GACHA REVEAL MODAL */}
      <PokemonGachaModal
        isOpen={gachaModalOpen}
        drawnCard={drawnCard}
        isNewCard={isNewCard}
        cardCount={drawnCardCount}
        streakCount={streak}
        onClose={() => setGachaModalOpen(false)}
        onViewBinder={scrollToBinder}
      />

      {/* STROKE PRACTICE MODES PARENT PASSWORD LOCK MODAL */}
      <PasswordAuthModal
        isOpen={showStrokePasswordModal}
        onClose={() => {
          setShowStrokePasswordModal(false);
          setPendingLockedMode(null);
        }}
        onSuccess={handleStrokePasswordSuccess}
        title="筆畫筆順特訓模式 (內部測試)"
        description="此專區（補筆畫特訓、筆順跟寫特訓）正處於內部校對階段，暫不向小朋友公開。請輸入家長驗證密碼解鎖："
      />
    </div>
  );
};
