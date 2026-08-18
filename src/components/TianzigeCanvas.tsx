import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { audioService } from '../utils/audio';

interface TianzigeCanvasProps {
  id: string;
  charHint?: string;
  strokeHint?: string[];
  placeholder?: string;
  initialValue?: string;
  onSave?: (dataUrl: string) => void;
}

export const TianzigeCanvas: React.FC<TianzigeCanvasProps> = ({
  id,
  charHint,
  strokeHint,
  placeholder,
  initialValue,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [hasContent, setHasContent] = useState(false);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Tianzige Outer border
    ctx.strokeStyle = '#E53E3E'; // Red traditional grid
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    // Inner dashed lines (Cross & Diagonals for Mi-zi-ge)
    ctx.strokeStyle = '#FEB2B2';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(3, height / 2);
    ctx.lineTo(width - 3, height / 2);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 3);
    ctx.lineTo(width / 2, height - 3);
    ctx.stroke();

    // Diagonal lines (Mi zi ge)
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(width - 3, height - 3);
    ctx.moveTo(width - 3, 3);
    ctx.lineTo(3, height - 3);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = 180;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    drawBackground(ctx, size, size);
    
    // Save empty state to history
    const emptyState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory([emptyState]);
  }, [id]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#2D3748'; // Dark ink
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory(prev => [...prev.slice(-10), currentState]);

    if (onSave) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    audioService.playClick();
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawBackground(ctx, 180, 180);
    setHasContent(false);
    const emptyState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory([emptyState]);
  };

  const undoLastStroke = () => {
    if (strokeHistory.length <= 1) {
      clearCanvas();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    audioService.playClick();
    const newHistory = strokeHistory.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory(newHistory);
    if (newHistory.length === 1) {
      setHasContent(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-[240px]">
      <div className="relative w-[180px] h-[180px] rounded-xl overflow-hidden shadow-inner border border-gray-200 bg-white select-none touch-none">
        {/* Character Hint Watermark */}
        {showHint && charHint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-8xl font-serif text-red-200/50 select-none">
              {charHint}
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          id={`canvas-${id}`}
          className="relative z-10 w-[180px] h-[180px] cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between w-full px-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id={`undo-${id}`}
            onClick={undoLastStroke}
            disabled={strokeHistory.length <= 1}
            className="p-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 disabled:opacity-40 transition"
            title="撤銷上一筆"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            type="button"
            id={`clear-${id}`}
            onClick={clearCanvas}
            className="p-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-rose-50 text-[#FF6B6B] active:scale-95 transition"
            title="清除全部"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {charHint && (
          <button
            type="button"
            id={`hint-${id}`}
            onClick={() => {
              audioService.playClick();
              setShowHint(!showHint);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition ${
              showHint
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {showHint ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showHint ? '隱藏字樣' : '提示字樣'}
          </button>
        )}
      </div>

      {strokeHint && strokeHint.length > 0 && showHint && (
        <div className="w-full text-[11px] text-gray-500 bg-[#F8FAFC] p-2.5 rounded-xl border border-gray-200 space-y-0.5">
          <div className="font-bold text-[#2B6CB0]">筆順參考：</div>
          {strokeHint.map((st, i) => (
            <div key={i} className="text-gray-600">{st}</div>
          ))}
        </div>
      )}
    </div>
  );
};
