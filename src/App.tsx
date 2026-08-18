import React, { useState, useEffect } from 'react';
import { CandidateInfo, ExamSection, ScoreState } from './types';
import { INITIAL_CANDIDATE, READING_GROUPS } from './data/examContent';
import { Navbar } from './components/Navbar';
import { SpeakingAssessment } from './components/SpeakingAssessment';
import { WrittenAssessment } from './components/WrittenAssessment';
import { DailyPracticeGame } from './components/DailyPracticeGame';
import { PrintablePaper } from './components/PrintablePaper';
import { AssessmentReport } from './components/AssessmentReport';
import { audioService } from './utils/audio';
import {
  Mic,
  BookOpen,
  Printer,
  Sparkles,
  Award,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [candidate, setCandidate] = useState<CandidateInfo>(INITIAL_CANDIDATE);
  const [currentSection, setCurrentSection] = useState<ExamSection>('part1_speaking_1');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(60 * 60); // 60 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Initialize Score State
  const [scoreState, setScoreState] = useState<ScoreState>({
    p1_q1_self_intro: 5,
    p1_q2_family: 5,
    p1_q3_hobby: 4,
    p1_q4_weather: 5,
    p1_sec2_body_parts: 10,
    p1_sec2_stationery_colors: 10,
    p1_sec2_scene_desc: 8,
    p1_sec3_commands: 15,

    // Part 2 Initial Sample/State (Pre-mark initial words as familiar for convenient evaluation)
    p2_reading_scores: {
      一: 1, 二: 1, 三: 1, 四: 1, 五: 1, 六: 1, 七: 1, 八: 1, 九: 1, 十: 1,
      人: 1, 口: 1, 手: 1, 足: 1, 耳: 1, 目: 1,
      日: 1, 月: 1, 水: 1, 火: 1, 山: 1, 石: 1, 田: 1, 土: 1,
      大: 1, 小: 1, 多: 1, 少: 1, 上: 1, 下: 1, 左: 1, 右: 1,
      爸爸: 1, 媽媽: 1, 哥哥: 1, 姐姐: 1, 弟弟: 1, 妹妹: 1,
      太陽: 1, 月亮: 1, 落雨: 1, 白雲: 1,
    },
    p2_matching_antonyms: {
      ant_1: 'ant_1', // 大 - 小
      ant_2: 'ant_2', // 多 - 少
      ant_3: 'ant_3', // 上 - 下
      ant_4: 'ant_4', // 左 - 右
    },
    p2_matching_pictures: {
      pic_1: 'pic_1', // 眼睛 - 👁️
      pic_2: 'pic_2', // 鼻子 - 👃
      pic_3: 'pic_3', // 嘴巴 - 👄
      pic_4: 'pic_4', // 耳朵 - 👂
    },
    p2_mc_answers: {
      mc_1: 'B', // 一本書
      mc_2: 'A', // 兩支鉛筆
      mc_3: 'B', // 三隻小鳥
      mc_4: 'C', // 白雲
    },
    p2_writing_answers: {
      q1_apples: '三',
      q1_arrow: '上',
      q2_mom: '媽',
      q2_sun: '陽',
      q2_write: '寫',
      q2_hand: '小',
      q3_water_strokes: '4',
      q3_moon_strokes: '4',
    },
    examinerNotes: '',
  });

  // Countdown timer effect
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning && timeRemainingSeconds > 0) {
      interval = window.setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            audioService.playCelebration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemainingSeconds]);

  const handleUpdateScore = (partial: Partial<ScoreState>) => {
    setScoreState((prev) => ({ ...prev, ...partial }));
  };

  // Compute summary scores
  const p1Raw =
    (scoreState.p1_q1_self_intro || 0) +
    (scoreState.p1_q2_family || 0) +
    (scoreState.p1_q3_hobby || 0) +
    (scoreState.p1_q4_weather || 0) +
    (scoreState.p1_sec2_body_parts || 0) +
    (scoreState.p1_sec2_stationery_colors || 0) +
    (scoreState.p1_sec2_scene_desc || 0) +
    (scoreState.p1_sec3_commands || 0);
  const p1Score = Math.min(30, Math.round((p1Raw / 65) * 30));

  const allReadingWords = READING_GROUPS.flatMap((g) => g.words.map((w) => w.char));
  const readCount = allReadingWords.filter(
    (w) => ((scoreState.p2_reading_scores || {})[w] || 0) > 0
  ).length;
  const readingScore = Math.round((readCount / allReadingWords.length) * 25);

  const correctAntonyms = ['ant_1', 'ant_2', 'ant_3', 'ant_4'].filter(
    (id) => (scoreState.p2_matching_antonyms || {})[id] === id
  ).length;
  const correctPictures = ['pic_1', 'pic_2', 'pic_3', 'pic_4'].filter(
    (id) => (scoreState.p2_matching_pictures || {})[id] === id
  ).length;
  const matchingScore = Math.round(((correctAntonyms + correctPictures) / 8) * 15);

  const correctMC = ['mc_1', 'mc_2', 'mc_3', 'mc_4'].filter(
    (id) => (scoreState.p2_mc_answers || {})[id] === (id === 'mc_1' ? 'B' : id === 'mc_2' ? 'A' : id === 'mc_3' ? 'B' : 'C')
  ).length;
  const mcScore = Math.round((correctMC / 4) * 15);

  let writingScore = 0;
  if (scoreState.p2_writing_answers?.q1_apples?.trim() === '三') writingScore += 2;
  if (scoreState.p2_writing_answers?.q1_arrow?.trim() === '上') writingScore += 2;
  if (scoreState.p2_writing_answers?.q2_mom?.trim() === '媽') writingScore += 2;
  if (scoreState.p2_writing_answers?.q2_sun?.trim() === '陽') writingScore += 2;
  if (['寫', '讀'].includes(scoreState.p2_writing_answers?.q2_write?.trim() || '')) writingScore += 2;
  if (['小', '巧'].includes(scoreState.p2_writing_answers?.q2_hand?.trim() || '')) writingScore += 2;
  if (scoreState.p2_writing_answers?.q3_water_strokes?.trim() === '4') writingScore += 1.5;
  if (scoreState.p2_writing_answers?.q3_moon_strokes?.trim() === '4') writingScore += 1.5;

  const p2Score = Math.min(70, Math.round(readingScore + matchingScore + mcScore + writingScore));
  const totalScore = p1Score + p2Score;

  const handleRetake = () => {
    audioService.playClick();
    setTimeRemainingSeconds(60 * 60);
    setIsTimerRunning(false);
    setCurrentSection('part1_speaking_1');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Top Fixed / Sticky Navigation Bar */}
      <Navbar
        candidate={candidate}
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        timeRemainingSeconds={timeRemainingSeconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onResetTimer={() => setTimeRemainingSeconds(60 * 60)}
        totalScore={totalScore}
        maxScore={100}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* VIEW 1: Part 1 Speaking Assessment */}
        {currentSection.startsWith('part1_') && (
          <SpeakingAssessment
            scoreState={scoreState}
            onUpdateScore={handleUpdateScore}
            currentSubSection={currentSection}
            onSubSectionChange={(sec) => setCurrentSection(sec)}
          />
        )}

        {/* VIEW 2: Part 2 Written & Reading Assessment */}
        {currentSection.startsWith('part2_') && (
          <WrittenAssessment
            scoreState={scoreState}
            onUpdateScore={handleUpdateScore}
            currentSubSection={currentSection}
            onSubSectionChange={(sec) => setCurrentSection(sec)}
          />
        )}

        {/* VIEW 3: Parent Daily 10-Min Practice Game */}
        {currentSection === 'daily_practice' && <DailyPracticeGame />}

        {/* VIEW 4: Printable Paper Mode */}
        {currentSection === 'print' && (
          <PrintablePaper
            candidate={candidate}
            scoreState={scoreState}
            onBack={() => setCurrentSection('part1_speaking_1')}
          />
        )}

        {/* VIEW 5: Assessment Report & Certificate */}
        {currentSection === 'report' && (
          <AssessmentReport
            candidate={candidate}
            scoreState={scoreState}
            onUpdateScore={handleUpdateScore}
            onRetake={handleRetake}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MKCSCC 廣東話中級班入學模擬測驗系統 • 考生：Jovan Ng（伍博睿）</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>口試 20 分鐘 ｜ 筆試 40 分鐘 ｜ 總計 60 分鐘</span>
            <span>通過標準：Part 2 達 60-70%+ 及流利口語</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
