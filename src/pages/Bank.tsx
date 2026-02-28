import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, History, X, HelpCircle } from "lucide-react";
import { useBankStore, type BankPlayer } from "../store/bankStore";
import { QRScanner } from "../components/QRScanner";
import { QRDisplay } from "../components/QRDisplay";
import { HelpModal, type HelpSection } from "../components/HelpModal";
import { cn } from "../utils/cn";
import { playAudio } from "../utils/audio";
import type { Payload } from "../types";

// --- Help content definitions ---

const bankHelpSections: HelpSection[] = [
  {
    title: "銀行端末の役割",
    borderColor: "border-indigo-500",
    content: (
      <p>
        この端末はゲーム全体のお金を管理する<strong>「銀行」</strong>です。
        テーブルの中央に置き、プレイヤーが見せるQRコードをカメラで読み取ることで残高を自動更新します。
      </p>
    ),
  },
  {
    title: "カメラが読み取れない時",
    borderColor: "border-emerald-500",
    content: (
      <p>
        ピントが合わない場合は、カメラ映像の下にあるドロップダウンから
        <strong>別のカメラやマクロレンズ</strong>に切り替えてみてください。
      </p>
    ),
  },
  {
    title: "プレイヤーのデータが消えた時",
    borderColor: "border-amber-500",
    content: (
      <div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mb-2">
          <strong>なぜ復元が必要？</strong>
          <br />
          このアプリは完全オフラインのため、プレイヤーが画面を閉じてデータが消えると銀行側とズレてしまい、以降の取引がエラーになります。
        </div>
        <p>
          <strong>復元のしかた：</strong>
        </p>
        <ol className="list-none space-y-1 mt-1">
          <li>
            <strong>1.</strong> 下のプレイヤー一覧から、該当する名前のパネルを<strong>タップ</strong>します。
          </li>
          <li>
            <strong>2.</strong> 復元用QRが表示されます。
          </li>
          <li>
            <strong>3.</strong> プレイヤーの端末で「銀行から復元」を選び、このQRを読み取ってもらってください。
          </li>
        </ol>
      </div>
    ),
  },
  {
    title: "アイコンの意味",
    borderColor: "border-slate-500",
    content: (
      <div className="space-y-3 bg-gray-50 p-3 rounded-xl">
        <div className="flex items-center">
          <History size={18} className="mr-3 text-gray-500 shrink-0" />
          <span>
            <strong>全体履歴:</strong> 全プレイヤーの取引ログを確認します。
          </span>
        </div>
        <div className="flex items-center">
          <Trash2 size={18} className="mr-3 text-rose-500 shrink-0" />
          <span>
            <strong>リセット:</strong> 全データ（残高・履歴）を消去します。
          </span>
        </div>
      </div>
    ),
  },
];

export default function Bank() {
  const { players, history, processPayload, resetBank } = useBankStore();

  const [isScanning, setIsScanning] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
      .map((id) => parseInt(id.split("-").pop() || "0", 10))
      .filter((n) => !isNaN(n));
    return seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  };

  const handleScan = (decodedText: string) => {
    try {
      const payload = JSON.parse(decodedText) as Payload;
      const result = processPayload(payload);

      if (result.success) {
        showToast(result.message, "success");
        // Play success sound
        playAudio("success");

        // Pause scanning briefly to prevent double scan spam UI
        setIsScanning(false);
        setTimeout(() => setIsScanning(true), 2000);
      } else {
        showToast(result.message, "error");
        playAudio("error");
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

  // Precompute the set of undone transaction IDs for the history overlay
  const undoneTxIds = useMemo(
    () =>
      new Set(
        history
          .filter((h) => h.type === "undo")
          .map((h) => `${h.playerId}-${h.targetSeq}`),
      ),
    [history],
  );

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
            title="全体履歴"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
            title="使い方"
          >
            <HelpCircle size={20} />
          </button>
          <button
            onClick={() => {
              if (window.confirm("本当にすべてのデータをリセットしますか？")) {
                resetBank();
              }
            }}
            className="p-2 text-rose-600 bg-rose-50 rounded-full hover:bg-rose-100"
            title="リセット"
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
                  <div className="text-xs text-gray-400 mt-2">
                    タップで復元QR
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
              <X size={24} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">
                履歴がありません
              </p>
            ) : (
              history.map((log) => {
                const seq = log.id.split('-').pop();
                const isUndone = log.type === "tx" && undoneTxIds.has(log.id);
                return (
                  <div
                    key={log.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          {log.playerName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          {log.type !== 'reg' && ` · seq:${seq}`}
                        </span>
                      </div>
                      
                      {log.type === "reg" && (
                        <div className="text-gray-500 font-medium">
                          プレイヤー登録
                        </div>
                      )}
                      
                      {log.type === "tx" && (
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "font-bold text-lg",
                              (log.amount || 0) > 0
                                ? "text-emerald-500"
                                : "text-rose-500",
                              isUndone && "line-through opacity-50"
                            )}
                          >
                            {(log.amount || 0) > 0 ? "+" : ""}
                            {log.amount} M
                          </div>
                          {isUndone && (
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              取消済
                            </span>
                          )}
                        </div>
                      )}

                      {log.type === "undo" && (
                        <div className="text-gray-500 font-medium">
                          取消済 (seq:{log.targetSeq})
                          <span className="ml-2 font-bold">
                            {(log.amount || 0) > 0 ? "+" : ""}
                            {log.amount} M
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="使い方（銀行）"
        sections={bankHelpSections}
      />

      {/* Sync Player Modal */}
      {syncPlayer && (
        <QRDisplay
          payload={JSON.stringify({
            act: "sync",
            uuid: syncPlayer.uuid,
            name: syncPlayer.name,
            col: syncPlayer.color,
            bal: syncPlayer.balance,
            seq: getNextSeq(syncPlayer.uuid),
          })}
          title={`${syncPlayer.name} の復元用QR`}
          description="プレイヤーの端末で「銀行から復元」を選び、このQRを読み取ってもらってください"
          onClose={() => setSyncPlayer(null)}
        />
      )}
    </div>
  );
}
