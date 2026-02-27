import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isScanning: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

export function QRScanner({ onScan, isScanning }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(isScanning);
  const onScanRef = useRef(onScan);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Sync props to refs to avoid re-running the camera effect
  useEffect(() => {
    isScanningRef.current = isScanning;
    onScanRef.current = onScan;
  }, [isScanning, onScan]);

  // Fetch available cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // By default, try to find a back camera, otherwise use the first one
          const backCamera = devices.find((d) => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("背面")
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
      });
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    const startScanning = async () => {
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }

        if (scannerRef.current) {
          await scannerRef.current.start(
            selectedCameraId, // Use specific camera ID instead of facingMode
            {
              fps: 10,
              // We omit qrbox so html5-qrcode doesn't draw its own dark overlay.
              // We also force aspect ratio to 1.0 so it fills our square container nicely.
              aspectRatio: 1.0,
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
      // Don't stop here unless unmounting, because changing camera triggers this cleanup
      // we handled stop() before start() above instead.
    };
  }, [selectedCameraId]); // Re-run when selected camera changes

  // Cleanup on final unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-3xl bg-gray-900 border-4 border-gray-200 shadow-inner mb-4">
        <div id="qr-reader" className="w-full h-full [&_video]:object-cover" />
        <div className="absolute inset-0 border-[40px] border-black/40 z-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border-4 border-white/50 rounded-2xl z-20 pointer-events-none" />
      </div>

      {cameras.length > 1 && (
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="max-w-sm w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium truncate"
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `カメラ ${camera.id}`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
