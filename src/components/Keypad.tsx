import { useState } from "react";
import { cn } from "../utils/cn";
import { Delete } from "lucide-react";

interface KeypadProps {
  onPay: (amount: number) => void;
  onReceive: (amount: number) => void;
}

export function Keypad({ onPay, onReceive }: KeypadProps) {
  const [value, setValue] = useState<string>("");

  const handleKey = (key: string) => {
    if (value.length >= 6) return; // Prevent huge numbers
    if (value === "0" && key === "0") return;
    setValue((v) => (v === "0" ? key : v + key));
  };

  const handleDelete = () => {
    setValue((v) => v.slice(0, -1));
  };

  const handleClear = () => {
    setValue("");
  };

  const amount = parseInt(value || "0", 10);

  const buttonClass =
    "w-full h-20 rounded-2xl bg-white shadow-sm border border-gray-100 text-2xl font-semibold text-gray-800 flex items-center justify-center active:bg-gray-100 active:scale-95 transition-all select-none touch-none";

  return (
    <div className="w-full px-4 pb-6 space-y-4">
      {/* Display */}
      <div className="bg-gray-100 rounded-2xl p-4 min-h-[80px] flex items-end justify-end shadow-inner relative">
        <div className="absolute top-4 left-6 text-gray-400 font-medium">
          金額
        </div>
        <div className="text-5xl font-bold tracking-tight text-gray-900 truncate flex items-center">
          <span className="text-gray-400 mr-2 text-3xl">M</span>
          {amount.toLocaleString()}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKey(num.toString())}
            className={buttonClass}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className={cn(buttonClass, "text-rose-500 font-bold text-lg")}
        >
          C
        </button>
        <button onClick={() => handleKey("0")} className={buttonClass}>
          0
        </button>
        <button
          onClick={handleDelete}
          className={cn(buttonClass, "text-gray-500")}
        >
          <Delete size={28} />
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          disabled={amount === 0}
          onClick={() => {
            onPay(amount);
            setValue("");
          }}
          className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-50 disabled:active:bg-rose-500 text-white font-bold rounded-2xl py-5 text-xl shadow-md active:scale-95 transition-all"
        >
          支払う (-M)
        </button>
        <button
          disabled={amount === 0}
          onClick={() => {
            onReceive(amount);
            setValue("");
          }}
          className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:active:bg-emerald-500 text-white font-bold rounded-2xl py-5 text-xl shadow-md active:scale-95 transition-all"
        >
          貰う (+M)
        </button>
      </div>
    </div>
  );
}
