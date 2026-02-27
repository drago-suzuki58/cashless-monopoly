import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { PlayerLog } from '../types';

export interface PlayerProfile {
  uuid: string;
  name: string;
  color: string;
  initialBalance: number;
}

interface PlayerState {
  profile: PlayerProfile | null;
  currentSeq: number;
  history: PlayerLog[];
  setProfile: (name: string, color: string, initialBalance: number) => void;
  addTransaction: (amount: number) => number; // returns the generated seq
  addUndo: (targetSeq: number) => number; // returns the generated seq
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profile: null,
      currentSeq: 1,
      history: [],
      setProfile: (name, color, initialBalance) => {
        const uuid = get().profile?.uuid || uuidv4();
        const newProfile = { uuid, name, color, initialBalance };
        set({ 
          profile: newProfile,
          // When re-registering, do we reset history and seq?
          // It's probably better to keep history but maybe add a register log.
          currentSeq: 1,
          history: [] 
        });
      },
      addTransaction: (amount) => {
        const { currentSeq, history } = get();
        const seq = currentSeq;
        const log: PlayerLog = {
          seq,
          timestamp: Date.now(),
          type: 'tx',
          amount,
        };
        set({
          currentSeq: seq + 1,
          history: [log, ...history],
        });
        return seq;
      },
      addUndo: (targetSeq) => {
        const { currentSeq, history } = get();
        const seq = currentSeq;
        const log: PlayerLog = {
          seq,
          timestamp: Date.now(),
          type: 'undo',
          targetSeq,
        };
        const updatedHistory = history.map((h) => 
          h.seq === targetSeq ? { ...h, isUndone: true } : h
        );
        set({
          currentSeq: seq + 1,
          history: [log, ...updatedHistory],
        });
        return seq;
      },
      reset: () => set({ profile: null, currentSeq: 1, history: [] }),
    }),
    {
      name: 'cashless-monopoly-player-storage',
    }
  )
);
