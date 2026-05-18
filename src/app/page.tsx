'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Award, Volume2, VolumeX, Edit2, Check, Zap, Target, Hash, CheckSquare, Layers, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { useAudio } from '../hooks/useAudio';
import ClientOnly from '../components/common/ClientOnly';

interface GameConfig {
  id: 'neon2048' | 'speedTouch' | 'cipherStrike' | 'zenSudoku' | 'sumConnect';
  title: string;
  description: string;
  path: string;
  colorClass: string;
  shadowClass: string;
  icon: React.ComponentType<{ className?: string }>;
  statLabel: string;
  getStatValue: (stats: ReturnType<typeof useGameStore.getState>['stats'][GameConfig['id']]) => string | number;
}

const games: GameConfig[] = [
  {
    id: 'neon2048',
    title: 'Neon 2048',
    description: '타일을 슬라이드하여 병합하고, 네온 파티클과 함께 숫자 2048을 완성하세요.',
    path: '/neon-2048',
    colorClass: 'from-cyan-500 to-blue-600',
    shadowClass: 'shadow-cyan-500/20 hover:shadow-cyan-500/40 border-cyan-500/30',
    icon: Zap,
    statLabel: 'BEST SCORE',
    getStatValue: (s) => s.highScore || '-',
  },
  {
    id: 'speedTouch',
    title: 'Speed Touch 1to50',
    description: '1부터 50까지 숫자를 순서대로 빛보다 빠른 속도로 터치하여 기록을 겨룹니다.',
    path: '/speed-touch',
    colorClass: 'from-pink-500 to-rose-600',
    shadowClass: 'shadow-rose-500/20 hover:shadow-rose-500/40 border-rose-500/30',
    icon: Target,
    statLabel: 'BEST TIME',
    getStatValue: (s) => s.bestTime ? `${s.bestTime.toFixed(2)}s` : '-',
  },
  {
    id: 'cipherStrike',
    title: 'Cipher Strike',
    description: '보안 코드를 해킹하듯 strike와 ball 단서를 단독 추론하여 맞추는 숫자 야구.',
    path: '/cipher-strike',
    colorClass: 'from-emerald-500 to-teal-600',
    shadowClass: 'shadow-emerald-500/20 hover:shadow-emerald-500/40 border-emerald-500/30',
    icon: Hash,
    statLabel: 'BEST TRY',
    getStatValue: (s) => s.leastAttempts ? `${s.leastAttempts}회` : '-',
  },
  {
    id: 'zenSudoku',
    title: 'Zen Sudoku',
    description: '두뇌 회전과 명상을 동시에. 차분하고 우아한 분위기의 9x9 브레인 스도쿠.',
    path: '/zen-sudoku',
    colorClass: 'from-amber-400 to-orange-500',
    shadowClass: 'shadow-orange-500/20 hover:shadow-orange-500/40 border-orange-500/30',
    icon: CheckSquare,
    statLabel: 'PLAYED',
    getStatValue: (s) => s.gamesPlayed || '-',
  },
  {
    id: 'sumConnect',
    title: '10 만들기 (Sum 10)',
    description: '드래그로 숫자를 연결해 정확히 10을 완성하고 시원하게 콤보 블록을 터트리세요.',
    path: '/sum-connect',
    colorClass: 'from-purple-500 to-indigo-600',
    shadowClass: 'shadow-indigo-500/20 hover:shadow-indigo-500/40 border-indigo-500/30',
    icon: Layers,
    statLabel: 'HIGH SCORE',
    getStatValue: (s) => s.highScore || '-',
  },
];

const badgeMetadata: Record<string, { title: string; desc: string }> = {
  // 2048
  neon2048_first_play: { title: '슬라이드 비기너', desc: 'Neon 2048 첫 플레이 달성' },
  neon2048_first_win: { title: '글로우 메이커', desc: 'Neon 2048 첫 클리어 달성' },
  neon2048_master: { title: '2048 초월자', desc: '네온 2048 타일 완성!' },
  // Speed
  speedTouch_first_play: { title: '눈 깜짝할 새', desc: 'Speed Touch 첫 플레이 달성' },
  speedDemon: { title: '광속 드라이버', desc: '20초 이내에 50 누르기 성공' },
  // Cipher
  cipherStrike_first_play: { title: '화이트 해커', desc: 'Cipher Strike 첫 해킹 시도' },
  mind_reader: { title: '독심술 마스터', desc: '4회 이내에 정확한 암호 분석 성공' },
};

