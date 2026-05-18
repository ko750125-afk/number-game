import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameStats {
  highScore: number;
  bestTime: number | null; // in seconds
  leastAttempts: number | null;
  gamesPlayed: number;
  gamesWon: number;
}

export interface NumiverseState {
  theme: 'neon' | 'zen';
  soundEnabled: boolean;
  userProfile: {
    nickname: string;
    unlockedBadges: string[];
  };
  stats: {
    neon2048: GameStats;
    speedTouch: GameStats;
    cipherStrike: GameStats;
    zenSudoku: GameStats;
    sumConnect: GameStats;
  };
  setTheme: (theme: 'neon' | 'zen') => void;
  toggleSound: () => void;
  updateNickname: (nickname: string) => void;
  updateStats: (game: keyof NumiverseState['stats'], update: Partial<GameStats>) => void;
  unlockBadge: (badgeId: string) => void;
  resetAllStats: () => void;
}

const initialGameStats: GameStats = {
  highScore: 0,
  bestTime: null,
  leastAttempts: null,
  gamesPlayed: 0,
  gamesWon: 0,
};

export const useGameStore = create<NumiverseState>()(
  persist(
    (set) => ({
      theme: 'neon',
      soundEnabled: true,
      userProfile: {
        nickname: 'NumiExplorer',
        unlockedBadges: [],
      },
      stats: {
        neon2048: { ...initialGameStats },
        speedTouch: { ...initialGameStats },
        cipherStrike: { ...initialGameStats },
        zenSudoku: { ...initialGameStats },
        sumConnect: { ...initialGameStats },
      },
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      updateNickname: (nickname) =>
        set((state) => ({
          userProfile: { ...state.userProfile, nickname },
        })),
      updateStats: (game, update) =>
        set((state) => {
          const currentStats = state.stats[game];
          const newStats = { ...currentStats };

          if (update.highScore !== undefined) {
            newStats.highScore = Math.max(currentStats.highScore, update.highScore);
          }
          if (update.bestTime !== undefined && update.bestTime !== null) {
            newStats.bestTime =
              currentStats.bestTime === null
                ? update.bestTime
                : Math.min(currentStats.bestTime, update.bestTime);
          }
          if (update.leastAttempts !== undefined && update.leastAttempts !== null) {
            newStats.leastAttempts =
              currentStats.leastAttempts === null
                ? update.leastAttempts
                : Math.min(currentStats.leastAttempts, update.leastAttempts);
          }
          if (update.gamesPlayed !== undefined) {
            newStats.gamesPlayed += update.gamesPlayed;
          }
          if (update.gamesWon !== undefined) {
            newStats.gamesWon += update.gamesWon;
          }

          // Check and unlock badges based on milestones
          const unlockedBadges = [...state.userProfile.unlockedBadges];
          
          const addBadge = (badgeId: string) => {
            if (!unlockedBadges.includes(badgeId)) {
              unlockedBadges.push(badgeId);
            }
          };

          // Basic Milestones
          if (newStats.gamesPlayed >= 1) addBadge(`${game}_first_play`);
          if (newStats.gamesWon >= 1) addBadge(`${game}_first_win`);
          if (newStats.gamesWon >= 5) addBadge(`${game}_five_wins`);

          // Game Specific Achievements
          if (game === 'neon2048' && update.highScore && update.highScore >= 2048) {
            addBadge('neon2048_master');
          }
          if (game === 'speedTouch' && update.bestTime && update.bestTime < 20) {
            addBadge('speed_demon');
          }
          if (game === 'cipherStrike' && update.leastAttempts && update.leastAttempts <= 4) {
            addBadge('mind_reader');
          }

          return {
            stats: {
              ...state.stats,
              [game]: newStats,
            },
            userProfile: {
              ...state.userProfile,
              unlockedBadges,
            },
          };
        }),
      unlockBadge: (badgeId) =>
        set((state) => {
          if (state.userProfile.unlockedBadges.includes(badgeId)) return {};
          return {
            userProfile: {
              ...state.userProfile,
              unlockedBadges: [...state.userProfile.unlockedBadges, badgeId],
            },
          };
        }),
      resetAllStats: () =>
        set({
          stats: {
            neon2048: { ...initialGameStats },
            speedTouch: { ...initialGameStats },
            cipherStrike: { ...initialGameStats },
            zenSudoku: { ...initialGameStats },
            sumConnect: { ...initialGameStats },
          },
          userProfile: {
            nickname: 'NumiExplorer',
            unlockedBadges: [],
          },
        }),
    }),
    {
      name: 'numiverse-game-storage',
    }
  )
);
