import React, { useState, useMemo, useEffect } from 'react';
import { PlayerProfile, PlayerStats, LeaderboardUser } from '../types/battle';
import { POKEMON_CARDS_DATA, PokemonCardData } from '../data/pokemonCards';
import { generateRandomName, savePlayerProfile } from '../utils/battleUtils';
import { subscribeToCloudPlayers, syncPlayerToFirestore } from '../lib/firebase';
import {
  Trophy,
  Swords,
  Medal,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Star,
  Users,
  Target,
  Crown,
  Cloud,
  Radio,
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: PlayerProfile;
  playerStats: PlayerStats;
  cardInventory: Record<number, number>;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onStartBattleWithRival: (rival: LeaderboardUser) => void;
  npcRivals: LeaderboardUser[];
}

type TabMode = 'all_time' | 'weekly' | 'battle';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  playerStats,
  cardInventory,
  onUpdateProfile,
  onStartBattleWithRival,
  npcRivals,
}) => {
  const [tab, setTab] = useState<TabMode>('all_time');
  const [cloudPlayers, setCloudPlayers] = useState<LeaderboardUser[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToCloudPlayers(
      (players) => {
        setCloudPlayers(players);
        setIsCloudSynced(true);
      },
      (error) => {
        console.warn('Leaderboard sync error:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Compute player's unique collected cards count
  const playerUniqueCards = useMemo(() => {
    return Object.keys(cardInventory).filter((id) => (cardInventory[Number(id)] || 0) > 0).length;
  }, [cardInventory]);

  // Compute player accuracy
  const playerAccuracy = useMemo(() => {
    if (playerStats.allTimeAnswered === 0) return 100;
    return Math.min(100, Math.round((playerStats.allTimeCorrect / playerStats.allTimeAnswered) * 100));
  }, [playerStats]);

  // Player's 4 battle cards
  const playerDeckIds = useMemo(() => {
    const unlocked = Object.keys(cardInventory)
      .map(Number)
      .filter((id) => (cardInventory[id] || 0) > 0);
    return unlocked.length >= 4 ? unlocked.slice(0, 4) : [25, 6, 9, 3];
  }, [cardInventory]);

  // Player as a LeaderboardUser
  const currentPlayerEntry: LeaderboardUser = useMemo(() => {
    return {
      id: playerProfile.id,
      name: playerProfile.name,
      isCurrentPlayer: true,
      avatarBg: 'from-amber-400 via-yellow-400 to-orange-500',
      badge: '👑 本機學員',
      allTimeAnswered: playerStats.allTimeAnswered,
      allTimeCorrect: playerStats.allTimeCorrect,
      accuracy: playerAccuracy,
      cardsCount: playerUniqueCards,
      weeklyAnswered: playerStats.weeklyAnswered,
      weeklyCorrect: playerStats.weeklyCorrect,
      battleWins: playerStats.battleWins,
      battleScore: playerStats.battleScore,
      deckCardIds: playerDeckIds,
    };
  }, [playerProfile, playerStats, playerAccuracy, playerUniqueCards, playerDeckIds]);

  // Sync current player to Firestore on open or stats change
  useEffect(() => {
    if (isOpen) {
      syncPlayerToFirestore(currentPlayerEntry);
    }
  }, [isOpen, currentPlayerEntry]);

  // Merge and sort users (Current player + other real cloud players + NPC Rivals)
  const sortedUsers = useMemo(() => {
    const map = new Map<string, LeaderboardUser>();

    // 1. Add NPC Rivals
    npcRivals.forEach((npc) => {
      map.set(npc.id, { ...npc, isCurrentPlayer: false });
    });

    // 2. Add real players from Firestore (excluding current player id to avoid stale data)
    cloudPlayers.forEach((cp) => {
      if (cp.id !== playerProfile.id && !cp.id.startsWith('npc_')) {
        map.set(cp.id, {
          ...cp,
          badge: cp.badge || '🌐 線上學員',
          avatarBg: cp.avatarBg || 'from-indigo-500 to-cyan-600',
          isCurrentPlayer: false,
        });
      }
    });

    // 3. Add Current Player (guaranteed fresh state)
    map.set(currentPlayerEntry.id, currentPlayerEntry);

    const all = Array.from(map.values());

    if (tab === 'all_time') {
      return [...all].sort((a, b) => b.allTimeCorrect - a.allTimeCorrect || b.cardsCount - a.cardsCount);
    } else if (tab === 'weekly') {
      return [...all].sort((a, b) => b.weeklyCorrect - a.weeklyCorrect || b.accuracy - a.accuracy);
    } else {
      return [...all].sort((a, b) => b.battleScore - a.battleScore || b.battleWins - a.battleWins);
    }
  }, [currentPlayerEntry, npcRivals, cloudPlayers, playerProfile.id, tab]);

  // Handle Reroll Name (Max 3 times)
  const handleRerollName = () => {
    if (playerProfile.rerollsRemaining <= 0) return;
    const newName = generateRandomName();
    const updated = {
      ...playerProfile,
      name: newName,
      rerollsRemaining: playerProfile.rerollsRemaining - 1,
    };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    // Sync new name to Firestore
    syncPlayerToFirestore({
      ...currentPlayerEntry,
      name: newName,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* TOP BANNER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wide">
                  粵語精靈學堂 • 榮譽排行榜
                </h2>
                {isCloudSynced ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-[10px] font-black text-emerald-300 shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Firestore 實時同步中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-[10px] font-bold text-amber-200">
                    <Radio className="w-2.5 h-2.5 animate-spin" /> 連線雲端中...
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100 font-medium">
                挑戰全體線上學員與神獸館主，打磨廣東話，贏取榮譽卡牌！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* PLAYER IDENTITY BAR */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-xl font-black text-slate-900 shadow-md">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">當前本機學員：</span>
                <span className="text-sm sm:text-base font-black text-amber-300 tracking-wide">
                  {playerProfile.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  鎖定代號
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                答對題數：<strong className="text-emerald-400 font-bold">{playerStats.allTimeCorrect}</strong> 題 ｜
                卡牌收集：<strong className="text-amber-400 font-bold">{playerUniqueCards}</strong> / 100 款 ｜
                對戰段位：<strong className="text-sky-400 font-bold">{playerStats.battleScore}</strong> 分
              </p>
            </div>
          </div>

          {/* REROLL NAME BUTTON */}
          {playerProfile.rerollsRemaining > 0 && (
            <button
              onClick={handleRerollName}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-600 shadow-sm"
              title="重新擲出隨機組合代號"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              🎲 換個代號 (剩 {playerProfile.rerollsRemaining} 次)
            </button>
          )}
        </div>

        {/* TABS HEADER */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 sm:px-4 pt-2 gap-2">
          <button
            onClick={() => setTab('all_time')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              tab === 'all_time'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> 總答題榜 (All-Time)
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              tab === 'weekly'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" /> 7日週榜 (Weekly)
          </button>
          <button
            onClick={() => setTab('battle')}
            className={`px-4 py-2.5 rounded-t-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              tab === 'battle'
                ? 'bg-slate-800 text-sky-300 border-t-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4 text-sky-400" /> 寶可夢天梯對戰榜
          </button>
        </div>

        {/* LEADERBOARD LIST */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
          {sortedUsers.map((user, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;

            return (
              <div
                key={user.id}
                className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                  user.isCurrentPlayer
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-800 to-slate-800 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                {/* RANK + AVATAR + NAME */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {rankMedal}
                  </div>

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${user.avatarBg} flex items-center justify-center text-white font-black shadow-md shrink-0`}>
                    {user.name.slice(0, 1)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-100">
                        {user.name}
                      </span>
                      {user.isCurrentPlayer ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                          YOU
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-600">
                          {user.badge}
                        </span>
                      )}
                    </div>

                    {/* STATS PREVIEW */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                      {tab === 'all_time' && (
                        <>
                          <span>總答對：<strong className="text-emerald-400 font-bold">{user.allTimeCorrect}</strong> 題</span>
                          <span>準確率：<strong className="text-sky-400 font-bold">{user.accuracy}%</strong></span>
                          <span>收集卡牌：<strong className="text-amber-400 font-bold">{user.cardsCount}</strong> 款</span>
                        </>
                      )}

                      {tab === 'weekly' && (
                        <>
                          <span>本週答對：<strong className="text-emerald-400 font-bold">{user.weeklyCorrect}</strong> 題</span>
                          <span>本週刷題：<strong className="text-slate-300 font-bold">{user.weeklyAnswered}</strong> 次</span>
                          <span>準確率：<strong className="text-sky-400 font-bold">{user.accuracy}%</strong></span>
                        </>
                      )}

                      {tab === 'battle' && (
                        <>
                          <span>天梯積分：<strong className="text-amber-400 font-bold">{user.battleScore}</strong> 分</span>
                          <span>勝場：<strong className="text-emerald-400 font-bold">{user.battleWins}</strong> 勝</span>
                          <span>陣容：<strong className="text-sky-300 font-bold">4 隻神獸出戰</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTION: CHALLENGE BUTTON */}
                <div className="flex items-center gap-2">
                  {!user.isCurrentPlayer ? (
                    <button
                      onClick={() => {
                        onClose();
                        onStartBattleWithRival(user);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Swords className="w-4 h-4" /> 挑戰對戰
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400 font-bold px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
                      當前排名 第 {rank} 名
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM TIPS */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          💡 <strong className="text-amber-300">對戰秘訣：</strong>每贏一場對戰，勝方可自由從對手隊伍複製一張神獸卡牌！輸方卡牌絕不損失！
        </div>
      </div>
    </div>
  );
};
