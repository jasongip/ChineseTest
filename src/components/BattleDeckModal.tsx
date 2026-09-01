import React, { useState, useMemo } from 'react';
import { POKEMON_CARDS_DATA, PokemonCardData } from '../data/pokemonCards';
import { getPlayerBattleDeck, savePlayerBattleDeck } from '../utils/battleUtils';
import { speakCantonese } from '../utils/audio';
import {
  Swords,
  Sparkles,
  Check,
  RotateCcw,
  X,
  Shield,
  Heart,
  Zap,
  Info,
  Shuffle,
  Award,
} from 'lucide-react';

interface BattleDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardInventory: Record<number, number>;
  onDeckSaved?: (deckIds: number[]) => void;
}

const SLOT_LABELS = [
  { index: 0, title: '先鋒先發', desc: '首發出陣，搶佔先機', color: 'from-amber-500 to-orange-600', badge: '1號位' },
  { index: 1, title: '主力戰將', desc: '強攻特攻，壓制對手', color: 'from-blue-500 to-indigo-600', badge: '2號位' },
  { index: 2, title: '中堅王將', desc: '穩紮穩打，靈活應變', color: 'from-emerald-500 to-teal-600', badge: '3號位' },
  { index: 3, title: '王牌守門', desc: '絕地反擊，終極奧義', color: 'from-purple-500 to-pink-600', badge: '4號位' },
];