function LobbyContent() {
  const { theme, soundEnabled, toggleSound, userProfile, updateNickname, stats } = useGameStore();
  const { playSound } = useAudio();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfile.nickname);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateNickname(tempName.trim());
      setIsEditingName(false);
      playSound('success');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
  };

  const totalGamesPlayed = Object.values(stats).reduce((acc, game) => acc + game.gamesPlayed, 0);
  const totalGamesWon = Object.values(stats).reduce((acc, game) => acc + game.gamesWon, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden relative pb-16 selection:bg-indigo-500/30">
      {/* Aurora Particle Glow Overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none animate-pulse" />

      <main className="w-full max-w-6xl mx-auto px-4 pt-12 relative z-10">
        
        {/* Navigation / Header controls */}
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                NUMIVERSE
              </h1>
              <p className="text-xs text-indigo-400/80 font-bold uppercase tracking-widest mt-0.5">
                Premium Number Arcade
              </p>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              toggleSound();
              setTimeout(() => playSound('click'), 50);
            }}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-md"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        </div>

        {/* Dashboard Profile Card & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* User Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
                PLAYER PROFILE
              </span>
              <div className="flex items-center gap-3 mt-2 mb-6">
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      maxLength={15}
                      className="bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 w-full"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 bg-indigo-500 rounded-xl hover:bg-indigo-400 text-white shrink-0"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-white">
                      {userProfile.nickname}
                    </h2>
                    <button
                      onClick={() => {
                        playSound('click');
                        setIsEditingName(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Achievement overview */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block mb-3">
                통합 분석 (Arcade Analytics)
              </span>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">PLAYED</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">{totalGamesPlayed}</span>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">VICTORIES</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{totalGamesWon}</span>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">BADGES</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {userProfile.unlockedBadges.length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Badges Display Shelf */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col"
          >
            <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-3 block">
              업적 보관함 (Achievement Shelf)
            </span>
            <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
              {userProfile.unlockedBadges.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-1.5 py-4">
                  <Award size={32} className="opacity-40" />
                  <span className="text-xs">잠금 해제된 뱃지가 없습니다.</span>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {userProfile.unlockedBadges.map((badgeId) => {
                    const meta = badgeMetadata[badgeId] || { title: badgeId, desc: '달성 완료 업적' };
                    return (
                      <motion.div
                        key={badgeId}
                        whileHover={{ scale: 1.1 }}
                        className="aspect-square bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 cursor-help"
                        title={`${meta.title}: ${meta.desc}`}
                      >
                        <Award size={22} className="drop-shadow-[0_0_5px_rgba(245,158,11,0.3)] animate-pulse" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Title divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-6 flex items-center gap-3"
        >
          <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase">
            ARCADE GAMES
          </span>
          <div className="h-[1px] bg-slate-800/80 flex-1" />
        </motion.div>

        {/* 5 Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => {
            const Icon = game.icon;
            const gameStat = stats[game.id];
            const displayStat = game.getStatValue(gameStat);

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group cursor-pointer"
              >
                <Link href={game.path} passHref legacyBehavior>
                  <a
                    onClick={() => playSound('click')}
                    className={`block h-full p-6 rounded-3xl bg-slate-900/40 border backdrop-blur-sm transition-all duration-300 relative overflow-hidden ${game.shadowClass}`}
                  >
                    {/* Glowing card border/corner effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-white/5 to-transparent blur-md transform translate-x-12 -translate-y-12 rotate-45 pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3.5 rounded-2xl bg-gradient-to-tr ${game.colorClass} shadow-md`}>
                        <Icon className="text-white w-6 h-6" />
                      </div>
                      
                      {/* Play action hint */}
                      <span className="p-2.5 rounded-xl bg-slate-950/80 text-indigo-400 border border-slate-800 opacity-60 group-hover:opacity-100 group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-all duration-300">
                        <Play size={14} fill="currentColor" />
                      </span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors mb-2">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 h-12 overflow-hidden line-clamp-3">
                      {game.description}
                    </p>

                    {/* Stats bar */}
                    <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {game.statLabel}
                      </span>
                      <span className="text-sm font-extrabold font-mono text-white group-hover:text-indigo-400 transition-colors">
                        {displayStat}
                      </span>
                    </div>
                  </a>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="animate-spin text-indigo-400 w-10 h-10 mx-auto mb-3" />
          <p className="text-xs tracking-widest text-slate-400 uppercase">NUMIVERSE LOADING...</p>
        </div>
      </div>
    }>
      <LobbyContent />
    </ClientOnly>
  );
}
