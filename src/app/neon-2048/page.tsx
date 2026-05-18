'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import GameHeader from '../../components/game/GameHeader';
import WinModal from '../../components/game/WinModal';
import ClientOnly from '../../components/common/ClientOnly';
import { motion, AnimatePresence } from 'framer-motion';

type Grid = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  2: { bg: 'bg-slate-900 border-cyan-500/20 text-cyan-400', text: 'text-cyan-400', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
  4: { bg: 'bg-slate-900 border-indigo-500/20 text-indigo-400', text: 'text-indigo-400', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.15)]' },
  8: { bg: 'bg-slate-900 border-violet-500/30 text-violet-300', text: 'text-violet-300', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.25)]' },
  16: { bg: 'bg-slate-900 border-purple-500/40 text-purple-400', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.35)]' },
  32: { bg: 'bg-slate-900 border-fuchsia-500/50 text-fuchsia-400', text: 'text-fuchsia-400', glow: 'shadow-[0_0_18px_rgba(217,70,239,0.45)]' },
  64: { bg: 'bg-slate-900 border-pink-500/60 text-pink-400', text: 'text-pink-400', glow: 'shadow-[0_0_22px_rgba(236,72,153,0.55)]' },
  128: { bg: 'bg-slate-900 border-rose-500/70 text-rose-300', text: 'text-rose-300', glow: 'shadow-[0_0_25px_rgba(244,63,94,0.65)]' },
  256: { bg: 'bg-slate-900 border-amber-500/80 text-amber-300', text: 'text-amber-300', glow: 'shadow-[0_0_28px_rgba(245,158,11,0.75)]' },
  512: { bg: 'bg-slate-900 border-yellow-400/90 text-yellow-300', text: 'text-yellow-300', glow: 'shadow-[0_0_32px_rgba(250,204,21,0.85)]' },
  1024: { bg: 'bg-slate-900 border-emerald-400 text-emerald-300', text: 'text-emerald-300', glow: 'shadow-[0_0_35px_rgba(52,211,153,0.9)]' },
  2048: { bg: 'bg-slate-900 border-teal-400 text-teal-200 animate-pulse', text: 'text-teal-200', glow: 'shadow-[0_0_45px_rgba(45,212,191,1)]' },
};