export const BattleDeckModal: React.FC<BattleDeckModalProps> = ({
  isOpen,
  onClose,
  cardInventory,
  onDeckSaved,
}) => {
  // Unlocked player cards
  const unlockedCards = useMemo(() => {
    const ids = Object.keys(cardInventory)
      .map(Number)
      .filter((id) => (cardInventory[id] || 0) > 0);

    let list = POKEMON_CARDS_DATA.filter((c) => ids.includes(c.id));
    if (list.length < 4) {
      const starters = POKEMON_CARDS_DATA.filter((c) => [25, 6, 9, 3].includes(c.id));
      list = Array.from(new Set([...list, ...starters]));
    }
    return list;
  }, [cardInventory]);

  // Current working deck (4 card IDs)
  const [deck, setDeck] = useState<number[]>(() => {
    const { deckCardIds } = getPlayerBattleDeck(cardInventory);
    return deckCardIds;
  });

  // Selected slot to replace (0, 1, 2, or 3)
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Sync initial deck when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const { deckCardIds } = getPlayerBattleDeck(cardInventory);
      setDeck(deckCardIds);
      setSavedNotice(false);
    }
  }, [isOpen, cardInventory]);

  // Available unique types from unlocked cards
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    unlockedCards.forEach((c) => types.add(c.type));
    return Array.from(types);
  }, [unlockedCards]);

  // Filtered pool of cards to pick from
  const selectableCards = useMemo(() => {
    return unlockedCards.filter((card) => {
      if (typeFilter !== 'all' && card.type !== typeFilter) return false;
      if (searchFilter.trim() !== '') {
        const q = searchFilter.toLowerCase();
        const match =
          card.nameZh.toLowerCase().includes(q) ||
          card.nameEn.toLowerCase().includes(q) ||
          card.type.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [unlockedCards, typeFilter, searchFilter]);

  if (!isOpen) return null;

  // Swap / Assign card to active slot
  const handleAssignCard = (card: PokemonCardData) => {
    const newDeck = [...deck];
    // Check if card is already in another slot -> swap positions
    const existingIdx = newDeck.indexOf(card.id);
    if (existingIdx !== -1 && existingIdx !== selectedSlot) {
      // Swap
      const temp = newDeck[selectedSlot];
      newDeck[selectedSlot] = card.id;
      newDeck[existingIdx] = temp;
    } else {
      newDeck[selectedSlot] = card.id;
    }
    setDeck(newDeck);
    speakCantonese(`${card.nameZh}！已配置到 ${SLOT_LABELS[selectedSlot].title}！`);

    // Auto advance to next slot for easy 1-2-3-4 picking
    setSelectedSlot((prev) => (prev + 1) % 4);
  };

  // Randomize deck from owned cards (Direction 1 anti-foolproof fallback / quick tool)
  const handleRandomizeDeck = () => {
    const shuffled = [...unlockedCards].sort(() => Math.random() - 0.5);
    const newDeck = shuffled.slice(0, 4).map((c) => c.id);
    while (newDeck.length < 4) {
      newDeck.push([25, 6, 9, 3][newDeck.length]);
    }
    setDeck(newDeck);
    speakCantonese('已隨機為你配搭最佳 4 隻戰鬥精靈！');
  };

  // Save Deck
  const handleSaveDeck = () => {
    savePlayerBattleDeck(deck);
    setSavedNotice(true);
    speakCantonese('戰鬥卡組已成功儲存並同步至雲端防守陣容！');
    if (onDeckSaved) {
      onDeckSaved(deck);
    }
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // Get full card data for the 4 slots
  const deckCardObjects = deck.map(
    (id) => POKEMON_CARDS_DATA.find((c) => c.id === id) || POKEMON_CARDS_DATA[0]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white relative">
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-purple-700 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-xl shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                  配置我的專屬戰鬥卡組
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  4 隻陣容
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                自訂出戰與防守陣容，線上其他玩家挑戰你時將以此陣容迎戰！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TOP 4 BATTLE SLOTS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Swords className="w-4 h-4" /> 點選下方卡牌，替換出戰陣容（當前選中：
                <span className="text-white underline font-bold">
                  {SLOT_LABELS[selectedSlot].badge} {SLOT_LABELS[selectedSlot].title}
                </span>
                ）
              </span>

              <button
                onClick={handleRandomizeDeck}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" /> 🎲 隨機自動配牌
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SLOT_LABELS.map((slot) => {
                const card = deckCardObjects[slot.index];
                const isSelected = selectedSlot === slot.index;

                return (
                  <button
                    key={slot.index}
                    onClick={() => {
                      setSelectedSlot(slot.index);
                      if (card) {
                        speakCantonese(`${slot.title}：${card.nameZh}！`);
                      }
                    }}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-slate-800 to-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    {/* Slot badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white bg-gradient-to-r ${slot.color}`}
                      >
                        {slot.badge} {slot.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {card.rarity}
                      </span>
                    </div>

                    {/* Card Avatar / Image */}
                    <div className="flex items-center gap-2.5 my-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img
                          src={card.imageUrl}
                          alt={card.nameZh}
                          className="w-full h-full object-contain drop-shadow-md"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white truncate">
                          {card.nameZh}
                        </div>
                        <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500 inline" />{' '}
                          HP {card.hp}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {card.type}屬性
                        </div>
                      </div>
                    </div>

                    {/* Top Move Preview */}
                    <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-300 flex items-center justify-between">
                      <span className="truncate">
                        ⚡ {card.moves[0]?.nameZh || '普通攻擊'}
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        攻{card.moves[0]?.damage || 40}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md animate-bounce">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD POOL SELECTOR */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 我的已解鎖精靈庫（共{' '}
                  {unlockedCards.length} 隻可選）
                </h3>
                <p className="text-[11px] text-slate-400">
                  點擊任意卡牌，即可換入當前選定的【
                  {SLOT_LABELS[selectedSlot].badge}】
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">全部屬性</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}屬性
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="搜尋精靈名稱..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none w-36 sm:w-44"
                />
              </div>
            </div>

            {/* Grid of selectable cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
              {selectableCards.map((card) => {
                const inDeckIdx = deck.indexOf(card.id);
                const isInDeck = inDeckIdx !== -1;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleAssignCard(card)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isInDeck
                        ? 'bg-amber-950/40 border-amber-400/60 ring-1 ring-amber-400/40'
                        : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 hover:border-slate-500 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        #{String(card.id).padStart(3, '0')}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          card.rarity === 'UR'
                            ? 'bg-purple-900 text-purple-200'
                            : card.rarity === 'SSR'
                            ? 'bg-amber-900 text-amber-200'
                            : 'bg-blue-900 text-blue-200'
                        }`}
                      >
                        {card.rarity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-900/80 p-0.5 border border-slate-700/80 flex items-center justify-center shrink-0">
                        <img
                          src={card.imageUrl}
                          alt={card.nameZh}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {card.nameZh}
                        </div>
                        <div className="text-[10px] text-amber-300 font-medium">
                          HP {card.hp} • {card.type}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isInDeck ? (
                      <div className="mt-1 pt-1 border-t border-amber-500/30 flex items-center justify-between text-[10px] text-amber-300 font-bold">
                        <span>已在陣容中</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                          {inDeckIdx + 1}號位
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 pt-1 border-t border-slate-700 text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors flex items-center justify-between">
                        <span>點擊換入</span>
                        <span>➔</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              若未自訂，系統會自動在對戰時從你已擁有的卡庫隨機抽選 4 隻出戰防守。
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
            >
              取消
            </button>

            <button
              onClick={handleSaveDeck}
              disabled={savedNotice}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                savedNotice
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-400/20'
              }`}
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> 已儲存並同步！
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" /> 儲存並啟用戰鬥卡組
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
