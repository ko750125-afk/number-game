'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, AlertCircle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';

interface WinModalProps {
  isOpen: boolean;
  type: 'win' | 'lose';
  title: string;
  subtitle?: string;
  stats?: Array<{ label: string; value: string | number }>;
  newBadgeUnlocked?: string | null;
  onAction: () => void;
  actionLabel?: string;
}

export default function WinModal({
  isOpen,
  type,
  title,
  subtitle,
  stats = [],
  newBadgeUnlocked,
  onAction,
  actionLabel = '다시 플레이',
}: WinModalProps) {
  const theme = useGameStore((state) => state.theme);
  const { playSound } = useAudio();
  const isNeon = theme === 'neon';

  useEffect(() => {
    if (isOpen) {
      if (type === 'win') {
        playSound('success');
        // Confetti burst
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
      } else {
        playSound('error');
      }
    }
  }, [isOpen, type, playSound]);

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 350 } },
    exit: { scale: 0.9, opacity: 0 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full max-w-md p-6 rounded-3xl overflow-hidden shadow-2xl transition-all border ${
              isNeon
                ? type === 'win'
                  ? 'bg-slate-900 border-emerald-500/30 shadow-emerald-500/10'
                  : 'bg-slate-900 border-rose-500/30 shadow-rose-500/10'
                : 'bg-white border-stone-200'
            }`}
          >
            {/* Glossy radial gradient overlay for Neon */}
            {isNeon && (
              <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                type === 'win' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
            )}

            <div className="flex flex-col items-center text-center relative z-10">
              {/* Icon Header */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: type === 'win' ? 360 : 0 }}
                transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
                className={`p-4 rounded-full mb-4 ${
                  type === 'win'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {type === 'win' ? <Trophy size={40} /> : <AlertCircle size={40} />}
              </motion.div>

              {/* Title */}
              <h2 className={`text-2xl font-extrabold tracking-tight mb-1 ${
                isNeon
                  ? type === 'win' ? 'text-emerald-400' : 'text-rose-400'
                  : 'text-stone-800'
              }`}>
                {title}
              </h2>
              
              {subtitle && (
                <p className={`text-sm mb-6 ${isNeon ? 'text-slate-400' : 'text-stone-500'}`}>
                  {subtitle}
                </p>
              )}

              {/* Stats Card */}
              {stats.length > 0 && (
                <div className={`w-full grid grid-cols-2 gap-3 p-4 rounded-2xl mb-6 ${
                  isNeon ? 'bg-slate-950/50 border border-slate-800' : 'bg-stone-50 border border-stone-150'
                }`}>
                  {stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className={`text-[10px] uppercase font-bold tracking-widest ${isNeon ? 'text-slate-500' : 'text-stone-400'}`}>
                        {stat.label}
                      </span>
                      <span className={`text-xl font-extrabold font-mono mt-0.5 ${isNeon ? 'text-white' : 'text-stone-800'}`}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Badge Unlock Alert */}
              {newBadgeUnlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-6 border ${
                    isNeon
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <Award className="shrink-0 animate-bounce text-amber-500" size={24} />
                  <div className="text-left text-xs">
                    <p className="font-bold">업적 잠금 해제!</p>
                    <p className="opacity-90">{newBadgeUnlocked}</p>
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playSound('click');
                  onAction();
                }}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-md ${
                  type === 'win'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/10'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-rose-500/10'
                }`}
              >
                <RefreshCw size={18} />
                {actionLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