function Neon2048Content() {
  const { stats, updateStats, theme } = useGameStore();
  const { playSound } = useAudio();
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  const bestScore = stats.neon2048.highScore;
  const isNeon = theme === 'neon';
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Initialize game board
  const initBoard = useCallback(() => {
    const freshGrid: Grid = Array(4).fill(null).map(() => Array(4).fill(0));
    
    // Add two random tiles
    const addRandom = (g: Grid) => {
      const emptyCells = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (g[r][c] === 0) emptyCells.push({ r, c });
        }
      }
      if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        g[r][c] = Math.random() < 0.9 ? 2 : 4;
      }
    };

    addRandom(freshGrid);
    addRandom(freshGrid);

    setGrid(freshGrid);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
    setShowWinModal(false);
    setNewBadge(null);
  }, []);

  // Set up board once loaded
  useEffect(() => {
    initBoard();
    updateStats('neon2048', { gamesPlayed: 1 });
  }, [initBoard, updateStats]);

  // Insert a random tile (2 or 4) to grid
  const spawnTile = (g: Grid) => {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      g[r][c] = Math.random() < 0.9 ? 2 : 4;
      playSound('pop');
    }
  };

  // Check if grid is identical (to confirm if move actually shifted things)
  const isIdentical = (g1: Grid, g2: Grid) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g1[r][c] !== g2[r][c]) return false;
      }
    }
    return true;
  };

  // Game over check
  const checkGameOver = (g: Grid) => {
    // 1. Check for empty cells
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return false;
      }
    }
    // 2. Check for matching neighbors
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && g[r][c] === g[r][c + 1]) return false;
        if (r < 3 && g[r][c] === g[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Slide sliding core row/column
  const slideLine = useCallback((line: number[]) => {
    // Filter zeroes out
    let filtered = line.filter(val => val !== 0);
    let mergedScore = 0;
    let playedMergeSound = false;

    // Merge adjacent numbers
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        mergedScore += filtered[i];
        filtered.splice(i + 1, 1);
        playedMergeSound = true;
      }
    }

    // Fill rest with zeroes
    while (filtered.length < 4) {
      filtered.push(0);
    }

    return { newLine: filtered, scoreGain: mergedScore, playedMergeSound };
  }, []);

  // Sliding triggers
  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isGameOver) return;

    let originalGrid = grid.map(row => [...row]);
    let newGrid: Grid = Array(4).fill(null).map(() => Array(4).fill(0));
    let totalScoreGain = 0;
    let anyMerged = false;

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        let row = originalGrid[r];
        if (direction === 'RIGHT') row = [...row].reverse();

        const { newLine, scoreGain, playedMergeSound } = slideLine(row);
        
        let finalRow = newLine;
        if (direction === 'RIGHT') finalRow = [...finalRow].reverse();

        newGrid[r] = finalRow;
        totalScoreGain += scoreGain;
        if (playedMergeSound) anyMerged = true;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [originalGrid[0][c], originalGrid[1][c], originalGrid[2][c], originalGrid[3][c]];
        if (direction === 'DOWN') col = [...col].reverse();

        const { newLine, scoreGain, playedMergeSound } = slideLine(col);

        let finalCol = newLine;
        if (direction === 'DOWN') finalCol = [...finalCol].reverse();

        for (let r = 0; r < 4; r++) {
          newGrid[r][c] = finalCol[r];
        }
        totalScoreGain += scoreGain;
        if (playedMergeSound) anyMerged = true;
      }
    }

    if (!isIdentical(originalGrid, newGrid)) {
      if (anyMerged) {
        playSound('merge');
      } else {
        playSound('click');
      }

      spawnTile(newGrid);
      
      const newScore = score + totalScoreGain;
      setScore(newScore);
      setGrid(newGrid);

      // Check if player generated 2048
      let reached2048 = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (newGrid[r][c] === 2048) reached2048 = true;
        }
      }

      if (reached2048 && !hasWon) {
        setHasWon(true);
        setShowWinModal(true);
        updateStats('neon2048', { highScore: newScore, gamesWon: 1 });
        setNewBadge('neon2048_master');
      }

      if (checkGameOver(newGrid)) {
        setIsGameOver(true);
        setShowWinModal(true);
        updateStats('neon2048', { highScore: newScore });
      }
    }
  }, [grid, isGameOver, score, hasWon, playSound, slideLine, updateStats]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current && e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStart.current.x;
      const diffY = e.changedTouches[0].clientY - touchStart.current.y;
      
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      
      // Minimum swipe distance
      if (Math.max(absX, absY) > 30) {
        if (absX > absY) {
          move(diffX > 0 ? 'RIGHT' : 'LEFT');
        } else {
          move(diffY > 0 ? 'DOWN' : 'UP');
        }
      }
      touchStart.current = null;
    }
  };

  // Safe checks
  if (grid.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg z-10">
        <GameHeader
          title="Neon 2048"
          gameKey="neon2048"
          currentScore={score}
          bestScoreValue={bestScore}
          onReset={initBoard}
        />

        {/* Keyboard controller Hint */}
        <div className="mb-4 text-center text-xs text-indigo-400/80 font-semibold tracking-wider flex items-center justify-center gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-indigo-500/10">
          <span>🎮 조작: 방향키 / WASD / 스와이프로 밀어보세요!</span>
        </div>

        {/* 4x4 Grid Board */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="aspect-square w-full p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col gap-3.5"
        >
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="flex-1 flex gap-3.5">
              {row.map((val, cIdx) => {
                const colors = TILE_COLORS[val] || {
                  bg: 'bg-slate-900/30 border-slate-800/60',
                  text: 'text-slate-700',
                  glow: '',
                };

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`flex-1 aspect-square rounded-2xl border-2 flex items-center justify-center font-black relative overflow-hidden transition-all duration-150 ${colors.bg} ${colors.glow}`}
                  >
                    {val > 0 ? (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-xl sm:text-3xl font-mono ${colors.text}`}
                      >
                        {val}
                      </motion.span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Win/Lose modal */}
      <WinModal
        isOpen={showWinModal}
        type={isGameOver ? 'lose' : 'win'}
        title={isGameOver ? 'GAME OVER' : 'CONGRATULATIONS!'}
        subtitle={isGameOver ? '더 이상 합칠 타일이 없습니다.' : '기념비적인 2048 타일을 획득했습니다!'}
        stats={[
          { label: 'MY SCORE', value: score },
          { label: 'BEST SCORE', value: Math.max(bestScore, score) },
        ]}
        newBadgeUnlocked={newBadge ? '2048 초월자 (네온 2048 타일 완성)' : null}
        onAction={initBoard}
        actionLabel={isGameOver ? '다시 도전' : '무한 모드 시작'}
      />
    </div>
  );
}

export default function Neon2048Page() {
  return (
    <ClientOnly>
      <Neon2048Content />
    </ClientOnly>
  );
}
