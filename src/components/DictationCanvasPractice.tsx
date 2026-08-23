import React, { useRef, useState, useEffect } from 'react';
import { VocabItem } from '../data/vocabPracticeList';
import { CHARACTER_STROKE_DATABASE, CharacterStrokeDefinition, renderStrokeSegmentPath } from '../data/strokeData';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
  Flame,
  HelpCircle,
  Award,
  Check,
  Edit3,
  Lightbulb,
} from 'lucide-react';

interface DictationCanvasPracticeProps {
  questions: VocabItem[];
  onStreakUpdate: (newStreak: number) => void;
  onTriggerPokemon: (streak: number) => void;
  currentStreak: number;
  onRecordResult: (isCorrect: boolean) => void;
  onSessionComplete: (score: number, wrongItems: VocabItem[]) => void;
}

interface MissingStrokeQuestion {
  vocabItem: VocabItem;
  targetChar: string;
  charDef: CharacterStrokeDefinition;
  puzzle: CharacterStrokeDefinition['missingStrokePuzzles'][number];
}

export const DictationCanvasPractice: React.FC<DictationCanvasPracticeProps> = ({
  questions,
  onStreakUpdate,
  onTriggerPokemon,
  currentStreak,
  onRecordResult,
  onSessionComplete,
}) => {
  // Build playable questions from stroke database
  const [puzzleQuestions, setPuzzleQuestions] = useState<MissingStrokeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userScore, setUserScore] = useState<number>(0);
  const [wrongItems, setWrongItems] = useState<VocabItem[]>([]);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnStrokes, setDrawnStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  // Evaluation & Feedback state
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [isPass, setIsPass] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showHintGuide, setShowHintGuide] = useState<boolean>(false);

  // Initialize questions
  useEffect(() => {
    const pool: MissingStrokeQuestion[] = [];
    const allDbKeys = Object.keys(CHARACTER_STROKE_DATABASE);

    // First try to match characters from current vocabulary questions
    questions.forEach((q) => {
      for (const ch of q.chars) {
        if (CHARACTER_STROKE_DATABASE[ch] && CHARACTER_STROKE_DATABASE[ch].missingStrokePuzzles.length > 0) {
          const charDef = CHARACTER_STROKE_DATABASE[ch];
          const puzzle = charDef.missingStrokePuzzles[Math.floor(Math.random() * charDef.missingStrokePuzzles.length)];
          pool.push({
            vocabItem: q,
            targetChar: ch,
            charDef,
            puzzle,
          });
        }
      }
    });

    // If fewer than questions.length, fill up from all database items
    if (pool.length < Math.max(5, questions.length)) {
      allDbKeys.forEach((key) => {
        const charDef = CHARACTER_STROKE_DATABASE[key];
        if (charDef && charDef.missingStrokePuzzles.length > 0) {
          charDef.missingStrokePuzzles.forEach((puzzle) => {
            const mockVocab: VocabItem = {
              id: `v_mock_${key}`,
              word: key,
              jyutping: charDef.jyutping,
              english: charDef.english,
              category: 'general',
              chars: [key],
              exampleSentence: `這個字是「${key}」，請補上缺漏的筆畫。`,
            };
            pool.push({
              vocabItem: mockVocab,
              targetChar: key,
              charDef,
              puzzle,
            });
          });
        }
      });
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setPuzzleQuestions(shuffled.slice(0, Math.max(10, questions.length)));
    setCurrentIndex(0);
    setUserScore(0);
    setWrongItems([]);
  }, [questions]);

  const currentQ = puzzleQuestions[currentIndex];

  // Reset drawing canvas on question change
  useEffect(() => {
    setDrawnStrokes([]);
    setCurrentPath([]);
    setIsEvaluated(false);
    setIsPass(false);
    setFeedbackMessage('');
    setShowHintGuide(false);

    if (currentQ) {
      setTimeout(() => {
        speakCantonese(currentQ.targetChar);
      }, 200);
    }
  }, [currentIndex, currentQ?.puzzle.puzzleId]);

  // Render Tianzige and Base Character (with missing stroke omitted)
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentQ) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // 1. Draw Paper Background
    ctx.fillStyle = '#FFFAFA';
    ctx.fillRect(0, 0, size, size);

    // 2. Tianzige Grid (Red outer border + Dashed inner)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.8;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);

    // Center Cross
    ctx.beginPath();
    ctx.moveTo(4, size / 2);
    ctx.lineTo(size - 4, size / 2);
    ctx.moveTo(size / 2, 4);
    ctx.lineTo(size / 2, size - 4);
    ctx.stroke();

    // Diagonals (Mi-zi-ge)
    ctx.strokeStyle = '#FEE2E2';
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(size - 4, size - 4);
    ctx.moveTo(size - 4, 4);
    ctx.lineTo(4, size - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Render Base Strokes (The existing strokes of the character)
    const { charDef, puzzle } = currentQ;
    charDef.strokes.forEach((stroke, sIdx) => {
      // If this stroke is NOT the missing one, draw it in solid ink
      if (sIdx !== puzzle.missingStrokeIndex) {
        ctx.strokeStyle = '#1E293B'; // Solid slate ink
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        renderStrokeSegmentPath(ctx, stroke, size);
      }
    });

    // 4. If Hint Guide is active or question is passed, render the missing stroke
    if (showHintGuide || (isEvaluated && isPass)) {
      const missingStroke = charDef.strokes[puzzle.missingStrokeIndex];
      if (missingStroke) {
        ctx.strokeStyle = isPass ? '#059669' : '#F59E0B'; // Emerald if passed, Amber if hint
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        renderStrokeSegmentPath(ctx, missingStroke, size);
      }
    }

    // 5. Draw User Drawn Strokes
    ctx.strokeStyle = '#0F172A'; // Black ink for user strokes
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawnStrokes.forEach((st) => {
      if (st.length > 1) {
        ctx.beginPath();
        ctx.moveTo(st[0].x, st[0].y);
        for (let i = 1; i < st.length; i++) {
          ctx.lineTo(st[i].x, st[i].y);
        }
        ctx.stroke();
      }
    });

    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [drawnStrokes, currentPath, isEvaluated, isPass, showHintGuide, currentQ]);

  // Touch & Mouse Drawing
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isEvaluated && isPass) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (300 / rect.width);
    const y = (clientY - rect.top) * (300 / rect.height);

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (isEvaluated && isPass)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (300 / rect.width);
    const y = (clientY - rect.top) * (300 / rect.height);

    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setDrawnStrokes((prev) => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  const handleClearCanvas = () => {
    audioService.playClick();
    setDrawnStrokes([]);
    setCurrentPath([]);
    setIsEvaluated(false);
    setIsPass(false);
    setFeedbackMessage('');
  };

  // High Precision Missing Stroke Evaluation
  const handleSubmitEvaluation = () => {
    if (!currentQ) return;
    if (drawnStrokes.length === 0 && currentPath.length === 0) {
      audioService.playError();
      setFeedbackMessage('請在田字格內補上缺漏的筆畫後再提交！✏️');
      setIsEvaluated(true);
      setIsPass(false);
      return;
    }

    const { puzzle } = currentQ;
    const size = 300;
    const zone = puzzle.targetZone;

    // Convert target zone to pixels
    const minPxX = (zone.minX / 100) * size - 25;
    const maxPxX = (zone.maxX / 100) * size + 25;
    const minPxY = (zone.minY / 100) * size - 25;
    const maxPxY = (zone.maxY / 100) * size + 25;

    // Check all drawn points
    let pointsInZone = 0;
    let totalPoints = 0;

    drawnStrokes.forEach((st) => {
      st.forEach((pt) => {
        totalPoints++;
        if (pt.x >= minPxX && pt.x <= maxPxX && pt.y >= minPxY && pt.y <= maxPxY) {
          pointsInZone++;
        }
      });
    });

    const zoneCoverage = totalPoints > 0 ? pointsInZone / totalPoints : 0;
    const isTotalPointsValid = totalPoints >= 4 && totalPoints <= 400;

    // Check first stroke trajectory direction
    const firstStroke = drawnStrokes[0];
    let isDirectionOk = true;

    if (firstStroke && firstStroke.length > 3) {
      const startPt = firstStroke[0];
      const endPt = firstStroke[firstStroke.length - 1];
      const dx = endPt.x - startPt.x;
      const dy = endPt.y - startPt.y;

      if (puzzle.expectedDirection === 'LTR') {
        isDirectionOk = dx >= -15; // horizontal left to right
      } else if (puzzle.expectedDirection === 'TTB') {
        isDirectionOk = dy >= -15; // vertical top to bottom
      } else if (puzzle.expectedDirection === 'DIAG_TL_BR') {
        isDirectionOk = dx >= -10 && dy >= -10; // 捺/撇 (top-left to bottom-right)
      } else if (puzzle.expectedDirection === 'DIAG_TR_BL') {
        isDirectionOk = dx <= 15 && dy >= -10; // 撇 (top-right to bottom-left)
      }
    }

    // Decision rule: 75%+ points inside the specific target quadrant + valid points + direction check
    const passed = zoneCoverage >= 0.65 && isTotalPointsValid && isDirectionOk;

    if (passed) {
      audioService.playSuccess();
      setIsPass(true);
      setIsEvaluated(true);
      setFeedbackMessage(`答對了！成功補上「${currentQ.targetChar}」字缺漏的【${puzzle.missingStrokeName}】！🌟`);
      setUserScore((prev) => prev + 10);
      onRecordResult(true);

      const newStreak = currentStreak + 1;
      onStreakUpdate(newStreak);

      // Continuous streak milestone: 連續對 10 題抽卡!
      if (newStreak > 0 && newStreak % 10 === 0) {
        setTimeout(() => {
          onTriggerPokemon(newStreak);
        }, 600);
      }
    } else {
      audioService.playError();
      setIsPass(false);
      setIsEvaluated(true);
      setFeedbackMessage(puzzle.hintMessage || `筆畫位置稍有偏差，請參考提示在指定位置補上【${puzzle.missingStrokeName}】！💪`);
      onStreakUpdate(0);
      onRecordResult(false);

      if (!wrongItems.find((w) => w.id === currentQ.vocabItem.id)) {
        setWrongItems((prev) => [...prev, currentQ.vocabItem]);
      }
    }
  };

  // Parent Override Check
  const handleParentOverride = (overridePass: boolean) => {
    audioService.playClick();
    if (overridePass) {
      setIsPass(true);
      setIsEvaluated(true);
      setFeedbackMessage('家長已判定為【正確】！🎉');
      setUserScore((prev) => prev + 10);
      const newStreak = currentStreak + 1;
      onStreakUpdate(newStreak);
      onRecordResult(true);

      if (newStreak > 0 && newStreak % 10 === 0) {
        setTimeout(() => {
          onTriggerPokemon(newStreak);
        }, 500);
      }
    } else {
      setIsPass(false);
      setIsEvaluated(true);
      setFeedbackMessage('家長判定為【需重新練習】！💪');
      onStreakUpdate(0);
      onRecordResult(false);
      if (currentQ && !wrongItems.find((w) => w.id === currentQ.vocabItem.id)) {
        setWrongItems((prev) => [...prev, currentQ.vocabItem]);
      }
    }
  };

  const handleNextQuestion = () => {
    audioService.playClick();
    if (currentIndex + 1 >= puzzleQuestions.length) {
      audioService.playCelebration();
      onSessionComplete(userScore, wrongItems);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!currentQ) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center text-slate-500">
        正在載入補筆畫題庫...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER BAR: PROGRESS & STREAK REWARD INFO */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              連續答對：<strong className="text-sm font-mono">{currentStreak}</strong> 題
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-black border border-rose-200">
            🌟 連對 10 題抽寶可夢卡包
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">題目進度：</span>
          <span className="text-sm font-mono font-black text-slate-800">
            {currentIndex + 1} / {puzzleQuestions.length}
          </span>
        </div>
      </div>

      {/* MAIN QUESTION & CANVAS WORKBENCH */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LEFT / CENTER: INTERACTIVE TIANZIGE CANVAS */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-3">
          <div className="relative group select-none touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleEndDraw}
              className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl shadow-inner border border-red-200 bg-white cursor-crosshair touch-none"
            />

            {/* Target Missing Stroke Prompt Banner */}
            <div className="absolute top-2 left-2 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>
                請補上【
                <span className="text-yellow-300 font-black">
                  {currentQ.puzzle.missingStrokeName}
                </span>
                】畫
              </span>
            </div>

            {/* Pass badge overlay */}
            {isEvaluated && isPass && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-2">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="text-lg font-black text-emerald-950">補筆完全正確！</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleClearCanvas}
              disabled={isEvaluated && isPass}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空重寫</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHintGuide((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>{showHintGuide ? '隱藏提示線' : '顯示筆畫提示'}</span>
            </button>

            {!isPass ? (
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>提交批改</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <span>下一題</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: QUESTION INFO, AUDIO & PARENT CONTROLS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Vocab Card */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500">目標詞語</div>
                <div className="text-2xl font-black text-slate-900 font-serif">
                  {currentQ.vocabItem.word}
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakCantonese(currentQ.vocabItem.word)}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              粵拼：<span className="font-mono text-amber-800 font-bold">{currentQ.vocabItem.jyutping}</span>
            </div>

            {currentQ.vocabItem.exampleSentence && (
              <div className="text-xs text-slate-600 pt-1 border-t border-amber-200/60">
                例句：{currentQ.vocabItem.exampleSentence}
              </div>
            )}
          </div>

          {/* Puzzle task instruction */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>補筆任務：</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {currentQ.puzzle.description}
            </div>
            <div className="text-xs text-slate-500">
              {currentQ.puzzle.hintMessage}
            </div>
          </div>

          {/* Feedback message banner */}
          {isEvaluated && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2 ${
                isPass
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {isPass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{feedbackMessage}</div>
            </div>
          )}

          {/* Parent override controls */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1.5">
              <span>家長覆核：</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleParentOverride(true)}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-emerald-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>家長算啱</span>
              </button>
              <button
                type="button"
                onClick={() => handleParentOverride(false)}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>家長算錯</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
