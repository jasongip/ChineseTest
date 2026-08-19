import React from 'react';
import { CandidateInfo, ExamSection } from '../types';
import { Clock, Play, Pause, RotateCcw, Volume2, Printer, Award, BookOpen, Mic, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const handleTestVoice = () => {
    audioService.playClick();
    speakCantonese('你好 Jovan，歡迎參加廣東話中級班入學模擬測驗！');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm print:hidden">
      {/* Top Banner: Candidate & Timer Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Title and Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#FF6B6B] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm tracking-tighter">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#2D3748]">
                MKCSCC 廣東話中級班
              </h1>
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                Placement Simulation
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold tracking-wide mt-0.5">
              入學模擬測驗 • Assessment Platform
            </p>
          </div>
        </div>

        {/* Candidate, Score & Timer */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Candidate Profile */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">候選人 Candidate</p>
            <p className="font-bold text-sm sm:text-base text-[#4A90E2]">
              {candidate.nameEn} <span className="text-[#2D3748]">({candidate.nameZh})</span>
            </p>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />

          {/* Cantonese voice test */}
          <button
            type="button"
            id="test-cantonese-voice"
            onClick={handleTestVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#2B6CB0] text-xs font-bold transition border border-gray-200"
            title="測試粵語發音"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" />
            <span className="hidden md:inline">粵語發音</span>
          </button>

          {/* Score Card */}
          <div className="bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#92400E] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span>得分：</span>
            <strong className="font-mono text-sm text-[#78350F]">{totalScore}</strong>
            <span className="text-[#B45309]">/{maxScore}</span>
          </div>

          {/* Remaining Timer Card */}
          <div className="bg-[#F0F4F8] px-3.5 py-1.5 rounded-xl border border-gray-200 flex items-center gap-2 shadow-inner">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none">剩餘 REMAINING</p>
              <p className="text-base sm:text-lg font-mono font-bold text-[#2D3748] leading-none mt-0.5">
                {formatTime(timeRemainingSeconds)}
              </p>
            </div>
            <div className="flex items-center gap-0.5 ml-1">
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
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 border-t border-gray-100 bg-[#FAFAFA]/70">
        <nav className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
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
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-[#4299E1] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.num}
                </div>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${
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
    </header>
  );
};
