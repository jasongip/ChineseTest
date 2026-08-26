import React, { useState, useEffect, useRef } from 'react';
import { VocabItem } from '../data/vocabPracticeList';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Mic,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Flame,
  Check,
  Radio,
  Square,
  Eye,
  EyeOff,
  Globe,
  Settings2,
} from 'lucide-react';

interface PronunciationPracticeProps {
  currentVocab: VocabItem;
  questionIndex: number;
  totalQuestions: number;
  streak: number;
  onAnswerResult: (isCorrect: boolean) => void;
  onNextQuestion: () => void;
  onTriggerGacha: (count: number) => void;
}

// Comprehensive Simplified to Traditional Chinese Character Map
const SIMP_TO_TRAD_MAP: Record<string, string> = {
  体: '體', 学: '學', 课: '課', 场: '場', 图: '圖', 书: '書', 馆: '館', 阳: '陽', 丽: '麗',
  开: '開', 乐: '樂', 习: '習', 边: '邊', 礼: '禮', 欢: '歡', 庆: '慶', 红: '紅', 绿: '綠',
  蓝: '藍', 头: '頭', 发: '髮', 动: '動', 飞: '飛', 机: '機', 车: '車', 电: '電', 脑: '腦',
  话: '話', 点: '點', 时: '時', 间: '間', 这: '這', 个: '個', 们: '們', 双: '雙', 节: '節',
  脸: '臉', 脚: '腳', 语: '語', 国: '國', 爱: '愛', 亲: '親', 热: '熱', 闹: '鬧', 听: '聽',
  讲: '講', 说: '說', 变: '變', 张: '張', 风: '風', 云: '雲', 现: '現', 认: '認', 识: '識',
  树: '樹', 叶: '葉', 鸟: '鳥', 鸡: '雞', 鸭: '鴨', 鹅: '鵝', 猫: '貓', 猪: '豬', 马: '馬',
  鱼: '魚', 虾: '蝦', 蟹: '蟹', 蚂: '螞', 蚁: '蟻', 蝴: '蝴', 蝶: '蝶', 钟: '鐘', 声: '聲',
  响: '響', 齐: '齊', 洁: '潔', 净: '淨', 优: '優', 简: '簡', 单: '單', 难: '難', 轻: '輕',
  长: '長', 宽: '寬', 圆: '圓', 线: '線', 条: '條', 湿: '濕', 润: '潤', 处: '處', 进: '進',
  过: '過', 样: '樣', 么: '麼', 谁: '誰', 哪: '哪', 给: '給', 著: '著', 为: '為',
  紧: '緊', 虽: '雖', 然: '然', 宝: '寶', 贝: '貝', 级: '級', 纸: '紙', 笔: '筆',
};

// Convert string from Simplified to Traditional characters
function normalizeToTraditional(str: string): string {
  if (!str) return '';
  return Array.from(str)
    .map((ch) => SIMP_TO_TRAD_MAP[ch] || ch)
    .join('');
}

