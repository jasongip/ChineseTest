import React, { useState, useEffect, useRef } from 'react';
import {
  CHARACTER_STROKE_DATABASE,
  CHARACTER_LIST_FOR_TRACER,
  CharacterStrokeDefinition,
  renderStrokeSegmentPath,
} from '../data/strokeData';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Volume2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Award,
  Flame,
  Check,
  Gift,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

interface StrokeTracerPracticeProps {
  onTriggerPokemon: (streakOrCount: number) => void;
}

const STORAGE_KEY_TRACER_COUNT = 'jovan_stroke_tracer_count_v2';
const STORAGE_KEY_TRACER_CLAIMED = 'jovan_stroke_tracer_claimed_packs_v2';

export const StrokeTracerPractice: React.FC<StrokeTracerPracticeProps> = ({
  onTriggerPokemon,
}) => {
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(0);
  const currentCharName = CHARACTER_LIST_FOR_TRACER[selectedCharIndex] || '木';
  const charDef: CharacterStrokeDefinition =
    CHARACTER_STROKE_DATABASE[currentCharName] || CHARACTER_STROKE_DATABASE['木'];

  // Current stroke index being traced (0 to charDef.strokes.length - 1)
  const [activeStrokeIndex, setActiveStrokeIndex] = useState<number>(0);
  const [isCharCompleted, setIsCharCompleted] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [showDashedGuide, setShowDashedGuide] = useState<boolean>(true);

  // User lifetime count of completed characters
  const [completedCharsCount, setCompletedCharsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACER_COUNT);
      if (saved) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  // User claimed packs count to prevent endless spamming
  const [claimedPacksCount, setClaimedPacksCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACER_CLAIMED);
      if (saved) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  // 20-character reward milestone calculation
  const milestoneTarget = 20;
  const currentMilestoneProgress = completedCharsCount % milestoneTarget;
  const totalEarnedPacks = Math.floor(completedCharsCount / milestoneTarget);
  const availablePacks = Math.max(0, totalEarnedPacks - claimedPacksCount);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRACER_COUNT, String(completedCharsCount));
    } catch {}
  }, [completedCharsCount]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRACER_CLAIMED, String(claimedPacksCount));
    } catch {}
  }, [claimedPacksCount]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [userStrokePoints, setUserStrokePoints] = useState<Array<{ x: number; y: number }>>([]);

  // Reset state when changing characters
  useEffect(() => {
    setActiveStrokeIndex(0);
    setIsCharCompleted(false);
    setIsAutoPlaying(false);
    setUserStrokePoints([]);
  }, [currentCharName]);

  // Pronounce character on load
  useEffect(() => {
    if (charDef) {
      speakCantonese(charDef.char);
    }
  }, [currentCharName]);

  // Render the Tianzige background and strokes
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    // 2. Traditional Tianzige Grid (Red/Pink)
    ctx.strokeStyle = '#EF4444'; // Red outer border
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Dashed inner cross lines
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(4, size / 2);
    ctx.lineTo(size - 4, size / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size / 2, 4);
    ctx.lineTo(size / 2, size - 4);
    ctx.stroke();

    // Diagonal lines (Mi zi ge)
    ctx.strokeStyle = '#FEE2E2';
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(size - 4, size - 4);
    ctx.moveTo(size - 4, 4);
    ctx.lineTo(4, size - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Faint Guide for upcoming strokes if enabled
    if (showDashedGuide) {
      charDef.strokes.forEach((stroke, idx) => {
        if (idx > activeStrokeIndex || isCharCompleted) {
          ctx.strokeStyle = '#CBD5E1'; // Soft gray outline
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          renderStrokeSegmentPath(ctx, stroke, size);
        }
      });
    }

    // 4. Draw Completed Strokes in solid ink (Dark Slate Ink)
    charDef.strokes.forEach((stroke, idx) => {
      if (idx < activeStrokeIndex || isCharCompleted) {
        ctx.strokeStyle = '#0F172A'; // Crisp black ink
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        renderStrokeSegmentPath(ctx, stroke, size);
      }
    });

    // 5. Draw Active Stroke Target Guide (Glowing Amber)
    if (!isCharCompleted && charDef.strokes[activeStrokeIndex]) {
      const activeStroke = charDef.strokes[activeStrokeIndex];

      // Glow path
      ctx.strokeStyle = '#F59E0B'; // Amber glow
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      renderStrokeSegmentPath(ctx, activeStroke, size);

      // Pulsing Start Dot
      const startPt = activeStroke.points ? activeStroke.points[0] : activeStroke.start;
      const sx = (startPt[0] / 100) * size;
      const sy = (startPt[1] / 100) * size;

      ctx.fillStyle = '#DC2626'; // Vibrant Red start indicator
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 6. Draw User Current Active Drawing Path (Real-time Brush)
    if (userStrokePoints.length > 1) {
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(userStrokePoints[0].x, userStrokePoints[0].y);
      for (let i = 1; i < userStrokePoints.length; i++) {
        ctx.lineTo(userStrokePoints[i].x, userStrokePoints[i].y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [activeStrokeIndex, isCharCompleted, userStrokePoints, showDashedGuide, currentCharName]);

  // Handle touch / mouse start
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isCharCompleted || isAutoPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (300 / rect.width);
    const y = (clientY - rect.top) * (300 / rect.height);

    setIsDrawing(true);
    setUserStrokePoints([{ x, y }]);
  };

  // Handle touch / mouse move
  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isCharCompleted || isAutoPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (300 / rect.width);
    const y = (clientY - rect.top) * (300 / rect.height);

    setUserStrokePoints((prev) => [...prev, { x, y }]);
  };

  // Handle touch / mouse end and validate stroke
  const handleEndDraw = () => {
    if (!isDrawing || isCharCompleted) return;
    setIsDrawing(false);

    if (userStrokePoints.length < 2) {
      setUserStrokePoints([]);
      return;
    }

    const activeStroke = charDef.strokes[activeStrokeIndex];
    if (!activeStroke) {
      setUserStrokePoints([]);
      return;
    }

    const size = 300;
    const pStart = activeStroke.points ? activeStroke.points[0] : activeStroke.start;
    const pEnd = activeStroke.points ? activeStroke.points[activeStroke.points.length - 1] : activeStroke.end;

    const expectedStart = {
      x: (pStart[0] / 100) * size,
      y: (pStart[1] / 100) * size,
    };
    const expectedEnd = {
      x: (pEnd[0] / 100) * size,
      y: (pEnd[1] / 100) * size,
    };

    const userStart = userStrokePoints[0];
    const userEnd = userStrokePoints[userStrokePoints.length - 1];

    const distStart = Math.hypot(userStart.x - expectedStart.x, userStart.y - expectedStart.y);
    const distEnd = Math.hypot(userEnd.x - expectedEnd.x, userEnd.y - expectedEnd.y);

    let isStrokePass = false;

    if (activeStroke.points && activeStroke.points.length > 2) {
      // Compound stroke like 橫折, 橫折鉤, 橫撇
      const pathLen = userStrokePoints.reduce((acc, pt, i) => {
        if (i === 0) return 0;
        return acc + Math.hypot(pt.x - userStrokePoints[i - 1].x, pt.y - userStrokePoints[i - 1].y);
      }, 0);
      const isStartOk = distStart < 75;
      const isEndOk = distEnd < 75;
      const hasReasonableLen = pathLen > 35;
      isStrokePass = isStartOk && isEndOk && hasReasonableLen;
    } else {
      // Single stroke line / curve
      const expectedDx = expectedEnd.x - expectedStart.x;
      const expectedDy = expectedEnd.y - expectedStart.y;
      const userDx = userEnd.x - userStart.x;
      const userDy = userEnd.y - userStart.y;

      const expectedLen = Math.hypot(expectedDx, expectedDy) || 1;
      const userLen = Math.hypot(userDx, userDy) || 1;
      const dot = (expectedDx * userDx + expectedDy * userDy) / (expectedLen * userLen);

      const isStartAccurate = distStart < 75;
      const isEndAccurate = distEnd < 75;
      const isDirectionAccurate = dot > 0.35 || (activeStroke.name === '點' && distStart < 60);

      isStrokePass = (isStartAccurate && (isEndAccurate || isDirectionAccurate)) || (distStart < 50 && distEnd < 50);
    }

    if (isStrokePass) {
      // Stroke Correct!
      audioService.playSuccess();
      const nextStrokeIdx = activeStrokeIndex + 1;
      setUserStrokePoints([]);

      if (nextStrokeIdx >= charDef.strokes.length) {
        // Character fully completed!
        setIsCharCompleted(true);
        audioService.playCelebration();

        const newTotalCount = completedCharsCount + 1;
        setCompletedCharsCount(newTotalCount);

        // Check if hit 20 milestone!
        if (newTotalCount > 0 && newTotalCount % milestoneTarget === 0) {
          // Mark this milestone as claimed and trigger card popup
          setClaimedPacksCount((prev) => Math.max(prev, Math.floor(newTotalCount / milestoneTarget)));
          setTimeout(() => {
            onTriggerPokemon(newTotalCount);
          }, 600);
        }
      } else {
        setActiveStrokeIndex(nextStrokeIdx);
      }
    } else {
      // Stroke incorrect or wrong direction
      audioService.playError();
      setUserStrokePoints([]);
    }
  };

  // Automated Stroke-by-Stroke Animation Player
  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      return;
    }

    setIsAutoPlaying(true);
    setActiveStrokeIndex(0);
    setIsCharCompleted(false);

    let current = 0;
    const total = charDef.strokes.length;

    const interval = setInterval(() => {
      current++;
      if (current >= total) {
        setActiveStrokeIndex(total);
        setIsCharCompleted(true);
        setIsAutoPlaying(false);
        audioService.playCelebration();
        clearInterval(interval);
      } else {
        setActiveStrokeIndex(current);
        audioService.playClick();
      }
    }, 700);
  };

  const handleResetCharacter = () => {
    audioService.playClick();
    setActiveStrokeIndex(0);
    setIsCharCompleted(false);
    setIsAutoPlaying(false);
    setUserStrokePoints([]);
  };

  const handlePrevChar = () => {
    audioService.playClick();
    const prev = selectedCharIndex > 0 ? selectedCharIndex - 1 : CHARACTER_LIST_FOR_TRACER.length - 1;
    setSelectedCharIndex(prev);
  };

  const handleNextChar = () => {
    audioService.playClick();
    const next = (selectedCharIndex + 1) % CHARACTER_LIST_FOR_TRACER.length;
    setSelectedCharIndex(next);
  };

  const handleClaimReward = () => {
    if (availablePacks <= 0) return;
    audioService.playCelebration();
    setClaimedPacksCount((prev) => prev + 1);
    onTriggerPokemon(completedCharsCount);
  };

  return (
    <div className="space-y-4">
      {/* 20-CHARACTER MILESTONE PROGRESS BAR */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-3.5 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
            🎁
          </div>
          <div>
            <div className="text-xs font-black text-amber-100 flex items-center gap-1.5">
              <span>模式B：筆順跟寫特訓大師</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-mono">
                每滿 20 字送卡包
              </span>
            </div>
            <div className="text-sm font-bold">
              累積已練字：<strong className="text-lg font-mono">{completedCharsCount}</strong> 個字
            </div>
          </div>
        </div>

        {/* Milestone gauge & controlled reward button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-48">
            <div className="flex justify-between text-[11px] font-bold text-amber-100 mb-1">
              <span>本輪進度</span>
              <span>
                {currentMilestoneProgress} / {milestoneTarget}
              </span>
            </div>
            <div className="h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-yellow-300 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${(currentMilestoneProgress / milestoneTarget) * 100}%` }}
              />
            </div>
          </div>

          {availablePacks > 0 ? (
            <button
              type="button"
              onClick={handleClaimReward}
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer animate-bounce"
            >
              <Gift className="w-4 h-4 text-amber-900 fill-amber-900" />
              <span>領取抽卡 ({availablePacks})</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-black/20 text-white/80 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 select-none border border-white/10">
              <Lock className="w-3 h-3 opacity-70" />
              <span>差 {milestoneTarget - currentMilestoneProgress} 字可抽卡</span>
            </div>
          )}
        </div>
      </div>

      {/* CHARACTER CAROUSEL SELECTOR */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {CHARACTER_LIST_FOR_TRACER.map((ch, idx) => {
          const isSelected = idx === selectedCharIndex;
          return (
            <button
              key={ch}
              type="button"
              onClick={() => {
                audioService.playClick();
                setSelectedCharIndex(idx);
              }}
              className={`min-w-[42px] h-10 rounded-xl font-serif text-lg font-black transition flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-sm scale-105'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      {/* MAIN WORKBENCH: CANVAS & STROKE-BY-STROKE GUIDE */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LEFT: TIANZIGE CANVAS WORKSPACE */}
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

            {/* Floating Top Banner: Current active stroke guide */}
            {!isCharCompleted && charDef.strokes[activeStrokeIndex] && (
              <div className="absolute top-2 left-2 px-3 py-1.5 bg-amber-500 text-white text-xs font-black rounded-xl shadow-sm backdrop-blur-xs flex items-center gap-1.5">
                <span>
                  第 {activeStrokeIndex + 1} 筆：{charDef.strokes[activeStrokeIndex].name} ({charDef.strokes[activeStrokeIndex].directionHint})
                </span>
              </div>
            )}

            {/* Character Completed Overlay */}
            {isCharCompleted && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-2 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="text-xl font-black text-emerald-950">
                  「{charDef.char}」筆順大功告成！
                </div>
                <div className="text-xs text-emerald-800 font-bold mt-1">
                  累積練習 +1 字 🎉
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar below canvas */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetCharacter}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新跟寫</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAutoPlay}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>暫停演示</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span>筆順動畫演示</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDashedGuide((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>{showDashedGuide ? '隱藏輔助虛線' : '顯示輔助虛線'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: CHARACTER INFORMATION & STROKE BREAKDOWN */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Character Header */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black font-serif text-slate-900">
                {charDef.char}
              </span>
              <div>
                <div className="text-xs font-bold text-slate-600">
                  粵拼：<span className="font-mono text-amber-900 font-black">{charDef.jyutping}</span>
                </div>
                <div className="text-xs text-slate-400">{charDef.english}</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  全字筆畫數：<strong className="text-amber-800 font-mono">{charDef.strokesCount}</strong> 畫
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => speakCantonese(charDef.char)}
              className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Stroke Sequence List */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">筆順順序清單：</div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
              {charDef.strokes.map((stroke, idx) => {
                const isPassed = idx < activeStrokeIndex || isCharCompleted;
                const isCurrent = idx === activeStrokeIndex && !isCharCompleted;
                return (
                  <div
                    key={`${charDef.char}_${idx}`}
                    className={`p-2 rounded-xl border text-center transition ${
                      isCurrent
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-black scale-105 shadow-xs'
                        : isPassed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400 text-xs'
                    }`}
                  >
                    <div className="text-[10px] opacity-75">第 {idx + 1} 筆</div>
                    <div className="text-xs font-bold">{stroke.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevChar}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一個字</span>
            </button>

            <button
              type="button"
              onClick={handleNextChar}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>下一個字</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
