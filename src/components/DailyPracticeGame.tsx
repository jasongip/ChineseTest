import React, { useState } from 'react';
import { speakCantonese, audioService } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  Star,
  Trophy,
  RotateCcw,
  CheckCircle,
  Clock,
  Heart,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const DailyPracticeGame: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'numbers' | 'body' | 'stationery' | 'family' | 'actions'>('numbers');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(3);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const categories = [
    { id: 'numbers', label: '1. 基礎數字 (1-10)', icon: '🔢' },
    { id: 'body', label: '2. 身體與五官', icon: '👦' },
    { id: 'stationery', label: '3. 顏色與文具', icon: '🎨' },
    { id: 'family', label: '4. 家庭稱呼', icon: '👨‍👩‍👧‍👦' },
    { id: 'actions', label: '5. 日常動作', icon: '🏃‍♂️' },
  ];

  // Game data per category
  const flashcardsData = {
    numbers: [
      { char: '一', jyutping: 'jat1', meaning: '數字 1', emoji: '1️⃣' },
      { char: '二', jyutping: 'ji6', meaning: '數字 2', emoji: '2️⃣' },
      { char: '三', jyutping: 'saam1', meaning: '數字 3', emoji: '3️⃣' },
      { char: '四', jyutping: 'sei3', meaning: '數字 4', emoji: '4️⃣' },
      { char: '五', jyutping: 'ng5', meaning: '數字 5', emoji: '5️⃣' },
      { char: '六', jyutping: 'luk6', meaning: '數字 6', emoji: '6️⃣' },
      { char: '七', jyutping: 'cat1', meaning: '數字 7', emoji: '7️⃣' },
      { char: '八', jyutping: 'baat3', meaning: '數字 8', emoji: '8️⃣' },
      { char: '九', jyutping: 'gau2', meaning: '數字 9', emoji: '9️⃣' },
      { char: '十', jyutping: 'sap6', meaning: '數字 10', emoji: '🔟' },
    ],
    body: [
      { char: '頭', jyutping: 'tau4', meaning: '頭部', emoji: '👦' },
      { char: '眼', jyutping: 'ngaan5', meaning: '眼睛', emoji: '👁️' },
      { char: '耳仔', jyutping: 'ji5 zai2', meaning: '耳朵', emoji: '👂' },
      { char: '鼻', jyutping: 'bei6', meaning: '鼻子', emoji: '👃' },
      { char: '口', jyutping: 'hau2', meaning: '嘴巴/口', emoji: '👄' },
      { char: '手', jyutping: 'sau2', meaning: '手掌', emoji: '✋' },
      { char: '腳', jyutping: 'goek3', meaning: '雙腳', emoji: '🦶' },
    ],
    stationery: [
      { char: '紅色鉛筆', jyutping: 'hung4 sik1 jyun4 bat1', meaning: '鉛筆 (Red)', emoji: '✏️' },
      { char: '藍色尺', jyutping: 'laam4 sik1 cek3', meaning: '尺 (Blue)', emoji: '📏' },
      { char: '黃色書包', jyutping: 'wong4 sik1 syu1 baau1', meaning: '書包 (Yellow)', emoji: '🎒' },
      { char: '綠色剪刀', jyutping: 'luk6 sik1 zin2 dou1', meaning: '剪刀 (Green)', emoji: '✂️' },
      { char: '黑色筆', jyutping: 'haak1 sik1 bat1', meaning: '原子筆 (Black)', emoji: '🖊️' },
      { char: '白色紙', jyutping: 'baak6 sik1 zi2', meaning: '圖畫紙 (White)', emoji: '📄' },
    ],
    family: [
      { char: '爸爸', jyutping: 'baa4 baa1', meaning: 'Father', emoji: '👨' },
      { char: '媽媽', jyutping: 'maa4 maa1', meaning: 'Mother', emoji: '👩' },
      { char: '哥哥', jyutping: 'go1 go1', meaning: 'Elder Brother', emoji: '👦' },
      { char: '姐姐', jyutping: 'ze4 ze1', meaning: 'Elder Sister', emoji: '👧' },
      { char: '弟弟', jyutping: 'dai6 dai6', meaning: 'Younger Brother', emoji: '👶' },
      { char: '妹妹', jyutping: 'mui4 mui2', meaning: 'Younger Sister', emoji: '👧' },
    ],
    actions: [
      { char: '跑緊步', jyutping: 'paau2 gan2 bou6', meaning: '跑步運動', emoji: '🏃‍♂️' },
      { char: '睇緊書', jyutping: 'tai2 gan2 syu1', meaning: '閱讀書本', emoji: '📖' },
      { char: '畫緊畫', jyutping: 'waa2 gan2 waa2', meaning: '畫紙作畫', emoji: '🎨' },
      { char: '食緊嘢', jyutping: 'sik6 gan2 je5', meaning: '享用點心', emoji: '🍎' },
    ],
  };

  // Mini Interactive Quiz Questions for Daily Mode
  const quizPool = [
    {
      q: '聽一聽，邊一張圖係「耳仔」？',
      audioText: '請搵出耳仔。',
      options: ['👁️ 眼', '👂 耳仔', '👃 鼻', '👄 口'],
      correct: '👂 耳仔',
    },
    {
      q: '「一本書」應該用邊個量詞？',
      audioText: '一本書嘅量詞係咩？',
      options: ['一隻書', '一本書', '一支書', '一張書'],
      correct: '一本書',
    },
    {
      q: '「大」嘅反義詞係邊一個？',
      audioText: '大嘅相反係咩？',
      options: ['多', '小', '上', '右'],
      correct: '小',
    },
    {
      q: '圖中如果小朋友在看故事書，廣東話應該點講？',
      audioText: '小朋友喺度做緊咩？',
      options: ['佢喺度跑緊步', '佢喺度睇緊書', '佢喺度畫緊畫', '佢喺度食緊嘢'],
      correct: '佢喺度睇緊書',
    },
  ];

  const currentQuiz = quizPool[quizIndex % quizPool.length];

  const handleCardClick = (item: { char: string; jyutping: string }) => {
    audioService.playClick();
    speakCantonese(item.char);
    setStars((s) => s + 1);
  };

  const handleAnswerQuiz = (opt: string) => {
    setSelectedOption(opt);
    if (opt === currentQuiz.correct) {
      audioService.playCelebration();
      setQuizScore((s) => s + 1);
      setStars((s) => s + 3);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // Ignore
      }
    } else {
      audioService.playError();
    }
  };

  const nextQuiz = () => {
    setSelectedOption(null);
    setQuizIndex((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              家長每日 10 分鐘問答遊戲
            </span>
            <span className="flex items-center gap-1 text-[10px] bg-[#FEF3C7] text-[#92400E] font-bold px-2.5 py-1 rounded-full border border-[#FDE68A]">
              <Flame className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" /> 連續學習 {streak} 日
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🎮</span> Jovan 廣東話日常快閃字卡與問答
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            每天 10 分鐘輕鬆問答，重點鞏固數字、身體部位、顏色文具、家庭稱呼與日常動作！
          </p>
        </div>

        {/* Star Counter */}
        <div className="flex items-center gap-3 bg-[#F0F4F8] px-5 py-3 rounded-2xl border border-gray-200 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shadow-sm">
            <Star className="w-5 h-5 fill-[#D97706]" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">今日收集星星</div>
            <div className="text-2xl font-black font-mono text-[#2D3748]">{stars} 顆</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              audioService.playClick();
              setActiveCategory(c.id as any);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition whitespace-nowrap border ${
              activeCategory === c.id
                ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Flashcards Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#4A90E2]" />
            <h3 className="font-bold text-gray-800 text-lg">
              點擊字卡發音與認讀（點一下即加星星 ⭐）
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-500">
            共 {flashcardsData[activeCategory].length} 個核心詞彙
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {flashcardsData[activeCategory].map((item, i) => (
            <div
              key={i}
              onClick={() => handleCardClick(item)}
              className="p-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-white to-[#F8FAFC] hover:border-[#4299E1] hover:bg-[#EBF8FF] cursor-pointer transition-all flex flex-col items-center justify-between gap-2 text-center group active:scale-95 shadow-sm"
            >
              <div className="text-3xl select-none group-hover:scale-110 transition">
                {item.emoji}
              </div>
              <div className="text-2xl font-bold font-serif text-gray-800 tracking-wide">
                {item.char}
              </div>
              <div className="text-xs font-mono text-gray-400">{item.jyutping}</div>
              <div className="text-[11px] text-gray-500 font-bold">{item.meaning}</div>
              <div className="flex items-center gap-1 text-[11px] text-[#2B6CB0] font-bold mt-1">
                <Volume2 className="w-3.5 h-3.5 text-[#4299E1]" /> 粵語朗讀
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10-Minute Mini Quiz Game Card */}
      <div className="bg-[#2D3748] text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-bold">10 分鐘問答小遊戲（第 {quizIndex + 1} 題）</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300 font-medium">
              問答得分：<strong className="text-amber-400 font-mono text-sm">{quizScore}</strong> 題
            </span>
            <button
              type="button"
              onClick={() => speakCantonese(currentQuiz.audioText || currentQuiz.q)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>播放題目語音</span>
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-xl font-bold text-amber-200 mb-1">{currentQuiz.q}</h4>
          <p className="text-xs text-gray-300">請 Jovan 點選正確的選項：</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuiz.options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === currentQuiz.correct;

            let btnClass = 'bg-white/10 hover:bg-white/20 border-white/20 text-white';
            if (selectedOption) {
              if (isSelected && isCorrect) {
                btnClass = 'bg-[#48BB78] border-emerald-400 text-white font-bold ring-2 ring-emerald-300';
              } else if (isSelected && !isCorrect) {
                btnClass = 'bg-[#FF6B6B] border-rose-400 text-white font-bold';
              } else if (isCorrect) {
                btnClass = 'bg-[#48BB78]/80 border-emerald-500 text-white';
              }
            }

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswerQuiz(opt)}
                disabled={!!selectedOption}
                className={`p-4 rounded-2xl border text-left text-base font-bold transition flex items-center justify-between ${btnClass}`}
              >
                <span>{opt}</span>
                {selectedOption && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-300" />}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-gray-300">
              {selectedOption === currentQuiz.correct
                ? '🎉 答啱喇！獎勵 +3 顆星星 ⭐'
                : '加油！正確答案係：' + currentQuiz.correct}
            </span>
            <button
              type="button"
              onClick={nextQuiz}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition shadow"
            >
              <span>下一題</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
