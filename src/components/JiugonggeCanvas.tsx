import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Undo, Eye, EyeOff, Volume2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { speakCantonese, audioService } from '../utils/audio';

interface JiugonggeCanvasProps {
  character: string;
  jyutping?: string;
  size?: number;
  showWatermarkDefault?: boolean;
  onCompleted?: () => void;
}

export const JiugonggeCanvas: React.FC<JiugonggeCanvasProps> = ({
  character,
  jyutping,
  size = 280,
  showWatermarkDefault = false,
  onCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWatermark, setShowWatermark] = useState(showWatermarkDefault);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [brushColor, setBrushColor] = useState('#1E293B'); // Ink black
  const [brushWidth, setBrushWidth] = useState(8);
  const [isMarkedMastered, setIsMarkedMastered] = useState(false);

  // Draw background grid (九宮格 3x3)
  const drawBackgroundGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    // Background fill
    ctx.fillStyle = '#FFFAF0'; // Warm rice paper background
    ctx.fillRect(0, 0, width, height);

    // Outer border
    ctx.strokeStyle = '#E2B888';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Inner 9-grid lines (九宮格: 1/3 and 2/3)
    ctx.strokeStyle = '#F3D5B5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);

    const stepX = width / 3;
    const stepY = height / 3;

    // Vertical dashed lines
    ctx.beginPath();
    ctx.moveTo(stepX, 0);
    ctx.lineTo(stepX, height);
    ctx.moveTo(stepX * 2, 0);
    ctx.lineTo(stepX * 2, height);

    // Horizontal dashed lines
    ctx.moveTo(0, stepY);
    ctx.lineTo(width, stepY);
    ctx.moveTo(0, stepY * 2);
    ctx.lineTo(width, stepY * 2);
    ctx.stroke();

    // Center diagonal cross for guide (米字/九宮輔助)
    ctx.strokeStyle = '#FBE8D3';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // Small center square highlight (中宮)
    ctx.fillStyle = 'rgba(235, 130, 60, 0.03)';
    ctx.fillRect(stepX, stepY, stepX, stepY);

    ctx.restore();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackgroundGrid(ctx, canvas.width, canvas.height);
  };

  useEffect(() => {
    redrawCanvas();
    setStrokeHistory([]);
    setStrokeCount(0);
    setIsMarkedMastered(false);
  }, [character]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-10), imgData]);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveState();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStrokeCount((prev) => prev + 1);
      audioService.playClick();
    }
  };

  const handleClear = () => {
    audioService.playClick();
    redrawCanvas();
    setStrokeHistory([]);
    setStrokeCount(0);
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    audioService.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));
    setStrokeCount((prev) => Math.max(0, prev - 1));
  };

  const handleSpeak = () => {
    audioService.playClick();
    speakCantonese(character);
  };

  const handleMarkMastered = () => {
    audioService.playSuccess();
    setIsMarkedMastered(!isMarkedMastered);
    if (onCompleted) onCompleted();
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
      {/* Header with pronunciation and hint */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeak}
            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1 text-xs font-bold"
            title="聽讀音"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>讀音</span>
          </button>
          {jyutping && <span className="font-mono text-xs text-slate-500 font-semibold">{jyutping}</span>}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              audioService.playClick();
              setShowWatermark(!showWatermark);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              showWatermark
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="切換字形浮水印臨摹"
          >
            {showWatermark ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showWatermark ? '隱藏提示' : '字形提示'}</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="relative rounded-xl overflow-hidden shadow-inner border border-amber-200" style={{ width: size, height: size }}>
        {/* Nine-Grid Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none select-none block"
        />

        {/* Character Watermark Overlay if enabled */}
        {showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-300/40 font-serif"
            style={{ fontSize: `${size * 0.72}px`, lineHeight: 1 }}
          >
            {character}
          </div>
        )}

        {/* Jiugongge Label watermark at corner */}
        <span className="absolute bottom-1 right-2 text-[10px] font-bold text-amber-700/30 select-none pointer-events-none">
          九宮格
        </span>
      </div>

      {/* Controls: Brush, Colors, Undo, Clear */}
      <div className="w-full flex items-center justify-between gap-2 mt-3 flex-wrap">
        {/* Brush Colors */}
        <div className="flex items-center gap-1.5">
          {[
            { color: '#1E293B', label: '墨黑' },
            { color: '#DC2626', label: '硃砂紅' },
            { color: '#2563EB', label: '靛藍' },
          ].map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => {
                audioService.playClick();
                setBrushColor(c.color);
              }}
              style={{ backgroundColor: c.color }}
              className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                brushColor === c.color ? 'border-amber-400 ring-2 ring-amber-200 scale-110' : 'border-white'
              }`}
              title={c.label}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeHistory.length === 0}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition"
            title="還原上一筆"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 border border-rose-200 transition"
            title="重寫 / 清空"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>

          <button
            type="button"
            onClick={handleMarkMastered}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              isMarkedMastered
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isMarkedMastered ? '已掌握 ✨' : '標記掌握'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