// Common Cantonese Jyutping map for phonetic fallback
const JYUTPING_MAP: Record<string, string> = {
  爸: 'baa', 媽: 'maa', 哥: 'go', 弟: 'dai', 姐: 'ze', 妹: 'mui', 外: 'ngoi', 婆: 'po', 朋: 'pang', 友: 'jau',
  同: 'tung', 學: 'hok', 老: 'lou', 師: 'si', 班: 'baan', 長: 'zoeng', 國: 'gwok', 王: 'wong', 客: 'haak', 人: 'jan',
  別: 'bit', 孩: 'haai', 子: 'zi', 兒: 'ji', 童: 'tung', 我: 'ngo', 們: 'mun', 大: 'daai', 家: 'gaa', 自: 'zi', 己: 'gei',
  上: 'soeng', 校: 'haau', 開: 'hoi', 放: 'fong', 下: 'haa', 課: 'fo', 小: 'siu', 息: 'sik', 室: 'sat', 操: 'cou', 場: 'coeng',
  遊: 'jau', 樂: 'lok', 圖: 'tou', 書: 'syu', 館: 'gun', 包: 'baau', 服: 'fuk', 讀: 'duk', 寫: 'se', 字: 'zi', 習: 'zaap',
  天: 'tin', 氣: 'hei', 晴: 'cing', 陰: 'jam', 雨: 'jyu', 雲: 'wan', 風: 'fung', 雪: 'syut', 雷: 'leoi', 電: 'din',
  日: 'jat', 月: 'jyut', 星: 'sing', 光: 'gwong', 山: 'saan', 水: 'seoi', 花: 'faa', 草: 'cou', 樹: 'syu', 木: 'muk', 目: 'muk',
  眼: 'ngaan', 睛: 'zing', 耳: 'ji', 朵: 'do', 鼻: 'bei', 嘴: 'zeoi', 巴: 'baa', 手: 'sau', 腳: 'goek', 頭: 'tau', 髮: 'faat',
  美: 'mei', 麗: 'lai', 漂: 'piu', 亮: 'loeng', 心: 'sam', 快: 'faai', 生: 'saang', 肚: 'tou', 身: 'san', 體: 'tai',
  太: 'taai', 陽: 'joeng', 動: 'dung', 物: 'mat', 魚: 'jyu', 蝴: 'wu', 蝶: 'dip', 蜜: 'mat', 蜂: 'fung', 青: 'ceng', 蛙: 'waa',
  螞: 'maa', 蟻: 'ngai', 燕: 'jin', 尾: 'mei', 泥: 'nai', 土: 'tou', 石: 'sek', 海: 'hoi', 洋: 'joeng', 池: 'ci', 塘: 'tong',
  種: 'zung', 剪: 'zin', 刀: 'dou', 畫: 'waa', 桌: 'coek', 椅: 'ji', 球: 'kau', 空: 'hung', 點: 'dim', 用: 'jung', 功: 'gung',
  比: 'bei', 賽: 'coi',
};

