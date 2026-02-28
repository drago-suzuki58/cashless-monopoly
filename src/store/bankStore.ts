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
              // Re-registration does not change balance; omit amount to avoid misleading data
            };

            set((s) => ({ history: [log, ...s.history] }));
            return { success: true, message: `${name}がプロファイルを更新しました`, log };
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
              amount: bal, // use amount field for initial balance
            };

            set((s) => ({ history: [log, ...s.history] }));
            return { success: true, message: `${name}が登録されました（初期残高: ${bal}）`, log };
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
          };

          set((s) => ({ history: [log, ...s.history] }));
          return { success: true, message: `${player.name}が ${Math.abs(amt)} ${actionWord}`, log };
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
            targetSeq: tgt, // Store target seq for restoring player history
          };

          set((s) => ({ history: [log, ...s.history] }));
          return { success: true, message: `${player.name}が過去の取引（${targetLog.amount}）を取り消しました`, log };
        }

        if (payload.act === "sync") {
          // Sync payloads are generated by the bank and scanned by players — not the reverse.
          // If the bank accidentally scans its own recovery QR, return a clear message.
          return { success: false, message: "復元用QRはプレイヤーの端末で読み取ってください" };
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
