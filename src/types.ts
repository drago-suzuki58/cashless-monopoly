export type TransactionType = 'reg' | 'tx' | 'undo' | 'sync';

export interface BasePayload {
  uuid: string;
  act: TransactionType;
}

export interface RegisterPayload extends BasePayload {
  act: 'reg';
  name: string;
  col: string; // color (hex or predefined class)
  bal: number; // initial balance
}

export interface SyncPayload extends BasePayload {
  act: 'sync';
  name: string;
  col: string;
  seq: number;
  hist?: [number, number, number, number][]; // [seq, type(1=tx, 2=undo), value(amount or tgt), timestamp]
}

export interface TransactionPayload extends BasePayload {
  act: 'tx';
  amt: number; // amount, negative for pay, positive for receive
  seq: number; // sequence number from the player
}

export interface UndoPayload extends BasePayload {
  act: 'undo';
  tgt: number; // target sequence number to undo
  seq: number; // current sequence number
}

export type Payload = RegisterPayload | TransactionPayload | UndoPayload;

// Log type for Bank
export interface BankLog {
  id: string; // uuid + seq or unique id
  timestamp: number;
  playerId: string;
  playerName: string;
  type: TransactionType;
  amount?: number;
  targetSeq?: number;
  message: string;
}

// Log type for Player
export interface PlayerLog {
  seq: number;
  timestamp: number;
  type: TransactionType;
  amount?: number;
  targetSeq?: number; // if undo
  isUndone?: boolean; // track locally
}
