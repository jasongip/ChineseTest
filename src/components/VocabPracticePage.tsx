import React, { useState, useEffect, useMemo } from 'react';
import { VOCAB_PRACTICE_LIST, VOCAB_CATEGORIES, VocabItem } from '../data/vocabPracticeList';
import { POKEMON_CARDS_DATA, PokemonCardData } from '../data/pokemonCards';
import { PokemonBinder } from './PokemonBinder';
import { PokemonGachaModal } from './PokemonGachaModal';
import { SentenceScramblePractice } from './SentenceScramblePractice';
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
  Flame,
  Star,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Eye,
  Check,
  RefreshCw,
  Trophy,
  Gift,
} from 'lucide-react';

type PracticeMode = 'mode_audio' | 'mode_missing' | 'mode_english' | 'mode_scramble' | 'mode_library';

const STORAGE_KEY_CARDS = 'jovan_pokemon_collection_v1';
const STORAGE_KEY_PACKS = 'jovan_pokemon_unopened_packs_v1';

export const VocabPracticePage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<PracticeMode>('mode_audio');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Quiz State
  const [quizSize, setQuizSize] = useState<number>(10);
  const [quizQuestions, setQuizQuestions] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [wrongItems, setWrongItems] = useState<VocabItem[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Pokemon Rewards State
  const [unlockedCardIds, setUnlockedCardIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    // Starter reward: Pikachu (#25)
    return [25];
  });

  const [availablePacks, setAvailablePacks] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKS);
      if (saved) {
        return parseInt(saved, 10) || 0;
      }
    } catch {
      // Ignore
    }
    return 0;
  });

  const [gachaModalOpen, setGachaModalOpen] = useState<boolean>(false);
  const [drawnCard, setDrawnCard] = useState<PokemonCardData | null>(null);
  const [isNewCard, setIsNewCard] = useState<boolean>(false);
  const [lastStreakTriggered, setLastStreakTriggered] = useState<number>(0);

  // Missing char mode state: which index is blank (0 or 1 etc)
  const [blankIndex, setBlankIndex] = useState<number>(1);

  // Trigger Pokemon Gacha Draw
  const triggerPokemonDraw = (streakNum: number = 5) => {
    const lockedPool = POKEMON_CARDS_DATA.filter((c) => !unlockedCardIds.includes(c.id));
    
    let chosen: PokemonCardData;
    let isNew = false;

    if (lockedPool.length > 0) {
      // If streak is multiple of 10 or 15, favor SSR / UR cards
      if (streakNum >= 10 && lockedPool.some((c) => c.rarity === 'SSR')) {
        const ssrPool = lockedPool.filter((c) => c.rarity === 'SSR');
        chosen = ssrPool[Math.floor(Math.random() * ssrPool.length)];
      } else {
        chosen = lockedPool[Math.floor(Math.random() * lockedPool.length)];
      }
      isNew = true;
      const nextUnlocked = [...unlockedCardIds, chosen.id];
      setUnlockedCardIds(nextUnlocked);
      try {
        localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(nextUnlocked));
      } catch {
        // Ignore
      }
    } else {
      // All collected, draw random card with high holographic chance
      chosen = POKEMON_CARDS_DATA[Math.floor(Math.random() * POKEMON_CARDS_DATA.length)];
      isNew = false;
    }

    setDrawnCard(chosen);
    setIsNewCard(isNew);
    setGachaModalOpen(true);
    setLastStreakTriggered(streakNum);
  };

  const handleManualOpenPack = () => {
    if (availablePacks > 0) {
      const nextPacks = Math.max(0, availablePacks - 1);
      setAvailablePacks(nextPacks);
      try {
        localStorage.setItem(STORAGE_KEY_PACKS, String(nextPacks));
      } catch {
        // Ignore
      }
      triggerPokemonDraw(5);
    } else {
      triggerPokemonDraw(5);
    }
  };

  const handleResetCollection = () => {
    if (window.confirm('確定要重設寶可夢卡冊進度嗎？（將恢復為只有比卡超）')) {
      const initial = [25];
      setUnlockedCardIds(initial);
      setAvailablePacks(0);
      try {
        localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(initial));
        localStorage.setItem(STORAGE_KEY_PACKS, '0');
      } catch {
        // Ignore
      }
    }
  };

  const scrollToBinder = () => {
    const el = document.getElementById('jovan-pokemon-binder');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered master list
  const filteredVocabList = useMemo(() => {
    return VOCAB_PRACTICE_LIST.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.word.includes(searchQuery) ||
        item.jyutping.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.english.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Start / Reset a quiz round
  const startQuiz = (customList?: VocabItem[]) => {
    const pool = customList || (filteredVocabList.length > 0 ? filteredVocabList : VOCAB_PRACTICE_LIST);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(quizSize, shuffled.length));
    
    setQuizQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setWrongItems([]);
    setIsQuizCompleted(false);
    setShowExplanation(false);

    // Randomize blank index for missing char mode
    setBlankIndex(Math.random() > 0.5 ? 1 : 0);

    // Auto pronounce first question if audio mode or writing mode
    if (selected.length > 0) {
      setTimeout(() => {
        speakCantonese(selected[0].word);
      }, 300);
    }
  };

  useEffect(() => {
    startQuiz();
  }, [activeMode, selectedCategory, quizSize]);

  const currentItem = quizQuestions[currentIndex];

  // Options generator for 4-choice questions
  const currentOptions = useMemo(() => {
    if (!currentItem) return [];

    if (activeMode === 'mode_missing') {
      // Missing character choices
      const targetChar = currentItem.chars[blankIndex] || currentItem.chars[0];
      const otherChars = VOCAB_PRACTICE_LIST.flatMap((v) => v.chars).filter(
        (c) => c !== targetChar && c.trim() !== ''
      );
      const uniqueDistractors = Array.from(new Set(otherChars)).sort(() => Math.random() - 0.5).slice(0, 3);
      const allChoices = [targetChar, ...uniqueDistractors].sort(() => Math.random() - 0.5);
      return allChoices.map((char) => ({
        id: char,
        text: char,
        isCorrect: char === targetChar,
      }));
    }

    // Modes 1 & 3: Word choices (發音四揀一 或 英文四揀一)
    const distractors = VOCAB_PRACTICE_LIST.filter((v) => v.id !== currentItem.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const choices = [currentItem, ...distractors].sort(() => Math.random() - 0.5);

    return choices.map((c) => ({
      id: c.id,
      text: c.word,
      jyutping: c.jyutping,
      english: c.english,
      isCorrect: c.id === currentItem.id,
    }));
  }, [currentItem, activeMode, blankIndex]);

  // Handle answering
  const handleSelectOption = (option: { id: string; text: string; isCorrect: boolean }) => {
    if (isAnswered) return;

    setSelectedAnswer(option.id);
    setIsAnswered(true);

    if (option.isCorrect) {
      audioService.playSuccess();
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Check if streak reaches a multiple of 5 (e.g. 5, 10, 15, 20...)
      if (newStreak > 0 && newStreak % 5 === 0 && newStreak !== lastStreakTriggered) {
        setTimeout(() => {
          triggerPokemonDraw(newStreak);
        }, 500);
      }
    } else {
      audioService.playError();
      setStreak(0);
      if (currentItem && !wrongItems.find((w) => w.id === currentItem.id)) {
        setWrongItems((prev) => [...prev, currentItem]);
      }
    }

    // Always speak correct pronunciation after answering
    if (currentItem) {
      setTimeout(() => {
        speakCantonese(currentItem.word);
      }, 150);
    }
  };

  // Next question
  const handleNext = () => {
    audioService.playClick();
    if (currentIndex + 1 >= quizQuestions.length) {
      setIsQuizCompleted(true);
      audioService.playCelebration();
      // If achieved high score (>=80%), grant +1 bonus pack if not already awarded
      if (score + (selectedAnswer && currentOptions.find(o => o.id === selectedAnswer)?.isCorrect ? 1 : 0) >= quizQuestions.length * 0.8) {
        setAvailablePacks((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem(STORAGE_KEY_PACKS, String(next));
          } catch {
            // Ignore
          }
          return next;
        });
      }
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setBlankIndex(Math.random() > 0.5 ? 1 : 0);

      // Auto play audio for next question
      if (quizQuestions[nextIdx]) {
        setTimeout(() => {
          speakCantonese(quizQuestions[nextIdx].word);
        }, 200);
      }
    }
  };

  const handleSpeakCurrent = () => {
    if (currentItem) {
      audioService.playClick();
      speakCantonese(currentItem.word);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero / Header Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white border border-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>仔仔專屬廣東話詞庫強化練習 (180+ 核心詞彙)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              詞語四大題型特訓闖關
            </h2>
            <p className="text-sm text-amber-100 max-w-2xl leading-relaxed">
              專為 Jovan 設計：包含<strong>聽音選詞</strong>、<strong>缺字填空</strong>、<strong>英文對照</strong>及<strong>九宮格手寫臨摹</strong>。支持即時語音朗讀與錯題智能重溫！
            </p>
          </div>

          {/* Quick Stats in Header */}
          <div className="flex flex-wrap items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/25">
            <div className="text-center px-2">
              <div className="text-xs text-amber-100 font-bold">總詞庫</div>
              <div className="text-xl sm:text-2xl font-black font-mono">{VOCAB_PRACTICE_LIST.length}</div>
            </div>
            <div className="h-8 w-[1px] bg-white/30" />
            <div className="text-center px-2">
              <div className="text-xs text-amber-100 font-bold">本輪得分</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-yellow-200">{score}</div>
            </div>
            <div className="h-8 w-[1px] bg-white/30" />
            <div className="text-center px-2 flex flex-col items-center">
              <div className="text-xs text-amber-100 font-bold flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-yellow-300 fill-yellow-300" /> 連對
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-yellow-300">{streak}</div>
            </div>
            <div className="h-8 w-[1px] bg-white/30 hidden sm:block" />
            {/* Pokemon Collection quick button */}
            <button
              type="button"
              onClick={scrollToBinder}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>寶可夢卡冊 ({unlockedCardIds.length}/{POKEMON_CARDS_DATA.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector Navigation */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { id: 'mode_audio' as PracticeMode, num: '1', title: '聽音四揀一', desc: '粵語發音選中文字', icon: '🎧' },
            { id: 'mode_missing' as PracticeMode, num: '2', title: '缺字填空', desc: '填補詞語缺失漢字', icon: '🧩' },
            { id: 'mode_english' as PracticeMode, num: '3', title: '英文對照', desc: '英文釋義選中文詞', icon: '🇬🇧' },
            { id: 'mode_scramble' as PracticeMode, num: '4', title: '重組句子', desc: '字卡排列通順句子', icon: '✍️' },
            { id: 'mode_library' as PracticeMode, num: '5', title: '詞庫總覽點讀', desc: '180+ 詞彙速查點讀', icon: '📚' },
          ].map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                id={`practice-mode-btn-${mode.id}`}
                onClick={() => {
                  audioService.playClick();
                  setActiveMode(mode.id);
                }}
                className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                  isActive
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm ring-2 ring-amber-200 scale-[1.02]'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl select-none">{mode.icon}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    題型 {mode.num}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{mode.title}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Settings Bar (For Modes 1, 2, 3) */}
      {activeMode !== 'mode_library' && activeMode !== 'mode_scramble' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl no-scrollbar">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {VOCAB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  audioService.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 border ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Quiz Question Count & Restart */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">題數：</span>
            {[10, 20, 30].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  audioService.playClick();
                  setQuizSize(num);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                  quizSize === num
                    ? 'bg-slate-800 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {num} 題
              </button>
            ))}

            <button
              type="button"
              onClick={() => startQuiz()}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition ml-2"
              title="重新洗牌開局"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {activeMode === 'mode_library' ? (
        /* MODE 5: Vocabulary Library & Card Explorer */
        <div className="space-y-4">
          {/* Search & Filter Header */}
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

            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
              {VOCAB_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 border ${
                    selectedCategory === cat.id
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
            <span>找到 {filteredVocabList.length} 個詞語</span>
            <span>點擊任意卡片喇叭即可聆聽純正廣東話發音 🔊</span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredVocabList.map((item) => (
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
      ) : activeMode === 'mode_scramble' ? (
        /* MODE 4: SENTENCE SCRAMBLE PRACTICE (重組句子) */
        <SentenceScramblePractice
          onStreakUpdate={(newStreak) => setStreak(newStreak)}
          onTriggerPokemon={(streakNum) => triggerPokemonDraw(streakNum)}
          currentStreak={streak}
        />
      ) : isQuizCompleted ? (
        /* QUIZ COMPLETED SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-md max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              太棒了！完成本輪挑戰 🎉
            </h3>
            <p className="text-slate-500 text-sm">
              Jovan 在本輪 {quizQuestions.length} 道詞語題目中，答對了：
            </p>
          </div>

          {/* Score Badge */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 inline-block w-full max-w-sm">
            <div className="text-4xl sm:text-5xl font-black font-mono text-amber-600">
              {score} <span className="text-2xl text-slate-400">/ {quizQuestions.length}</span>
            </div>
            <div className="text-xs font-bold text-amber-800 mt-2">
              正確率：{Math.round((score / Math.max(1, quizQuestions.length)) * 100)}%
            </div>
          </div>

          {/* Mistake review prompt if any */}
          {wrongItems.length > 0 && (
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <HelpCircle className="w-4 h-4" />
                <span>需要加強鞏固的詞語（共 {wrongItems.length} 個）：</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {wrongItems.map((item) => (
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
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {availablePacks > 0 && (
              <button
                type="button"
                onClick={handleManualOpenPack}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/30 transition flex items-center gap-2 animate-bounce cursor-pointer"
              >
                <Gift className="w-4 h-4 fill-slate-950" />
                <span>拆開獎勵卡包 ({availablePacks})</span>
              </button>
            )}

            <button
              type="button"
              onClick={scrollToBinder}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>查看寶可夢集卡冊 ({unlockedCardIds.length}/{POKEMON_CARDS_DATA.length})</span>
            </button>

            {wrongItems.length > 0 && (
              <button
                type="button"
                onClick={() => startQuiz(wrongItems)}
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>專項複習這 {wrongItems.length} 個錯詞</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => startQuiz()}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>換一組新題目</span>
            </button>
          </div>
        </div>
      ) : currentItem ? (
        /* ACTIVE QUIZ QUESTION CONTAINER */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">進度 Progress</span>
              <span className="font-mono font-black text-amber-600 text-sm sm:text-base">
                {currentIndex + 1}
              </span>
              <span className="text-slate-400 text-xs">/ {quizQuestions.length}</span>
            </div>

            <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">目前答對：</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
                {score}
              </span>
            </div>
          </div>

          {/* QUESTION PROMPT CARD */}
          <div className="bg-gradient-to-b from-amber-50/60 to-orange-50/40 rounded-3xl p-6 sm:p-8 border border-amber-100 text-center space-y-4">
            {/* TYPE 1: 發音四揀一 */}
            {activeMode === 'mode_audio' && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
                  <span>🎧 第一題型：聽發音，選出正確的詞語</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="play-question-audio"
                    onClick={handleSpeakCurrent}
                    className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6 animate-pulse" />
                    <span>點擊聆聽粵語發音 🔊</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-medium">
                  提示：點擊按鈕重聽發音，然後從下方四個選項中選出正確詞語。
                </p>
              </div>
            )}

            {/* TYPE 2: 缺字填空 */}
            {activeMode === 'mode_missing' && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
                  <span>🧩 第二題型：缺字填空，選出括號內遺漏的漢字</span>
                </div>

                {/* Display Word with Missing Blank */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {currentItem.chars.map((ch, idx) => {
                    const isBlank = idx === blankIndex;
                    return isBlank ? (
                      <div
                        key={idx}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-dashed border-amber-400 flex items-center justify-center text-3xl sm:text-4xl font-bold font-serif text-amber-600 shadow-inner animate-pulse"
                      >
                        {isAnswered ? ch : '？'}
                      </div>
                    ) : (
                      <div
                        key={idx}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl sm:text-4xl font-bold font-serif text-slate-800 shadow-sm"
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSpeakCurrent}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>聽完整詞語發音（語音提示）</span>
                  </button>
                </div>
              </div>
            )}

            {/* TYPE 3: 英文對照 */}
            {activeMode === 'mode_english' && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
                  <span>🇬🇧 第三題型：根據英文釋義，選出對應的中文詞語</span>
                </div>

                <div className="py-2">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                    English Meaning / Definition
                  </div>
                  <div className="text-2xl sm:text-4xl font-extrabold text-slate-800 font-sans tracking-tight">
                    {currentItem.english}
                  </div>
                </div>

                {isAnswered && (
                  <button
                    type="button"
                    onClick={handleSpeakCurrent}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>粵語發音：{currentItem.jyutping}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4-CHOICE OPTIONS GRID (FOR MODES 1, 2, 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentOptions.map((opt, idx) => {
              const isSelected = selectedAnswer === opt.id;
              const isCorrect = opt.isCorrect;

              let btnStyle = 'bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-800';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200';
                } else {
                  btnStyle = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`choice-opt-${idx}`}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-500 shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold font-serif text-slate-800">
                        {opt.text}
                      </div>
                      {isAnswered && 'jyutping' in opt && opt.jyutping && (
                        <div className="text-xs font-mono text-slate-400">{opt.jyutping}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* EXPLANATION & NEXT STEP BAR (AFTER ANSWERED) */}
          {isAnswered && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-900">
                    正確解答：<strong>{currentItem.word}</strong>
                  </span>
                  <span className="font-mono text-xs text-slate-500">（{currentItem.jyutping}）</span>
                  <span className="text-xs text-slate-500">• {currentItem.english}</span>
                </div>
                {currentItem.exampleSentence && (
                  <p className="text-xs text-amber-800/80">
                    💡 例句應用：<em>「{currentItem.exampleSentence}」</em>
                  </p>
                )}
              </div>

              <button
                type="button"
                id="next-question-btn"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer self-end sm:self-center"
              >
                <span>{currentIndex + 1 >= quizQuestions.length ? '查看本輪成績' : '下一題'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* JOVAN'S POKEMON CARD COLLECTION BINDER (PLACED AT BOTTOM) */}
      <PokemonBinder
        unlockedCardIds={unlockedCardIds}
        currentStreak={streak}
        availablePacks={availablePacks}
        onOpenPack={handleManualOpenPack}
        onResetCollection={handleResetCollection}
      />

      {/* GACHA CARD REVEAL MODAL */}
      <PokemonGachaModal
        isOpen={gachaModalOpen}
        onClose={() => setGachaModalOpen(false)}
        drawnCard={drawnCard}
        isNewCard={isNewCard}
        streakCount={lastStreakTriggered || 5}
        onViewBinder={scrollToBinder}
      />
    </div>
  );
};
