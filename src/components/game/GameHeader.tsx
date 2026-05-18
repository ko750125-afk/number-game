'use client';

import Link from 'next/link';
import { Home, Volume2, VolumeX, RotateCcw, HelpCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  title: string;
  gameKey: 'neon2048' | 'speedTouch' | 'cipherStrike' | 'zenSudoku' | 'sumConnect';
  currentScore?: number | string;
  bestScoreLabel?: string;
  bestScoreValue?: number | string | null;
  onReset?: () => void;
  onHelpClick?: () => void;
}

export default function GameHeader({
  title,
  gameKey,
  currentScore,
  bestScoreLabel = 'BEST',
  bestScoreValue,
  onReset,
  onHelpClick,
}: GameHeaderProps) {
  const { theme, soundEnabled, toggleSound } = useGameStore();
  const { playSound } = useAudio();

  const handleToggleSound = () => {
    toggleSound();
    // Delay to let store update so it plays if unmuting
    setTimeout(() => playSound('click'), 50);
  };

  const isNeon = theme === 'neon';

  return (
    <header className={`w-full max-w-4xl mx-auto mb-6 p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${
      isNeon
        ? 'bg-slate-900/60 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
        : 'bg-stone-100/70 border border-stone-200/50 shadow-md'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left: Navigation and Title */}
        <div className="flex items-center gap-4">
          <Link href="/" passHref legacyBehavior>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => playSound('click')}
              className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                isNeon
                  ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-950/80 hover:text-indigo-300'
                  : 'bg-stone-200/50 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
              }`}
              title="로비로 돌아가기"
            >
              <Home size={20} />
            </motion.a>
          </Link>
          
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isNeon
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : 'text-stone-800'
            }`}>
              {title}
            </h1>
            <p className={`text-xs ${isNeon ? 'text-indigo-400/70' : 'text-stone-500'}`}>
              Numiverse Number Challenge
            </p>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="flex items-center gap-3">
          {currentScore !== undefined && (
            <div className={`px-4 py-1.5 rounded-xl flex flex-col items-center ${
              isNeon ? 'bg-indigo-950/30 border border-indigo-500/10' : 'bg-stone-200/35 border border-stone-200/40'
            }`}>
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${isNeon ? 'text-indigo-400/80' : 'text-stone-500'}`}>
                SCORE
              </span>
              <span className={`text-lg font-bold font-mono ${isNeon ? 'text-cyan-400' : 'text-stone-800'}`}>
                {currentScore}
              </span>
            </div>
          )}

          {bestScoreValue !== undefined && (
            <div className={`px-4 py-1.5 rounded-xl flex flex-col items-center ${
              isNeon ? 'bg-purple-950/30 border border-purple-500/10' : 'bg-amber-100/55 border border-amber-200/40'
            }`}>
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${isNeon ? 'text-purple-400/80' : 'text-amber-700'}`}>
                {bestScoreLabel}
              </span>
              <span className={`text-lg font-bold font-mono ${isNeon ? 'text-fuchsia-400' : 'text-amber-800'}`}>
                {bestScoreValue || '-'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Controller Buttons */}
        <div className="flex items-center gap-2">
          {onHelpClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                onHelpClick();
              }}
              className={`p-2.5 rounded-xl transition-colors ${
                isNeon
                  ? 'bg-slate-800/80 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 border border-slate-700'
                  : 'bg-stone-200/50 text-stone-700 hover:bg-stone-200'
              }`}
              title="게임 규칙 설명"
            >
              <HelpCircle size={18} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleSound}
            className={`p-2.5 rounded-xl transition-colors ${
              isNeon
                ? 'bg-slate-800/80 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 border border-slate-700'
                : 'bg-stone-200/50 text-stone-700 hover:bg-stone-200'
            }`}
            title={soundEnabled ? '음소거' : '소리 켜기'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </motion.button>

          {onReset && (
            <motion.button
              whileHover={{ scale: 1.05, rotate: -45 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                onReset();
              }}
              className={`p-2.5 rounded-xl transition-colors ${
                isNeon
                  ? 'bg-rose-950/30 text-rose-400 border border-rose-500/20 hover:bg-rose-950/60'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
              title="재시작"
            >
              <RotateCcw size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
