import { QRCodeSVG } from "qrcode.react";
import { X, Check } from "lucide-react";

interface QRDisplayProps {
  payload: string;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
}

export function QRDisplay({
  payload,
  onClose,
  onConfirm,
  title = "銀行にかざしてください",
}: QRDisplayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-6 pb-6 flex flex-col items-center flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            {title}
          </h2>

          <div className="bg-white p-2 rounded-xl shadow-inner border-2 border-gray-100 mb-4 w-full aspect-square flex items-center justify-center">
            <QRCodeSVG
              value={payload}
              className="w-full h-full"
              level="M"
              includeMargin={false}
            />
          </div>
          
          <p className="text-gray-500 text-sm font-medium text-center mt-2 leading-relaxed">
            銀行端末で読み取ってもらった後、<br />
            完了ボタンを押してください
          </p>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <X size={20} className="mr-2" />
            キャンセル
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose(); // Fallback if onConfirm is not provided
            }}
            className="flex items-center justify-center py-4 rounded-xl font-bold text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Check size={20} className="mr-2" />
            読取完了
          </button>
        </div>
      </div>
    </div>
  );
}
