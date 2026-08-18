import React, { useState } from 'react';
import { ScoreState, ExamSection } from '../types';
import {
  SPEAKING_PART_1_QUESTIONS,
  BODY_PARTS_ITEMS,
  STATIONERY_COLOR_ITEMS,
  SCENARIO_ITEMS,
  LISTENING_COMMANDS,
} from '../data/examContent';
import { AudioRecorder } from './AudioRecorder';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Volume2,
  CheckCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

interface SpeakingAssessmentProps {
  scoreState: ScoreState;
  onUpdateScore: (partial: Partial<ScoreState>) => void;
  currentSubSection: ExamSection;
  onSubSectionChange: (section: ExamSection) => void;
}

export const SpeakingAssessment: React.FC<SpeakingAssessmentProps> = ({
  scoreState,
  onUpdateScore,
  currentSubSection,
  onSubSectionChange,
}) => {
  const [activeTab, setActiveTab] = useState<'sec1' | 'sec2' | 'sec3'>('sec1');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedStationery, setSelectedStationery] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<Record<string, boolean>>({});

  const handleScoreChange = (key: keyof ScoreState, value: number) => {
    audioService.playClick();
    onUpdateScore({ [key]: value });
  };

  const toggleCommandCheck = (cmdId: string) => {
    audioService.playClick();
    const updated = { ...commandFeedback, [cmdId]: !commandFeedback[cmdId] };
    setCommandFeedback(updated);
    const count = Object.values(updated).filter(Boolean).length;
    onUpdateScore({ p1_sec3_commands: count * 5 });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card with Stage & Guide Badges */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              考官指引 Examiner Guide
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {activeTab === 'sec1' ? 'Stage 1.1 • 自我介紹' : activeTab === 'sec2' ? 'Stage 1.2 • 睇圖認物' : 'Stage 1.3 • 聆聽指令'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🗣️</span> Part 1: 口試 Speaking Assessment
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            總時限：約 20 分鐘 ｜ 評估重點：廣東話完整句子作答、詞彙辨識及聽力即時反應
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-[#F0F4F8] p-1.5 rounded-2xl border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('sec1')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'sec1'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            01. 自我介紹 (5m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sec2')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'sec2'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            02. 睇圖認物 (10m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sec3')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'sec3'
                ? 'bg-[#2B6CB0] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            03. 聆聽指令 (5m)
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: 自我介紹與日常對答 */}
      {activeTab === 'sec1' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">考官發問指引：</strong>
              請考官用標準廣東話依序提問以下 4 條題目，鼓勵 Jovan 用完整廣東話句子作答。可隨時點擊「播放考官提問」發音，並使用下方錄音記錄。
            </div>
          </div>

          <div className="space-y-5">
            {SPEAKING_PART_1_QUESTIONS.map((q, idx) => {
              const scoreKeys: (keyof ScoreState)[] = [
                'p1_q1_self_intro',
                'p1_q2_family',
                'p1_q3_hobby',
                'p1_q4_weather',
              ];
              const currentVal = (scoreState[scoreKeys[idx]] as number) || 0;
              const isFirstOrScored = idx === 0 || currentVal > 0;

              return (
                <div
                  key={q.id}
                  className={`p-6 sm:p-8 rounded-3xl border transition shadow-sm ${
                    isFirstOrScored
                      ? 'bg-[#F8FAFC] border-l-8 border-l-[#4299E1] border-gray-200'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wide">
                      問題 {idx + 1} (Question {idx + 1}) • {q.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => speakCantonese(q.promptCantonese)}
                      className="flex items-center gap-1.5 text-xs text-[#2B6CB0] hover:text-[#1A365D] bg-[#EBF8FF] hover:bg-[#BEE3F8] px-3 py-1 rounded-xl transition font-bold border border-[#BEE3F8]"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 播放考官提問
                    </button>
                  </div>

                  <p className="text-xl sm:text-2xl font-medium text-gray-900 mb-4">
                    「{q.promptCantonese}」
                  </p>
                  <p className="text-xs font-mono text-gray-400 mb-4">{q.jyutping}</p>

                  {/* Expected Answer in Artistic Flair box */}
                  <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
                    <div className="w-10 h-10 bg-[#F0F4F8] rounded-full flex items-center justify-center shadow-sm border border-gray-200 flex-shrink-0">
                      <span className="text-xl">💡</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">期望回答 (Expected Response)</p>
                      <p className="text-sm text-[#2B6CB0] italic font-semibold mt-0.5">
                        {q.expectedAnswer}
                      </p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{q.expectedJyutping}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 bg-[#F7FAFC] p-3 rounded-xl border border-gray-100 mb-4">
                    <strong>提示重點：</strong> {q.tips}
                  </div>

                  {/* Audio Recorder */}
                  <div className="mb-4">
                    <AudioRecorder id={q.id} />
                  </div>

                  {/* Examiner Score Rubric */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-bold text-gray-700">
                      考官評分 (最高 5 分)：
                      <span className="font-mono text-base text-[#FF6B6B] ml-1">{currentVal} / 5 分</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => handleScoreChange(scoreKeys[idx], pts)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            currentVal === pts
                              ? 'bg-[#2D3748] text-white shadow'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {pts}分
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('sec1')}
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              重溫第一題
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sec2')}
              className="px-10 py-3.5 bg-[#2D3748] text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <span>下一部分：睇圖說話與認物</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: 睇圖說話與認物 */}
      {activeTab === 'sec2' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">考官提問指引：</strong>
              考官向 Jovan 展示圖片（五官部位、文具顏色、情境動作），指住圖片用廣東話提問：「呢個係咩嚟㗎？」或「張圖入面做緊咩呀？」。
            </div>
          </div>

          {/* 1. 身體與五官 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                  重點 1 • 五官身體
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  身體與五官辨識（頭、眼、耳仔、鼻、口、手、腳）
                </h3>
              </div>
              <button
                type="button"
                onClick={() => speakCantonese('呢個係咩部位嚟㗎？')}
                className="flex items-center gap-1.5 text-xs text-[#2B6CB0] bg-[#F0F4F8] hover:bg-[#E2E8F0] px-3 py-1.5 rounded-xl transition font-bold border border-gray-200"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 提問：「呢個係咩嚟㗎？」
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {BODY_PARTS_ITEMS.map((item) => {
                const isSelected = selectedBodyPart === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedBodyPart(item.id);
                      speakCantonese(item.name);
                    }}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${
                      isSelected
                        ? 'border-[#4299E1] bg-[#EBF8FF] shadow-sm scale-105'
                        : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-3xl select-none mb-1">{item.emoji}</span>
                    <span className="text-lg font-bold text-gray-800">{item.name}</span>
                    <span className="text-[10px] font-mono text-gray-500">{item.jyutping}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-600 font-bold">考官評分（身體五官準確度，滿分 10 分）：</span>
              <div className="flex items-center gap-1.5">
                {[0, 2, 4, 6, 8, 10].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => handleScoreChange('p1_sec2_body_parts', pts)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                      scoreState.p1_sec2_body_parts === pts
                        ? 'bg-[#2D3748] text-white shadow'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {pts}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 顏色與文具 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                  重點 2 • 文具顏色
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  顏色與文具辨識（紅藍黃綠黑白；鉛筆、尺、書包、剪刀）
                </h3>
              </div>
              <button
                type="button"
                onClick={() => speakCantonese('呢件係咩文具？咩顏色？')}
                className="flex items-center gap-1.5 text-xs text-[#2B6CB0] bg-[#F0F4F8] hover:bg-[#E2E8F0] px-3 py-1.5 rounded-xl transition font-bold border border-gray-200"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 提問：「咩文具？咩顏色？」
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {STATIONERY_COLOR_ITEMS.map((item) => {
                const isSelected = selectedStationery === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedStationery(item.id);
                      speakCantonese(`${item.color}嘅${item.item}`);
                    }}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${
                      isSelected
                        ? 'border-[#48BB78] bg-emerald-50 shadow-sm scale-105'
                        : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 shadow-inner border border-gray-200 bg-white">
                      {item.icon}
                    </div>
                    <div className="flex items-center gap-1.5 my-1">
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="font-bold text-sm text-gray-800">{item.color}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{item.item}</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {item.colorJyutping} {item.itemJyutping}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-600 font-bold">考官評分（文具與顏色認讀，滿分 10 分）：</span>
              <div className="flex items-center gap-1.5">
                {[0, 2, 4, 6, 8, 10].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => handleScoreChange('p1_sec2_stationery_colors', pts)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                      scoreState.p1_sec2_stationery_colors === pts
                        ? 'bg-[#2D3748] text-white shadow'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {pts}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 日常動作與情境描述 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF8FF] text-[#2B6CB0] text-[10px] font-bold uppercase tracking-wider border border-[#BEE3F8]">
                  重點 3 • 情境動作
                </span>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  日常動作與情境描述（跑緊步、睇緊書、畫緊畫、食緊嘢）
                </h3>
              </div>
              <button
                type="button"
                onClick={() => speakCantonese('張圖入面個小朋友做緊咩呀？')}
                className="flex items-center gap-1.5 text-xs text-[#2B6CB0] bg-[#F0F4F8] hover:bg-[#E2E8F0] px-3 py-1.5 rounded-xl transition font-bold border border-gray-200"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 提問：「做緊咩呀？」
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {SCENARIO_ITEMS.map((item) => {
                const isSelected = selectedScenario === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedScenario(item.id);
                      speakCantonese(item.expected);
                    }}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-[#FF6B6B] bg-[#FFF5F5] shadow-md'
                        : 'border-gray-100 bg-[#F8FAFC] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200">
                        {item.scene}
                      </span>
                      <span className="text-3xl">{item.emoji}</span>
                    </div>

                    <div>
                      <div className="text-base font-bold text-gray-800">{item.actionName}</div>
                      <div className="text-xs font-mono text-gray-500">{item.jyutping}</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs">
                      <span className="font-bold text-[#FF6B6B]">標準回答：</span>
                      <p className="text-gray-800 font-medium mt-0.5">{item.expected}</p>
                    </div>

                    <div className="text-[11px] text-gray-500">{item.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
              <span className="text-gray-600 font-bold">考官評分（情境動作表達，滿分 10 分）：</span>
              <div className="flex items-center gap-1.5">
                {[0, 2, 4, 6, 8, 10].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => handleScoreChange('p1_sec2_scene_desc', pts)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                      scoreState.p1_sec2_scene_desc === pts
                        ? 'bg-[#2D3748] text-white shadow'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {pts}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('sec1')}
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
            >
              ← 返回第一部分
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sec3')}
              className="px-10 py-3.5 bg-[#2D3748] text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <span>前往第三部分：聆聽指令</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: 聆聽理解與指令 */}
      {activeTab === 'sec3' && (
        <div className="space-y-6">
          <div className="bg-[#EBF8FF] border border-[#BEE3F8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B6CB0]">
            <Info className="w-4 h-4 text-[#4299E1] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">考官指令評估：</strong>
              考官發出簡單廣東話口頭指令，觀察 Jovan 的肢體反應與聽力理解。可點擊「播放口頭指令」，考官觀察後勾選「指令正確完成」。
            </div>
          </div>

          <div className="space-y-4">
            {LISTENING_COMMANDS.map((cmd) => {
              const isChecked = !!commandFeedback[cmd.id];
              return (
                <div
                  key={cmd.id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition ${
                    isChecked
                      ? 'border-[#48BB78] bg-emerald-50/20'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#F0F4F8] border border-gray-200 flex items-center justify-center text-3xl shadow-inner">
                        {cmd.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#2D3748] text-white font-bold text-xs">
                            指令 {cmd.number}
                          </span>
                          <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF8FF] px-2 py-0.5 rounded border border-[#BEE3F8]">
                            {cmd.keyTarget}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mt-1">{cmd.command}</h4>
                        <p className="text-xs font-mono text-gray-500">{cmd.jyutping}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => speakCantonese(cmd.command)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#2B6CB0] font-bold text-xs border border-gray-200 transition"
                      >
                        <Volume2 className="w-4 h-4 text-[#4299E1]" />
                        <span>播放口頭指令</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCommandCheck(cmd.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm ${
                          isChecked
                            ? 'bg-[#48BB78] text-white ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isChecked ? '指令正確完成 (+5分)' : '點擊確認完成'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <strong className="text-gray-700">要求動作：</strong> {cmd.actionRequired}
                    </div>
                    <span className="font-mono font-bold text-[#48BB78]">
                      {isChecked ? '得分：5 / 5' : '尚未得分'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#2D3748] text-white rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div>
              <h4 className="font-bold text-lg">Part 1 口試評估完成！</h4>
              <p className="text-xs text-gray-300 mt-0.5">
                口試總得分：
                <strong className="text-[#FF6B6B] font-mono text-base ml-1">
                  {(scoreState.p1_q1_self_intro || 0) +
                    (scoreState.p1_q2_family || 0) +
                    (scoreState.p1_q3_hobby || 0) +
                    (scoreState.p1_q4_weather || 0) +
                    (scoreState.p1_sec2_body_parts || 0) +
                    (scoreState.p1_sec2_stationery_colors || 0) +
                    (scoreState.p1_sec2_scene_desc || 0) +
                    (scoreState.p1_sec3_commands || 0)}{' '}
                  / 65 分
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSubSectionChange('part2_reading_1')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-bold text-sm transition shadow-md"
            >
              <span>進入 Part 2 筆試與認讀 (40 分鐘)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
