import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface QRDisplayProps {
  payload: string;
  onClose: () => void;
  title?: string;
}

export function QRDisplay({ payload, onClose, title = "銀行にかざしてください" }: QRDisplayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
        >
          <X size={24} />
        </button>
        
        <div className="p-8 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
          
          <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-gray-100">
            <QRCodeSVG 
              value={payload} 
              size={240}
              level="M"
              includeMargin={false}
            />
          </div>
          
          <p className="mt-8 text-gray-500 text-sm text-center">
            読み取られると自動的に<br/>画面が閉じます（未実装の場合は×で閉じてください）
          </p>
        </div>
      </div>
    </div>
  );
}
