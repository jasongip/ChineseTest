import React from 'react';
import { CandidateInfo, ScoreState } from '../types';
import {
  SPEAKING_PART_1_QUESTIONS,
  BODY_PARTS_ITEMS,
  STATIONERY_COLOR_ITEMS,
  SCENARIO_ITEMS,
  LISTENING_COMMANDS,
  READING_GROUPS,
  ANTONYM_MATCHING_PAIRS,
  PICTURE_MATCHING_PAIRS,
  MULTIPLE_CHOICE_QUESTIONS,
  WRITING_QUESTIONS,
} from '../data/examContent';
import { Printer, Download, ArrowLeft } from 'lucide-react';

interface PrintablePaperProps {
  candidate: CandidateInfo;
  scoreState: ScoreState;
  onBack: () => void;
}

export const PrintablePaper: React.FC<PrintablePaperProps> = ({
  candidate,
  scoreState,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-gray-700 font-bold text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回互動測驗</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">標準 A4 模擬試卷格式</span>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#2D3748] hover:bg-black text-white font-bold text-xs shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>立即列印／匯出 PDF 試卷</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Canvas */}
      <div className="bg-white p-8 sm:p-12 max-w-4xl mx-auto rounded-3xl border border-gray-200 shadow-md text-gray-900 font-sans print:p-0 print:border-none print:shadow-none print:max-w-full">
        {/* Header */}
        <div className="text-center pb-6 border-b-2 border-gray-900 space-y-2">
          <div className="text-xs tracking-widest text-gray-500 font-bold uppercase">
            MKCSCC 廣東話班入學評估考核試卷
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-serif">
            MKCSCC 廣東話中級班入學模擬測驗
          </h1>
          <div className="text-xs sm:text-sm text-gray-700 font-medium flex flex-wrap items-center justify-center gap-4 pt-1">
            <span>
              考生姓名：<strong className="underline underline-offset-4 font-bold">{candidate.nameEn} ({candidate.nameZh})</strong>
            </span>
            <span>
              年齡：<strong className="underline underline-offset-4 font-bold">{candidate.age} 歲</strong>
            </span>
            <span>
              限時：<strong>60 分鐘</strong>（口試 20 分鐘 ＋ 筆試 40 分鐘）
            </span>
            <span>
              日期：<strong>{candidate.testDate}</strong>
            </span>
          </div>
        </div>

        {/* Evaluation Summary Box for Examiner */}
        <div className="my-6 p-4 border border-gray-300 rounded-2xl bg-[#F8FAFC] flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="text-gray-700">
            <strong className="text-gray-900">考核標準：</strong> Jovan 需流利完成 Part 1 對答，並在 Part 2 認出 60-70% 以上字詞與基本書寫，即完全符合中級班入學標準。
          </div>
          <div className="flex items-center gap-3">
            <div className="border border-gray-300 px-3 py-1 bg-white rounded-lg">
              口試得分：______ / 30
            </div>
            <div className="border border-gray-300 px-3 py-1 bg-white rounded-lg">
              筆試得分：______ / 70
            </div>
            <div className="border-2 border-gray-900 px-3 py-1 font-black bg-white rounded-lg">
              總評分：______ / 100
            </div>
          </div>
        </div>

        {/* ================= PART 1: 口試 ================= */}
        <div className="space-y-6 pt-2">
          <div className="bg-gray-100 p-3 rounded-xl border border-gray-300 font-bold text-sm flex items-center justify-between">
            <span>Part 1: 口試 Speaking Assessment（約 20 分鐘）</span>
            <span className="text-xs font-normal text-gray-600">考官主理 ｜ 請以標準廣東話提問</span>
          </div>

          {/* 第一部分：自我介紹與日常對答 */}
          <div className="space-y-3 pl-2">
            <h3 className="font-bold text-sm text-gray-900">
              第一部分：自我介紹與日常對答（5 分鐘）
            </h3>
            <p className="text-xs text-gray-600">考官指引：考官用廣東話提問，考生需用完整句子作答。</p>

            <div className="space-y-3 pt-1">
              {SPEAKING_PART_1_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="text-xs border-b border-dashed border-gray-200 pb-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-gray-900">{idx + 1}. {q.promptCantonese}</strong>
                      <span className="text-gray-500 font-mono ml-2">[{q.jyutping}]</span>
                    </div>
                    <span className="text-gray-400">評分：[ 5 / 4 / 3 / 2 / 1 / 0 ]</span>
                  </div>
                  <div className="text-gray-600 mt-1 pl-4">
                    期望回答：「{q.expectedAnswer}」
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 第二部分：睇圖說話與認物 */}
          <div className="space-y-3 pl-2 pt-2">
            <h3 className="font-bold text-sm text-gray-900">
              第二部分：睇圖說話與認物（10 分鐘）
            </h3>
            <p className="text-xs text-gray-600">考官指引：考官展示圖片（五官、文具、顏色、動物），指住圖片提問。</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3.5 border border-gray-200 rounded-xl">
                <div className="font-bold mb-1">1. 身體與五官：</div>
                <div className="text-gray-600 mb-2">考官問：「呢個係咩嚟㗎？」</div>
                <div className="space-y-1">
                  {BODY_PARTS_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.emoji} {item.name} ({item.jyutping})</span>
                      <span>[   ]</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 border border-gray-200 rounded-xl">
                <div className="font-bold mb-1">2. 顏色與文具：</div>
                <div className="text-gray-600 mb-2">考官問：「呢支筆係咩顏色？」</div>
                <div className="space-y-1">
                  {STATIONERY_COLOR_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.icon} {item.color}嘅{item.item}</span>
                      <span>[   ]</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 border border-gray-200 rounded-xl">
                <div className="font-bold mb-1">3. 情境與動作描述：</div>
                <div className="text-gray-600 mb-2">考官問：「小朋友做緊咩呀？」</div>
                <div className="space-y-1">
                  {SCENARIO_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.emoji} {item.actionName}</span>
                      <span>[   ]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 第三部分：聆聽理解與指令 */}
          <div className="space-y-3 pl-2 pt-2">
            <h3 className="font-bold text-sm text-gray-900">
              第三部分：聆聽理解與指令（5 分鐘）
            </h3>
            <p className="text-xs text-gray-600">考官指引：考官發出簡單廣東話口頭指令，觀察考生反應。</p>

            <div className="space-y-2 pt-1">
              {LISTENING_COMMANDS.map((cmd) => (
                <div key={cmd.id} className="p-2.5 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <strong>{cmd.number}. 「{cmd.command}」</strong>
                    <span className="text-gray-500 font-mono ml-2">[{cmd.jyutping}]</span>
                    <div className="text-gray-500 text-[11px] mt-0.5">{cmd.actionRequired}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>反應正確：□ 準確完成 (5分)  □ 需提示 (3分)  □ 未完成 (0分)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="my-8 border-b-2 border-gray-900 print:break-before-page" />

        {/* ================= PART 2: 筆試與認讀 ================= */}
        <div className="space-y-6 pt-2">
          <div className="bg-gray-100 p-3 rounded-xl border border-gray-300 font-bold text-sm flex items-center justify-between">
            <span>Part 2: 筆試與認讀 Written Assessment（約 40 分鐘）</span>
            <span className="text-xs font-normal text-gray-600">認讀、配對、量詞與方格書寫</span>
          </div>

          {/* 一、認讀單字與詞語 */}
          <div className="space-y-3 pl-2">
            <h3 className="font-bold text-sm text-gray-900">
              一、 認讀單字與詞語（Oral Reading）（10 分鐘）
            </h3>
            <p className="text-xs text-gray-600">指引：請 Jovan 朗讀出以下字詞（考官在旁記錄 ✔ 或 ✘）。</p>

            <div className="space-y-3 pt-1">
              {READING_GROUPS.map((g) => (
                <div key={g.id} className="p-3 border border-gray-200 rounded-xl text-xs">
                  <div className="font-bold text-gray-800 mb-1.5">{g.title}：</div>
                  <div className="flex flex-wrap gap-3">
                    {g.words.map((w) => (
                      <span
                        key={w.char}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg font-serif text-sm font-bold text-gray-900 flex items-center gap-1.5"
                      >
                        <span>{w.char}</span>
                        <span className="text-[10px] text-gray-400 font-sans font-normal">□</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 二、配對題 */}
          <div className="space-y-4 pl-2 pt-2">
            <h3 className="font-bold text-sm text-gray-900">
              二、 配對題（Matching）（10 分鐘）
            </h3>
            <p className="text-xs text-gray-600">指引：睇左邊嘅詞語，將相配嘅意思／圖片連線。</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-1">
              {/* 1. 反義詞連線 */}
              <div className="p-4 border border-gray-300 rounded-xl">
                <div className="font-bold text-gray-900 mb-3">1. 反義詞連線</div>
                <div className="space-y-3 font-serif text-base font-bold">
                  <div className="flex items-center justify-between">
                    <span>大 ●</span>
                    <span>● 少</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>多 ●</span>
                    <span>● 小</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>上 ●</span>
                    <span>● 右</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>左 ●</span>
                    <span>● 下</span>
                  </div>
                </div>
              </div>

              {/* 2. 圖文配對 */}
              <div className="p-4 border border-gray-300 rounded-xl">
                <div className="font-bold text-gray-900 mb-3">2. 圖文配對（文字連去圖片）</div>
                <div className="space-y-3 font-serif text-base font-bold">
                  <div className="flex items-center justify-between">
                    <span>眼睛 ●</span>
                    <span>● 👃 鼻子圖</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>鼻子 ●</span>
                    <span>● 👄 嘴巴圖</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>嘴巴 ●</span>
                    <span>● 👁️ 眼睛圖</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>耳朵 ●</span>
                    <span>● 👂 耳朵圖</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 三、選擇題與量詞 */}
          <div className="space-y-3 pl-2 pt-2">
            <h3 className="font-bold text-sm text-gray-900">
              三、 選擇題與量詞（Multiple Choice）（10 分鐘）
            </h3>
            <p className="text-xs text-gray-600">指引：圈出正確嘅答案（A、B 或 C）。</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              {MULTIPLE_CHOICE_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="p-3 border border-gray-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-sm font-serif">{idx + 1}. {q.question}</div>
                  <div className="flex items-center gap-4 pl-2 font-medium">
                    {q.options.map((opt) => (
                      <span key={opt.label}>
                        （ {opt.label} ） {opt.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 四、書寫與筆順 */}
          <div className="space-y-4 pl-2 pt-2">
            <h3 className="font-bold text-sm text-gray-900">
              四、 書寫與筆順（Writing）（10 分鐘）
            </h3>
            <p className="text-xs text-gray-600">指引：喺方格（田字格）內寫出指定中文字或完成填空。</p>

            {/* 1. 基礎數字與方向 */}
            <div className="space-y-2">
              <div className="font-bold text-xs">1. 基礎數字與方向（看圖寫字）：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div>看到 3 個蘋果 🍎🍎🍎</div>
                    <div className="mt-1">寫出中文字：</div>
                  </div>
                  <div className="w-16 h-16 border-2 border-red-500 border-dashed bg-white flex items-center justify-center text-red-300 font-serif text-xl rounded-lg">
                    田
                  </div>
                </div>

                <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div>看到箭咀指向上 ⬆️</div>
                    <div className="mt-1">寫出中文字：</div>
                  </div>
                  <div className="w-16 h-16 border-2 border-red-500 border-dashed bg-white flex items-center justify-center text-red-300 font-serif text-xl rounded-lg">
                    田
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 聽寫填空 */}
            <div className="space-y-2">
              <div className="font-bold text-xs">2. 看拼音/聽寫填空（聽老師讀出並寫在括號內）：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  我愛爸爸和媽（　　）。
                </div>
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  天上有太（　　）。
                </div>
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  老師教我（　　）字。
                </div>
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  我有一雙（　　）手。
                </div>
              </div>
            </div>

            {/* 3. 筆劃數一數 */}
            <div className="space-y-2">
              <div className="font-bold text-xs">3. 筆劃數一數：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  「水」字一共有【　　】畫。
                </div>
                <div className="p-3 border border-gray-200 rounded-xl font-serif text-sm">
                  「月」字一共有【　　】畫。
                </div>
              </div>
            </div>
          </div>

          {/* Examiner Signature Footer */}
          <div className="pt-6 mt-6 border-t border-gray-400 flex flex-wrap items-center justify-between text-xs text-gray-700">
            <div>考官簽名：____________________</div>
            <div>評估日期：{candidate.testDate}</div>
            <div>錄取判定：□ 錄取中級班  □ 建議初級鞏固  □ 其他</div>
          </div>
        </div>
      </div>
    </div>
  );
};
