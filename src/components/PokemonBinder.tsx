import React, { useState } from 'react';
import { POKEMON_CARDS_DATA, PokemonCardData, CardRarity } from '../data/pokemonCards';
import { PokemonCard } from './PokemonCard';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Sparkles,
  Trophy,
  Flame,
  Star,
  Gift,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Volume2,
  X,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';

interface PokemonBinderProps {
  unlockedCardIds: number[];
  currentStreak: number;
  availablePacks: number;
  onOpenPack: () => void;
  onResetCollection?: () => void;
}

export const PokemonBinder: React.FC<PokemonBinderProps> = ({
  unlockedCardIds,
  currentStreak,
  availablePacks,
  onOpenPack,
  onResetCollection,
}) => {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCardForInspect, setSelectedCardForInspect] = useState<PokemonCardData | null>(null);

  // Card stats
  const totalCards = POKEMON_CARDS_DATA.length;
  const unlockedCount = unlockedCardIds.length;
  const progressPercent = Math.round((unlockedCount / totalCards) * 100);

  const ssrUnlocked = POKEMON_CARDS_DATA.filter((c) => c.rarity === 'SSR' && unlockedCardIds.includes(c.id)).length;
  const ssrTotal = POKEMON_CARDS_DATA.filter((c) => c.rarity === 'SSR').length;

  const urUnlocked = POKEMON_CARDS_DATA.filter((c) => c.rarity === 'UR' && unlockedCardIds.includes(c.id)).length;
  const urTotal = POKEMON_CARDS_DATA.filter((c) => c.rarity === 'UR').length;

  // Filtered Cards
  const filteredCards = POKEMON_CARDS_DATA.filter((card) => {
    const isUnlocked = unlockedCardIds.includes(card.id);

    // Status filter
    if (filterStatus === 'unlocked' && !isUnlocked) return false;
    if (filterStatus === 'locked' && isUnlocked) return false;

    // Rarity filter
    if (filterRarity !== 'all' && card.rarity !== filterRarity) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName =
        card.nameZh.toLowerCase().includes(q) ||
        card.nameEn.toLowerCase().includes(q) ||
        card.type.includes(q) ||
        card.moves.some((m) => m.nameZh.includes(q));
      if (!matchName) return false;
    }

    return true;
  });

  const handleCardClick = (card: PokemonCardData) => {
    const isUnlocked = unlockedCardIds.includes(card.id);
    setSelectedCardForInspect(card);
    if (isUnlocked) {
      speakCantonese(`${card.nameZh}！${card.type}屬性！`);
    } else {
      speakCantonese(`這張是未解鎖的神秘卡片，提示：${card.type}屬性！連對五題就可以抽到！`);
    }
  };

  return (
    <div id="jovan-pokemon-binder" className="mt-12 pt-8 border-t-2 border-slate-200">
      {/* SECTION HEADER */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-400/30">
                <Trophy className="w-3.5 h-3.5 fill-slate-950" /> 仔仔專屬成就獎勵
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-bold text-xs border border-slate-700">
                正版寶可夢立繪卡牌
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400">
              🎒 Jovan 的寶可夢大師集卡冊
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              特訓每連續答對 <strong>5 題</strong>，即可解鎖 1 次神秘卡包抽卡機會！越答得多，收集越多神獸與閃卡！
            </p>
          </div>

          {/* OPEN PACK CTA / STREAK METER */}
          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            {availablePacks > 0 ? (
              <button
                onClick={() => {
                  audioService.playClick();
                  onOpenPack();
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 animate-bounce"
              >
                <Gift className="w-5 h-5 fill-slate-950" />
                <span>立即拆開卡包！(剩餘 {availablePacks} 個)</span>
                <Sparkles className="w-4 h-4 fill-slate-950" />
              </button>
            ) : (
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700 flex flex-col items-center sm:items-end">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1.5">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span>抽卡進度：連對 {currentStreak % 5} / 5 題</span>
                </div>
                {/* 5-step pip bar */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((step) => {
                    const active = (currentStreak % 5) >= step || currentStreak > 0 && currentStreak % 5 === 0;
                    return (
                      <div
                        key={step}
                        className={`w-7 h-2.5 rounded-full transition-all ${
                          active
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-xs shadow-amber-400/50'
                            : 'bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  再答對 {5 - (currentStreak % 5)} 題即可獲得下一張寶可夢卡！
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PROGRESS STATS ROW */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-medium block">總收集進度</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-300">
                {unlockedCount} / {totalCards}
              </span>
              <span className="text-xs font-bold text-slate-400">({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-amber-300 font-medium block">SSR 幻之神獸</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400">
                {ssrUnlocked} / {ssrTotal}
              </span>
              <span className="text-xs text-slate-400 font-medium">張</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">如超夢、比卡超、烈空坐</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-blue-300 font-medium block">UR 極稀有</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-blue-400">
                {urUnlocked} / {urTotal}
              </span>
              <span className="text-xs text-slate-400 font-medium">張</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">如伊貝、路卡利歐、甲賀忍蛙</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">激勵小提示</span>
            <p className="text-xs text-emerald-300 font-bold leading-tight">
              每次答啱即累積連擊，保持專注！
            </p>
            {onResetCollection && (
              <button
                onClick={onResetCollection}
                className="text-[10px] text-slate-400 hover:text-red-400 text-left underline mt-1"
              >
                重設卡冊進度
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Rarity & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 ({totalCards})
          </button>
          <button
            onClick={() => setFilterStatus('unlocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterStatus === 'unlocked'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> 已收集 ({unlockedCount})
          </button>
          <button
            onClick={() => setFilterStatus('locked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterStatus === 'locked'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> 未解鎖 ({totalCards - unlockedCount})
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* Rarity selector */}
          {(['all', 'SSR', 'UR', 'SR', 'R'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterRarity === r
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? '全部稀有度' : r}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋精靈、屬性或招式..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CARDS DISPLAY GRID */}
      {filteredCards.length === 0 ? (
        <div className="my-12 text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-600">未有符合篩選條件的卡牌</p>
          <button
            onClick={() => {
              setFilterRarity('all');
              setFilterStatus('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs text-amber-600 hover:underline font-medium"
          >
            重設篩選條件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {filteredCards.map((card) => {
            const isUnlocked = unlockedCardIds.includes(card.id);
            return (
              <div key={card.id} className="flex justify-center">
                <PokemonCard
                  card={card}
                  isUnlocked={isUnlocked}
                  size="md"
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* CARD DETAIL INSPECT MODAL */}
      {selectedCardForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-slate-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setSelectedCardForInspect(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* JUMBO CARD */}
            <PokemonCard
              card={selectedCardForInspect}
              isUnlocked={unlockedCardIds.includes(selectedCardForInspect.id)}
              size="lg"
            />

            {/* FLAVOR & EXTRA DETAILS */}
            <div className="mt-5 w-full bg-slate-800/80 rounded-2xl p-4 border border-slate-700 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">
                  📖 寶可夢圖鑑檔案 #{String(selectedCardForInspect.id).padStart(3, '0')}
                </span>
                <button
                  onClick={() =>
                    speakCantonese(
                      `${selectedCardForInspect.nameZh}。${selectedCardForInspect.quote}`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 粵語朗讀說明
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedCardForInspect.quote}
              </p>
            </div>

            <button
              onClick={() => setSelectedCardForInspect(null)}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
            >
              返回卡冊
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
