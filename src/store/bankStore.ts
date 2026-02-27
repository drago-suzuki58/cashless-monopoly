import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BankLog,
  RegisterPayload,
  TransactionPayload,
  UndoPayload,
  Payload,
} from "../types";

export interface BankPlayer {
  uuid: string;
  name: string;
  color: string;
  balance: number;
}

interface BankState {
  players: Record<string, BankPlayer>;
  processedSeqs: string[]; // array of `uuid-seq` to prevent double scan
  history: BankLog[];
  processPayload: (payload: Payload) => {
    success: boolean;
    message: string;
    log?: BankLog;
  };
  resetBank: () => void;
}

export const useBankStore = create<BankState>()(
  persist(
    (set, get) => ({
      players: {},
      processedSeqs: [],
      history: [],

      processPayload: (payload: Payload) => {
        const state = get();
        const timestamp = Date.now();

        if (payload.act === "reg") {
          const { uuid, name, col, bal } = payload as RegisterPayload;
          const existingPlayer = state.players[uuid];

          if (existingPlayer) {
            set((s) => ({
              players: {
                ...s.players,
                [uuid]: { ...existingPlayer, name, color: col },
              },
            }));

            const log: BankLog = {
              id: `reg-${uuid}-${timestamp}`,
              timestamp,
              playerId: uuid,
              playerName: name,
              type: "reg",
              message: `${name}がプロファイルを更新しました`,
            };

            set((s) => ({ history: [log, ...s.history] }));
            return { success: true, message: log.message, log };
          } else {
            set((s) => ({
              players: {
                ...s.players,
                [uuid]: { uuid, name, color: col, balance: bal },
              },
            }));

            const log: BankLog = {
              id: `reg-${uuid}-${timestamp}`,
              timestamp,
              playerId: uuid,
              playerName: name,
              type: "reg",
              message: `${name}が登録されました（初期残高: ${bal}）`,
            };

            set((s) => ({ history: [log, ...s.history] }));
            return { success: true, message: log.message, log };
          }
        }

        if (payload.act === "tx") {
          const { uuid, seq, amt } = payload as TransactionPayload;
          const txId = `${uuid}-${seq}`;

          // Check for idempotency
          if (state.processedSeqs.includes(txId)) {
            return { success: false, message: "既に処理済みの取引です" };
          }

          const player = state.players[uuid];
          if (!player) {
            return {
              success: false,
              message: "プレイヤーが見つかりません。先に登録してください。",
            };
          }

          // Update Balance
          set((s) => ({
            players: {
              ...s.players,
              [uuid]: { ...player, balance: player.balance + amt },
            },
            processedSeqs: [...s.processedSeqs, txId],
          }));

          const actionWord = amt > 0 ? "貰いました" : "支払いました";
          const log: BankLog = {
            id: txId,
            timestamp,
            playerId: uuid,
            playerName: player.name,
            type: "tx",
            amount: amt,
            message: `${player.name}が ${Math.abs(amt)} ${actionWord}`,
          };

          set((s) => ({ history: [log, ...s.history] }));
          return { success: true, message: log.message, log };
        }

        if (payload.act === "undo") {
          const { uuid, tgt, seq } = payload as UndoPayload;
          const undoTxId = `${uuid}-${seq}`;
          const targetTxId = `${uuid}-${tgt}`;

          if (state.processedSeqs.includes(undoTxId)) {
            return { success: false, message: "既に処理済みの取消です" };
          }

          const player = state.players[uuid];
          if (!player) {
            return { success: false, message: "プレイヤーが見つかりません。" };
          }

          // Find the target transaction to undo
          const targetLog = state.history.find((h) => h.id === targetTxId);
          if (!targetLog) {
            return {
              success: false,
              message: `取消対象の取引が見つかりません（seq:${tgt}）`,
            };
          }

          if (targetLog.type !== "tx") {
            return { success: false, message: "取引以外は取消できません" };
          }

          const amtToReverse = -(targetLog.amount || 0);

          set((s) => ({
            players: {
              ...s.players,
              [uuid]: { ...player, balance: player.balance + amtToReverse },
            },
            processedSeqs: [...s.processedSeqs, undoTxId],
          }));

          const log: BankLog = {
            id: undoTxId,
            timestamp,
            playerId: uuid,
            playerName: player.name,
            type: "undo",
            amount: amtToReverse, // Show the reversed amount
            message: `${player.name}が過去の取引（${targetLog.amount}）を取り消しました`,
          };

          set((s) => ({ history: [log, ...s.history] }));
          return { success: true, message: log.message, log };
        }

        return { success: false, message: "不正なデータ形式です" };
      },

      resetBank: () => set({ players: {}, processedSeqs: [], history: [] }),
    }),
    {
      name: "cashless-monopoly-bank-storage",
    },
  ),
);
