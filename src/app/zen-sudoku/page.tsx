'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import GameHeader from '../../components/game/GameHeader';
import WinModal from '../../components/game/WinModal';
import ClientOnly from '../../components/common/ClientOnly';
import { generateSudoku } from '../../utils/sudokuGenerator';
import { motion } from 'framer-motion';
import { PenTool, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface HistoryState {
  board: number[][];
  notes: Record<string, number[]>;
  mistakes: number;
}

function ZenSudokuContent() {
  const { theme, setTheme, stats, updateStats } = useGameStore();
  const { playSound } = useAudio();
  
  // Game states
  const [solvedBoard, setSolvedBoard] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [initialMask, setInitialMask] = useState<boolean[][]>([]); // true if cell was initially given
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({}); // Key: "r-c", Value: list of numbers
  const [mistakes, setMistakes] = useState(0);
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Toggle theme to 'zen' on enter, and restore to 'neon' on leave
  useEffect(() => {
    const originalTheme = theme;
    setTheme('zen');
    return () => setTheme(originalTheme);
  }, [theme, setTheme]);

  // Generate new board
  const startNewGame = useCallback((diff: Difficulty = difficulty) => {
    const { solved, puzzle } = generateSudoku(diff);
    
    // Create initial mask to lock given numbers
    const mask = puzzle.map(row => row.map(val => val !== 0));

    setSolvedBoard(solved);
    setBoard(puzzle);
    setInitialMask(mask);
    setSelectedCell(null);
    setNotes({});
    setMistakes(0);
    setIsGameOver(false);
    setIsGameWon(false);
    setShowResultModal(false);
    setHistory([]);
    setDifficulty(diff);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
    updateStats('zenSudoku', { gamesPlayed: 1 });
  }, [startNewGame, updateStats]);

  // Save current step to history for Undo
  const saveToHistory = (currentBoard: number[][], currentNotes: Record<string, number[]>, currentMistakes: number) => {
    const clonedBoard = currentBoard.map(row => [...row]);
    const clonedNotes = { ...currentNotes };
    setHistory(prev => [...prev, { board: clonedBoard, notes: clonedNotes, mistakes: currentMistakes }]);
  };

  // Cell Selection
  const handleCellSelect = (r: number, c: number) => {
    if (isGameOver || isGameWon) return;
    playSound('click');
    setSelectedCell({ r, c });
  };

  // Cell number input handler
  const handleNumberInput = (num: number) => {
    if (!selectedCell || isGameOver || isGameWon) return;
    const { r, c } = selectedCell;

    // Check if cell is locked (initial number)
    if (initialMask[r][c]) return;

    saveToHistory(board, notes, mistakes);

    if (isNoteMode) {
      // Pencil markup mode
      const key = `${r}-${c}`;
      const currentNotes = notes[key] || [];
      let nextNotes: number[];

      if (currentNotes.includes(num)) {
        nextNotes = currentNotes.filter(n => n !== num);
      } else {
        nextNotes = [...currentNotes, num].sort();
      }

      setNotes(prev => ({ ...prev, [key]: nextNotes }));
      playSound('click');
    } else {
      // Direct placement mode
      const correctVal = solvedBoard[r][c];
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = num;
      setBoard(newBoard);

      // Clear pencil notes for the edited cell
      const key = `${r}-${c}`;
      setNotes(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      if (num === correctVal) {
        playSound('click');
        
        // Win check
        let isComplete = true;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (newBoard[i][j] !== solvedBoard[i][j]) {
              isComplete = false;
              break;
            }
          }
        }

        if (isComplete) {
          setIsGameWon(true);
          setShowResultModal(true);
          updateStats('zenSudoku', { gamesWon: 1 });
        }
      } else {
        // Wrong entry
        playSound('error');
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);

        if (nextMistakes >= 3) {
          setIsGameOver(true);
          setShowResultModal(true);
        }
      }
    }
  };

  // Erase Cell value
  const handleErase = () => {
    if (!selectedCell || isGameOver || isGameWon) return;
    const { r, c } = selectedCell;

    if (initialMask[r][c]) return;

    saveToHistory(board, notes, mistakes);
    playSound('click');

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 0;
    setBoard(newBoard);

    // Also erase any notes
    const key = `${r}-${c}`;
    setNotes(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Undo action
  const handleUndo = () => {
    if (history.length === 0 || isGameOver || isGameWon) return;
    playSound('click');

    const previousState = history[history.length - 1];
    setBoard(previousState.board);
    setNotes(previousState.notes);
    setMistakes(previousState.mistakes);
    setHistory(prev => prev.slice(0, -1));
  };

  // Highlight logic for styling
  const getCellHighlightClass = (r: number, c: number) => {
    if (!selectedCell) return 'bg-white text-stone-800';

    const { r: selR, c: selC } = selectedCell;
    const isSelected = r === selR && c === selC;
    
    // Check if cell shares row, col or 3x3 box
    const inSameRow = r === selR;
    const inSameCol = c === selC;
    const inSameBox = Math.floor(r / 3) === Math.floor(selR / 3) && Math.floor(c / 3) === Math.floor(selC / 3);
    const sharesArea = inSameRow || inSameCol || inSameBox;

    // Check if cell shares same value as selected cell
    const selectedVal = board[selR][selC];
    const sharesValue = selectedVal !== 0 && board[r][c] === selectedVal;

    if (isSelected) {
      return 'bg-amber-100/90 text-amber-900 border-amber-400 ring-2 ring-amber-300';
    }
    if (sharesValue) {
      return 'bg-emerald-100/70 text-emerald-950 border-emerald-300';
    }
    if (sharesArea) {
      return 'bg-amber-50/50 text-stone-700';
    }
    return 'bg-white text-stone-800';
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col justify-center items-center p-4 selection:bg-amber-100 relative">
      {/* Soothing pastel background circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-emerald-50/30 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-amber-50/30 blur-[100px]" />
      </div>

      <div className="w-full max-w-xl z-10">
        <GameHeader
          title="Zen Sudoku"
          gameKey="zenSudoku"
          bestScoreLabel="LEVEL"
          bestScoreValue={difficulty.toUpperCase()}
          onReset={() => startNewGame(difficulty)}
        />

        {/* Difficulty Selectors & Mistakes Counter */}
        <div className="flex justify-between items-center mb-5 p-3 rounded-2xl bg-white/70 border border-stone-200/60 shadow-sm backdrop-blur-sm">
          <div className="flex gap-1">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  playSound('click');
                  startNewGame(diff);
                }}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg transition-all ${
                  difficulty === diff
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-stone-500">
            <AlertTriangle size={14} className={mistakes > 0 ? 'text-red-500 animate-pulse' : 'text-stone-400'} />
            실수: <span className={mistakes > 0 ? 'text-red-600 font-extrabold' : ''}>{mistakes}/3</span>
          </div>
        </div>

        {/* 9x9 Sudoku Grid Board */}
        <div className="aspect-square w-full p-2 rounded-3xl bg-stone-300 border border-stone-200 shadow-xl grid grid-cols-3 gap-1 mb-6 relative overflow-hidden">
          {[0, 1, 2].map((boxRow) => (
            [0, 1, 2].map((boxCol) => (
              
              /* 3x3 Box Grid wrapper to thicken box borders */
              <div key={`${boxRow}-${boxCol}`} className="grid grid-cols-3 gap-0.5 bg-stone-200">
                {[0, 1, 2].map((cellR) => {
                  const r = boxRow * 3 + cellR;
                  return [0, 1, 2].map((cellC) => {
                    const c = boxCol * 3 + cellC;
                    const val = board[r][c];
                    const isGiven = initialMask[r][c];
                    const isCorrect = val === solvedBoard[r][c];
                    
                    const cellColorClass = getCellHighlightClass(r, c);
                    const cellNotes = notes[`${r}-${c}`] || [];

                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellSelect(r, c)}
                        className={`aspect-square border border-stone-100 text-base sm:text-xl font-bold flex items-center justify-center relative overflow-hidden transition-all duration-150 ${cellColorClass} ${
                          isGiven
                            ? 'font-extrabold text-stone-900 bg-stone-50/70'
                            : val !== 0
                              ? isCorrect
                                ? 'text-indigo-600 font-bold'
                                : 'text-red-500 font-bold bg-red-50/50'
                              : ''
                        }`}
                      >
                        {/* Cell Value */}
                        {val !== 0 ? (
                          val
                        ) : (
                          
                          /* Pencil Notes Grid overlay */
                          <div className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 gap-0 leading-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                              <span
                                key={n}
                                className={`text-[8px] font-medium flex items-center justify-center ${
                                  cellNotes.includes(n) ? 'text-amber-500' : 'text-transparent'
                                }`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  });
                })}
              </div>
            ))
          ))}
        </div>

        {/* Sudoku Controller bar (Notes, Erase, Undo) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => {
              playSound('click');
              setIsNoteMode(!isNoteMode);
            }}
            className={`py-3.5 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 shadow-sm transition-all ${
              isNoteMode
                ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/10'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <PenTool size={16} />
            메모 {isNoteMode ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleErase}
            disabled={!selectedCell}
            className="py-3.5 rounded-2xl font-bold text-sm border bg-white border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Trash2 size={16} />
            지우개
          </button>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="py-3.5 rounded-2xl font-bold text-sm border bg-white border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RotateCcw size={16} />
            되돌리기
          </button>
        </div>

        {/* Input number pad */}
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-lg">
          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="py-4.5 rounded-xl font-black font-mono text-base border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100 hover:border-amber-400 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game results modal */}
      <WinModal
        isOpen={showResultModal}
        type={isGameOver ? 'lose' : 'win'}
        title={isGameOver ? 'FAILED' : 'ZEN CLEARED'}
        subtitle={isGameOver ? '실수를 3회 초과하여 스도쿠 도전에 실패하셨습니다.' : '마음의 평온과 함께 스도쿠 퍼즐을 완성했습니다!'}
        stats={[
          { label: 'DIFFICULTY', value: difficulty.toUpperCase() },
          { label: 'STATUS', value: isGameOver ? '탈락' : '완성' },
        ]}
        onAction={() => startNewGame(difficulty)}
        actionLabel={isGameOver ? '다시 도전' : '새 퍼즐 시작'}
      />
    </div>
  );
}

export default function ZenSudokuPage() {
  return (
    <ClientOnly>
      <ZenSudokuContent />
    </ClientOnly>
  );
}
