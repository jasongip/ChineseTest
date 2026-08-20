import React, { useState, useEffect, useMemo } from 'react';
import { SCRAMBLE_SENTENCES_DATA, ScrambleSentenceItem } from '../data/scrambleSentences';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  HelpCircle,
  ArrowRight,
  Flame,
  Undo2,
  RefreshCw,
  Trophy,
  Check,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';

interface SentenceScramblePracticeProps {
  onStreakUpdate: (newStreak: number) => void;
  onTriggerPokemon: (streak: number) => void;
  currentStreak: number;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SentenceScramblePractice: React.FC<SentenceScramblePracticeProps> = ({
  onStreakUpdate,
  onTriggerPokemon,
  currentStreak,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quizSize, setQuizSize] = useState<number>(10);
  const [questions, setQuestions] = useState<ScrambleSentenceItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Active question state
  // availableTokens: { id: string, text: string }[]
  const [availableTokens, setAvailableTokens] = useState<{ id: string; text: string }[]>([]);
  const [placedTokens, setPlacedTokens] = useState<{ id: string; text: string }[]>([]);
  
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [wrongQuestions, setWrongQuestions] = useState<ScrambleSentenceItem[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Filter list
  const filteredSentences = useMemo(() => {
    if (selectedCategory === 'all') return SCRAMBLE_SENTENCES_DATA;
    return SCRAMBLE_SENTENCES_DATA.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Categories list
  const categories = [
    { id: 'all', name: '全部主題句子 (40+ 句)' },
    { id: 'family_people', name: '👨‍👩‍👧‍👦 家庭與人物' },
    { id: 'school_learning', name: '🏫 學校與學習' },
    { id: 'nature_animals', name: '🌿 大自然與動植物' },
    { id: 'daily_actions', name: '🏃 日常生活與動作' },
    { id: 'objects_food', name: '🍎 物品與食物' },
    { id: 'feelings_adj', name: '😄 感覺與情緒' },
    { id: 'time_place', name: '⏰ 時間與方位' },
  ];

  // Initialize or restart quiz
  const startQuiz = (customList?: ScrambleSentenceItem[]) => {
    const pool: ScrambleSentenceItem[] = customList || filteredSentences;
    const shuffled: ScrambleSentenceItem[] = shuffleArray<ScrambleSentenceItem>(pool).slice(0, Math.min(quizSize, pool.length));
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setWrongQuestions([]);
    setIsQuizCompleted(false);
    if (shuffled.length > 0) {
      loadQuestion(shuffled[0]);
    }
  };

  // Load a single question
  const loadQuestion = (item: ScrambleSentenceItem | undefined) => {
    if (!item) return;
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
    setPlacedTokens([]);

    // Create unique token objects and shuffle them
    const initialTokens = item.segments.map((seg, idx) => ({
      id: `${item.id}_${idx}_${seg}`,
      text: seg,
    }));

    // Ensure it's not already in correct order
    let shuffled = shuffleArray(initialTokens);
    if (shuffled.map((t) => t.text).join('') === item.segments.join('') && shuffled.length > 1) {
      shuffled = shuffleArray(shuffled);
    }

    setAvailableTokens(shuffled);
  };

  // On category or size change
  useEffect(() => {
    startQuiz();
  }, [selectedCategory, quizSize]);

  const currentQ = questions[currentIndex];

  // User clicks an available card -> move to placed
  const handleSelectToken = (token: { id: string; text: string }) => {
    if (isAnswered) return;
    audioService.playPop();
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    setPlacedTokens((prev) => [...prev, token]);
  };

  // User clicks a placed card -> return to available
  const handleRemovePlacedToken = (token: { id: string; text: string }) => {
    if (isAnswered) return;
    audioService.playPop();
    setPlacedTokens((prev) => prev.filter((t) => t.id !== token.id));
    setAvailableTokens((prev) => [...prev, token]);
  };

  // Undo last placed token
  const handleUndo = () => {
    if (isAnswered || placedTokens.length === 0) return;
    audioService.playPop();
    const last = placedTokens[placedTokens.length - 1];
    setPlacedTokens((prev) => prev.slice(0, prev.length - 1));
    setAvailableTokens((prev) => [...prev, last]);
  };

  // Reset all tokens
  const handleResetTokens = () => {
    if (isAnswered || !currentQ) return;
    audioService.playPop();
    setPlacedTokens([]);
    const initialTokens = currentQ.segments.map((seg, idx) => ({
      id: `${currentQ.id}_${idx}_${seg}`,
      text: seg,
    }));
    setAvailableTokens(shuffleArray(initialTokens));
  };

  // Check Answer
  const handleCheckAnswer = () => {
    if (!currentQ || isAnswered || placedTokens.length === 0) return;

    const constructed = placedTokens.map((t) => t.text).join('');
    const target = currentQ.segments.join('');
    const correct = constructed === target;

    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      audioService.playSuccess();
      setScore((prev) => prev + 1);
      const newStreak = currentStreak + 1;
      onStreakUpdate(newStreak);

      // Read aloud the whole sentence
      setTimeout(() => {
        speakCantonese(currentQ.targetSentence);
      }, 300);

      // Trigger Pokemon reward every 5 streak
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => {
          onTriggerPokemon(newStreak);
        }, 800);
      }
    } else {
      audioService.playError();
      onStreakUpdate(0);
      setWrongQuestions((prev) => [...prev, currentQ]);
    }
  };

  // Next Question
  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsQuizCompleted(true);
      audioService.playCelebration();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadQuestion(questions[nextIdx]);
    }
  };

  // Pronounce prompt clue
  const handlePlayVoicePrompt = () => {
    if (!currentQ) return;
    speakCantonese(currentQ.targetSentence);
  };

  return (
    <div className="space-y-6">
      {/* FILTER & TOP CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-bold text-slate-500 shrink-0">主題分類：</span>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Quiz Length */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">每輪題數：</span>
          {[5, 10, 15].map((len) => (
            <button
              key={len}
              onClick={() => setQuizSize(len)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                quizSize === len ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {len} 題
            </button>
          ))}
        </div>
      </div>

      {/* QUIZ MAIN CARD */}
      {!isQuizCompleted && currentQ ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg relative overflow-hidden">
          {/* Top Progress & Streak */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                重組句子 • 第 {currentIndex + 1} / {questions.length} 題
              </span>
              <span className="text-xs text-slate-500 font-medium">
                主題：{currentQ.categoryName}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>連對: <strong>{currentStreak}</strong></span>
              </div>
              <div className="text-xs font-bold text-slate-600">
                得分: <span className="text-amber-600 font-black">{score}</span> / {currentIndex + (isAnswered ? 1 : 0)}
              </div>
            </div>
          </div>

          {/* QUESTION PROMPT & VOICE CLUE */}
          <div className="bg-amber-50/80 rounded-2xl p-4 sm:p-5 border border-amber-200/80 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
                  🧩 任務：點擊下方字卡，排成通順完整的正確句子
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                🇬🇧 英文意思：<span className="text-slate-800 font-medium italic">{currentQ.english}</span>
              </p>
              {showHint && currentQ.hint && (
                <p className="text-xs text-amber-700 font-bold mt-1.5 flex items-center gap-1 animate-fade-in">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> {currentQ.hint}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? '隱藏提示' : '句型提示'}</span>
              </button>

              <button
                type="button"
                onClick={handlePlayVoicePrompt}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>聽讀音提示</span>
              </button>
            </div>
          </div>

          {/* SENTENCE BUILDER / PLACED AREA */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <span>📝 仔仔組合的句子：</span>
                <span className="text-[11px] text-slate-400 font-normal">（點擊已放上的字卡可退回）</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAnswered || placedTokens.length === 0}
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" /> 撤銷上一張
                </button>
                <button
                  type="button"
                  disabled={isAnswered || placedTokens.length === 0}
                  onClick={handleResetTokens}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重排
                </button>
              </div>
            </div>

            {/* Dropped / Placed Token Slots */}
            <div
              className={`min-h-[96px] sm:min-h-[110px] rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-wrap items-center gap-2.5 sm:gap-3 ${
                isAnswered
                  ? isCorrect
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/30'
                  : placedTokens.length > 0
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-slate-50 border-dashed border-slate-300 justify-center'
              }`}
            >
              {placedTokens.length === 0 ? (
                <div className="text-center text-slate-400 text-xs sm:text-sm font-medium py-4">
                  👇 請點擊下方的字卡按順序排列句子 👇
                </div>
              ) : (
                placedTokens.map((token, idx) => (
                  <button
                    key={token.id}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleRemovePlacedToken(token)}
                    className={`group relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-black text-base sm:text-lg tracking-wide transition-all select-none shadow-md flex items-center gap-1.5 ${
                      isAnswered
                        ? isCorrect
                          ? 'bg-emerald-500 text-white shadow-emerald-200'
                          : 'bg-rose-500 text-white shadow-rose-200'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <span className="text-[10px] opacity-60 font-mono font-normal mr-0.5">#{idx + 1}</span>
                    <span>{token.text}</span>
                    {!isAnswered && (
                      <span className="text-xs opacity-0 group-hover:opacity-100 text-slate-900 transition-opacity">✕</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* AVAILABLE WORD CARDS POOL */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-600">
                🎴 待選字卡（點擊放上）：
              </label>
              <span className="text-xs text-slate-400 font-medium">
                剩餘 {availableTokens.length} 張
              </span>
            </div>

            <div className="min-h-[80px] p-4 rounded-2xl bg-slate-100/70 border border-slate-200 flex flex-wrap items-center gap-3">
              {availableTokens.length === 0 ? (
                <div className="w-full text-center text-xs text-emerald-600 font-bold py-2 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 所有字卡已全部排上！請點擊「檢查答案」！
                </div>
              ) : (
                availableTokens.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => handleSelectToken(token)}
                    className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white hover:bg-amber-100 border-2 border-amber-300/80 hover:border-amber-400 text-slate-900 font-black text-base sm:text-lg tracking-wide shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all select-none cursor-pointer"
                  >
                    {token.text}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* FEEDBACK & EXPLANATION (AFTER ANSWERED) */}
          {isAnswered && (
            <div
              className={`p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-up ${
                isCorrect
                  ? 'bg-emerald-100/80 border border-emerald-300 text-emerald-950'
                  : 'bg-rose-100/80 border border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-base font-black">
                    {isCorrect ? '🎉 答啱咗！好棒！' : '❌ 順序仲有啲小問題，唔緊要！'}
                  </h4>
                  <div className="text-sm font-bold mt-1 text-slate-800">
                    正確句子：<span className="text-emerald-700 font-black">{currentQ.targetSentence}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-500">相關核心詞語：</span>
                    {currentQ.keyVocab.map((kv, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white text-xs font-black text-slate-800 shadow-2xs">
                        {kv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakCantonese(currentQ.targetSentence)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>朗讀正確句子</span>
              </button>
            </div>
          )}

          {/* ACTION BUTTON: CHECK OR NEXT */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!isAnswered ? (
              <>
                <div className="text-xs text-slate-500 font-medium">
                  {availableTokens.length > 0 ? (
                    <span className="text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-200 inline-flex items-center gap-1 font-bold">
                      ⚠️ 仲有 {availableTokens.length} 張字卡未放上，請全部放上組裝完整句子
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-1 font-bold">
                      ✨ 字卡已全部放上，請點擊右方「檢查答案」！
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={availableTokens.length > 0 || placedTokens.length === 0}
                  onClick={handleCheckAnswer}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base shadow-lg shadow-amber-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  <span>{availableTokens.length > 0 ? `請放上所有字卡 (${placedTokens.length}/${currentQ.segments.length})` : '檢查答案'}</span>
                </button>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-bounce"
                >
                  <span>{currentIndex + 1 >= questions.length ? '查看重組特訓成績' : '下一題'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : isQuizCompleted ? (
        /* QUIZ COMPLETED SUMMARY SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            🎊 恭喜 Jovan 完成重組句子特訓！
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            仔仔完成了 {questions.length} 道句子重組練習，掌握了多個重要語法句型！
          </p>

          {/* SCORE BOARD */}
          <div className="max-w-md mx-auto grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">總得分</span>
              <span className="text-3xl font-black text-amber-600 font-mono">
                {score} <span className="text-sm text-slate-400 font-normal">/ {questions.length}</span>
              </span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">正確率</span>
              <span className="text-3xl font-black text-emerald-600 font-mono">
                {Math.round((score / Math.max(1, questions.length)) * 100)}%
              </span>
            </div>
          </div>

          {/* WRONG QUESTIONS REVIEW */}
          {wrongQuestions.length > 0 && (
            <div className="max-w-xl mx-auto text-left bg-rose-50/80 rounded-2xl p-5 border border-rose-200 mb-8">
              <h4 className="text-sm font-black text-rose-900 mb-3 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> 本輪需要加強的句子 ({wrongQuestions.length} 句)：
              </h4>
              <div className="space-y-2">
                {wrongQuestions.map((wq, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-rose-200/60 text-xs text-slate-800">
                    <span className="font-bold text-rose-700">第 {i + 1} 句：</span> {wq.targetSentence}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => startQuiz(wrongQuestions)}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>專項重溫這 {wrongQuestions.length} 個錯句</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => startQuiz()}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>換一組全新句子特訓</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
