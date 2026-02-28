import { useEffect, useCallback, type ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";

export interface HelpSection {
  title: string;
  /** Tailwind border color class, e.g. "border-indigo-500" */
  borderColor: string;
  content: ReactNode;
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: HelpSection[];
}

export function HelpModal({ open, onClose, title, sections }: HelpModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <HelpCircle size={24} className="mr-2 text-indigo-500" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {sections.map((section, i) => (
            <section key={i}>
              <h3
                className={`font-bold text-gray-800 mb-2 border-l-4 ${section.borderColor} pl-2`}
              >
                {section.title}
              </h3>
              <div className="text-sm text-gray-600 leading-relaxed">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
