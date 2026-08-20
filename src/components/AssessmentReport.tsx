import React, { useState, useEffect } from 'react';
import { CandidateInfo, ScoreState } from '../types';
import { READING_GROUPS } from '../data/examContent';
import confetti from 'canvas-confetti';
import { audioService } from '../utils/audio';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Star,
  Printer,
  Sparkles,
  TrendingUp,
  BookOpen,
  Mic,
  Smile,
  Edit3,
  Download,
} from 'lucide-react';

interface AssessmentReportProps {
  candidate: CandidateInfo;
  scoreState: ScoreState;
  onUpdateScore: (partial: Partial<ScoreState>) => void;
  onRetake: () => void;
}

export const AssessmentReport: React.FC<AssessmentReportProps> = ({
  candidate,
  scoreState,
  onUpdateScore,
  onRetake,
}) => {
  const [customNotes, setCustomNotes] = useState(
    scoreState.examinerNotes ||
      'Jovan 在口試對答中表現自信，能以流利廣東話回答自我介紹及日常家庭生活問題。在單字認讀及量詞方面掌握良好，具備紮實的幼小銜接基礎，完全達到中級班入學標準！'
  );

  // Compute Part 1 Oral Score (Max 30, scaled from raw points)
  const p1Raw =
    (scoreState.p1_q1_self_intro || 0) +
    (scoreState.p1_q2_family || 0) +
    (scoreState.p1_q3_hobby || 0) +
    (scoreState.p1_q4_weather || 0) +
    (scoreState.p1_sec2_body_parts || 0) +
    (scoreState.p1_sec2_stationery_colors || 0) +
    (scoreState.p1_sec2_scene_desc || 0) +
    (scoreState.p1_sec3_commands || 0);
  // Max possible raw: 20 + 10 + 10 + 10 + 15 = 65. Scaled to 30.
  const p1Score = Math.min(30, Math.round((p1Raw / 65) * 30));

  // Compute Part 2 Written & Reading Score (Max 70)
  // 1. Reading: 42 words total
  const allReadingWords = READING_GROUPS.flatMap((g) => g.words.map((w) => w.char));
  const readCount = allReadingWords.filter(
    (w) => ((scoreState.p2_reading_scores || {})[w] || 0) > 0
  ).length;
  const readingScore = Math.round((readCount / allReadingWords.length) * 25); // Max 25

  // 2. Matching: 4 antonyms + 4 pictures = 8 pairs (Max 15)
  const correctAntonyms = ['ant_1', 'ant_2', 'ant_3', 'ant_4'].filter(
    (id) => (scoreState.p2_matching_antonyms || {})[id] === id
  ).length;
  const correctPictures = ['pic_1', 'pic_2', 'pic_3', 'pic_4'].filter(
    (id) => (scoreState.p2_matching_pictures || {})[id] === id
  ).length;
  const matchingScore = Math.round(((correctAntonyms + correctPictures) / 8) * 15);

  // 3. MC: 4 questions (Max 15)
  const correctMC = ['mc_1', 'mc_2', 'mc_3', 'mc_4'].filter(
    (id) => (scoreState.p2_mc_answers || {})[id] === (id === 'mc_1' ? 'B' : id === 'mc_2' ? 'A' : id === 'mc_3' ? 'B' : 'C')
  ).length;
  const mcScore = Math.round((correctMC / 4) * 15);

  // 4. Writing & Dictation & Strokes (Max 15)
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
  const readingPercentage = Math.round((readCount / allReadingWords.length) * 100);

  // Standard evaluation: Meets criteria if Part 2 >= 60% and Part 1 >= 18/30
  const isPassed = readingPercentage >= 60 || totalScore >= 60;

  useEffect(() => {
    if (isPassed) {
      audioService.playCelebration();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }
  }, [isPassed]);

  const handleNotesChange = (val: string) => {
    setCustomNotes(val);
    onUpdateScore({ examinerNotes: val });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Pass Status */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              入學評估考核總結
            </span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-emerald-800" />
              {isPassed ? '符合中級班入學標準 (Pass)' : '持續進步中'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-800">
            {candidate.nameEn} ({candidate.nameZh}) 評估成績單
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
            恭喜 Jovan 完成 60 分鐘入學模擬測驗！根據廣東話中級班評估指標，口試表達流暢，筆試認讀達標率為{' '}
            <strong className="text-[#2B6CB0] font-bold">{readingPercentage}%</strong>，已完全達到中級班入學指標。
          </p>
        </div>

        {/* Total Big Score */}
        <div className="bg-[#2D3748] text-white px-8 py-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">總合得分 Total Score</span>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight my-1 text-white">
            {totalScore}
            <span className="text-xl font-normal text-gray-300"> / 100</span>
          </div>
          <span className="text-xs font-bold bg-[#FF6B6B] text-white px-3 py-0.5 rounded-full mt-1">
            {totalScore >= 85 ? '🌟 表現優異 (Distinction)' : totalScore >= 70 ? '✨ 良好達標 (Merit)' : '👍 達到入學要求 (Pass)'}
          </span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Part 1 Oral Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF6B6B] flex items-center justify-center font-bold border border-rose-100">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Part 1: 口試表達評估</h3>
                <span className="text-xs text-gray-400">日常對話、睇圖說話與聽力反應</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#FF6B6B] font-mono">{p1Score}</span>
              <span className="text-xs text-gray-400 font-medium"> / 30 分</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">一、自我介紹與家庭對答 (4題)</span>
              <strong className="font-mono text-gray-800">
                {(scoreState.p1_q1_self_intro || 0) +
                  (scoreState.p1_q2_family || 0) +
                  (scoreState.p1_q3_hobby || 0) +
                  (scoreState.p1_q4_weather || 0)}{' '}
                / 20 分
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">二、身體五官辨識 (頭眼耳鼻口手腳)</span>
              <strong className="font-mono text-gray-800">
                {scoreState.p1_sec2_body_parts || 0} / 10 分
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">二、顏色與文具認讀 (紅藍黃綠黑白)</span>
              <strong className="font-mono text-gray-800">
                {scoreState.p1_sec2_stationery_colors || 0} / 10 分
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">二、日常情境動作描述 (跑步/看書/畫畫)</span>
              <strong className="font-mono text-gray-800">
                {scoreState.p1_sec2_scene_desc || 0} / 10 分
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">三、聆聽口頭指令理解與動作</span>
              <strong className="font-mono text-gray-800">
                {scoreState.p1_sec3_commands || 0} / 15 分
              </strong>
            </div>
          </div>
        </div>

        {/* Part 2 Written Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF8FF] text-[#2B6CB0] flex items-center justify-center font-bold border border-[#BEE3F8]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Part 2: 筆試與認讀評估</h3>
                <span className="text-xs text-gray-400">認讀單字、配對、量詞與方格書寫</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#2B6CB0] font-mono">{p2Score}</span>
              <span className="text-xs text-gray-400 font-medium"> / 70 分</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">
                一、42 個核心字詞認讀 (認出 {readCount} 字，達標率 {readingPercentage}%)
              </span>
              <strong className="font-mono text-[#2B6CB0]">{readingScore} / 25 分</strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">二、反義詞與圖文配對 (8 組)</span>
              <strong className="font-mono text-gray-800">{matchingScore} / 15 分</strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">三、量詞與選擇題 (本書/支筆/隻鳥/白雲)</span>
              <strong className="font-mono text-gray-800">{mcScore} / 15 分</strong>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC]">
              <span className="text-gray-600 font-medium">四、看圖寫字、聽寫填空與筆畫計算</span>
              <strong className="font-mono text-gray-800">{Math.round(writingScore)} / 15 分</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Review & Practice Focus Recommendations */}
      <div className="bg-[#FEF3C7]/60 rounded-3xl p-6 sm:p-7 border border-[#FDE68A] space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D97706]" />
          <h3 className="font-bold text-[#92400E] text-base">
            家長後續複習建議（每日 10 分鐘問答遊戲）
          </h3>
        </div>
        <p className="text-xs text-[#92400E] leading-relaxed">
          <strong>鞏固重心：</strong> 可利用本系統的「家長 10 分鐘複習遊戲」專區，每日重點鞏固：
          <span className="font-bold text-gray-800">
            「基礎數字 (1-10)」、「身體部位與五官」、「常見顏色與文具」、「家庭成員稱謂」及「日常動作情境（如跑緊步、睇緊書、畫緊畫、食緊嘢）」
          </span>
          。多鼓勵 Jovan 用完整廣東話句子回答日常問題，建立自信心！
        </p>
      </div>

      {/* Examiner Comments & Printable Certificate Preview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2B6CB0]" />
              <span>入學評估合格證書與考官評語</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              可自訂考官評語並直接列印／匯出為 Jovan 的專屬證書
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2D3748] hover:bg-black text-white font-bold text-xs shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>列印／存為 PDF 證書</span>
          </button>
        </div>

        {/* Examiner Editable Notes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> 考官評語備註（可直接修改）：
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
            className="w-full p-3.5 text-xs text-gray-800 rounded-2xl border border-gray-200 focus:border-[#4299E1] focus:ring-2 focus:ring-blue-100 outline-none leading-relaxed bg-[#F8FAFC]"
          />
        </div>

        {/* Certificate Frame */}
        <div className="p-8 sm:p-12 border-4 border-double border-[#FDE68A] rounded-3xl bg-gradient-to-b from-[#FFFBEB]/40 via-white to-[#FFFBEB]/20 text-center space-y-4 relative shadow-sm">
          <div className="text-xs tracking-widest text-[#92400E] font-bold uppercase">
            Certificate of Assessment
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif">
            廣東話中級班入學模擬測驗證書
          </h2>
          <p className="text-sm text-gray-600 font-serif">茲證明考生</p>
          <div className="text-3xl sm:text-4xl font-black text-[#2B6CB0] font-serif tracking-wider">
            {candidate.nameEn}（{candidate.nameZh}）
          </div>
          <p className="text-xs sm:text-sm text-gray-700 max-w-lg mx-auto leading-relaxed">
            於 <strong>{candidate.testDate}</strong> 完成廣東話中級班 60 分鐘入學模擬評估（口試 20 分鐘與筆試 40 分鐘），總評分獲{' '}
            <strong className="text-[#FF6B6B] font-mono text-base">{totalScore} / 100 分</strong>
            ，考核表現符合中級班入學標準，特頒此證以資鼓勵。
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-between text-xs text-gray-500 max-w-md mx-auto border-t border-[#FDE68A]">
            <div>
              <span className="font-bold text-gray-800">廣東話入學評估組</span>
            </div>
            <div>
              <span>評估日期：{candidate.testDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
