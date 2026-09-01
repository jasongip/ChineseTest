import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayerProfile, PlayerStats, LeaderboardUser, BattleQuestion } from '../types/battle';
import { POKEMON_CARDS_DATA, PokemonCardData } from '../data/pokemonCards';
import {
  generateRandomBattleQuestion,
  getAttackMultiplier,
  updatePlayerStats,
  resolveOpponentDeck,
} from '../utils/battleUtils';
import { speakCantonese, audioService } from '../utils/audio';
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Volume2,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface PokemonBattleArenaProps {
  isOpen: boolean;
  onClose: () => void;
  rival: LeaderboardUser | null;
  playerProfile: PlayerProfile;
  cardInventory: Record<number, number>;
  onRewardCardUnlocked: (cardId: number) => void;
  onStatsUpdated: () => void;
}

interface BattleFighter {
  card: PokemonCardData;
  currentHp: number;
  maxHp: number;
}

interface MoveOption {
  name: string;
  requiredQuestions: number; // 1, 2, or 3 questions
  baseDamage: number;
  desc: string;
}

type BattlePhase =
  | 'deck_select'     // 挑選 4 張卡並排序
  | 'turn_player_move' // 玩家選擇招式
  | 'turn_player_quiz' // 玩家答題集氣
  | 'player_attacking' // 玩家攻擊動畫與扣血
  | 'turn_enemy_ai'    // 對手 AI 思考與攻擊
  | 'enemy_attacking'  // 對手攻擊動畫
  | 'battle_win'       // 勝利，挑選複製卡牌
  | 'battle_lose';     // 失敗

