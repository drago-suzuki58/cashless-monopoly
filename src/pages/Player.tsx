import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, RefreshCw, X } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { Keypad } from '../components/Keypad';
import { QRDisplay } from '../components/QRDisplay';
import { QRScanner } from '../components/QRScanner';
import { cn } from '../utils/cn';
import type { RegisterPayload, TransactionPayload, UndoPayload, SyncPayload } from '../types';

const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
];

export default function Player() {
  const { profile, setProfile, addTransaction, addUndo, history } = usePlayerStore();
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0].hex);
  const [initialBalance, setInitialBalance] = useState('1500');
  
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState('');
  
  const [showHistory, setShowHistory] = useState(false);
  const [isScanningSync, setIsScanningSync] = useState(false);

  const handleScanSync = (text: string) => {
    try {
      const data = JSON.parse(text) as SyncPayload;
      if (data.act === 'sync') {
        usePlayerStore.getState().recoverProfile(data.uuid, data.name, data.col, data.seq);
        setIsScanningSync(false);
      }
    } catch (e) {
      // Ignore invalid QR
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const bal = parseInt(initialBalance, 10) || 1500;
    setProfile(name.trim(), color, bal);
    
    // Fetch updated profile
    const currentProfile = usePlayerStore.getState().profile!;
    const payload: RegisterPayload = {
      uuid: currentProfile.uuid,
      act: 'reg',
      name: name.trim(),
      col: color,
      bal,
    };
    setQrPayload(JSON.stringify(payload));
    setQrTitle('登録用QRコード');
  };

  const showRegQR = () => {
    if (!profile) return;
    const payload: RegisterPayload = {
      uuid: profile.uuid,
      act: 'reg',
      name: profile.name,
      col: profile.color,
      bal: profile.initialBalance,
    };
    setQrPayload(JSON.stringify(payload));
    setQrTitle('登録用QRコード');
  };

  const handlePay = (amount: number) => {
    if (!profile) return;
    const seq = addTransaction(-amount);
    const payload: TransactionPayload = {
      uuid: profile.uuid,
      act: 'tx',
      amt: -amount,
      seq,
    };
    setQrPayload(JSON.stringify(payload));
    setQrTitle(`M ${amount.toLocaleString()} 支払う`);
  };

  const handleReceive = (amount: number) => {
    if (!profile) return;
    const seq = addTransaction(amount);
    const payload: TransactionPayload = {
      uuid: profile.uuid,
      act: 'tx',
      amt: amount,
      seq,
    };
    setQrPayload(JSON.stringify(payload));
    setQrTitle(`M ${amount.toLocaleString()} 貰う`);
  };

  const handleUndo = (targetSeq: number) => {
    if (!profile) return;
    const seq = addUndo(targetSeq);
    const payload: UndoPayload = {
      uuid: profile.uuid,
      act: 'undo',
      tgt: targetSeq,
      seq,
    };
    setQrPayload(JSON.stringify(payload));
    setQrTitle(`取引 (seq:${targetSeq}) を取消`);
    setShowHistory(false);
  };

  // ----- Registration View -----
  if (!profile) {
    if (isScanningSync) {
      return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-6">
          <header className="flex items-center mb-8">
            <button onClick={() => setIsScanningSync(false)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2">銀行から復元</h1>
          </header>
          <div className="flex-1 flex flex-col items-center">
            <QRScanner onScan={handleScanSync} isScanning={true} />
            <p className="mt-8 text-sm font-bold text-gray-500 text-center">
              銀行の画面でプレイヤーパネルをタップし、<br/>復元用QRを表示して読み取ってください。
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-gray-50 p-6">
        <header className="flex items-center mb-8">
          <Link to="/" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold ml-2">プレイヤー登録</h1>
        </header>

        <form onSubmit={handleRegister} className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">名前</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-lg p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Alice"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">テーマカラー</label>
            <div className="flex flex-wrap gap-4">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={cn(
                    "w-12 h-12 rounded-full border-4 transition-transform",
                    color === c.hex ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">初期残高 (M)</label>
            <input 
              type="number" 
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full text-lg p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-8 bg-gray-900 text-white font-bold py-4 rounded-xl shadow hover:bg-gray-800 active:scale-95 transition-all"
          >
            登録して開始する
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-sm text-gray-500 font-medium">または</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsScanningSync(true)}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
          >
            銀行からデータを復元する
          </button>
        </form>
      </div>
    );
  }

  // ----- Main View -----
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-h-screen overflow-hidden relative">
      <header className="flex items-center p-4 bg-white shadow-sm border-b border-gray-100 z-10 shrink-0">
        <Link to="/" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="ml-2 flex items-center flex-1">
          <div 
            className="w-4 h-4 rounded-full mr-2 shadow-inner" 
            style={{ backgroundColor: profile.color }} 
          />
          <span className="font-bold text-gray-800 truncate">{profile.name}</span>
        </div>
        <button 
          onClick={showRegQR}
          className="p-2 text-indigo-600 bg-indigo-50 rounded-full mr-2 hover:bg-indigo-100 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <History size={20} />
        </button>
      </header>
      
      <main className="flex-1 flex flex-col pt-4 bg-gray-50 relative min-h-0">
        <Keypad onPay={handlePay} onReceive={handleReceive} />
      </main>

      {/* QR Code Modal */}
      {qrPayload && (
        <QRDisplay 
          payload={qrPayload} 
          title={qrTitle} 
          onClose={() => setQrPayload(null)} 
        />
      )}

      {/* History Slide-over */}
      {showHistory && (
        <div className="absolute inset-0 z-40 flex flex-col bg-gray-50 animate-in slide-in-from-bottom-full duration-300">
          <header className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0">
            <h2 className="text-xl font-bold text-gray-800">取引履歴</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <X size={24} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">履歴がありません</p>
            ) : (
              history.map((log) => (
                <div key={log.seq} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(log.timestamp).toLocaleTimeString()} · seq:{log.seq}
                    </div>
                    {log.type === 'tx' ? (
                      <div className={cn(
                        "font-bold text-lg",
                        (log.amount || 0) > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {log.amount! > 0 ? '+' : ''}{log.amount} M
                      </div>
                    ) : (
                      <div className="text-gray-500 font-medium">
                        取消済 (seq:{log.targetSeq})
                      </div>
                    )}
                  </div>
                  {log.type === 'tx' && !log.isUndone && (
                    <button 
                      onClick={() => handleUndo(log.seq)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                    >
                      取消
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
