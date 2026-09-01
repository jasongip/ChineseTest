import React, { useState, useEffect } from 'react';
import { PokemonCardData } from '../data/pokemonCards';
import { PokemonCard } from './PokemonCard';
import { audioService, speakCantonese } from '../utils/audio';
import { Sparkles, Gift, Flame, Trophy, ArrowRight, RotateCw, Volume2, X, Star } from 'lucide-react';

interface PokemonGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawnCard: PokemonCardData | null;
  isNewCard: boolean;
  cardCount?: number;
  streakCount: number;
  onViewBinder?: () => void;
}

export const PokemonGachaModal: React.FC<PokemonGachaModalProps> = ({
  isOpen,
  onClose,
  drawnCard,
  isNewCard,
  cardCount = 1,
  streakCount,
  onViewBinder,
}) => {
  const [packState, setPackState] = useState<'sealed' | 'opening' | 'revealed'>('sealed');

  useEffect(() => {
    if (isOpen) {
      setPackState('sealed');
      audioService.playCelebration();
    }
  }, [isOpen]);

  if (!isOpen || !drawnCard) return null;

  const handleOpenPack = () => {
    setPackState('opening');
    audioService.playCardOpen();

    setTimeout(() => {
      setPackState('revealed');
      audioService.playFanfare();
      // Announce drawn pokemon in Cantonese
      setTimeout(() => {
        if (isNewCard) {
          speakCantonese(`太犀利啦！你首次抽到全新神獸 ${drawnCard.nameZh}！`);
        } else {
          speakCantonese(`你再次抽到 ${drawnCard.nameZh}！目前一共擁有 ${cardCount} 張！`);
        }
      }, 400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-md shadow-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-200" /> 連續答對 {streakCount} 題獎勵！
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-1">
          {packState === 'revealed' ? '✨ 恭喜抽到寶可夢卡牌！' : '🎁 寶可夢卡包已解鎖！'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6">
          {packState === 'revealed'
            ? isNewCard
              ? '🎉 哇！這是全新解鎖的稀有卡牌，已收錄進你的集卡冊！'
              : `🌟 再次抽到同一款卡牌！目前一共持有 x${cardCount} 張！`
            : '你的表現超棒！快點擊撕開神秘卡包，看看抽到哪隻精靈！'}
        </p>

        {/* CENTER STAGE */}
        <div className="min-h-[320px] flex items-center justify-center relative py-4">
          {packState === 'sealed' && (
            <div
              onClick={handleOpenPack}
              className="cursor-pointer group relative flex flex-col items-center transform transition-transform hover:scale-105 active:scale-95"
            >
              {/* Pulsing Pack Halo */}
              <div className="absolute inset-0 bg-amber-400/30 rounded-2xl blur-xl animate-pulse" />

              {/* Booster Pack Visual */}
              <div className="relative w-52 h-72 rounded-2xl bg-gradient-to-b from-amber-500 via-red-600 to-purple-800 p-1 border-2 border-amber-300 shadow-2xl flex flex-col justify-between overflow-hidden">
                {/* Pack top seal crimp */}
                <div className="w-full h-4 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 flex justify-between items-center px-2">
                  <span className="text-[8px] font-mono font-bold text-amber-950 tracking-widest">★ POKÉMON ★</span>
                  <span className="text-[8px] font-mono font-bold text-amber-950">SSR PACK</span>
                </div>

                {/* Pack Center Artwork */}
                <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xs border-2 border-white/60 flex items-center justify-center mb-2 shadow-inner group-hover:rotate-12 transition-transform">
                    <img
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                      alt="Pack Icon"
                      className="w-16 h-16 object-contain filter drop-shadow-md"
                    />
                  </div>
                  <h4 className="text-base font-black text-amber-100 uppercase tracking-wider leading-tight">
                    寶可夢大師卡包
                  </h4>
                  <p className="text-[10px] text-amber-200/90 font-medium mt-0.5">
                    180+ 詞語特訓限定版
                  </p>
                </div>

                {/* Pack Bottom Seal */}
                <div className="w-full py-2 bg-gradient-to-r from-amber-400 to-red-500 text-center">
                  <span className="text-xs font-black text-white tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 點擊撕開卡包 <Sparkles className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="mt-4 text-xs font-bold text-amber-300 animate-bounce flex items-center gap-1">
                👉 點擊開啟卡包 👈
              </div>
            </div>
          )}

          {packState === 'opening' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>
              <p className="text-lg font-black text-amber-300 animate-pulse">
                ⚡ 正在撕開卡包...
              </p>
            </div>
          )}

          {packState === 'revealed' && (
            <div className="flex flex-col items-center animate-scale-up">
              <PokemonCard card={drawnCard} isNew={isNewCard} size="md" />
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        {packState === 'revealed' ? (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onViewBinder) onViewBinder();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all border border-slate-600 flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-400" /> 前往卡冊查看全部
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>收下卡片，繼續答題！</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 text-xs text-slate-400">
            答得越快越準確，就有機會抽到 SSR 幻之神獸卡牌！
          </div>
        )}
      </div>
    </div>
  );
};
