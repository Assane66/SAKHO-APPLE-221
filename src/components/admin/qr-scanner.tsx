'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Upload, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Utiliser la caméra arrière par défaut
        videoConstraints: {
            facingMode: "environment"
        }
      },
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

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear scanner", error);
      });
    };
  }, [onScan]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
    } catch (err) {
      setError("Impossible de lire le QR code dans cette image.");
    }
  };

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
        
        <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Uploader une photo
                </Button>
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-500 flex items-start gap-2">
                <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Placez le QR code de l'iPhone devant la caméra arrière ou uploadez une photo pour l'identifier automatiquement.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
