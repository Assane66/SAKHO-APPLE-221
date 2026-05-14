'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (errorMessage) => {
        // On ignore les erreurs de scan continuelles
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold">Scanner un IMEI (QR Code)</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div id="qr-reader" className="w-full"></div>
        {error && <p className="p-4 text-red-500 text-sm">{error}</p>}
        <div className="p-4 bg-gray-50 text-xs text-gray-500">
          Placez le QR code de l'iPhone devant la caméra pour l'identifier automatiquement.
        </div>
      </div>
    </div>
  );
}
