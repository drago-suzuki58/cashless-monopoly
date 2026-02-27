import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, History } from "lucide-react";
import { useBankStore, type BankPlayer } from "../store/bankStore";
import { QRScanner } from "../components/QRScanner";
import { QRDisplay } from "../components/QRDisplay";
import { cn } from "../utils/cn";
import type { Payload } from "../types";

export default function Bank() {
  const { players, history, processPayload, resetBank } = useBankStore();

  const [isScanning, setIsScanning] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    id: number;
  } | null>(null);
  const [syncPlayer, setSyncPlayer] = useState<BankPlayer | null>(null);

  const playersList = Object.values(players);

  const getNextSeq = (uuid: string) => {
    const { processedSeqs } = useBankStore.getState();
    const seqs = processedSeqs
      .filter((id) => id.startsWith(`${uuid}-`))
      .map((id) => parseInt(id.split("-")[1], 10))
      .filter((n) => !isNaN(n));
    return seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  };

  const getPlayerHistory = (uuid: string) => {
    const { history } = useBankStore.getState();
    const playerLogs = history.filter(
      (h) => h.playerId === uuid && (h.type === "tx" || h.type === "undo")
    );
    
    // QR Code size limit mitigation: only send the latest 20 transactions
    return playerLogs.slice(0, 20).map((log) => {
      const seqStr = log.id.split("-").pop();
      const seq = parseInt(seqStr || "0", 10);
      const typeNum = log.type === "tx" ? 1 : 2;
      const val = log.type === "tx" ? (log.amount || 0) : (log.targetSeq || 0);
      return [seq, typeNum, val, log.timestamp];
    });
  };

  const handleScan = (decodedText: string) => {
    try {
      const payload = JSON.parse(decodedText) as Payload;
      const result = processPayload(payload);

      if (result.success) {
        showToast(result.message, "success");
        // Play success sound
        playAudio("/success.mp3");

        // Pause scanning briefly to prevent double scan spam UI
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 2000);
      } else {
        showToast(result.message, "error");
        playAudio("/error.mp3");
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 2000);
      }
    } catch {
      // Invalid JSON or non-app QR
      showToast("不正なQRコードです", "error");
      setIsScanning(false);
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const playAudio = (path: string) => {
    // Basic beep generation since we don't have files yet
    const ctx = new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (path.includes("success")) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-h-screen overflow-hidden">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0 z-10">
        <div className="flex items-center">
          <Link
            to="/"
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold ml-2 text-gray-800">中央銀行</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => {
              if (window.confirm("本当にすべてのデータをリセットしますか？")) {
                resetBank();
              }
            }}
            className="p-2 text-rose-600 bg-rose-50 rounded-full hover:bg-rose-100"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 space-y-6 overflow-hidden relative">
        {/* Scanner Area */}
        <div className="shrink-0 flex flex-col items-center">
          <QRScanner onScan={handleScan} isScanning={isScanning} />
          <p className="mt-4 text-sm font-bold text-gray-500 animate-pulse">
            {isScanning ? "プレイヤーのQRコードをスキャン..." : "処理中..."}
          </p>
        </div>

        {/* Players Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-400 mb-4 px-2">
            プレイヤー残高
          </h2>
          {playersList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <p>プレイヤーが登録されていません</p>
              <p className="text-sm">
                プレイヤー端末で「登録用QR」を表示し、
                <br />
                カメラにかざしてください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {playersList.map((p) => (
                <div
                  key={p.uuid}
                  onClick={() => setSyncPlayer(p)}
                  className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col relative overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="font-bold text-gray-700 text-lg mb-1 truncate">
                    {p.name}
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900">
                    <span className="text-gray-400 text-xl mr-1">M</span>
                    {p.balance.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification Overlay */}
      {toast && (
        <div
          key={toast.id}
          className="absolute inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/20 animate-in fade-in duration-200" />
          <div
            className={cn(
              "relative w-full max-w-sm p-8 rounded-3xl shadow-2xl animate-in zoom-in-90 fade-in duration-200 text-center",
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white",
            )}
          >
            <div className="text-3xl font-black mb-2 tracking-tight leading-tight">
              {toast.type === "success" ? "SUCCESS!" : "ERROR!"}
            </div>
            <div className="text-xl font-bold opacity-90">{toast.message}</div>
          </div>
        </div>
      )}

      {/* History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-40 flex flex-col bg-gray-50 animate-in slide-in-from-bottom-full duration-300">
          <header className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0">
            <h2 className="text-xl font-bold text-gray-800">全体取引履歴</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={24} className="rotate-[-90deg]" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">
                履歴がありません
              </p>
            ) : (
              history.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">
                      {log.playerName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm">{log.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sync Player Modal */}
      {syncPlayer && (
        <QRDisplay
          payload={JSON.stringify({
            act: "sync",
            uuid: syncPlayer.uuid,
            name: syncPlayer.name,
            col: syncPlayer.color,
            seq: getNextSeq(syncPlayer.uuid),
            hist: getPlayerHistory(syncPlayer.uuid),
          })}
          title={`${syncPlayer.name} の復元用QR`}
          onClose={() => setSyncPlayer(null)}
        />
      )}
    </div>
  );
}
