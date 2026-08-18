import React, { useState } from 'react';
import { ScoreState, ExamSection } from '../types';
import {
  READING_GROUPS,
  ANTONYM_MATCHING_PAIRS,
  PICTURE_MATCHING_PAIRS,
  MULTIPLE_CHOICE_QUESTIONS,
  WRITING_QUESTIONS,
} from '../data/examContent';
import { TianzigeCanvas } from './TianzigeCanvas';
import { InteractiveMatching } from './InteractiveMatching';
import { speakCantonese, audioService } from '../utils/audio';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';

interface WrittenAssessmentProps {
  scoreState: ScoreState;
  onUpdateScore: (partial: Partial<ScoreState>) => void;
  currentSubSection: ExamSection;
  onSubSectionChange: (section: ExamSection) => void;
}

export const WrittenAssessment: React.FC<WrittenAssessmentProps> = ({
  scoreState,
  onUpdateScore,
  currentSubSection,
  onSubSectionChange,
}) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'matching' | 'mc' | 'writing'>('reading');
  const [showJyutping, setShowJyutping] = useState(true);

  // Scrambled items for matching
  const scrambledAntonyms = [
    { id: 'ant_2', text: '少', jyutping: 'siu2' },
    { id: 'ant_1', text: '小', jyutping: 'siu2' },
    { id: 'ant_4', text: '右', jyutping: 'jau6' },
    { id: 'ant_3', text: '下', jyutping: 'haa6' },
  ];

  const scrambledPictures = [
    { id: 'pic_2', text: '👃 鼻子', icon: '👃' },
    { id: 'pic_3', text: '👄 嘴巴', icon: '👄' },
    { id: 'pic_1', text: '👁️ 眼睛', icon: '👁️' },
    { id: 'pic_4', text: '👂 耳朵', icon: '👂' },
  ];

  // Handler for Reading Checklist
  const toggleWordRead = (wordKey: string) => {
    audioService.playClick();
    const current = scoreState.p2_reading_scores || {};
    const updated = {
      ...current,
      [wordKey]: current[wordKey] ? 0 : 1,
    };
    onUpdateScore({ p2_reading_scores: updated });
  };

  const markAllGroupWords = (words: { char: string }[], markAs: number) => {
    audioService.playSuccess();
    const current = { ...(scoreState.p2_reading_scores || {}) };
    words.forEach((w) => {
      current[w.char] = markAs;
    });
    onUpdateScore({ p2_reading_scores: current });
  };

  // Handler for MC choice selection
  const handleSelectMC = (qId: string, optionLabel: string, correctAnswer: string) => {
    if (optionLabel === correctAnswer) {
      audioService.playSuccess();
    } else {
      audioService.playError();
    }
    const updated = { ...(scoreState.p2_mc_answers || {}), [qId]: optionLabel };
    onUpdateScore({ p2_mc_answers: updated });
  };

  // Handler for Writing values
  const handleWritingChange = (field: keyof ScoreState['p2_writing_answers'], val: string) => {
    const updated = {
      ...(scoreState.p2_writing_answers || {
        q1_apples: '',
        q1_arrow: '',
        q2_mom: '',
        q2_sun: '',
        q2_write: '',
        q2_hand: '',
        q3_water_strokes: '',
        q3_moon_strokes: '',
      }),
      [field]: val,
    };
    onUpdateScore({ p2_writing_answers: updated });
  };

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              筆試認讀 Written Evaluation
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {activeTab === 'reading' ? 'Stage 2.1 • 單字認讀' : activeTab === 'matching' ? 'Stage 2.2 • 配對題' : activeTab === 'mc' ? 'Stage 2.3 • 量詞選擇' : 'Stage 2.4 • 書寫筆順'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="text-3xl">📝</span> Part 2: 筆試與認讀 Written Assessment
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            建議時間：約 40 分鐘 ｜ 通過標準：認出 60-70% 以上字詞與基本書寫規範
          </p>
        </div>

        {/* Sub-section Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F0F4F8] p-1.5 rounded-2xl border border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('reading')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'reading'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            01. 認讀單字 (10m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matching')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'matching'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            02. 配對題 (10m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'mc'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            03. 量詞選擇 (10m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('writing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'writing'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            04. 書寫筆順 (10m)
          </button>
        </div>
      </div>

      {/* SECTION 1: 認讀單字與詞語 (Oral Reading) */}
      {activeTab === 'reading' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-[#2B6CB0]">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">認讀指引：</strong> 請 Jovan 朗讀出以下 42 個核心字詞（考官在旁記錄），點擊字卡發音鍵可聆聽示範，點擊字卡即可切換掌握記錄。
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowJyutping(!showJyutping)}
              className="px-3 py-1 rounded-xl bg-white border border-[#BEE3F8] text-[#2B6CB0] font-bold hover:bg-[#F0F4F8] flex-shrink-0 transition text-xs shadow-sm"
            >
              {showJyutping ? '隱藏粵拼' : '顯示粵拼'}
            </button>
          </div>

          <div className="space-y-5">
            {READING_GROUPS.map((group) => {
              const groupScores = group.words.map(
                (w) => (scoreState.p2_reading_scores || {})[w.char] || 0
              );
              const readCount = groupScores.filter((s) => s > 0).length;

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EBF8FF] text-[#2B6CB0] font-bold text-xs flex items-center justify-center border border-[#BEE3F8]">
                        0{group.id}
                      </div>
                      <h3 className="font-bold text-gray-800 text-base">{group.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500">
                        掌握進度：<strong className="text-[#2B6CB0] font-mono">{readCount}</strong> / {group.words.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => markAllGroupWords(group.words, 1)}
                        className="text-xs text-[#2B6CB0] hover:text-[#1A365D] font-bold bg-[#EBF8FF] px-3 py-1 rounded-xl border border-[#BEE3F8] hover:bg-[#BEE3F8] transition"
                      >
                        全部標記掌握
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
                    {group.words.map((item) => {
                      const isRead = ((scoreState.p2_reading_scores || {})[item.char] || 0) > 0;
                      return (
                        <div
                          key={item.char}
                          onClick={() => toggleWordRead(item.char)}
                          className={`relative p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer select-none transition ${
                            isRead
                              ? 'border-[#48BB78] bg-emerald-50/40 shadow-sm scale-102'
                              : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakCantonese(item.char);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full text-gray-400 hover:text-[#2B6CB0] transition"
                            title="粵語朗讀"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="text-2xl sm:text-3xl font-bold font-serif text-gray-800 my-1">
                            {item.char}
                          </div>

                          {showJyutping && (
                            <div className="text-[11px] font-mono text-gray-400">
                              {item.jyutping}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-center">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isRead
                                  ? 'bg-[#48BB78] text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {isRead ? '✓' : '未'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('matching')}
              className="px-10 py-3.5 bg-[#2D3748] text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <span>前往第二部分：配對題</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: 配對題 (Matching) */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">配對連線指引：</strong> 睇左邊嘅詞語，將相配嘅意思／圖片連線。點選左邊項目後，再點選右邊對應項目即可連線。
            </div>
          </div>

          {/* 1. 反義詞連線 */}
          <InteractiveMatching
            id="antonyms-matching"
            title="1. 反義詞連線 (大、多、上、左)"
            pairs={ANTONYM_MATCHING_PAIRS}
            scrambledRight={scrambledAntonyms}
            connections={scoreState.p2_matching_antonyms || {}}
            onConnectionsChange={(newConn) => onUpdateScore({ p2_matching_antonyms: newConn })}
          />

          {/* 2. 圖文配對 */}
          <InteractiveMatching
            id="pictures-matching"
            title="2. 圖文配對（將文字連去相應五官圖片）"
            pairs={PICTURE_MATCHING_PAIRS}
            scrambledRight={scrambledPictures}
            connections={scoreState.p2_matching_pictures || {}}
            onConnectionsChange={(newConn) => onUpdateScore({ p2_matching_pictures: newConn })}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('reading')}
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              ← 返回第一部分
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mc')}
              className="px-10 py-3.5 bg-[#2D3748] text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <span>前往第三部分：量詞選擇題</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: 選擇題與量詞 (Multiple Choice) */}
      {activeTab === 'mc' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">量詞與選擇題指引：</strong> 請圈出或點選最合適嘅答案。可點擊發音按鈕聽題目，作答後系統將即時分析解釋。
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MULTIPLE_CHOICE_QUESTIONS.map((q, idx) => {
              const selectedAnswer = (scoreState.p2_mc_answers || {})[q.id];
              const isAnswered = !!selectedAnswer;
              const isCorrect = selectedAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2.5 py-0.5 rounded-lg border border-[#BEE3F8]">
                        第 {idx + 1} 題
                      </span>
                      <button
                        type="button"
                        onClick={() => speakCantonese(q.question)}
                        className="flex items-center gap-1 text-xs text-[#2B6CB0] hover:text-[#1A365D] bg-[#F0F4F8] hover:bg-[#E2E8F0] px-3 py-1 rounded-xl transition font-bold border border-gray-200"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 粵語朗讀
                      </button>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 tracking-wide font-serif">
                        {q.question}
                      </h3>
                      <div className="text-xs font-mono text-gray-400 mt-1">{q.jyutping}</div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5 pt-2">
                      {q.options.map((opt) => {
                        const isThisSelected = selectedAnswer === opt.label;
                        const isThisCorrect = opt.label === q.correctAnswer;

                        let style =
                          'border-gray-200 bg-[#F8FAFC] hover:bg-gray-100 text-gray-800';
                        if (isAnswered) {
                          if (isThisSelected && isThisCorrect) {
                            style = 'border-[#48BB78] bg-emerald-50 text-emerald-900 font-bold';
                          } else if (isThisSelected && !isThisCorrect) {
                            style = 'border-[#FF6B6B] bg-[#FFF5F5] text-rose-900 font-bold';
                          } else if (isThisCorrect) {
                            style = 'border-emerald-300 bg-emerald-50/50 text-emerald-800';
                          }
                        }

                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => handleSelectMC(q.id, opt.label, q.correctAnswer)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition text-left ${style}`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isThisSelected
                                    ? isThisCorrect
                                      ? 'bg-[#48BB78] text-white'
                                      : 'bg-[#FF6B6B] text-white'
                                    : 'bg-white border border-gray-300 text-gray-700'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span className="text-lg font-bold">{opt.text}</span>
                            </div>

                            {isAnswered && (
                              <div>
                                {isThisSelected && isThisCorrect && (
                                  <CheckCircle2 className="w-5 h-5 text-[#48BB78]" />
                                )}
                                {isThisSelected && !isThisCorrect && (
                                  <XCircle className="w-5 h-5 text-[#FF6B6B]" />
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation card */}
                  {isAnswered && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/80 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1 mb-0.5">
                        {isCorrect ? '✅ 答啱咗！' : '❌ 正確答案係 ' + q.correctAnswer + '：'}
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('matching')}
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              ← 返回第二部分
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('writing')}
              className="px-10 py-3.5 bg-[#2D3748] text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <span>前往第四部分：書寫與筆順</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: 書寫與筆順 (Writing & Strokes) */}
      {activeTab === 'writing' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">書寫與筆順指引：</strong> 喺方格（田字格）內寫出指定中文字或完成填空，並數一數中文字筆劃。Jovan
              可以用手寫板直接臨摹書寫，亦可鍵入字詞作答。
            </div>
          </div>

          {/* 1. 基礎數字與方向（看圖寫字） */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2.5 py-0.5 rounded-lg border border-[#BEE3F8]">
                小題 1
              </span>
              <h3 className="font-bold text-gray-900 text-base">基礎數字與方向（看圖寫字）</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Question 1: 3 Apples -> 三 */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">🍎🍎🍎</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    看到 3 個蘋果，寫出中文字：
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">鍵入作答：</span>
                    <input
                      type="text"
                      id="input-q1-apples"
                      value={scoreState.p2_writing_answers?.q1_apples || ''}
                      onChange={(e) => handleWritingChange('q1_apples', e.target.value)}
                      placeholder="【  】"
                      maxLength={2}
                      className="w-16 h-10 text-center font-bold text-lg rounded-xl border border-gray-300 focus:border-[#4299E1] focus:ring-2 focus:ring-blue-100 outline-none bg-white text-[#2D3748]"
                    />
                    {scoreState.p2_writing_answers?.q1_apples?.trim() === '三' && (
                      <span className="text-[#48BB78] text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 正確！
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1 font-bold">手寫田字格：</div>
                  <TianzigeCanvas
                    id="canvas-three"
                    charHint="三"
                    strokeHint={['一 (上短橫)', '一 (中短橫)', '一 (下長橫)']}
                  />
                </div>
              </div>

              {/* Question 2: Arrow Up -> 上 */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">⬆️</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    看到箭咀指向上，寫出中文字：
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">鍵入作答：</span>
                    <input
                      type="text"
                      id="input-q1-arrow"
                      value={scoreState.p2_writing_answers?.q1_arrow || ''}
                      onChange={(e) => handleWritingChange('q1_arrow', e.target.value)}
                      placeholder="【  】"
                      maxLength={2}
                      className="w-16 h-10 text-center font-bold text-lg rounded-xl border border-gray-300 focus:border-[#4299E1] focus:ring-2 focus:ring-blue-100 outline-none bg-white text-[#2D3748]"
                    />
                    {scoreState.p2_writing_answers?.q1_arrow?.trim() === '上' && (
                      <span className="text-[#48BB78] text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 正確！
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-1 font-bold">手寫田字格：</div>
                  <TianzigeCanvas
                    id="canvas-up"
                    charHint="上"
                    strokeHint={['丨 (豎)', '一 (短橫)', '一 (長橫)']}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. 看拼音/聽寫填空 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2.5 py-0.5 rounded-lg border border-[#BEE3F8]">
                  小題 2
                </span>
                <h3 className="font-bold text-gray-900 text-base">
                  看拼音/聽寫填空（聽老師讀出並寫在括號內）
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                點擊音頻鍵聽老師粵語句子朗讀
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WRITING_QUESTIONS.section2_dictation_fill.map((item, idx) => {
                const fieldMap: Record<string, keyof ScoreState['p2_writing_answers']> = {
                  dict_1: 'q2_mom',
                  dict_2: 'q2_sun',
                  dict_3: 'q2_write',
                  dict_4: 'q2_hand',
                };
                const fieldKey = fieldMap[item.id];
                const currentVal = scoreState.p2_writing_answers?.[fieldKey] || '';
                const isCorrect = currentVal.trim() === item.targetWord;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC] flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">句子 {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => speakCantonese(item.fullSentence)}
                        className="flex items-center gap-1 text-xs text-[#2B6CB0] bg-white hover:bg-[#F0F4F8] px-2.5 py-1 rounded-lg border border-gray-200 transition font-bold"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 老師讀句
                      </button>
                    </div>

                    <div className="text-lg font-bold text-gray-800 flex items-center gap-1 font-serif flex-wrap">
                      <span>{item.sentenceBefore}</span>
                      <input
                        type="text"
                        id={`input-${item.id}`}
                        value={currentVal}
                        onChange={(e) => handleWritingChange(fieldKey, e.target.value)}
                        placeholder="（  ）"
                        maxLength={2}
                        className="w-14 h-9 text-center font-bold text-base rounded-lg border-2 border-[#4299E1] focus:ring-2 focus:ring-blue-100 outline-none bg-white text-[#2B6CB0] mx-1"
                      />
                      <span>{item.sentenceAfter}</span>
                    </div>

                    <div className="text-[11px] font-mono text-gray-400">{item.jyutping}</div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                      <span className="text-gray-500">提示：{item.clue}</span>
                      {isCorrect && (
                        <span className="text-[#48BB78] font-bold flex items-center gap-0.5">
                          <Check className="w-3.5 h-3.5" /> 正確 ({item.targetWord})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 筆劃數一數 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2.5 py-0.5 rounded-lg border border-[#BEE3F8]">
                小題 3
              </span>
              <h3 className="font-bold text-gray-900 text-base">筆劃數一數（計算中文字總筆畫）</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Question: 水 */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-serif font-bold text-gray-800">「水」</div>
                  <button
                    type="button"
                    onClick={() => speakCantonese('水字一共有四畫。')}
                    className="p-1 text-gray-400 hover:text-[#2B6CB0]"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span>「水」字一共有</span>
                  <input
                    type="number"
                    id="input-strokes-water"
                    value={scoreState.p2_writing_answers?.q3_water_strokes || ''}
                    onChange={(e) => handleWritingChange('q3_water_strokes', e.target.value)}
                    placeholder="？"
                    min={1}
                    max={20}
                    className="w-14 h-9 text-center font-bold text-base rounded-lg border border-gray-300 focus:border-[#4299E1] outline-none bg-white text-[#2D3748]"
                  />
                  <span>畫。</span>

                  {scoreState.p2_writing_answers?.q3_water_strokes === '4' && (
                    <span className="text-[#48BB78] text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 正確（4畫）
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200 space-y-0.5">
                  <div className="font-bold text-[#2B6CB0]">筆順拆解：</div>
                  <div>1. 亅 (豎鈎)</div>
                  <div>2. ㇇ (橫撇)</div>
                  <div>3. ノ (撇)</div>
                  <div>4. ㇏ (捺)</div>
                </div>
              </div>

              {/* Question: 月 */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAFC] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-serif font-bold text-gray-800">「月」</div>
                  <button
                    type="button"
                    onClick={() => speakCantonese('月字一共有四畫。')}
                    className="p-1 text-gray-400 hover:text-[#2B6CB0]"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span>「月」字一共有</span>
                  <input
                    type="number"
                    id="input-strokes-moon"
                    value={scoreState.p2_writing_answers?.q3_moon_strokes || ''}
                    onChange={(e) => handleWritingChange('q3_moon_strokes', e.target.value)}
                    placeholder="？"
                    min={1}
                    max={20}
                    className="w-14 h-9 text-center font-bold text-base rounded-lg border border-gray-300 focus:border-[#4299E1] outline-none bg-white text-[#2D3748]"
                  />
                  <span>畫。</span>

                  {scoreState.p2_writing_answers?.q3_moon_strokes === '4' && (
                    <span className="text-[#48BB78] text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 正確（4畫）
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200 space-y-0.5">
                  <div className="font-bold text-[#2B6CB0]">筆順拆解：</div>
                  <div>1. 丿 (撇)</div>
                  <div>2. 𠃌 (橫折鈎)</div>
                  <div>3. 一 (橫)</div>
                  <div>4. 一 (橫)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2D3748] text-white rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div>
              <h4 className="font-bold text-lg">整份模擬測驗已全部完成！</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                點擊右方按鈕即時查看 Jovan 的評估總成績、雷達分析圖與中級班入學建議報告。
              </p>
            </div>

            <button
              type="button"
              id="view-report-btn"
              onClick={() => onSubSectionChange('report')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-sm transition shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>查看測驗總成績與評估報告</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
