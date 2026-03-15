'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [hardwareScanDetected, setHardwareScanDetected] = useState(false);

  const scanBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Hardware scanner: listen for rapid keypress events
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      if (e.key === 'Enter' && scanBufferRef.current.length > 2) {
        e.preventDefault();
        const scannedValue = scanBufferRef.current.trim();
        scanBufferRef.current = '';
        lastKeyTimeRef.current = 0;
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

        setHardwareScanDetected(true);
        setTimeout(() => {
          stopCamera();
          onScan(scannedValue);
        }, 300);
        return;
      }

      if (e.key.length !== 1) return;

      if (timeDiff < 50 && scanBufferRef.current.length > 0) {
        scanBufferRef.current += e.key;
        e.preventDefault();
      } else if (timeDiff > 200 || scanBufferRef.current.length === 0) {
        scanBufferRef.current = e.key;
      } else {
        scanBufferRef.current += e.key;
      }

      lastKeyTimeRef.current = now;

      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => {
        scanBufferRef.current = '';
      }, 100);
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [onScan, stopCamera]);

  useEffect(() => {
    let animationId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if ('BarcodeDetector' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'qr_code'],
          });
          setScanning(true);
          scanFrame();
        }
      } catch {
        setCameraAvailable(false);
      }
    }

    async function scanFrame() {
      if (!videoRef.current || !detector) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          if (value) {
            stopCamera();
            onScan(value);
            return;
          }
        }
      } catch {
        // Ignore detection errors
      }
      animationId = requestAnimationFrame(scanFrame);
    }

    startCamera();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [onScan, stopCamera]);

  function handleManualSubmit() {
    if (manualInput.trim()) {
      stopCamera();
      onScan(manualInput.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">바코드 스캔</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {hardwareScanDetected && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-medium">스캐너 인식 완료</p>
            </div>
          )}

          {cameraAvailable ? (
            <div className="relative mb-4 bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-2 border-[#E1431B] rounded-xl opacity-70" />
                </div>
              )}
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
                {scanning ? '바코드를 스캔 영역에 맞추세요' : '카메라 활성화 중...'}
              </p>
            </div>
          ) : (
            <div className="mb-4 p-6 bg-gray-50 rounded-xl text-center">
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-sm text-gray-500">카메라를 사용할 수 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">아래에 코드를 직접 입력하세요</p>
            </div>
          )}

          <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 text-center flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              바코드를 스캔하세요 (카메라 또는 스캐너)
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSubmit();
              }}
              placeholder="코드를 직접 입력 (예: PT-0001)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
              autoFocus={!cameraAvailable}
            />
            <button
              onClick={handleManualSubmit}
              className="px-4 py-2.5 bg-[#E1431B] text-white text-sm font-medium rounded-xl hover:bg-[#c9391a] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
