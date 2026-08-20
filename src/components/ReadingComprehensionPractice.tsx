import React, { useState, useEffect, useMemo } from 'react';
import {
  STORY_CATEGORIES,
  READING_STORY_LIST,
  StoryComprehensionItem,
} from '../data/readingComprehension';
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
  Gift,
  ArrowRight,
  RefreshCw,
  Trophy,
  Filter,
  Check,
} from 'lucide-react';

interface ReadingComprehensionPracticeProps {
  onTriggerPokemon: (streakOrCount: number) => void;
  unlockedCardsCount?: number;
  totalCardsCount?: number;
}

const STORAGE_KEY_CUMULATIVE_CORRECT = 'jovan_story_cumulative_correct_v1';
const STORAGE_KEY_LAST_DRAW_TRIGGER = 'jovan_story_last_draw_count_v1';

export const ReadingComprehensionPractice: React.FC<ReadingComprehensionPracticeProps> = ({
  onTriggerPokemon,
  unlockedCardsCount = 0,
  totalCardsCount = 50,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quizSize, setQuizSize] = useState<number>(10);
  const [questions, setQuestions] = useState<StoryComprehensionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [wrongItems, setWrongItems] = useState<StoryComprehensionItem[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Cumulative correct counter for reading comprehension (triggers every 10 correct, non-consecutive)
  const [cumulativeCorrect, setCumulativeCorrect] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUMULATIVE_CORRECT);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [lastDrawTriggered, setLastDrawTriggered] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_DRAW_TRIGGER);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Save cumulative stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUMULATIVE_CORRECT, String(cumulativeCorrect));
    } catch {}
  }, [cumulativeCorrect]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_DRAW_TRIGGER, String(lastDrawTriggered));
    } catch {}
  }, [lastDrawTriggered]);

  // Filter and start quiz
  const startQuiz = (customList?: StoryComprehensionItem[]) => {
    let pool = customList ? [...customList] : [...READING_STORY_LIST];

    if (!customList && selectedCategory !== 'all') {
      pool = pool.filter((item) => item.category === selectedCategory);
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, quizSize);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswerIdx(null);
    setIsAnswered(false);
    setRoundScore(0);
    setWrongItems([]);
    setIsQuizCompleted(false);
  };

  useEffect(() => {
    startQuiz();
  }, [selectedCategory, quizSize]);

  const currentQ = questions[currentIndex];

  // Options shuffled or direct
  const optionsWithMeta = useMemo(() => {
    if (!currentQ) return [];
    return currentQ.options.map((optText, index) => ({
      text: optText,
      index,
      isCorrect: index === currentQ.correctIndex,
    }));
  }, [currentQ]);

  // Handle selecting an option
  const handleSelectOption = (idx: number, optText: string) => {
    // If already answered, allow clicking ANY option to hear pronunciation!
    if (isAnswered) {
      audioService.playPop();
      speakCantonese(optText);
      return;
    }

    setSelectedAnswerIdx(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      audioService.playSuccess();
      setRoundScore((prev) => prev + 1);
      const newCumulative = cumulativeCorrect + 1;
      setCumulativeCorrect(newCumulative);

      // Trigger reward every 10 cumulative correct answers (10, 20, 30...)
      if (newCumulative > 0 && newCumulative % 10 === 0 && newCumulative !== lastDrawTriggered) {
        setLastDrawTriggered(newCumulative);
        setTimeout(() => {
          onTriggerPokemon(newCumulative);
        }, 500);
      }
    } else {
      audioService.playError();
      if (currentQ && !wrongItems.some((w) => w.id === currentQ.id)) {
        setWrongItems((prev) => [...prev, currentQ]);
      }
    }

    // Pronounce the selected answer option
    speakCantonese(optText);
  };

  // Next Question
  const handleNext = () => {
    audioService.playClick();
    if (currentIndex + 1 >= questions.length) {
      setIsQuizCompleted(true);
      audioService.playCelebration();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedAnswerIdx(null);
      setIsAnswered(false);
    }
  };

  // Speak passage or question
  const handleReadPassage = () => {
    if (!currentQ) return;
    audioService.playClick();
    speakCantonese(currentQ.passage);
  };

  const handleReadQuestion = () => {
    if (!currentQ) return;
    audioService.playClick();
    speakCantonese(currentQ.question);
  };

  // Cumulative progress towards next Pokemon card
  const progressToNextPack = cumulativeCorrect % 10;
  const questionsLeftForPack = 10 - progressToNextPack;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* CUMULATIVE REWARD BANNER */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-3 sm:p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
            🎁
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base">短文閱讀理解專屬獎勵</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 font-extrabold text-[10px] shadow-xs">
                難度升級 • 累積 10 題抽卡
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium">
              只要累積答對 10 題（無需連續），即刻撕開寶可夢卡包獲得全新卡牌！
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-1.5 border border-white/20">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-indigo-100">累積答對</div>
            <div className="text-xs font-extrabold font-mono text-amber-300">
              {cumulativeCorrect} 題 ({progressToNextPack}/10)
            </div>
          </div>

          <div className="w-16 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all duration-300"
              style={{ width: `${(progressToNextPack / 10) * 100}%` }}
            />
          </div>

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {questionsLeftForPack === 10 ? '✨ 剛達成抽卡！' : `差 ${questionsLeftForPack} 題抽卡`}
          </span>
        </div>
      </div>

      {/* FILTER & LENGTH SELECTOR */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-2xl no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-0.5" />
          {STORY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                audioService.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Quiz Question Count & Refresh */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-bold">每輪題數：</span>
          {[5, 10, 15, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                audioService.playClick();
                setQuizSize(num);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-1 transition cursor-pointer"
            title="重新洗牌短文"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MAIN QUIZ CONTAINER */}
      {isQuizCompleted ? (
        /* QUIZ COMPLETED SCREEN */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-400 to-indigo-600 flex items-center justify-center text-white text-4xl shadow-lg shadow-purple-500/30 animate-bounce">
            🏆
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              短文閱讀理解特訓完成！
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              恭喜你完成本輪閱讀理解練習！你的廣東話閱讀和分析能力正穩步提升！
            </p>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5">
              <div className="text-xs text-purple-600 font-bold mb-1">本輪得分</div>
              <div className="text-2xl font-black text-purple-700 font-mono">
                {roundScore} / {questions.length}
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5">
              <div className="text-xs text-indigo-600 font-bold mb-1">總累積答對</div>
              <div className="text-2xl font-black text-indigo-700 font-mono">
                {cumulativeCorrect} 題
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
              <div className="text-xs text-amber-600 font-bold mb-1">距離下張卡</div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {questionsLeftForPack} 題
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {wrongItems.length > 0 && (
              <button
                type="button"
                onClick={() => startQuiz(wrongItems)}
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>專項複習這 {wrongItems.length} 篇短文</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => startQuiz()}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>換一組新短文</span>
            </button>
          </div>
        </div>
      ) : currentQ ? (
        /* ACTIVE QUESTION CARD */
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">
                {currentQ.categoryName} • {currentQ.title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500">進度</span>
                <span className="font-mono font-black text-purple-600 text-sm">
                  {currentIndex + 1}
                </span>
                <span className="text-slate-400 text-xs">/ {questions.length}</span>
              </div>
            </div>

            <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-slate-400">本輪答對：</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                {roundScore}
              </span>
            </div>
          </div>

          {/* SHORT PASSAGE BOX (約20字故事) */}
          <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-slate-50 rounded-2xl p-4 sm:p-5 border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>閱讀短文故事：</span>
              </div>
              <button
                type="button"
                onClick={handleReadPassage}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                title="點擊聆聽整段短文粵語朗讀"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>朗讀短文 🔊</span>
              </button>
            </div>

            {/* Passage Text */}
            <div className="bg-white/90 rounded-xl p-4 border border-purple-100/80 text-lg sm:text-2xl font-serif font-bold text-slate-800 leading-relaxed tracking-wide shadow-inner">
              {currentQ.passage}
            </div>

            {/* Key Vocabulary Pills */}
            {currentQ.keyVocab && currentQ.keyVocab.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400">核心詞彙：</span>
                {currentQ.keyVocab.map((vocab, vIdx) => (
                  <button
                    key={vIdx}
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      speakCantonese(vocab);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title={`點擊聆聽「${vocab}」發音`}
                  >
                    <span>{vocab}</span>
                    <Volume2 className="w-3 h-3 text-purple-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COMPREHENSION QUESTION */}
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                問
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 font-sans">
                {currentQ.question}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReadQuestion}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-purple-600 border border-slate-200 transition shrink-0 cursor-pointer"
              title="聆聽問題"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Tip for Option Pronunciation */}
          {isAnswered && (
            <div className="text-[11px] text-slate-500 font-bold flex items-center justify-between px-1">
              <span>💡 提示：點擊任何選項卡片均可重複聆聽粵語發音！</span>
              <span className="text-purple-600">🔊 點選發音學習</span>
            </div>
          )}

          {/* 4-CHOICE OPTIONS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {optionsWithMeta.map((opt, idx) => {
              const isSelected = selectedAnswerIdx === idx;
              const isCorrect = opt.isCorrect;

              let btnStyle =
                'bg-slate-50 border-slate-200 hover:bg-purple-50 hover:border-purple-300 text-slate-800';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle =
                    'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200';
                } else {
                  btnStyle =
                    'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-purple-50/70 hover:border-purple-300';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  id={`story-opt-${idx}`}
                  onClick={() => handleSelectOption(idx, opt.text)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-600 shadow-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div>
                      <div className="text-lg sm:text-xl font-bold font-serif text-slate-800">
                        {opt.text}
                      </div>
                      {isAnswered && (
                        <div className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <Volume2 className="w-3 h-3" />
                          <span>點擊朗讀</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAnswered && isCorrect && (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="hidden sm:inline">正確答案</span>
                      </div>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <div className="flex items-center gap-1 text-rose-500 font-bold text-xs">
                        <XCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">答錯了</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* EXPLANATION & NEXT STEP */}
          {isAnswered && (
            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-purple-950">
                    正確答案：<strong>{currentQ.options[currentQ.correctIndex]}</strong>
                  </span>
                </div>
                <p className="text-xs text-purple-900/90 leading-relaxed">
                  💡 解析說明：{currentQ.explanation}
                </p>
              </div>

              <button
                type="button"
                id="next-story-btn"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer self-end sm:self-center"
              >
                <span>{currentIndex + 1 >= questions.length ? '查看本輪成績' : '下一篇短文'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
