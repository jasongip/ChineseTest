import React, { useState } from 'react';
import { CandidateInfo, ExamSection } from '../types';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Lock,
  Unlock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Menu,
  ArrowLeft,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { speakCantonese, audioService } from '../utils/audio';

interface NavbarProps {
  candidate: CandidateInfo;
  currentSection: ExamSection;
  onSelectSection: (section: ExamSection) => void;
  timeRemainingSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  totalScore: number;
  maxScore: number;
  isAssessmentUnlocked: boolean;
  onRequestUnlock: () => void;
  onLockAssessment: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  candidate,
  currentSection,
  onSelectSection,
  timeRemainingSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  totalScore,
  maxScore,
  isAssessmentUnlocked,
  onRequestUnlock,
  onLockAssessment,
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isVocabMode = currentSection === 'vocab_practice';

  const assessmentNavItems: { id: ExamSection; label: string; num: string; badge?: string }[] = [
    { id: 'part1_speaking_1', label: 'Part 1: 口試評估', num: '01', badge: '20m' },
    { id: 'part2_reading_1', label: 'Part 2: 筆試認讀', num: '02', badge: '40m' },
    { id: 'daily_practice', label: '10分鐘複習遊戲', num: '03', badge: '家長' },
    { id: 'print', label: '模擬試卷列印', num: '04' },
    { id: 'report', label: '評分報告與證書', num: '05' },
  ];

  const handleTestVoice = () => {
    audioService.playClick();
    if (isVocabMode) {
      speakCantonese('歡迎進行廣東話詞語特訓！連對十題就可以抽寶可夢卡包喇！');
    } else {
      speakCantonese('你好 Jovan，歡迎參加廣東話中級班入學模擬測驗！');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm print:hidden transition-all">
      {/* 1. COMPACT VIEW (COLLAPSED ON MOBILE/IPAD) */}
      {isNavCollapsed ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-lg flex items-center justify-center text-white font-black text-base shadow-sm">
              廣
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">
              {isVocabMode ? '仔仔詞語特訓' : '入學評估系統'}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Cantonese Voice button */}
            <button
              type="button"
              onClick={handleTestVoice}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200 transition"
              title="測試粵語發音"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {!isVocabMode && (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-lg text-xs font-bold text-[#92400E]">
                得分: {totalScore}
              </div>
            )}

            {/* Expand Menu Toggle */}
            <button
              type="button"
              onClick={() => {
                audioService.playClick();
                setIsNavCollapsed(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">選單</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* 2. EXPANDED VIEW */
        <>
          {/* Top Banner */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Brand & Mode Header */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm tracking-tighter shrink-0 ${
                  isVocabMode
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-orange-500/20'
                    : 'bg-[#2B6CB0]'
                }`}
              >
                {isVocabMode ? '✨' : '廣'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#2D3748]">
                    {isVocabMode ? '廣東話詞語特訓系統' : '廣東話中級班入學評估系統'}
                  </h1>
                  {isVocabMode ? (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 text-[10px] font-extrabold border border-amber-300">
                      200+ 核心詞語 • 寶可夢卡包
                    </span>
                  ) : (
                    <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                      Candidate: {candidate.nameEn}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-semibold tracking-wide">
                  {isVocabMode
                    ? '聽音選詞 • 缺字填空 • 中英對照 • 重組句子 • 連勝抽卡'
                    : `60分鐘模擬評估 • 口試與筆試考核 • 考生：${candidate.nameEn}（${candidate.nameZh}）`}
                </p>
              </div>
            </div>

            {/* Right Control Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Cantonese voice test */}
              <button
                type="button"
                id="test-cantonese-voice"
                onClick={handleTestVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#2B6CB0] text-xs font-bold transition border border-gray-200 cursor-pointer"
                title="測試粵語發音"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" />
                <span className="hidden sm:inline">語音測試</span>
              </button>

              {/* VOCAB PRACTICE MODE: Shows Lock Button to Enter Assessment */}
              {isVocabMode && (
                <button
                  type="button"
                  id="open-assessment-btn"
                  onClick={() => {
                    audioService.playClick();
                    if (isAssessmentUnlocked) {
                      onSelectSection('part1_speaking_1');
                    } else {
                      onRequestUnlock();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition active:scale-95 cursor-pointer border border-slate-700"
                >
                  {isAssessmentUnlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>進入評估系統</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>入學評估系統 (家長專區)</span>
                    </>
                  )}
                </button>
              )}

              {/* ASSESSMENT MODE: Shows Score & Timer */}
              {!isVocabMode && (
                <>
                  {/* Score Card */}
                  <div className="bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 rounded-xl text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>得分：</span>
                    <strong className="font-mono text-sm text-[#78350F]">{totalScore}</strong>
                    <span className="text-[#B45309]">/{maxScore}</span>
                  </div>

                  {/* Remaining Timer Card */}
                  <div className="bg-[#F0F4F8] px-3 py-1 rounded-xl border border-gray-200 flex items-center gap-2 shadow-inner">
                    <p className="text-sm font-mono font-bold text-[#2D3748] leading-none">
                      {formatTime(timeRemainingSeconds)}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        id="toggle-timer-btn"
                        onClick={() => {
                          audioService.playClick();
                          onToggleTimer();
                        }}
                        className="p-1 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition cursor-pointer"
                        title={isTimerRunning ? '暫停計時' : '開始計時'}
                      >
                        {isTimerRunning ? (
                          <Pause className="w-3.5 h-3.5 text-[#D97706]" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-[#48BB78]" />
                        )}
                      </button>
                      <button
                        type="button"
                        id="reset-timer-btn"
                        onClick={() => {
                          audioService.playClick();
                          onResetTimer();
                        }}
                        className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 transition cursor-pointer"
                        title="重設 60 分鐘"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Lock button to re-lock */}
                  <button
                    type="button"
                    onClick={() => {
                      audioService.playClick();
                      onLockAssessment();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
                    title="鎖定並返回詞語特訓"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">重新上鎖</span>
                  </button>
                </>
              )}

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => {
                  audioService.playClick();
                  setIsNavCollapsed(true);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition active:scale-95 cursor-pointer"
                title="收起頂部選單"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assessment Navigation Tabs (Only visible when Assessment Mode is Active) */}
          {!isVocabMode && (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 border-t border-gray-100 bg-[#FAFAFA]/90">
              <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
                {/* Back to Vocab Practice Button */}
                <button
                  type="button"
                  id="nav-back-to-vocab"
                  onClick={() => {
                    audioService.playClick();
                    onSelectSection('vocab_practice');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs transition whitespace-nowrap cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>🎯 返回詞語特訓</span>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

                {assessmentNavItems.map((item) => {
                  const isPart1Active =
                    item.id === 'part1_speaking_1' && currentSection.startsWith('part1_');
                  const isPart2Active =
                    item.id === 'part2_reading_1' && currentSection.startsWith('part2_');
                  const isActive = isPart1Active || isPart2Active || currentSection === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => {
                        audioService.playClick();
                        onSelectSection(item.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                        isActive
                          ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8] shadow-sm font-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                          isActive ? 'bg-[#4299E1] text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.num}
                      </div>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-semibold leading-none ${
                            isActive ? 'bg-[#BEE3F8] text-[#2B6CB0]' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </>
      )}
    </header>
  );
};
