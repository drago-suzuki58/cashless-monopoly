import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { PlayerLog } from "../types";

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
  recoverProfile: (
    uuid: string,
    name: string,
    color: string,
    nextSeq: number,
    bal: number,
    hist?: [number, number, number, number][]
  ) => void;
  addTransaction: (amount: number) => {
    seq: number;
    commit: () => void;
    rollback: () => void;
  };
  addUndo: (targetSeq: number) => {
    seq: number;
    commit: () => void;
    rollback: () => void;
  };
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
          history: [],
        });
      },
      recoverProfile: (uuid, name, color, nextSeq, bal, hist) => {
        const history: PlayerLog[] = [];
        const undoneSeqs = new Set<number>();

        if (hist) {
          // First pass: identify all undone seqs
          hist.forEach(([, typeNum, val]) => {
            if (typeNum === 2) { // 2 means undo
              undoneSeqs.add(val); // val is targetSeq
            }
          });

          // Second pass: build the PlayerLog array
          hist.forEach(([seq, typeNum, val, timestamp]) => {
            if (typeNum === 1) { // 1 means tx
              history.push({
                seq,
                type: "tx",
                amount: val,
                timestamp,
                isUndone: undoneSeqs.has(seq),
              });
            } else if (typeNum === 2) { // 2 means undo
              history.push({
                seq,
                type: "undo",
                targetSeq: val,
                timestamp,
              });
            }
          });
        }

        set({
          profile: { uuid, name, color, initialBalance: bal },
          currentSeq: nextSeq,
          history, // Use reconstructed history
        });
      },
      addTransaction: (amount) => {
        const { currentSeq } = get();
        const seq = currentSeq;

        // We increment the seq immediately to ensure uniqueness even if canceled (safe)
        // But we don't add to history until committed
        set({ currentSeq: seq + 1 });

        return {
          seq,
          commit: () => {
            const log: PlayerLog = {
              seq,
              timestamp: Date.now(),
              type: "tx",
              amount,
            };
            set((state) => ({ history: [log, ...state.history] }));
          },
          rollback: () => {
            // In a perfect world we might decrement seq, but it's safer to just skip it
            // so we don't accidentally reuse a sequence number if there was a race condition
          },
        };
      },
      addUndo: (targetSeq) => {
        const { currentSeq } = get();
        const seq = currentSeq;

        set({ currentSeq: seq + 1 });

        return {
          seq,
          commit: () => {
            const log: PlayerLog = {
              seq,
              timestamp: Date.now(),
              type: "undo",
              targetSeq,
            };
            set((state) => ({
              history: [
                log,
                ...state.history.map((h) =>
                  h.seq === targetSeq ? { ...h, isUndone: true } : h,
                ),
              ],
            }));
          },
          rollback: () => {},
        };
      },
      reset: () => set({ profile: null, currentSeq: 1, history: [] }),
    }),
    {
      name: "cashless-monopoly-player-storage",
    },
  ),
);