export const PokemonBattleArena: React.FC<PokemonBattleArenaProps> = ({
  isOpen,
  onClose,
  rival,
  playerProfile,
  cardInventory,
  onRewardCardUnlocked,
  onStatsUpdated,
}) => {
  // Available unlocked player cards
  const availablePlayerCards = useMemo(() => {
    const ids = Object.keys(cardInventory)
      .map(Number)
      .filter((id) => (cardInventory[id] || 0) > 0);
    
    // If player has very few cards, give some starter cards so they can always battle
    let list = POKEMON_CARDS_DATA.filter((c) => ids.includes(c.id));
    if (list.length < 4) {
      const starters = POKEMON_CARDS_DATA.filter((c) => [25, 6, 9, 3].includes(c.id));
      list = Array.from(new Set([...list, ...starters]));
    }
    return list;
  }, [cardInventory]);

  // Selected 4 cards for player deck
  const [selectedDeckIds, setSelectedDeckIds] = useState<number[]>([]);

  // Battle State
  const [phase, setPhase] = useState<BattlePhase>('deck_select');
  const [playerTeam, setPlayerTeam] = useState<BattleFighter[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<BattleFighter[]>([]);
  const [playerActiveIdx, setPlayerActiveIdx] = useState<number>(0);
  const [enemyActiveIdx, setEnemyActiveIdx] = useState<number>(0);

  // Active Move & Quiz Series State
  const [chosenMove, setChosenMove] = useState<MoveOption | null>(null);
  const [quizSeries, setQuizSeries] = useState<BattleQuestion[]>([]);
  const [currentQuizStep, setCurrentQuizStep] = useState<number>(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState<boolean>(false);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);

  // Battle Animation & Log States
  const [battleLog, setBattleLog] = useState<string>('對戰即將開始！');
  const [multiplierText, setMultiplierText] = useState<string>('');
  const [isPlayerHit, setIsPlayerHit] = useState<boolean>(false);
  const [isEnemyHit, setIsEnemyHit] = useState<boolean>(false);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [attackEffect, setAttackEffect] = useState<{
    type: string;
    target: 'enemy' | 'player';
  } | null>(null);
  const [chosenCopyCardId, setChosenCopyCardId] = useState<number | null>(null);

  // Initialize player deck selection on open
  useEffect(() => {
    if (isOpen) {
      const defaultIds = availablePlayerCards.slice(0, 4).map((c) => c.id);
      setSelectedDeckIds(defaultIds);
      setPhase('deck_select');
      setChosenCopyCardId(null);
    }
  }, [isOpen, availablePlayerCards]);

  // Current Active Fighters
  const activePlayerFighter = playerTeam[playerActiveIdx];
  const activeEnemyFighter = enemyTeam[enemyActiveIdx];

  // Rival's 4 Cards (Strictly guaranteed 4 cards with matching attributes or R/SR random fillers)
  const enemyCards = useMemo(() => {
    if (!rival) return resolveOpponentDeck();
    return resolveOpponentDeck(rival.deckCardIds);
  }, [rival]);

  // Handle deck selection toggle
  const toggleDeckCard = (cardId: number) => {
    if (selectedDeckIds.includes(cardId)) {
      setSelectedDeckIds(selectedDeckIds.filter((id) => id !== cardId));
    } else {
      if (selectedDeckIds.length < 4) {
        setSelectedDeckIds([...selectedDeckIds, cardId]);
      }
    }
  };

  // Start the battle with confirmed deck
  const handleStartBattle = () => {
    if (selectedDeckIds.length !== 4) return;

    const pFighters: BattleFighter[] = selectedDeckIds.map((id) => {
      const card = POKEMON_CARDS_DATA.find((c) => c.id === id)!;
      return { card, currentHp: card.hp, maxHp: card.hp };
    });

    const eFighters: BattleFighter[] = enemyCards.map((card) => {
      return { card, currentHp: card.hp, maxHp: card.hp };
    });

    setPlayerTeam(pFighters);
    setEnemyTeam(eFighters);
    setPlayerActiveIdx(0);
    setEnemyActiveIdx(0);
    setPhase('turn_player_move');
    setBattleLog(`雙方首發精靈登場！由 ${playerProfile.name} 先攻！`);
    speakCantonese(`對戰開始！由你先發動攻擊！`);
  };

  // Move Options based on active player's card - strict card-damage fidelity & hierarchy
  const availableMoves: MoveOption[] = useMemo(() => {
    if (!activePlayerFighter) return [];
    const card = activePlayerFighter.card;
    const rawMoves = card.moves || [];
    
    // Sort moves by damage so:
    // Move 1 = Fast attack (lower damage move on card)
    // Move 2 = Strong special attack (higher damage move on card)
    const validMoves = rawMoves.map((m) => {
      const dmg = typeof m.damage === 'number' ? m.damage : parseInt(m.damage as string) || 40;
      return { nameZh: m.nameZh, numDamage: dmg };
    });

    if (validMoves.length === 0) {
      validMoves.push({ nameZh: '衝擊', numDamage: 35 });
    }

    // Sort ascending by numerical damage
    validMoves.sort((a, b) => a.numDamage - b.numDamage);

    const m1 = validMoves[0];
    const m2 =
      validMoves.length > 1
        ? validMoves[1]
        : { nameZh: `${card.nameZh}特攻`, numDamage: Math.round(m1.numDamage * 1.5) };

    const dmg1 = m1.numDamage;
    const dmg2 = m2.numDamage;
    // Ultimate Move is a bonus devastating 3-question finisher
    const dmg3 = Math.max(dmg2 + 35, Math.round(card.hp * 0.95));

    return [
      {
        name: `【快速招式】${m1.nameZh}`,
        requiredQuestions: 1,
        baseDamage: dmg1,
        desc: `卡面傷害 ${dmg1} 點 • 答對 1 題即生效，穩定迅速！`,
      },
      {
        name: `【強力特攻】${m2.nameZh}`,
        requiredQuestions: 2,
        baseDamage: dmg2,
        desc: `卡面傷害 ${dmg2} 點 • 連續答對 2 題，爆發強大威力！`,
      },
      {
        name: `【奧義絕招】終極爆發`,
        requiredQuestions: 3,
        baseDamage: dmg3,
        desc: `毀滅傷害 ${dmg3} 點 • 挑戰 3 連題！全中打出終極奧義！`,
      },
    ];
  }, [activePlayerFighter]);

  // Player chooses a move -> prepare quiz questions
  const handleSelectMove = (move: MoveOption) => {
    setChosenMove(move);
    const questions: BattleQuestion[] = [];
    for (let i = 0; i < move.requiredQuestions; i++) {
      questions.push(generateRandomBattleQuestion());
    }
    setQuizSeries(questions);
    setCurrentQuizStep(0);
    setQuizCorrectCount(0);
    setSelectedChoice(null);
    setIsQuestionAnswered(false);
    setScrambleAnswer([]);
    setPhase('turn_player_quiz');

    // Speak audio for audio questions
    if (questions[0].type === 'audio_mc' && questions[0].targetWord) {
      setTimeout(() => speakCantonese(questions[0].targetWord!), 300);
    }
  };

  // Submit Answer in Quiz
  const handleAnswerQuestion = (answer: string) => {
    if (isQuestionAnswered) return;
    setSelectedChoice(answer);
    setIsQuestionAnswered(true);

    const currentQ = quizSeries[currentQuizStep];
    const isCorrect = answer.trim() === currentQ.correctAnswer.trim();

    if (isCorrect) {
      audioService.playSuccess();
      setQuizCorrectCount((prev) => prev + 1);
    } else {
      audioService.playError();
    }

    // Update global practice stats for leaderboard tracking
    updatePlayerStats((prev) => ({
      ...prev,
      allTimeAnswered: prev.allTimeAnswered + 1,
      allTimeCorrect: prev.allTimeCorrect + (isCorrect ? 1 : 0),
      weeklyAnswered: prev.weeklyAnswered + 1,
      weeklyCorrect: prev.weeklyCorrect + (isCorrect ? 1 : 0),
    }));

    // Auto advance to next question or execute attack
    setTimeout(() => {
      if (currentQuizStep + 1 < quizSeries.length) {
        const nextStep = currentQuizStep + 1;
        setCurrentQuizStep(nextStep);
        setSelectedChoice(null);
        setIsQuestionAnswered(false);
        setScrambleAnswer([]);
        if (quizSeries[nextStep].type === 'audio_mc' && quizSeries[nextStep].targetWord) {
          speakCantonese(quizSeries[nextStep].targetWord!);
        }
      } else {
        // All quiz questions completed -> Execute Player Attack!
        executePlayerAttack(quizCorrectCount + (isCorrect ? 1 : 0));
      }
    }, 1200);
  };

  // Execute Player Attack
  const executePlayerAttack = (totalCorrect: number) => {
    setPhase('player_attacking');
    if (!activePlayerFighter || !activeEnemyFighter || !chosenMove) return;

    // Calculate Ratio & Damage
    const ratio = totalCorrect / chosenMove.requiredQuestions;
    const scaledBase = Math.round(chosenMove.baseDamage * ratio);

    // Type effectiveness calculation
    const typeEff = getAttackMultiplier(activePlayerFighter.card.type, activeEnemyFighter.card.type);
    const finalDamage = Math.max(10, Math.round(scaledBase * typeEff.multiplier));

    setMultiplierText(typeEff.text);

    let logMsg = '';
    if (totalCorrect === chosenMove.requiredQuestions) {
      logMsg = `🔥 全對完美釋放【${chosenMove.name}】！造成 ${finalDamage} 點傷害！`;
    } else if (totalCorrect > 0) {
      logMsg = `⚡ 答對 ${totalCorrect}/${chosenMove.requiredQuestions} 題，釋放部分威力！造成 ${finalDamage} 點傷害！`;
    } else {
      logMsg = `💦 招式未完全凝聚，造成基礎微弱擦傷 ${finalDamage} 點！`;
    }
    setBattleLog(logMsg);

    // Trigger Elemental VFX & Haptic / Screen Shake
    const pType = activePlayerFighter.card.type || '普通';
    setAttackEffect({ type: pType, target: 'enemy' });
    setIsEnemyHit(true);
    setIsScreenShaking(true);
    
    // Haptic vibration if supported (Mobile/iPad)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }

    setTimeout(() => {
      setIsEnemyHit(false);
      setIsScreenShaking(false);
      setAttackEffect(null);
    }, 750);

    // Apply Damage
    setTimeout(() => {
      const newEnemyHp = Math.max(0, activeEnemyFighter.currentHp - finalDamage);
      const updatedEnemyTeam = [...enemyTeam];
      updatedEnemyTeam[enemyActiveIdx].currentHp = newEnemyHp;
      setEnemyTeam(updatedEnemyTeam);

      if (newEnemyHp <= 0) {
        // Enemy card knocked out!
        speakCantonese(`太勁喇！對手隻 ${activeEnemyFighter.card.nameZh} 頂唔住倒低咗！`);
        if (enemyActiveIdx + 1 < enemyTeam.length) {
          // Next enemy card comes in
          const nextIdx = enemyActiveIdx + 1;
          setEnemyActiveIdx(nextIdx);
          setBattleLog(`對手派出第 ${nextIdx + 1} 隻精靈：【${enemyTeam[nextIdx].card.nameZh}】！`);
          setTimeout(() => {
            setPhase('turn_player_move');
          }, 1500);
        } else {
          // Player Wins Entire Battle!
          handleBattleVictory();
        }
      } else {
        // Enemy is still alive -> Enemy Turn!
        setTimeout(() => {
          executeEnemyTurn(updatedEnemyTeam);
        }, 1200);
      }
    }, 800);
  };

  // Enemy Turn (AI Simulation)
  const executeEnemyTurn = (currentETeam: BattleFighter[]) => {
    setPhase('turn_enemy_ai');
    const eFighter = currentETeam[enemyActiveIdx];
    const pFighter = playerTeam[playerActiveIdx];
    if (!eFighter || !pFighter) return;

    setBattleLog(`🤖 ${rival?.name || '對手'} 正在組織反擊...`);

    setTimeout(() => {
      setPhase('enemy_attacking');
      // AI Accuracy 50% ~ 70%
      const aiHits = Math.random() < 0.65;
      const move = eFighter.card.moves[0] || { nameZh: '猛擊', damage: 35 };
      const dmgVal = typeof move.damage === 'number' ? move.damage : parseInt(move.damage) || 35;

      const typeEff = getAttackMultiplier(eFighter.card.type, pFighter.card.type);
      let enemyDmg = 0;

      if (aiHits) {
        enemyDmg = Math.max(15, Math.round(dmgVal * typeEff.multiplier));
        setBattleLog(`💥 對手 ${eFighter.card.nameZh} 使用了【${move.nameZh}】，命中造成 ${enemyDmg} 傷害！`);
        
        // Trigger Enemy attack VFX & Screen Shake
        const eType = eFighter.card.type || '普通';
        setAttackEffect({ type: eType, target: 'player' });
        setIsPlayerHit(true);
        setIsScreenShaking(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(120);
        }
        setTimeout(() => {
          setIsPlayerHit(false);
          setIsScreenShaking(false);
          setAttackEffect(null);
        }, 750);
      } else {
        enemyDmg = Math.round(dmgVal * 0.3);
        setBattleLog(`🛡️ 對手招式出現破綻，被你化解！僅受到 ${enemyDmg} 點微弱擦傷！`);
      }

      setTimeout(() => {
        const newPlayerHp = Math.max(0, pFighter.currentHp - enemyDmg);
        const updatedPlayerTeam = [...playerTeam];
        updatedPlayerTeam[playerActiveIdx].currentHp = newPlayerHp;
        setPlayerTeam(updatedPlayerTeam);

        if (newPlayerHp <= 0) {
          // Player card knocked out - Natural Cantonese prompt
          speakCantonese(`哎呀！你隻 ${pFighter.card.nameZh} 頂唔住暈咗喇！快啲派出下一隻啦！`);
          if (playerActiveIdx + 1 < playerTeam.length) {
            const nextPIdx = playerActiveIdx + 1;
            setPlayerActiveIdx(nextPIdx);
            setBattleLog(`你派出了第 ${nextPIdx + 1} 隻精靈：【${playerTeam[nextPIdx].card.nameZh}】！`);
            setTimeout(() => {
              setPhase('turn_player_move');
            }, 1500);
          } else {
            // Player Loses
            handleBattleDefeat();
          }
        } else {
          // Back to Player Turn
          setTimeout(() => {
            setPhase('turn_player_move');
            setBattleLog(`輪到你發起進攻！請選擇招式！`);
          }, 1000);
        }
      }, 800);
    }, 1500);
  };

  // Victory Handler
  const handleBattleVictory = () => {
    setPhase('battle_win');
    audioService.playFanfare();
    speakCantonese(`恭喜你贏咗呢場對戰！快啲揀一張對手嘅卡牌複製入你嘅卡冊啦！`);

    // Update Player Battle Stats
    updatePlayerStats((prev) => ({
      ...prev,
      battleWins: prev.battleWins + 1,
      battleScore: prev.battleScore + 25,
    }));
    onStatsUpdated();
  };

  // Defeat Handler
  const handleBattleDefeat = () => {
    setPhase('battle_lose');
    audioService.playError();
    speakCantonese(`好可惜今次打輸咗！不過唔緊要，你唔會唔見任何卡牌㗎，加油再接再厲啦！`);

    updatePlayerStats((prev) => ({
      ...prev,
      battleLosses: prev.battleLosses + 1,
      battleScore: Math.max(800, prev.battleScore - 10),
    }));
    onStatsUpdated();
  };

  // Confirm Card Duplication Reward
  const handleClaimCardCopy = (cardId: number) => {
    setChosenCopyCardId(cardId);
    onRewardCardUnlocked(cardId);
    audioService.playCelebration();
    const card = POKEMON_CARDS_DATA.find((c) => c.id === cardId);
    speakCantonese(`成功複製 ${card?.nameZh || '神獸'} 卡牌！已加入你嘅集卡冊！`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* HEADER BAR */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-black text-sm sm:text-base text-white tracking-wide">
              粵語精靈學堂 • 寶可夢對戰擂台
            </span>
            {rival && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                VS {rival.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* STAGE 1: DECK SELECT PHASE */}
        {phase === 'deck_select' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                ⚔️ 編排你的 4 隻出戰陣容
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                從你的集卡冊中挑選 <strong>4 張最強精靈</strong> 按順序出場。點擊卡牌選定或取消。
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300">
                  <span>已選卡牌：{selectedDeckIds.length} / 4 張</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-xs font-bold text-emerald-300">
                  <span>🔰 新手學員首發陣容已就緒（4隻精靈）</span>
                </span>
              </div>
            </div>

            {/* CARD SELECT GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {availablePlayerCards.map((card) => {
                const isSelected = selectedDeckIds.includes(card.id);
                const order = selectedDeckIds.indexOf(card.id) + 1;

                return (
                  <div
                    key={card.id}
                    onClick={() => toggleDeckCard(card.id)}
                    className={`relative p-3 rounded-2xl cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                        #{order}
                      </div>
                    )}
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-950/50 mb-2 flex items-center justify-center p-2">
                      <img
                        src={card.imageUrl}
                        alt={card.nameZh}
                        className="w-full h-full object-contain drop-shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-slate-100">{card.nameZh}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-black text-slate-950"
                        style={{ backgroundColor: card.typeColor }}
                      >
                        {card.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-bold">
                      <span>HP {card.hp}</span>
                      <span className="text-amber-400">{card.rarity}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONFIRM BUTTON */}
            <div className="text-center sticky bottom-0 bg-slate-900/90 py-3 border-t border-slate-800">
              <button
                disabled={selectedDeckIds.length !== 4}
                onClick={handleStartBattle}
                className={`px-8 py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all ${
                  selectedDeckIds.length === 4
                    ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white hover:scale-105 active:scale-95 shadow-red-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {selectedDeckIds.length === 4 ? '🚀 正式開始對戰！' : `請先選滿 4 張卡牌 (仲差 ${4 - selectedDeckIds.length} 張)`}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: ACTIVE BATTLE ARENA */}
        {phase !== 'deck_select' && phase !== 'battle_win' && phase !== 'battle_lose' && (
          <div className={`flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto relative ${isScreenShaking ? 'animate-screen-shake' : ''}`}>
            
            {/* ELEMENTAL ATTACK VFX OVERLAY */}
            {attackEffect && (
              <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
                {attackEffect.type === '火' && (
                  <div className="animate-fire-blast w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 opacity-90 blur-sm flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl">🔥</span>
                  </div>
                )}
                {attackEffect.type === '電' && (
                  <div className="animate-thunder-slash w-full h-full flex items-center justify-center">
                    <div className="w-4 sm:w-6 h-full bg-gradient-to-b from-yellow-100 via-amber-400 to-yellow-300 shadow-[0_0_50px_#facc15] rotate-12 flex items-center justify-center">
                      <span className="text-6xl sm:text-8xl animate-spin">⚡</span>
                    </div>
                  </div>
                )}
                {attackEffect.type === '水' && (
                  <div className="animate-water-tsunami w-full h-48 sm:h-64 bg-gradient-to-t from-blue-700 via-cyan-500 to-sky-300 opacity-80 blur-xs rounded-3xl flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl">🌊</span>
                  </div>
                )}
                {attackEffect.type === '草' && (
                  <div className="animate-leaf-storm w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-emerald-400 bg-emerald-600/30 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl">🍃</span>
                  </div>
                )}
                {(attackEffect.type === '超能' || attackEffect.type === '龍' || attackEffect.type === '幽靈') && (
                  <div className="animate-psychic-blast w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-600/40 border-8 border-fuchsia-400 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl">🔮</span>
                  </div>
                )}
                {(attackEffect.type === '普通' || attackEffect.type === '格鬥' || attackEffect.type === '鋼' || attackEffect.type === '岩石' || attackEffect.type === '地面') && (
                  <div className="animate-fire-blast w-56 h-56 rounded-full bg-amber-500/40 border-4 border-orange-300 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl">💥</span>
                  </div>
                )}
              </div>
            )}

            {/* TOP ARENA: FIGHTERS STATUS BARS & REMAINING CARDS INDICATORS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 mb-3">
              {/* ENEMY FIGHTER */}
              <div className={`p-3 rounded-xl bg-slate-900/90 border border-slate-700 relative transition-all duration-300 ${isEnemyHit ? 'scale-90 brightness-150 ring-4 ring-red-500 animate-bounce' : ''}`}>
                
                {/* ENEMY REMAINING CARDS MINIATURES */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-400 mr-1">對手剩餘卡牌:</span>
                    {enemyTeam.map((fighter, idx) => {
                      const isFainted = fighter.currentHp <= 0;
                      const isCurrent = idx === enemyActiveIdx && !isFainted;
                      return (
                        <div
                          key={idx}
                          title={`${fighter.card.nameZh} (${isFainted ? '已倒下' : '待命中'})`}
                          className={`w-6 h-8 sm:w-7 sm:h-9 rounded-md border flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'border-red-400 bg-red-950 shadow-sm shadow-red-500/50 scale-105 ring-2 ring-red-500/50'
                              : isFainted
                              ? 'border-slate-800 bg-slate-950/80 opacity-30 grayscale'
                              : 'border-slate-700 bg-gradient-to-b from-indigo-900 to-slate-900'
                          }`}
                        >
                          {isFainted ? (
                            <span className="text-xs text-red-500 font-black">✖</span>
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-amber-400 bg-red-600 flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300">
                    剩 {enemyTeam.filter((f) => f.currentHp > 0).length} 隻
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-black text-xs sm:text-sm text-slate-200">
                      {activeEnemyFighter?.card.nameZh}
                    </span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-black text-slate-950"
                      style={{ backgroundColor: activeEnemyFighter?.card.typeColor }}
                    >
                      {activeEnemyFighter?.card.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    第 {enemyActiveIdx + 1}/4 隻
                  </span>
                </div>

                {/* HP BAR */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                    style={{
                      width: `${Math.round((activeEnemyFighter?.currentHp / activeEnemyFighter?.maxHp) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                  <span>HP: {activeEnemyFighter?.currentHp} / {activeEnemyFighter?.maxHp}</span>
                  <span>弱點：{activeEnemyFighter?.card.weakness}</span>
                </div>

                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mt-2 flex items-center justify-center">
                  <img
                    src={activeEnemyFighter?.card.imageUrl}
                    alt={activeEnemyFighter?.card.nameZh}
                    className="max-h-full object-contain drop-shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* PLAYER FIGHTER */}
              <div className={`p-3 rounded-xl bg-slate-900/90 border border-slate-700 relative transition-all duration-300 ${isPlayerHit ? 'scale-90 brightness-150 ring-4 ring-amber-500 animate-bounce' : ''}`}>
                
                {/* PLAYER REMAINING CARDS MINIATURES */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-400 mr-1">我方剩餘卡牌:</span>
                    {playerTeam.map((fighter, idx) => {
                      const isFainted = fighter.currentHp <= 0;
                      const isCurrent = idx === playerActiveIdx && !isFainted;
                      return (
                        <div
                          key={idx}
                          title={`${fighter.card.nameZh} (${isFainted ? '已倒下' : '待命中'})`}
                          className={`w-6 h-8 sm:w-7 sm:h-9 rounded-md border flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'border-emerald-400 bg-emerald-950 shadow-sm shadow-emerald-500/50 scale-105 ring-2 ring-emerald-500/50'
                              : isFainted
                              ? 'border-slate-800 bg-slate-950/80 opacity-30 grayscale'
                              : 'border-slate-700 bg-gradient-to-b from-blue-900 to-slate-900'
                          }`}
                        >
                          {isFainted ? (
                            <span className="text-xs text-red-500 font-black">✖</span>
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-amber-300 bg-blue-600 flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    剩 {playerTeam.filter((f) => f.currentHp > 0).length} 隻
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-black text-xs sm:text-sm text-amber-300">
                      {activePlayerFighter?.card.nameZh}
                    </span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-black text-slate-950"
                      style={{ backgroundColor: activePlayerFighter?.card.typeColor }}
                    >
                      {activePlayerFighter?.card.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    第 {playerActiveIdx + 1}/4 隻
                  </span>
                </div>

                {/* HP BAR */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                    style={{
                      width: `${Math.round((activePlayerFighter?.currentHp / activePlayerFighter?.maxHp) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                  <span>HP: {activePlayerFighter?.currentHp} / {activePlayerFighter?.maxHp}</span>
                  <span>弱點：{activePlayerFighter?.card.weakness}</span>
                </div>

                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mt-2 flex items-center justify-center">
                  <img
                    src={activePlayerFighter?.card.imageUrl}
                    alt={activePlayerFighter?.card.nameZh}
                    className="max-h-full object-contain drop-shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* BATTLE LOG NOTIFICATION */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-xs sm:text-sm font-black text-amber-200 mb-3 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{battleLog}</span>
              {multiplierText && <span className="text-amber-400 font-bold ml-1">{multiplierText}</span>}
            </div>

            {/* INTERACTIVE CONTROLS AREA */}
            <div className="flex-1 flex flex-col justify-center">
              {/* SUB-STATE A: MOVE SELECTION */}
              {phase === 'turn_player_move' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 text-center mb-1">
                    🎯 選擇發動的招式（威力越高，需回答的題目越多）：
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {availableMoves.map((move, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMove(move)}
                        className="p-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 hover:border-amber-400 text-left transition-all group active:scale-95 shadow-md"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs sm:text-sm text-slate-100 group-hover:text-amber-300">
                            {move.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">
                            攻 {move.baseDamage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{move.desc}</p>
                        <div className="mt-2 text-[10px] text-emerald-400 font-bold">
                          ⚡ 需答對：{move.requiredQuestions} 題
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-STATE B: QUIZ CHALLENGE FOR MOVE CHARGE */}
              {phase === 'turn_player_quiz' && quizSeries[currentQuizStep] && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-w-xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-black">
                      招式集氣中：第 {currentQuizStep + 1} / {quizSeries.length} 題
                    </span>
                    <span className="text-slate-400 font-bold">
                      已命中：{quizCorrectCount} 題
                    </span>
                  </div>

                  {/* QUESTION PROMPT */}
                  <div className="text-center mb-4">
                    <p className="font-extrabold text-sm sm:text-base text-slate-100 mb-1">
                      {quizSeries[currentQuizStep].prompt}
                    </p>
                    {quizSeries[currentQuizStep].subPrompt && (
                      <div className="text-xs text-amber-300 font-semibold whitespace-pre-line bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 my-2 text-left leading-relaxed">
                        {quizSeries[currentQuizStep].subPrompt}
                      </div>
                    )}

                    {/* AUDIO BUTTONS (FOR SHORT STORY COMPREHENSION, READ ALOUD, AUDIO MC, SCRAMBLE, ETC.) */}
                    {quizSeries[currentQuizStep].type === 'comprehension' ? (
                      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                        {quizSeries[currentQuizStep].targetWord && (
                          <button
                            type="button"
                            onClick={() => speakCantonese(quizSeries[currentQuizStep].targetWord!)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" /> 朗讀短文 📖 🔊
                          </button>
                        )}
                        {quizSeries[currentQuizStep].questionText && (
                          <button
                            type="button"
                            onClick={() => speakCantonese(quizSeries[currentQuizStep].questionText!)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" /> 朗讀問題 ❓ 🔊
                          </button>
                        )}
                      </div>
                    ) : (quizSeries[currentQuizStep].targetWord ||
                        quizSeries[currentQuizStep].type === 'audio_mc' ||
                        quizSeries[currentQuizStep].type === 'read_aloud' ||
                        quizSeries[currentQuizStep].type === 'scramble') ? (
                      <button
                        type="button"
                        onClick={() =>
                          speakCantonese(
                            quizSeries[currentQuizStep].targetWord ||
                            quizSeries[currentQuizStep].correctAnswer
                          )
                        }
                        className="mt-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        {quizSeries[currentQuizStep].type === 'scramble'
                          ? '朗讀完整句子 🔊'
                          : '點擊播放廣東話發音 🔊'}
                      </button>
                    ) : null}
                  </div>

                  {/* SCRAMBLE QUESTION TYPE */}
                  {quizSeries[currentQuizStep].type === 'scramble' && quizSeries[currentQuizStep].scrambleWords && (
                    <div className="space-y-3">
                      {/* ASSEMBLED ANSWER */}
                      <div className="min-h-[44px] p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-wrap items-center justify-center gap-2">
                        {scrambleAnswer.length === 0 ? (
                          <span className="text-xs text-slate-500">點擊下方詞語依序排好句子</span>
                        ) : (
                          scrambleAnswer.map((word, idx) => (
                            <span
                              key={idx}
                              onClick={() => {
                                if (isQuestionAnswered) return;
                                setScrambleAnswer(scrambleAnswer.filter((_, i) => i !== idx));
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
                            >
                              {word} ✕
                            </span>
                          ))
                        )}
                      </div>

                      {/* WORD CHIPS POOL */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {quizSeries[currentQuizStep].scrambleWords?.map((word, idx) => {
                          const isUsed = scrambleAnswer.includes(word);
                          return (
                            <button
                              key={idx}
                              disabled={isUsed || isQuestionAnswered}
                              onClick={() => setScrambleAnswer([...scrambleAnswer, word])}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                isUsed
                                  ? 'bg-slate-800 text-slate-600 border border-slate-800 cursor-not-allowed'
                                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-center pt-2">
                        <button
                          disabled={scrambleAnswer.length === 0 || isQuestionAnswered}
                          onClick={() => handleAnswerQuestion(scrambleAnswer.join(''))}
                          className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md"
                        >
                          確認送出句子
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MULTIPLE CHOICE OPTIONS */}
                  {quizSeries[currentQuizStep].options && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {quizSeries[currentQuizStep].options?.map((opt, idx) => {
                        const isCorrectAnswer = opt.trim() === quizSeries[currentQuizStep].correctAnswer.trim();
                        const isThisSelected = selectedChoice === opt;

                        let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
                        if (isQuestionAnswered) {
                          if (isCorrectAnswer) {
                            btnStyle = 'bg-emerald-600 text-white border-emerald-400 font-black scale-105';
                          } else if (isThisSelected) {
                            btnStyle = 'bg-rose-600 text-white border-rose-400 font-black';
                          } else {
                            btnStyle = 'bg-slate-900 text-slate-600 border-slate-800 opacity-50';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={isQuestionAnswered}
                            onClick={() => handleAnswerQuestion(opt)}
                            className={`p-3 rounded-xl border text-xs sm:text-sm font-extrabold transition-all text-center flex items-center justify-center min-h-[48px] ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-STATE C: ATTACKING ANIMATION */}
              {(phase === 'player_attacking' || phase === 'enemy_attacking' || phase === 'turn_enemy_ai') && (
                <div className="text-center py-6">
                  <div className="inline-block p-4 rounded-full bg-slate-950/80 border border-slate-800 animate-pulse">
                    <Swords className="w-10 h-10 text-amber-400" />
                  </div>
                  <p className="text-sm font-black text-slate-300 mt-2">
                    {phase === 'player_attacking' ? '⚡ 正在發動強烈攻擊！' : '🤖 對手正在出招...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: VICTORY SCREEN (CARD COPY REWARD) */}
        {phase === 'battle_win' && (
          <div className="p-4 sm:p-6 text-center overflow-y-auto flex-1 custom-scrollbar">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-3xl font-black mx-auto mb-3 shadow-lg shadow-amber-400/30">
              🏆
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
              戰鬥大獲全勝！
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-5">
              你成功擊敗了 <strong>{rival?.name || '對手'}</strong>！天梯積分 +25 分！
              <br />
              <strong className="text-amber-400">🎁 戰利品特權：</strong>請從對手的卡組中任選 1 張複製到你的集卡冊！
            </p>

            {/* OPPONENT CARDS TO DUPLICATE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
              {enemyCards.map((card) => {
                const isClaimed = chosenCopyCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className={`p-3 rounded-2xl border-2 transition-all text-center relative ${
                      isClaimed
                        ? 'bg-amber-950/50 border-amber-400 shadow-lg shadow-amber-400/30 scale-105'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-950/50 mb-2 flex items-center justify-center p-2">
                      <img
                        src={card.imageUrl}
                        alt={card.nameZh}
                        className="max-h-full object-contain drop-shadow"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="font-black text-xs sm:text-sm text-slate-100">{card.nameZh}</p>
                    <p className="text-[10px] font-bold text-amber-400">{card.rarity} • HP {card.hp}</p>

                    <button
                      disabled={chosenCopyCardId !== null}
                      onClick={() => handleClaimCardCopy(card.id)}
                      className={`mt-2.5 w-full py-1.5 rounded-xl font-black text-xs transition-all ${
                        isClaimed
                          ? 'bg-emerald-600 text-white cursor-default'
                          : chosenCopyCardId !== null
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                      }`}
                    >
                      {isClaimed ? '✓ 成功複製！' : '🎁 複製此卡'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700"
              >
                返回學堂
              </button>
              <button
                onClick={() => {
                  setPhase('deck_select');
                  setChosenCopyCardId(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-md"
              >
                再戰一局 ⚔️
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: DEFEAT SCREEN */}
        {phase === 'battle_lose' && (
          <div className="p-6 text-center flex-1 flex flex-col justify-center items-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-2xl font-black mb-3">
              🛡️
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-200 mb-1">
              本次對戰惜敗！
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
              別灰心！輸方絕不會丟失任何卡牌。多進行詞語朗讀與練習，加強精靈威力再來挑戰！
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700"
              >
                返回學堂
              </button>
              <button
                onClick={() => {
                  setPhase('deck_select');
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-md"
              >
                再試一次 🔄
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