// Check if recognized candidate phrases sound identical or match words
function evaluateCantonesePronunciation(
  targetWord: string,
  candidates: string[]
): { isMatch: boolean; confidenceReason: string; bestText: string } {
  if (!candidates || candidates.length === 0 || !targetWord) {
    return { isMatch: false, confidenceReason: '未收到清晰聲音', bestText: '' };
  }

  const cleanTarget = targetWord.trim().replace(/[，。！？\s]/g, '');

  for (const rawCandidate of candidates) {
    const rawClean = rawCandidate.trim().replace(/[，。！？\s]/g, '');
    const tradClean = normalizeToTraditional(rawClean);

    // 1. Direct or normalized match (e.g. "呢個係眼睛" -> contains "眼睛"; or "学校" -> "學校")
    if (tradClean.includes(cleanTarget) || cleanTarget.includes(tradClean) || rawClean.includes(cleanTarget)) {
      return { isMatch: true, confidenceReason: '字詞精確吻合', bestText: tradClean };
    }

    // 2. Character-by-character phonetic comparison
    const targetChars = Array.from(cleanTarget);
    const recChars = Array.from(tradClean);

    let matchedCharCount = 0;
    targetChars.forEach((tChar, i) => {
      const tPhonetic = JYUTPING_MAP[tChar];
      const rChar = recChars[i];
      if (rChar === tChar) {
        matchedCharCount++;
      } else if (rChar && tPhonetic && JYUTPING_MAP[rChar] === tPhonetic) {
        // Homophone match! (e.g. 目 -> 木)
        matchedCharCount++;
      }
    });

    if (matchedCharCount >= Math.ceil(targetChars.length * 0.75)) {
      return { isMatch: true, confidenceReason: '同音字／拼音吻合', bestText: tradClean };
    }
  }

  const primaryRec = normalizeToTraditional(candidates[0] || '');
  return { isMatch: false, confidenceReason: '讀音不相符', bestText: primaryRec };
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  currentVocab,
  questionIndex,
  totalQuestions,
  streak,
  onAnswerResult,
  onNextQuestion,
  onTriggerGacha,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(5);
  const [recognizedTranscript, setRecognizedTranscript] = useState<string>('');
  const [liveHeardText, setLiveHeardText] = useState<string>('');
  const [practiceStatus, setPracticeStatus] = useState<'idle' | 'recording' | 'evaluating' | 'correct' | 'incorrect'>('idle');
  const [showHintJyutping, setShowHintJyutping] = useState<boolean>(false);
  const [matchReason, setMatchReason] = useState<string>('');
  
  // Language configuration (Default to Cantonese zh-HK)
  const [speechLang, setSpeechLang] = useState<string>('zh-HK');
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const candidateTranscriptsRef = useRef<string[]>([]);

  // Reset states on new question
  useEffect(() => {
    setIsRecording(false);
    setCountdownSeconds(5);
    setRecognizedTranscript('');
    setLiveHeardText('');
    setPracticeStatus('idle');
    setMatchReason('');
    candidateTranscriptsRef.current = [];

    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
  }, [currentVocab.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleFinishRecording = (candidates: string[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setPracticeStatus('evaluating');

    const result = evaluateCantonesePronunciation(currentVocab.word, candidates);
    setMatchReason(result.confidenceReason);
    setRecognizedTranscript(result.bestText);

    setTimeout(() => {
      if (result.isMatch) {
        setPracticeStatus('correct');
        audioService.playSuccess();
        onAnswerResult(true);
      } else {
        setPracticeStatus('incorrect');
        audioService.playError();
        onAnswerResult(false);
      }
    }, 350);
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('抱歉，此瀏覽器未支援語音辨識，請使用 Google Chrome、Edge 或 Safari。');
      return;
    }

    try {
      audioService.playClick();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      // Use chosen Cantonese language code (zh-HK / yue-Hant-HK / zh-CN)
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;

      candidateTranscriptsRef.current = [];
      setRecognizedTranscript('');
      setLiveHeardText('');
      setPracticeStatus('recording');
      setIsRecording(true);
      setCountdownSeconds(5);

      recognition.onresult = (event: any) => {
        const foundList: string[] = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          for (let k = 0; k < res.length; k++) {
            const txt = res[k]?.transcript?.trim();
            if (txt && !foundList.includes(txt)) {
              foundList.push(txt);
            }
          }
        }
        if (foundList.length > 0) {
          candidateTranscriptsRef.current = foundList;
          setLiveHeardText(normalizeToTraditional(foundList[0]));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          alert('請允許麥克風權限以進行讀音練習！');
          setIsRecording(false);
          setPracticeStatus('idle');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          handleFinishRecording(candidateTranscriptsRef.current);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // 5-second countdown timer
      let timeLeft = 5;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdownSeconds(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timerRef.current);
          try {
            recognition.stop();
          } catch {}
          handleFinishRecording(candidateTranscriptsRef.current);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setPracticeStatus('idle');
    }
  };

  const stopVoiceRecordingEarly = () => {
    audioService.playPop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    handleFinishRecording(candidateTranscriptsRef.current);
  };

  // Manual Parent Override (Mark Correct)
  const handleParentMarkCorrect = () => {
    audioService.playCelebration();
    setPracticeStatus('correct');
    setMatchReason('家長覆核判定為正確');
    onAnswerResult(true);
  };

  return (
    <div className="space-y-4">
      {/* HEADER CARD WITH STREAK, PROGRESS, AND LANGUAGE SELECTOR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-inner font-bold">
            🎤
          </div>
          <div>
            <div className="text-xs font-black text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
              <span>朗讀發音特訓</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                {speechLang === 'zh-HK' ? '🇭🇰 廣東話 (香港)' : speechLang === 'yue-Hant-HK' ? '🇭🇰 粵語 (iOS相容)' : '🇨🇳 普通話 (國語)'}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800">
              第 <strong className="text-purple-600 font-mono text-base">{questionIndex + 1}</strong> / {totalQuestions} 題
            </div>
          </div>
        </div>

        {/* Action badges: Language switch + Streak */}
        <div className="flex items-center gap-2">
          {/* Language selector toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="切換辨識語言"
            >
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              <Settings2 className="w-3 h-3" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  選擇語音辨識語言
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechLang('zh-HK');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between ${
                    speechLang === 'zh-HK' ? 'bg-purple-100 text-purple-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🇭🇰 廣東話 (zh-HK 預設)</span>
                  {speechLang === 'zh-HK' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechLang('yue-Hant-HK');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between ${
                    speechLang === 'yue-Hant-HK' ? 'bg-purple-100 text-purple-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🇭🇰 粵語 (iOS/Safari)</span>
                  {speechLang === 'yue-Hant-HK' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechLang('zh-CN');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between ${
                    speechLang === 'zh-CN' ? 'bg-purple-100 text-purple-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🇨🇳 普通話 (普教中)</span>
                  {speechLang === 'zh-CN' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>連對 {streak} 題</span>
          </div>
        </div>
      </div>

      {/* MAIN PRACTICE BOARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md text-center space-y-6">
        {/* Instruction badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
          <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>請看字大聲朗讀（預設錄音 5 秒，系統將自動核對讀音）</span>
        </div>

        {/* Target Word Display Card */}
        <div className="max-w-md mx-auto py-6 px-4 bg-gradient-to-b from-slate-50 to-purple-50/40 rounded-3xl border-2 border-purple-200/80 shadow-inner space-y-3 relative">
          <div className="text-5xl sm:text-6xl font-black font-serif text-slate-900 tracking-wider">
            {currentVocab.word}
          </div>

          {/* Optional Jyutping Hint Toggle */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {showHintJyutping ? (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-xl text-purple-900 font-mono text-sm font-black border border-purple-200 shadow-xs">
                <span>粵拼：{currentVocab.jyutping}</span>
                <button
                  type="button"
                  onClick={() => setShowHintJyutping(false)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHintJyutping(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>顯示粵拼提示</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">{currentVocab.english}</div>
        </div>

        {/* INTERACTIVE VOICE RECORDING BUTTON AREA */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-2">
          {practiceStatus === 'idle' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer mx-auto group"
              >
                <Mic className="w-10 h-10 group-hover:animate-bounce" />
                <span className="text-[11px] font-black mt-1">點擊朗讀</span>
              </button>
              <div className="text-xs text-slate-400 font-medium">點擊後開始 5 秒倒數（可用廣東話朗讀）</div>
            </div>
          )}

          {practiceStatus === 'recording' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative inline-flex items-center justify-center">
                {/* Pulsing ring animation */}
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                <div className="w-24 h-24 rounded-full bg-rose-500 text-white flex flex-col items-center justify-center shadow-2xl relative z-10">
                  <span className="text-2xl font-black font-mono">{countdownSeconds}s</span>
                  <span className="text-[10px] font-bold">請大聲讀出</span>
                </div>
              </div>

              {/* Dynamic waveform simulation */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                <div className="w-1.5 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-6" />
                <div className="w-1.5 bg-purple-500 rounded-full animate-[bounce_0.6s_infinite_200ms] h-8" />
                <div className="w-1.5 bg-indigo-500 rounded-full animate-[bounce_0.6s_infinite_300ms] h-5" />
                <div className="w-1.5 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_400ms] h-7" />
                <div className="w-1.5 bg-purple-500 rounded-full animate-[bounce_0.6s_infinite_500ms] h-4" />
              </div>

              {/* Real-time speech preview */}
              {liveHeardText && (
                <div className="text-xs text-purple-900 font-bold bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 inline-block animate-pulse">
                  即時聽到：<strong>「{liveHeardText}」</strong>
                </div>
              )}

              {/* Early stop button */}
              <div>
                <button
                  type="button"
                  onClick={stopVoiceRecordingEarly}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-slate-700" />
                  <span>我講完喇（即刻核對）</span>
                </button>
              </div>
            </div>
          )}

          {practiceStatus === 'evaluating' && (
            <div className="py-6 space-y-2">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-purple-700">正在核對廣東話讀音...</div>
            </div>
          )}

          {/* CORRECT RESULT CARD */}
          {practiceStatus === 'correct' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 max-w-md mx-auto space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>讀音非常標準！太棒了！🎉</span>
              </div>
              <div className="text-xs text-emerald-700 font-bold">
                辨識結果：<strong className="underline text-slate-900">{recognizedTranscript || currentVocab.word}</strong> ({matchReason})
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNextQuestion}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>下一題</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* INCORRECT RESULT CARD */}
          {practiceStatus === 'incorrect' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 max-w-md mx-auto space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-rose-800 font-black text-lg">
                <XCircle className="w-6 h-6 text-rose-600" />
                <span>發音需要再清晰一點喔！</span>
              </div>

              <div className="text-xs text-slate-600">
                系統聽到的內容：<strong className="text-rose-700">{recognizedTranscript ? `「${recognizedTranscript}」` : '（未清晰辨識到聲音）'}</strong>
              </div>

              {/* Practice guide with Audio play */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => speakCantonese(currentVocab.word)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black transition flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-purple-700" />
                  <span>聽標準示範音</span>
                </button>

                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>再錄一次</span>
                </button>
              </div>

              {/* PARENT OVERRIDE TOOLBAR */}
              <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">家長覆核判定：</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleParentMarkCorrect}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>家長算啱</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNextQuestion}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer text-[11px]"
                  >
                    <span>跳過</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
