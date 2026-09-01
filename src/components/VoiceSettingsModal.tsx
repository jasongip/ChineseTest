import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Smartphone,
  Globe,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  Check,
  Zap,
} from 'lucide-react';
import {
  VoiceEngineType,
  getVoiceConfig,
  saveVoiceConfig,
  speakCantonese,
  getSystemVoices,
  VoiceConfig,
} from '../utils/audio';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<VoiceConfig>(() => getVoiceConfig());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [detectedVoices, setDetectedVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState<string>('你好！歡迎來到粵語精靈學堂，我哋一齊開心學廣東話！');

  useEffect(() => {
    if (isOpen) {
      setConfig(getVoiceConfig());
      const voices = getSystemVoices();
      setDetectedVoices(voices);

      // Listen for voices changed in case browser loads asynchronously
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const handleVoices = () => {
          setDetectedVoices(getSystemVoices());
        };
        window.speechSynthesis.onvoiceschanged = handleVoices;
        return () => {
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectEngine = (engine: VoiceEngineType) => {
    const updated = { ...config, engine };
    setConfig(updated);
    saveVoiceConfig(updated);
    // Play quick preview
    speakCantonese('引擎切換成功，發音測試中！', () => {});
  };

  const handleSpeedChange = (speed: number) => {
    const updated = { ...config, speed };
    setConfig(updated);
    saveVoiceConfig(updated);
  };

  const handlePlayTest = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    speakCantonese(testText, () => {
      setIsPlaying(false);
    });
    // Safety timer in case onEnd doesn't fire
    setTimeout(() => {
      setIsPlaying(false);
    }, 4000);
  };

  const cantoneseVoices = detectedVoices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return (
      lang.includes('hk') ||
      lang.includes('yue') ||
      name.includes('cantonese') ||
      name.includes('hong kong') ||
      name.includes('sin-ji') ||
      name.includes('hiuyu') ||
      name.includes('tracy') ||
      name.includes('廣東話') ||
      name.includes('粵語')
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🔊
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                廣東話發音引擎設定
                <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  多重引擎切換
                </span>
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                遇到無聲？隨時切換引擎或選擇【雲端標準粵語】保證 100% 有聲！
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Quick Voice Test Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="text-left w-full sm:w-auto">
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                即時語音發音測試
              </p>
              <p className="text-xs text-blue-700 font-medium mt-0.5 line-clamp-1">
                「{testText}」
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlayTest}
              disabled={isPlaying}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                isPlaying
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              {isPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span>正在發聲中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>點擊試聽發音 🔊</span>
                </>
              )}
            </button>
          </div>

          {/* ENGINE SELECTION CARDS */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
              選擇發音核心引擎 (Voice Engine)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Cloud Cantonese (100% Reliable) */}
              <div
                onClick={() => handleSelectEngine('cloud_hk')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  config.engine === 'cloud_hk'
                    ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">雲端標準香港粵語</h4>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          推薦 • 100% 保證有聲
                        </span>
                      </div>
                    </div>
                    {config.engine === 'cloud_hk' && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    透過雲端高清晰香港粵語音訊流發聲，免安裝任何語音包，在 Windows、Android、iPad、Mac 均能完美發聲！
                  </p>
                </div>
              </div>

              {/* Option 2: iOS / macOS Safari Native */}
              <div
                onClick={() => handleSelectEngine('native_ios')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  config.engine === 'native_ios'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">iOS / Safari 原生粵語</h4>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Apple 原裝 Sin-ji 仙姬 / Tracy
                        </span>
                      </div>
                    </div>
                    {config.engine === 'native_ios' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    直接調用 iPhone、iPad 及 Mac 系統內建的 Apple 高階廣東話語音引擎，發音自然生動。
                  </p>
                </div>
              </div>

              {/* Option 3: Auto Intelligent Switch */}
              <div
                onClick={() => handleSelectEngine('auto')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  config.engine === 'auto'
                    ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">智能自動切換 (Auto)</h4>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          雙重備援 • 自動偵測
                        </span>
                      </div>
                    </div>
                    {config.engine === 'auto' && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    先嘗試呼叫本機粵語語音；若檢測不到或播放受阻，0.1秒內自動無縫切換至雲端香港標準音。
                  </p>
                </div>
              </div>

              {/* Option 4: Browser Web Speech */}
              <div
                onClick={() => handleSelectEngine('native_web')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  config.engine === 'native_web'
                    ? 'border-slate-800 bg-slate-50 shadow-md ring-2 ring-slate-400/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">系統 Web Speech</h4>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                          純本機合成
                        </span>
                      </div>
                    </div>
                    {config.engine === 'native_web' && (
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    使用 Chrome、Edge 或本機操作系統已安裝的 TTS 引擎發聲（依賴作業系統語言包）。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SPEED CONTROL */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span>⚡ 語速調節</span>
                <span className="font-mono text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                  {config.speed}x
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '慢速 (0.75x)', val: 0.75 },
                  { label: '標準 (0.88x)', val: 0.88 },
                  { label: '快速 (1.05x)', val: 1.05 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => handleSpeedChange(s.val)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      config.speed === s.val
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.3"
              step="0.05"
              value={config.speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* DIAGNOSTIC PANEL */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                🩺 裝置語音狀態診斷
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {typeof window !== 'undefined' && 'speechSynthesis' in window ? '✅ WebSpeech 支援' : '⚠️ 需雲端引擎'}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1">
              <p>
                • 當前運作引擎：<strong className="text-blue-300 font-mono">{config.engine.toUpperCase()}</strong>
              </p>
              <p>
                • 系統已偵測粵語聲線：
                {cantoneseVoices.length > 0 ? (
                  <span className="text-emerald-400 font-bold ml-1">
                    {cantoneseVoices.map((v) => v.name).join(' / ')}
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium ml-1">
                    未偵測到本機粵語包（已自動啟用【雲端標準香港粵語】無障礙發音）
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            設定會自動儲存於當前瀏覽器
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            完成並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
