'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import GameHeader from '../../components/game/GameHeader';
import WinModal from '../../components/game/WinModal';
import ClientOnly from '../../components/common/ClientOnly';
import { motion } from 'framer-motion';

function SpeedTouchContent() {
  const { stats, updateStats, theme } = useGameStore();
  const { playSound } = useAudio();
  const [board, setBoard] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [shakeGrid, setShakeGrid] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  const bestTime = stats.speedTouch.bestTime;
  const isNeon = theme === 'neon';
  
  // Timer references
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Grid values (1-25) and backup queue (26-50)
  const backupQueue = useRef<number[]>([]);

  // Generate array with shuffled numbers
  const getShuffledArray = (start: number, end: number) => {
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize board and stats
  const initGame = useCallback(() => {
    const initial25 = getShuffledArray(1, 25);
    const queue26to50 = getShuffledArray(26, 50);

    setBoard(initial25);
    backupQueue.current = queue26to50;
    setNextNumber(1);
    setIsPlaying(false);
    setIsGameOver(false);
    setTime(0);
    setShakeGrid(false);
    setShowWinModal(false);

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    initGame();
    updateStats('speedTouch', { gamesPlayed: 1 });
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [initGame, updateStats]);

  // Update timer loops with high accuracy
  const updateTimer = useCallback(() => {
    if (!isPlaying) return;
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    setTime(elapsed);
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [isPlaying]);

  // Handle start and click operations
  const handleCellClick = (num: number, idx: number) => {
    if (isGameOver) return;

    // Start timer on first correct click
    if (num === 1 && !isPlaying) {
      setIsPlaying(true);
      startTimeRef.current = performance.now();
      timerRef.current = requestAnimationFrame(updateTimer);
    }

    if (num === nextNumber) {
      playSound('click');
      const nextTarget = nextNumber + 1;

      // Update cell in grid
      const newBoard = [...board];
      if (backupQueue.current.length > 0) {
        // Drop next number from 26 to 50
        const nextBackupVal = backupQueue.current.shift()!;
        newBoard[idx] = nextBackupVal;
      } else {
        // No numbers left, empty slot
        newBoard[idx] = 0;
      }
      setBoard(newBoard);
      setNextNumber(nextTarget);

      // Win check
      if (nextNumber === 50) {
        setIsPlaying(false);
        setIsGameOver(true);
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        
        const finalTime = (performance.now() - startTimeRef.current) / 1000;
        setTime(finalTime);
        setShowWinModal(true);

        // Update statistics
        updateStats('speedTouch', { bestTime: finalTime, gamesWon: 1 });
      }
    } else {
      // Incorrect click - penalty
      playSound('error');
      setShakeGrid(true);
      setTimeout(() => setShakeGrid(false), 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-pink-500/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-rose-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg z-10">
        <GameHeader
          title="Speed Touch 1to50"
          gameKey="speedTouch"
          currentScore={`${time.toFixed(2)}s`}
          bestScoreLabel="BEST TIME"
          bestScoreValue={bestTime ? `${bestTime.toFixed(2)}s` : '-'}
          onReset={initGame}
        />

        {/* Target and Info bar */}
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center flex flex-col justify-center">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-0.5">
              CURRENT TARGET
            </span>
            <span className="text-3xl font-black font-mono text-pink-400">
              {nextNumber <= 50 ? nextNumber : 'FINISH!'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
              STATUS
            </span>
            <span className="text-sm font-bold text-slate-300">
              {!isPlaying && nextNumber === 1 ? '1을 터치하여 시작' : '도전 진행 중!'}
            </span>
          </div>
        </div>

        {/* 5x5 Play Board */}
        <motion.div
          animate={shakeGrid ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.3 }}
          className={`grid grid-cols-5 gap-2.5 p-4 rounded-3xl bg-slate-950 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
            shakeGrid ? 'border-rose-500/40 shadow-rose-500/5' : 'border-slate-800'
          }`}
        >
          {board.map((num, idx) => {
            const isClickable = num > 0;
            const isTarget = num === nextNumber;

            return (
              <motion.button
                key={idx}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                onClick={() => handleCellClick(num, idx)}
                className={`aspect-square rounded-2xl font-black font-mono text-lg sm:text-xl border flex items-center justify-center transition-all duration-150 ${
                  num === 0
                    ? 'bg-transparent border-transparent text-transparent cursor-default'
                    : isTarget
                      ? 'bg-slate-900 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-indigo-500/40'
                }`}
                disabled={num === 0}
              >
                {num > 0 ? num : ''}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={showWinModal}
        type="win"
        title="CLEAR!"
        subtitle="1부터 50까지 놀라운 집중력으로 모두 클리어하셨습니다!"
        stats={[
          { label: 'RECORD TIME', value: `${time.toFixed(2)}s` },
          { label: 'PERSONAL BEST', value: bestTime ? `${bestTime.toFixed(2)}s` : `${time.toFixed(2)}s` },
        ]}
        newBadgeUnlocked={time < 20 ? '광속 드라이버 (20초 이내 스피드 터치 클리어)' : null}
        onAction={initGame}
        actionLabel="기록 갱신 도전"
      />
    </div>
  );
}

export default function SpeedTouchPage() {
  return (
    <ClientOnly>
      <SpeedTouchContent />
    </ClientOnly>
  );
}
