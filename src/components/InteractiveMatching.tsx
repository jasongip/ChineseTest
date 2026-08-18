import React, { useState } from 'react';
import { MatchingPair } from '../types';
import { speakCantonese, audioService } from '../utils/audio';
import { Volume2, Check, X, RotateCcw } from 'lucide-react';

interface InteractiveMatchingProps {
  id: string;
  title: string;
  pairs: MatchingPair[];
  scrambledRight: { id: string; text: string; icon?: string; jyutping?: string }[];
  connections: Record<string, string>; // leftId -> rightId
  onConnectionsChange: (newConnections: Record<string, string>) => void;
  showFeedback?: boolean;
}

export const InteractiveMatching: React.FC<InteractiveMatchingProps> = ({
  id,
  title,
  pairs,
  scrambledRight,
  connections,
  onConnectionsChange,
  showFeedback = true,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleSelectLeft = (leftId: string, speakText?: string) => {
    audioService.playClick();
    if (speakText) speakCantonese(speakText);
    setSelectedLeft(selectedLeft === leftId ? null : leftId);
  };

  const handleSelectRight = (rightId: string, speakText?: string) => {
    if (speakText) speakCantonese(speakText);
    if (!selectedLeft) return;

    // Check if this right item is already connected to another left item
    const updated = { ...connections };
    
    // If this rightId is used elsewhere, remove it
    Object.keys(updated).forEach((key) => {
      if (updated[key] === rightId) {
        delete updated[key];
      }
    });

    updated[selectedLeft] = rightId;
    onConnectionsChange(updated);
    setSelectedLeft(null);

    // Audio feedback
    const isCorrect = pairs.find((p) => p.id === selectedLeft)?.id === rightId;
    if (isCorrect) {
      audioService.playSuccess();
    } else {
      audioService.playClick();
    }
  };

  const removeConnection = (leftId: string) => {
    audioService.playClick();
    const updated = { ...connections };
    delete updated[leftId];
    onConnectionsChange(updated);
  };

  const resetAll = () => {
    audioService.playClick();
    onConnectionsChange({});
    setSelectedLeft(null);
  };

  // Color mapping for connections
  const colorPalette = [
    'bg-[#EBF8FF] border-[#BEE3F8] text-[#2B6CB0]',
    'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]',
    'bg-emerald-50 border-emerald-200 text-emerald-900',
    'bg-rose-50 border-rose-200 text-rose-900',
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-bold text-gray-800 text-base">{title}</h4>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">
            已配對：<strong className="text-[#2B6CB0] font-mono">{Object.keys(connections).length}</strong> / {pairs.length}
          </span>
          {Object.keys(connections).length > 0 && (
            <button
              type="button"
              id={`reset-${id}`}
              onClick={resetAll}
              className="text-xs text-[#FF6B6B] hover:text-[#FA5252] flex items-center gap-1 font-bold bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 transition"
            >
              <RotateCcw className="w-3 h-3" /> 重設
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 font-medium">
        💡 作答指引：點擊左邊詞語，再點擊右邊相配嘅意思／圖片進行配對連線。
      </p>

      <div className="grid grid-cols-2 gap-4 sm:gap-10 relative py-2">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">左欄（題目）</div>
          {pairs.map((pair, index) => {
            const isSelected = selectedLeft === pair.id;
            const connectedRightId = connections[pair.id];
            const isConnected = !!connectedRightId;
            const isCorrect = isConnected && connectedRightId === pair.id;
            const colorClass = colorPalette[index % colorPalette.length];

            return (
              <div
                key={pair.id}
                id={`left-item-${pair.id}`}
                onClick={() => handleSelectLeft(pair.id, pair.left)}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#2B6CB0] ring-2 ring-blue-100 bg-[#EBF8FF] scale-[1.02]'
                    : isConnected
                    ? `${colorClass} shadow-sm`
                    : 'border-gray-200 bg-[#F8FAFC] hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakCantonese(pair.left);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-[#2B6CB0] transition"
                    title="粵語讀音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xl font-bold text-gray-800 font-serif">{pair.left}</div>
                    {pair.leftJyutping && (
                      <div className="text-[11px] font-mono text-gray-400">{pair.leftJyutping}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isConnected && (
                    <span className="w-6 h-6 rounded-full bg-[#2B6CB0] text-white text-xs font-bold flex items-center justify-center shadow">
                      {index + 1}
                    </span>
                  )}
                  {showFeedback && isConnected && (
                    <span>
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-[#48BB78]" />
                      ) : (
                        <X className="w-5 h-5 text-[#FF6B6B]" />
                      )}
                    </span>
                  )}
                  {isConnected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeConnection(pair.id);
                      }}
                      className="p-1 text-gray-400 hover:text-[#FF6B6B] rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">右欄（配對選項）</div>
          {scrambledRight.map((item) => {
            // Find if this right item is connected to any left item
            const connectedLeftId = Object.keys(connections).find((k) => connections[k] === item.id);
            const isConnected = !!connectedLeftId;
            const leftIndex = pairs.findIndex((p) => p.id === connectedLeftId);
            const colorClass = leftIndex >= 0 ? colorPalette[leftIndex % colorPalette.length] : '';

            return (
              <div
                key={item.id}
                id={`right-item-${item.id}`}
                onClick={() => handleSelectRight(item.id, item.text)}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isConnected
                    ? `${colorClass} shadow-sm scale-[1.01]`
                    : selectedLeft
                    ? 'border-[#4299E1] bg-[#EBF8FF] hover:border-[#2B6CB0] animate-pulse'
                    : 'border-gray-200 bg-[#F8FAFC] hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-2xl select-none">{item.icon}</span>}
                  <div>
                    <div className="text-xl font-bold text-gray-800 font-serif">{item.text}</div>
                    {item.jyutping && (
                      <div className="text-[11px] font-mono text-gray-400">{item.jyutping}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakCantonese(item.text);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-[#2B6CB0] transition"
                    title="粵語讀音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {isConnected && (
                    <span className="w-6 h-6 rounded-full bg-[#2B6CB0] text-white text-xs font-bold flex items-center justify-center shadow">
                      {leftIndex + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
