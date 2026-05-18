'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import GameHeader from '../../components/game/GameHeader';
import WinModal from '../../components/game/WinModal';
import ClientOnly from '../../components/common/ClientOnly';
import { motion } from 'framer-motion';
import { Sparkles, Timer, Flame } from 'lucide-react';

interface CellCoords {
  r: number;
  c: number;
}

function SumConnectContent() {
  const { stats, updateStats, theme } = useGameStore();
  const { playSound } = useAudio();
  
  // Game states
  const [grid, setGrid] = useState<number[][]>([]);
  const [selectedPath, setSelectedPath] = useState<CellCoords[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [combo, setCombo] = useState(0);

  const bestScore = stats.sumConnect.highScore;
  const isNeon = theme === 'neon';
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate 6x6 grid with random values 1 to 9
  const generateRandomGrid = () => {
    const newGrid: number[][] = [];
    for (let r = 0; r < 6; r++) {
      const row = [];
      for (let c = 0; c < 6; c++) {
        row.push(Math.floor(Math.random() * 9) + 1);
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  const initGame = useCallback(() => {
    setGrid(generateRandomGrid());
    setSelectedPath([]);
    setIsDragging(false);
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(false);
    setIsGameOver(false);
    setShowWinModal(false);
    setCombo(0);

    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    initGame();
    updateStats('sumConnect', { gamesPlayed: 1 });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame, updateStats]);

  // Start timer on first drag/action
  const startTimer = () => {
    if (isPlaying || isGameOver) return;
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);
          setIsPlaying(false);
          setShowWinModal(true);
          
          // Update high score
          updateStats('sumConnect', { highScore: score });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Helper check for cell selection state
  const isSelected = (r: number, c: number) => {
    return selectedPath.some((cell) => cell.r === r && cell.c === c);
  };

  // Adjacency check (must touch or be diagonal)
  const isAdjacent = (c1: CellCoords, c2: CellCoords) => {
    return Math.abs(c1.r - c2.r) <= 1 && Math.abs(c1.c - c2.c) <= 1;
  };

  // Calculate sum of currently selected path
  const getPathSum = useCallback(() => {
    return selectedPath.reduce((acc, cell) => acc + grid[cell.r][cell.c], 0);
  }, [selectedPath, grid]);

  // Start drag interaction
  const handleCellDown = (r: number, c: number) => {
    if (isGameOver) return;
    startTimer();
    playSound('click');
    setIsDragging(true);
    setSelectedPath([{ r, c }]);
  };

  // Hover over cell during drag
  const handleCellEnter = (r: number, c: number) => {
    if (!isDragging || isGameOver) return;

    // Check if dragging onto same cell
    if (isSelected(r, c)) {
      // If user drags BACK to the second-to-last cell, undo the last step
      if (selectedPath.length > 1) {
        const secondToLast = selectedPath[selectedPath.length - 2];
        if (secondToLast.r === r && secondToLast.c === c) {
          playSound('click');
          setSelectedPath((prev) => prev.slice(0, -1));
        }
      }
      return;
    }

    // Check adjacency
    const lastCell = selectedPath[selectedPath.length - 1];
    if (isAdjacent(lastCell, { r, c })) {
      playSound('click');
      const nextPath = [...selectedPath, { r, c }];
      setSelectedPath(nextPath);

      // Trigger instant success if exact 10 is reached!
      const currentSum = nextPath.reduce((acc, cell) => acc + grid[cell.r][cell.c], 0);
      if (currentSum === 10) {
        // Complete the drag automatically
        triggerClearSuccess(nextPath);
      } else if (currentSum > 10) {
        // Exceeded 10, fail drag
        playSound('error');
        setIsDragging(false);
        setSelectedPath([]);
        setCombo(0);
      }
    }
  };

  // Clear path successfully
  const triggerClearSuccess = (path: CellCoords[]) => {
    playSound('merge');
    setIsDragging(false);

    // Scoring math based on connected blocks (combo multiplier)
    const blocksCount = path.length;
    const baseScore = blocksCount * 10;
    const currentCombo = combo + 1;
    const scoreGain = baseScore * currentCombo;

    setScore((prev) => prev + scoreGain);
    setCombo(currentCombo);
    
    // Reward bonus time
    setTimeLeft((prev) => Math.min(prev + Math.floor(blocksCount * 0.8), 60));

    // Refill grid with gravity drop
    const newGrid = grid.map((row) => [...row]);
    
    // 1. Mark cells in path as empty (0)
    path.forEach((cell) => {
      newGrid[cell.r][cell.c] = 0;
    });

    // 2. Drop cells down (gravity shift)
    for (let c = 0; c < 6; c++) {
      let writeRow = 5;
      for (let r = 5; r >= 0; r--) {
        if (newGrid[r][c] !== 0) {
          newGrid[writeRow][c] = newGrid[r][c];
          if (writeRow !== r) newGrid[r][c] = 0;
          writeRow--;
        }
      }
      // Fill empty top cells with new random numbers
      for (let r = writeRow; r >= 0; r--) {
        newGrid[r][c] = Math.floor(Math.random() * 9) + 1;
      }
    }

    setGrid(newGrid);
    setSelectedPath([]);
  };

  // End drag (if they let go without reaching 10)
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const sum = getPathSum();
    if (sum === 10) {
      triggerClearSuccess(selectedPath);
    } else {
      // Failed sum
      if (selectedPath.length > 0) {
        playSound('error');
      }
      setSelectedPath([]);
      setCombo(0);
    }
  };

  const pathSum = getPathSum();

  return (
    <div
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 relative"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg z-10">
        <GameHeader
          title="Sum Connect: 10 만들기"
          gameKey="sumConnect"
          currentScore={score}
          bestScoreValue={bestScore}
          onReset={initGame}
        />

        {/* Info stats (Time, Sum, Combo) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Time Bar */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center flex flex-col justify-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5 flex items-center justify-center gap-1">
              <Timer size={10} /> TIME LEFT
            </span>
            <span className={`text-xl font-black font-mono ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-purple-400'}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Current Path Sum */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center flex flex-col justify-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5 flex items-center justify-center gap-1">
              <Sparkles size={10} /> PATH SUM
            </span>
            <span className={`text-xl font-black font-mono ${pathSum === 10 ? 'text-emerald-400' : pathSum > 10 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {pathSum} / 10
            </span>
          </div>

          {/* Combo Multiplier */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center flex flex-col justify-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5 flex items-center justify-center gap-1">
              <Flame size={10} /> COMBO
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              {combo > 0 ? `${combo}x` : '-'}
            </span>
          </div>
        </div>

        {/* 6x6 gravity connect board grid */}
        <div className="aspect-square w-full p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col gap-2.5">
          {grid.map((row, r) => (
            <div key={r} className="flex-1 flex gap-2.5">
              {row.map((val, c) => {
                const selected = isSelected(r, c);
                
                // Highlight line colors
                let selectionClass = 'bg-slate-900 border-slate-800 text-white hover:border-purple-500/30';
                if (selected) {
                  selectionClass = 'bg-gradient-to-tr from-purple-500 to-indigo-500 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[0.98]';
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleCellDown(r, c)}
                    onMouseEnter={() => handleCellEnter(r, c)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleCellDown(r, c);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element) {
                          const dataset = (element as HTMLElement).dataset;
                          if (dataset.r !== undefined && dataset.c !== undefined) {
                            handleCellEnter(parseInt(dataset.r), parseInt(dataset.c));
                          }
                        }
                      }
                    }}
                    data-r={r}
                    data-c={c}
                    className={`flex-1 aspect-square rounded-xl border flex items-center justify-center text-lg sm:text-xl font-black font-mono select-none cursor-pointer transition-all duration-150 ${selectionClass}`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Game results modal */}
      <WinModal
        isOpen={showWinModal}
        type="win"
        title="TIME OUT!"
        subtitle="제한시간이 초과되어 도전이 종료되었습니다."
        stats={[
          { label: 'MY SCORE', value: score },
          { label: 'BEST SCORE', value: Math.max(bestScore, score) },
        ]}
        onAction={initGame}
        actionLabel="다시 도전"
      />
    </div>
  );
}

export default function SumConnectPage() {
  return (
    <ClientOnly>
      <SumConnectContent />
    </ClientOnly>
  );
}
