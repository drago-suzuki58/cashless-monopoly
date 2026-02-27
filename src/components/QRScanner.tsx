import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isScanning: boolean;
}

export function QRScanner({ onScan, isScanning }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(isScanning);
  const onScanRef = useRef(onScan);

  // Sync props to refs to avoid re-running the camera effect
  useEffect(() => {
    isScanningRef.current = isScanning;
    onScanRef.current = onScan;
  }, [isScanning, onScan]);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    const startScanning = async () => {
      try {
        if (scannerRef.current && !scannerRef.current.isScanning) {
          await scannerRef.current.start(
            { facingMode: "user" }, // Use front camera typically for a tablet/kiosk looking at players
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              if (isScanningRef.current) {
                onScanRef.current(decodedText);
              }
            },
            () => {
              // Ignore scan failures (happens on every frame without a QR)
            },
          );
        }
      } catch (err) {
        console.error("Camera start failed", err);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []); // Run only once on mount

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-3xl bg-gray-900 border-4 border-gray-200 shadow-inner">
      <div id="qr-reader" className="w-full h-full" />
      <div className="absolute inset-0 border-[40px] border-black/40 z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border-4 border-white/50 rounded-2xl z-20 pointer-events-none" />
    </div>
  );
}
