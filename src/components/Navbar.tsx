import React, { useState } from 'react';
import { CandidateInfo, ExamSection } from '../types';
import { Clock, Play, Pause, RotateCcw, Volume2, Printer, Award, BookOpen, Mic, Sparkles, CheckCircle2, ChevronUp, ChevronDown, Menu } from 'lucide-react';
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
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems: { id: ExamSection; label: string; num: string; badge?: string }[] = [
    { id: 'part1_speaking_1', label: 'Part 1: 口試評估', num: '01', badge: '20m' },
    { id: 'part2_reading_1', label: 'Part 2: 筆試認讀', num: '02', badge: '40m' },
    { id: 'vocab_practice', label: '仔仔詞語特訓', num: '03', badge: '180+ 詞' },
    { id: 'daily_practice', label: '10分鐘複習遊戲', num: '04', badge: '家長' },
    { id: 'print', label: '模擬試卷列印', num: '05' },
    { id: 'report', label: '評分報告與證書', num: '06' },
  ];

  const currentNav = navItems.find(
    (item) =>
      (item.id === 'part1_speaking_1' && currentSection.startsWith('part1_')) ||
      (item.id === 'part2_reading_1' && currentSection.startsWith('part2_')) ||
      item.id === currentSection
  ) || navItems[2];

  const handleTestVoice = () => {
    audioService.playClick();
    speakCantonese('你好 Jovan，歡迎參加廣東話中級班入學模擬測驗！');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm print:hidden transition-all">
      {/* COMPACT VIEW (WHEN COLLAPSED ON IPAD/TABLET) */}
      {isNavCollapsed ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
          {/* Brand + Current Tab Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF6B6B] rounded-lg flex items-center justify-center text-white font-black text-base shadow-sm">
              M
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-800 hidden sm:inline">MKCSCC</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1">
                <span>{currentNav.label}</span>
              </span>
            </div>
          </div>

          {/* Right Status & Expand Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Score */}
            <div className="bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 rounded-lg text-xs font-bold text-[#92400E] flex items-center gap-1">
              <span>得分:</span>
              <strong className="font-mono text-amber-900">{totalScore}</strong>
            </div>

            {/* Quick Timer */}
            <div className="bg-[#F0F4F8] px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(timeRemainingSeconds)}</span>
            </div>

            {/* Cantonese Voice button */}
            <button
              type="button"
              onClick={handleTestVoice}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
              title="測試粵語發音"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
            </button>

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
              <span className="hidden sm:inline">展開選單</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED VIEW */
        <>
          {/* Top Banner: Candidate & Timer Bar */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Title and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B6B] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm tracking-tighter shrink-0">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#2D3748]">
                    MKCSCC 廣東話中級班
                  </h1>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                    Placement
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-semibold tracking-wide">
                  入學模擬測驗系統 • Jovan Ng（伍博睿）
                </p>
              </div>
            </div>

            {/* Candidate, Score & Timer */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Cantonese voice test */}
              <button
                type="button"
                id="test-cantonese-voice"
                onClick={handleTestVoice}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#2B6CB0] text-xs font-bold transition border border-gray-200"
                title="測試粵語發音"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" />
                <span className="hidden sm:inline">粵語發音</span>
              </button>

              {/* Score Card */}
              <div className="bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 rounded-xl text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span>得分：</span>
                <strong className="font-mono text-sm text-[#78350F]">{totalScore}</strong>
                <span className="text-[#B45309]">/{maxScore}</span>
              </div>

              {/* Remaining Timer Card */}
              <div className="bg-[#F0F4F8] px-3 py-1 rounded-xl border border-gray-200 flex items-center gap-2 shadow-inner">
                <div>
                  <p className="text-sm font-mono font-bold text-[#2D3748] leading-none">
                    {formatTime(timeRemainingSeconds)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    id="toggle-timer-btn"
                    onClick={() => {
                      audioService.playClick();
                      onToggleTimer();
                    }}
                    className="p-1 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition"
                    title={isTimerRunning ? '暫停計時' : '開始計時'}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5 text-[#D97706]" /> : <Play className="w-3.5 h-3.5 text-[#48BB78]" />}
                  </button>
                  <button
                    type="button"
                    id="reset-timer-btn"
                    onClick={() => {
                      audioService.playClick();
                      onResetTimer();
                    }}
                    className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 transition"
                    title="重設 60 分鐘"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Collapse Button to save iPad screen */}
              <button
                type="button"
                onClick={() => {
                  audioService.playClick();
                  setIsNavCollapsed(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition active:scale-95 cursor-pointer"
                title="收起頂部選單以獲得更多螢幕空間"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">收起選單</span>
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 border-t border-gray-100 bg-[#FAFAFA]/90">
            <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
              {navItems.map((item) => {
                const isPart1Active = item.id === 'part1_speaking_1' && currentSection.startsWith('part1_');
                const isPart2Active = item.id === 'part2_reading_1' && currentSection.startsWith('part2_');
                const isActive = isPart1Active || isPart2Active || currentSection === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      audioService.playClick();
                      onSelectSection(item.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isActive
                        ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8] shadow-sm'
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
        </>
      )}
    </header>
  );
};
