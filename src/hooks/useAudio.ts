import { useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';

export const useAudio = () => {
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  const playSound = useCallback((type: 'click' | 'success' | 'error' | 'merge' | 'pop') => {
    if (!soundEnabled) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, duration: number, typeOfWave: OscillatorType = 'sine', gainVal = 0.1) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = typeOfWave;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      };

      switch (type) {
        case 'click':
          playTone(800, 0.08, 'sine', 0.15);
          break;
        case 'success':
          // Major arpeggio
          playTone(523.25, 0.15, 'triangle', 0.15); // C5
          setTimeout(() => playTone(659.25, 0.15, 'triangle', 0.15), 80); // E5
          setTimeout(() => playTone(783.99, 0.3, 'triangle', 0.15), 160); // G5
          break;
        case 'error':
          // Low buzzing sound
          playTone(150, 0.25, 'sawtooth', 0.1);
          setTimeout(() => playTone(120, 0.25, 'sawtooth', 0.1), 50);
          break;
        case 'merge':
          // Pop upward slide
          {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.18);
          }
          break;
        case 'pop':
          playTone(400, 0.12, 'sine', 0.25);
          break;
      }
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }, [soundEnabled]);

  return { playSound };
};
