'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAudio } from '../../hooks/useAudio';
import GameHeader from '../../components/game/GameHeader';
import WinModal from '../../components/game/WinModal';
import ClientOnly from '../../components/common/ClientOnly';
import { motion } from 'framer-motion';
import { Terminal, Shield, Delete, CornerDownLeft, Eye, Award } from 'lucide-react';

interface Attempt {
  guess: number[];
  strikes: number;
  balls: number;
  isOut: boolean;
}

// Scratchpad state for player notes
type ScratchpadState = 'none' | 'exclude' | 'include';

function CipherStrikeContent() {
  const { stats, updateStats, theme } = useGameStore();
  const { playSound } = useAudio();
  const [secretCode, setSecretCode] = useState<number[]>([]);
  const [inputNumbers, setInputNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [scratchpad, setScratchpad] = useState<Record<number, ScratchpadState>>({
    1: 'none', 2: 'none', 3: 'none', 4: 'none', 5: 'none', 6: 'none', 7: 'none', 8: 'none', 9: 'none'
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const leastAttempts = stats.cipherStrike.leastAttempts;
  const isNeon = theme === 'neon';

  // Initialize secret digits
  const initGame = useCallback(() => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const generated: number[] = [];
    
    // Pick 3 unique digits
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * digits.length);
      generated.push(digits[idx]);
      digits.splice(idx, 1);
    }

    setSecretCode(generated);
    setInputNumbers([]);
    setHistory([]);
    setScratchpad({
      1: 'none', 2: 'none', 3: 'none', 4: 'none', 5: 'none', 6: 'none', 7: 'none', 8: 'none', 9: 'none'
    });
    setIsGameOver(false);
    setShowWinModal(false);
    setShowCheatSheet(false);
  }, []);

  useEffect(() => {
    initGame();
    updateStats('cipherStrike', { gamesPlayed: 1 });
  }, [initGame, updateStats]);

  // Click on a virtual key
  const handleKeyClick = (num: number) => {
    if (isGameOver) return;
    playSound('click');

    // Prevent duplicates
    if (inputNumbers.includes(num)) return;
    
    // Max 3 digits
    if (inputNumbers.length < 3) {
      setInputNumbers([...inputNumbers, num]);
    }
  };

  // Delete digit
  const handleDelete = () => {
    if (inputNumbers.length > 0) {
      playSound('click');
      setInputNumbers(inputNumbers.slice(0, -1));
    }
  };

  // Submit attempt
  const handleSubmit = () => {
    if (inputNumbers.length < 3 || isGameOver) return;

    let strikes = 0;
    let balls = 0;

    for (let i = 0; i < 3; i++) {
      if (inputNumbers[i] === secretCode[i]) {
        strikes++;
      } else if (secretCode.includes(inputNumbers[i])) {
        balls++;
      }
    }

    const currentAttempt: Attempt = {
      guess: inputNumbers,
      strikes,
      balls,
      isOut: strikes === 0 && balls === 0,
    };

    const newHistory = [...history, currentAttempt];
    setHistory(newHistory);
    setInputNumbers([]);

    if (strikes === 3) {
      playSound('success');
      setIsGameOver(true);
      setShowWinModal(true);

      const attemptsCount = newHistory.length;
      updateStats('cipherStrike', {
        leastAttempts: attemptsCount,
        gamesWon: 1,
      });
    } else {
      playSound('merge');
    }
  };

  // Scratchpad toggle
  const toggleScratchpad = (num: number) => {
    playSound('click');
    setScratchpad(prev => {
      const current = prev[num];
      let next: ScratchpadState = 'none';
      if (current === 'none') next = 'exclude'; // Red X
      else if (current === 'exclude') next = 'include'; // Gold Star
      
      return { ...prev, [num]: next };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 selection:bg-indigo-500/20 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg z-10">
        <GameHeader
          title="Cipher Strike"
          gameKey="cipherStrike"
          currentScore={`${history.length}회 시도`}
          bestScoreLabel="MIN ATTEMPTS"
          bestScoreValue={leastAttempts ? `${leastAttempts}회` : '-'}
          onReset={initGame}
        />

        {/* Decoder Screen */}
        <div className="p-4 rounded-3xl bg-slate-950 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 mb-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Terminal size={12} /> HACKING SHIELD STATUS
            </span>
            <button
              onClick={() => {
                playSound('click');
                setShowCheatSheet(!showCheatSheet);
              }}
              className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"
            >
              <Eye size={12} /> Cheat
            </button>
          </div>

          {/* Hacking Panel Output */}
          <div className="aspect-[4/1] w-full bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center gap-4 relative">
            {showCheatSheet && (
              <span className="absolute top-2 right-3 text-[10px] text-rose-400 font-mono">
                Secret: {secretCode.join(' ')}
              </span>
            )}
            
            {[0, 1, 2].map((idx) => {
              const val = inputNumbers[idx];
              return (
                <div
                  key={idx}
                  className={`w-14 aspect-square rounded-xl border flex items-center justify-center text-2xl font-black font-mono transition-all duration-150 ${
                    val !== undefined
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'border-slate-800 text-slate-700 bg-slate-950'
                  }`}
                >
                  {val !== undefined ? val : '?'}
                </div>
              );
            })}
          </div>
        </div>

        {/* History timeline & Scratchpad side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          
          {/* Timeline - Left (3cols) */}
          <div className="sm:col-span-3 p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col h-[240px]">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 block">
              암호 해독 로그 (Logs)
            </span>
            
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-1.5 py-6">
                  <Shield size={24} className="opacity-40" />
                  <span className="text-xs">이력이 여기에 로그아웃됩니다.</span>
                </div>
              ) : (
                history.map((att, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex justify-between items-center ${
                      att.strikes === 3
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : att.isOut
                          ? 'bg-rose-950/20 border-rose-500/20'
                          : 'bg-slate-950/80 border-slate-800/80'
                    }`}
                  >
                    <span className="text-sm font-black font-mono text-white">
                      #{idx + 1}: <span className="text-indigo-400">{att.guess.join(' ')}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {att.isOut ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                          OUT
                        </span>
                      ) : (
                        <>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {att.strikes} S
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {att.balls} B
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scratchpad - Right (2cols) */}
          <div className="sm:col-span-2 p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 block">
              분석 보드 (Memo)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const mark = scratchpad[num];
                return (
                  <button
                    key={num}
                    onClick={() => toggleScratchpad(num)}
                    className={`aspect-square rounded-xl font-bold font-mono text-sm border flex flex-col items-center justify-center relative transition-all ${
                      mark === 'exclude'
                        ? 'border-rose-500/30 text-rose-500 bg-rose-950/20'
                        : mark === 'include'
                          ? 'border-amber-500/40 text-amber-400 bg-amber-950/10 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                          : 'border-slate-800/80 text-slate-400 hover:border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    <span>{num}</span>
                    {mark === 'exclude' && (
                      <span className="absolute text-[10px] font-black top-0 right-1 text-rose-500">X</span>
                    )}
                    {mark === 'include' && (
                      <span className="absolute text-[8px] top-0 right-1 text-amber-400">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Input Keypad */}
        <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isSelected = inputNumbers.includes(num);
              return (
                <motion.button
                  key={num}
                  whileHover={!isSelected ? { scale: 1.03 } : {}}
                  whileTap={!isSelected ? { scale: 0.97 } : {}}
                  onClick={() => handleKeyClick(num)}
                  disabled={isSelected || isGameOver}
                  className={`py-3.5 rounded-2xl font-black font-mono text-lg border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-emerald-500/40'
                  }`}
                >
                  {num}
                </motion.button>
              );
            })}

            {/* Backspace */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={inputNumbers.length === 0 || isGameOver}
              className="py-3.5 rounded-2xl font-black border border-slate-800 bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 flex items-center justify-center disabled:opacity-30"
            >
              <Delete size={20} />
            </motion.button>

            {/* Zero (Excluded by logic usually, but keep simple 3x3 layout filler / spacer) */}
            <div className="py-3.5 text-center text-slate-800 font-mono flex items-center justify-center">
              1-9
            </div>

            {/* Enter / Submit */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={inputNumbers.length < 3 || isGameOver}
              className="py-3.5 rounded-2xl font-black border border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center disabled:opacity-30 disabled:border-slate-800 disabled:text-slate-700"
            >
              <CornerDownLeft size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Win/Lose modal */}
      <WinModal
        isOpen={showWinModal}
        type="win"
        title="ACCESS GRANTED"
        subtitle="보안 코드 해석에 성공하여 시스템을 정상 해킹했습니다!"
        stats={[
          { label: 'ATTEMPTS', value: `${history.length}회` },
          { label: 'BEST RECORD', value: leastAttempts ? `${Math.min(leastAttempts, history.length)}회` : `${history.length}회` },
        ]}
        newBadgeUnlocked={history.length <= 4 ? '독심술 마스터 (4회 이내에 숫자 야구 성공)' : null}
        onAction={initGame}
        actionLabel="새 코드 분석 시작"
      />
    </div>
  );
}

export default function CipherStrikePage() {
  return (
    <ClientOnly>
      <CipherStrikeContent />
    </ClientOnly>
  );
}
