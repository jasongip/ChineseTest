import React, { useState } from 'react';
import { PokemonCardData } from '../data/pokemonCards';
import { Sparkles, Zap, Flame, Droplets, Leaf, Eye, Shield, Volume2, Award, Star } from 'lucide-react';
import { speakCantonese } from '../utils/audio';

interface PokemonCardProps {
  card: PokemonCardData;
  isUnlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isNew?: boolean;
  onClick?: () => void;
  showHoloEffect?: boolean;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  card,
  isUnlocked = true,
  size = 'md',
  isNew = false,
  onClick,
  showHoloEffect = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    const primaryMove = card.moves[0]?.nameZh || '';
    speakCantonese(`${card.nameZh}！${card.type}屬性！招式：${primaryMove}！`);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'SSR':
        return {
          label: 'SSR ★★★ 幻之神獸',
          classes: 'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white shadow-amber-300/50',
          border: 'border-amber-300 ring-2 ring-amber-400/80 shadow-xl shadow-amber-500/20',
          bg: 'bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100',
        };
      case 'UR':
        return {
          label: 'UR ★★ 極稀有',
          classes: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-blue-300/50',
          border: 'border-blue-400 ring-2 ring-indigo-400/50 shadow-lg shadow-blue-500/15',
          bg: 'bg-gradient-to-b from-blue-50 via-slate-50 to-indigo-100',
        };
      case 'SR':
        return {
          label: 'SR ★ 超級精靈',
          classes: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200',
          border: 'border-emerald-400 ring-1 ring-emerald-400/40 shadow-md',
          bg: 'bg-gradient-to-b from-emerald-50 via-teal-50 to-green-100',
        };
      default:
        return {
          label: 'R 精英',
          classes: 'bg-slate-700 text-white',
          border: 'border-slate-300 shadow-sm',
          bg: 'bg-gradient-to-b from-slate-100 to-slate-200',
        };
    }
  };

  const rarityInfo = getRarityBadge(card.rarity);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '電':
        return <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />;
      case '火':
        return <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />;
      case '水':
      case '冰':
        return <Droplets className="w-3.5 h-3.5 text-blue-500 fill-blue-400" />;
      case '草':
        return <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-500 fill-purple-400" />;
    }
  };

  // Locked Card Placeholder (Silhouette)
  if (!isUnlocked) {
    return (
      <div
        id={`pokemon-card-locked-${card.id}`}
        onClick={onClick}
        className={`relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-dashed border-slate-600/60 p-4 flex flex-col items-center justify-between text-center overflow-hidden transition-all duration-300 hover:border-slate-400 hover:scale-[1.02] cursor-pointer select-none ${
          size === 'sm' ? 'w-44 h-64' : size === 'lg' ? 'w-80 h-[480px]' : 'w-56 h-80'
        }`}
      >
        {/* Silhouette question glow */}
        <div className="w-full flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>NO. {String(card.id).padStart(3, '0')}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
            {card.rarity}
          </span>
        </div>

        {/* Silhouette Image */}
        <div className="relative my-auto flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center shadow-inner relative">
            <span className="text-4xl filter grayscale contrast-200 opacity-20">❓</span>
            <img
              src={card.imageUrl}
              alt="Locked Pokemon"
              className="absolute w-24 h-24 object-contain filter brightness-0 invert opacity-20"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-300">？？？</p>
          <span className="text-[11px] text-amber-400/80 font-bold mt-1">連對 5 題解鎖</span>
        </div>

        <div className="w-full pt-2 border-t border-slate-800 text-[10px] text-slate-300">
          屬性: {card.type} • 點擊查看提示
        </div>
      </div>
    );
  }

  // Unlocked Authentic Holo Pokemon Card
  return (
    <div
      id={`pokemon-card-${card.id}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl ${rarityInfo.border} ${rarityInfo.bg} p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden transition-all duration-300 select-none shadow-xl cursor-pointer ${
        isHovered ? 'scale-[1.03] shadow-2xl -translate-y-1' : ''
      } ${size === 'sm' ? 'w-48 h-72' : size === 'lg' ? 'w-80 sm:w-96 min-h-[520px]' : 'w-60 sm:w-64 h-[380px]'}`}
    >
      {/* Holographic Iridescent Sheen Layer */}
      {showHoloEffect && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/25 to-pink-300/20 mix-blend-overlay ${
            card.rarity === 'SSR'
              ? 'opacity-80 animate-pulse'
              : isHovered
              ? 'opacity-60'
              : 'opacity-25'
          }`}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
      )}

      {/* NEW Ribbon if just pulled */}
      {isNew && (
        <div className="absolute -top-1 -right-1 z-20 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-md uppercase tracking-wider animate-bounce flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> NEW!
        </div>
      )}

      {/* CARD TOP BAR: Name, Element & HP */}
      <div className="relative z-10 flex items-center justify-between pb-1.5 border-b border-slate-300/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-bold text-slate-500">#{String(card.id).padStart(3, '0')}</span>
          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight tracking-tight">
            {card.nameZh.split(' ')[0]}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-black text-red-600 font-mono tracking-tighter">
            HP <span className="text-sm sm:text-base">{card.hp}</span>
          </span>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white/80"
            style={{ backgroundColor: card.typeColor }}
            title={`屬性：${card.type}`}
          >
            {getTypeIcon(card.type)}
          </div>
        </div>
      </div>

      {/* CARD ARTWORK FRAME */}
      <div
        className={`relative z-10 my-1 rounded-xl bg-gradient-to-b ${card.bgGradient} p-2 flex items-center justify-center shadow-inner border-2 border-white/80 overflow-hidden ${
          size === 'sm' ? 'h-28' : size === 'lg' ? 'h-52' : 'h-36'
        }`}
      >
        {/* Decorative elemental aura */}
        <div className="absolute inset-0 bg-radial from-white/30 to-transparent opacity-60 pointer-events-none" />
        
        <img
          src={card.imageUrl}
          alt={card.nameZh}
          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-110"
          loading="lazy"
        />

        {/* Pronounce Cry Button */}
        <button
          onClick={handlePlayVoice}
          title="播放粵語精靈叫聲及招式"
          className="absolute bottom-1 right-1 z-20 w-7 h-7 rounded-full bg-white/90 text-slate-700 hover:bg-amber-400 hover:text-white flex items-center justify-center shadow-md transition-all active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>

        {/* English & Japanese Subtitle */}
        <div className="absolute bottom-1 left-1.5 z-20 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs text-[9px] text-white/90 font-medium">
          {card.nameEn} • {card.nameJa}
        </div>
      </div>

      {/* CARD MOVES SECTION */}
      <div className="relative z-10 flex-1 flex flex-col justify-center space-y-1.5 py-1 text-slate-800">
        {card.moves.slice(0, size === 'sm' ? 1 : 2).map((move, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-white/80 backdrop-blur-xs rounded-lg px-2 py-1 border border-slate-200/80 shadow-2xs text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate leading-none text-[11px] sm:text-xs">
                  {move.nameZh}
                </p>
                <p className="text-[9px] text-slate-600 truncate mt-0.5">{move.desc}</p>
              </div>
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 font-mono shrink-0 pl-1">
              {move.damage}
            </span>
          </div>
        ))}
      </div>

      {/* CARD FOOTER: Weakness, Resistance & Rarity Stamp */}
      <div className="relative z-10 pt-1.5 border-t border-slate-300/60 flex items-center justify-between text-[10px] text-slate-700">
        <div className="flex items-center gap-1 font-medium">
          <span>弱點: <strong className="text-red-500">{card.weakness}</strong></span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider shadow-xs ${rarityInfo.classes}`}>
          {card.rarity}
        </div>
      </div>
    </div>
  );
};
