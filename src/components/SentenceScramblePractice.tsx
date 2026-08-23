import React, { useState, useEffect } from 'react';
import { ScrambleSentenceItem } from '../data/scrambleSentences';
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
  Trophy,
  Check,
  Award,
} from 'lucide-react';

interface SentenceScramblePracticeProps {
  questions: ScrambleSentenceItem[];
  onStreakUpdate: (newStreak: number) => void;
  onTriggerPokemon: (streak: number) => void;
  currentStreak: number;
  onRecordResult?: (isCorrect: boolean) => void;
  onSessionComplete?: (score: number, wrongItems: ScrambleSentenceItem[]) => void;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...(array || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SentenceScramblePractice: React.FC<SentenceScramblePracticeProps> = ({
  questions = [],
  onStreakUpdate,
  onTriggerPokemon,
  currentStreak = 0,
  onRecordResult,
  onSessionComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Active question state
  const [availableTokens, setAvailableTokens] = useState<{ id: string; text: string }[]>([]);
  const [placedTokens, setPlacedTokens] = useState<{ id: string; text: string }[]>([]);
  
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [wrongQuestions, setWrongQuestions] = useState<ScrambleSentenceItem[]>([]);

  // Load a single question
  const loadQuestion = (item: ScrambleSentenceItem | undefined) => {
    if (!item || !item.segments) return;
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

  useEffect(() => {
    setCurrentIndex(0);
    setScore(0);
    setWrongQuestions([]);
    if (questions && questions.length > 0) {
      loadQuestion(questions[0]);
    }
  }, [questions]);

  const currentQ = questions && questions.length > 0 ? questions[currentIndex] : undefined;

  // User clicks an available card -> move to placed
  const handleSelectToken = (token: { id: string; text: string }) => {
    if (isAnswered) return;
    audioService.playPop();
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    setPlacedTokens((prev) => [...prev, token]);
  };

  // User clicks a placed card -> return to available
  const handleRemovePlacedToken = (token: { id: string; text: string }) => {
    if (isAnswered) {
      audioService.playPop();
      return;
    }
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
      if (onRecordResult) onRecordResult(true);

      // Read aloud the whole sentence
      setTimeout(() => {
        speakCantonese(currentQ.targetSentence);
      }, 300);

      // Trigger Pokemon reward immediately every 5 consecutive correct answers (5, 10, 15, 20...)
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => {
          onTriggerPokemon(newStreak);
        }, 500);
      }
    } else {
      audioService.playError();
      onStreakUpdate(0);
      if (onRecordResult) onRecordResult(false);
      setWrongQuestions((prev) => [...prev, currentQ]);
    }
  };

  // Next Question
  const handleNext = () => {
    const totalQ = questions ? questions.length : 0;
    if (currentIndex + 1 >= totalQ) {
      if (onSessionComplete) {
        onSessionComplete(score, wrongQuestions);
      }
      audioService.playCelebration();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (questions && questions[nextIdx]) {
        loadQuestion(questions[nextIdx]);
      }
    }
  };

  // Pronounce prompt clue
  const handlePlayVoicePrompt = () => {
    if (!currentQ) return;
    speakCantonese(currentQ.targetSentence);
  };

  if (!currentQ) return null;

  const isAllPlaced = (availableTokens || []).length === 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ACTIVE QUESTION CONTAINER */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
        {/* Progress & Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
              {currentQ.categoryName}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500">進度</span>
              <span className="font-mono font-black text-amber-600 text-sm">
                {currentIndex + 1}
              </span>
              <span className="text-slate-400 text-xs">/ {questions ? questions.length : 0}</span>
            </div>
          </div>

          <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / Math.max(1, questions ? questions.length : 1)) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-900">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>連對: {currentStreak}</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
              得分: {score}
            </div>
          </div>
        </div>

        {/* PROMPT & MEANING CLUE */}
        <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl p-4 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>將下方打亂的詞語字卡，按正確語序拖放排列成一句通順完整的句子：</span>
            </div>
            <div className="text-sm font-semibold text-slate-700">
              英文語義提示：<span className="text-slate-900 font-serif italic">{currentQ.englishMeaning}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlayVoicePrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition shrink-0 active:scale-95 cursor-pointer"
            title="點擊聽粵語整句提示"
          >
            <Volume2 className="w-4 h-4" />
            <span>聽語音提示</span>
          </button>
        </div>

        {/* ANSWER PLACEMENT AREA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>你的句子排列區（點擊已放字卡可放回）：</span>
            {placedTokens.length > 0 && !isAnswered && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>撤銷</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTokens}
                  className="flex items-center gap-1 text-rose-500 hover:text-rose-700 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>
              </div>
            )}
          </div>

          <div
            className={`min-h-[90px] sm:min-h-[110px] rounded-2xl p-3 sm:p-4 border-2 transition-all flex flex-wrap items-center gap-2 sm:gap-3 ${
              isAnswered
                ? isCorrect
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  : 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                : placedTokens.length > 0
                ? 'bg-amber-50/40 border-amber-300'
                : 'bg-slate-50 border-dashed border-slate-300'
            }`}
          >
            {placedTokens.length === 0 ? (
              <div className="w-full text-center text-slate-400 text-sm font-medium py-3">
                👆 請點擊下方字卡進行排列...
              </div>
            ) : (
              placedTokens.map((token, idx) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => handleRemovePlacedToken(token)}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 font-serif text-lg sm:text-2xl font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    isAnswered
                      ? isCorrect
                        ? 'bg-white border-emerald-400 text-emerald-900 shadow-emerald-100'
                        : 'bg-white border-rose-300 text-rose-900 shadow-rose-100'
                      : 'bg-white border-amber-300 text-slate-800 hover:border-amber-400 hover:bg-amber-50 shadow-amber-100'
                  }`}
                >
                  <span>{token.text}</span>
                  {!isAnswered && (
                    <span className="text-[10px] font-mono text-slate-300 ml-1">#{idx + 1}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* AVAILABLE TOKENS POOL */}
        {!isAnswered && (
          <div className="space-y-2">
            <div className="text-xs text-slate-500 font-bold px-1">
              待選字卡（點擊放入上方）：
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 sm:gap-3 min-h-[70px]">
              {availableTokens.length === 0 ? (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 py-1">
                  <Check className="w-4 h-4" />
                  <span>已放齊所有字卡，請點擊下方「提交檢查」！</span>
                </div>
              ) : (
                availableTokens.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => handleSelectToken(token)}
                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-amber-100/70 border-2 border-slate-300 hover:border-amber-400 text-slate-800 font-serif text-lg sm:text-2xl font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {token.text}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK & EXPLANATION WHEN ANSWERED */}
        {isAnswered && (
          <div
            className={`p-4 rounded-2xl border space-y-2 animate-fadeIn ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 text-base font-black">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>恭喜答啱！句子排列通順 🎉</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>排列順序有誤，再接再厲！💪</span>
                </>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-xs font-bold text-slate-600">正確標準句子：</div>
              <div className="text-lg sm:text-xl font-serif font-bold text-slate-900 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                {currentQ.targetSentence}
              </div>
              <p className="text-xs text-slate-500 pt-1">💡 語法解析：{currentQ.explanation}</p>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTON */}
        <div className="pt-2">
          {!isAnswered ? (
            <button
              type="button"
              id="submit-scramble-btn"
              onClick={handleCheckAnswer}
              disabled={placedTokens.length === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                isAllPlaced
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 active:scale-98'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Check className="w-4 h-4" />
              <span>{isAllPlaced ? '完成排列，提交檢查！🚀' : '提交檢查答案'}</span>
            </button>
          ) : (
            <button
              type="button"
              id="next-scramble-btn"
              onClick={handleNext}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{currentIndex + 1 >= (questions ? questions.length : 0) ? '查看本輪成績' : '下一題'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
