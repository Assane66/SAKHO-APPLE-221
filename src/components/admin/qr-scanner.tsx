'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Upload, Camera, AlertTriangle, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [status, setStatus] = useState<'initializing' | 'active' | 'error' | 'success'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef<boolean>(false);
  const hasScannedRef = useRef(false);
  const containerId = 'qr-camera-stream';

  // Nettoyage strict et arrêt de la caméra
  const stopCamera = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Erreur lors de l'arrêt du scanner:", err);
      } finally {
        scannerRef.current = null;
      }
    }

    // Sécurité supplémentaire : couper tout stream résiduel sur les balises vidéo
    try {
      const container = document.getElementById(containerId);
      if (container) {
        const videos = container.getElementsByTagName('video');
        for (let i = 0; i < videos.length; i++) {
          const stream = videos[i].srcObject as MediaStream;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => track.stop());
          }
          videos[i].srcObject = null;
        }
        container.innerHTML = '';
      }
    } catch {
      // Ignorer
    }
    isStoppingRef.current = false;
  }, []);

  // Fermeture complète et propre
  const handleClose = useCallback(async () => {
    await stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Succès de détection
  const handleSuccess = useCallback(async (decodedText: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    setStatus('success');
    await stopCamera();
    onScan(decodedText);
  }, [stopCamera, onScan]);

  // Démarrage du scanner avec gestion intelligente de caméra arrière / avant
  const startCamera = useCallback(async (cameraId?: string) => {
    try {
      setStatus('initializing');
      setErrorMessage(null);
      hasScannedRef.current = false;
      await stopCamera();

      // Créer une nouvelle instance Html5Qrcode
      const html5Qr = new Html5Qrcode(containerId, /* verbose= */ false);
      scannerRef.current = html5Qr;

      // Récupérer la liste des caméras disponibles pour information
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Caméra ${d.id}` })));
        }
      } catch {
        // Ignorer si échec getCameras
      }

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.78);
          return { width: size, height: size };
        },
        aspectRatio: 1.333334,
        disableFlip: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.PDF_417,
        ],
      };

      const cameraConfig = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: "environment" }; // Priorité absolue à la caméra arrière sur mobile

      try {
        await html5Qr.start(
          cameraConfig,
          qrConfig,
          (decodedText) => {
            handleSuccess(decodedText);
          },
          () => {
            // Ignorer les erreurs frame par frame
          }
        );
        setStatus('active');
      } catch (err: any) {
        // Si facingMode "environment" échoue (ex: PC portable avec une seule caméra frontale)
        console.warn("Échec environnement direct, tentative avec première caméra disponible...", err);
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const fallbackId = devices[0].id;
            setSelectedCameraId(fallbackId);
            await html5Qr.start(
              fallbackId,
              qrConfig,
              (decodedText) => {
                handleSuccess(decodedText);
              },
              () => {}
            );
            setStatus('active');
            return;
          }
        } catch (subErr) {
          console.error("Échec fallback caméra:", subErr);
        }

        setStatus('error');
        setErrorMessage("Impossible d'accéder à la caméra. Vérifiez les autorisations du navigateur ou utilisez l'import de photo.");
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage("Erreur d'initialisation du lecteur. Vous pouvez importer une photo.");
    }
  }, [stopCamera, handleSuccess]);

  // Démarrer au montage
  useEffect(() => {
    startCamera(selectedCameraId || undefined);

    return () => {
      // Nettoyage impératif au démontage
      stopCamera();
    };
  }, [startCamera, selectedCameraId, stopCamera]);

  // Importation et scan de photo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus('initializing');
      setErrorMessage(null);
      await stopCamera();

      const tempScanner = new Html5Qrcode(containerId, /* verbose= */ false);
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleSuccess(decodedText);
    } catch (err) {
      setStatus('error');
      setErrorMessage("Aucun QR code ou code-barres lisible n'a été détecté dans cette image. Veuillez essayer avec une photo plus nette.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => {
        // Empêcher la fermeture si clic dans la modal
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-card border shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        {/* Header modal */}
        <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Scanner un QR Code / IMEI</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Viewport de la caméra */}
        <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* Conteneur injecté par Html5Qrcode */}
          <div id={containerId} className="w-full h-full object-cover"></div>

          {/* Viseur moderne avec laser animé */}
          {status === 'active' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-primary/50 rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Coins renforcés */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Ligne laser animée */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_#3b82f6] animate-[scanLaser_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Overlay Initialisation */}
          {status === 'initializing' && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Activation de la caméra...</p>
            </div>
          )}

          {/* Overlay Succès */}
          {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
              <p className="text-base font-bold">Code scanné avec succès !</p>
            </div>
          )}

          {/* Overlay Erreur */}
          {status === 'error' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => startCamera(selectedCameraId || undefined)} 
                className="gap-2 text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Réessayer la caméra
              </Button>
            </div>
          )}
        </div>

        {/* Footer & Contrôles */}
        <div className="p-4 bg-muted/20 border-t space-y-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2 text-xs" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Importer une photo
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />

            {cameras.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                title="Changer de caméra"
                onClick={() => {
                  const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  setSelectedCameraId(cameras[nextIndex].id);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
            <ImageIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              Pointez la caméra arrière sur l&apos;étiquette du code-barres ou du QR code IMEI. Vous pouvez aussi téléverser une photo claire.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanLaser {
          0% { transform: translateY(0px); opacity: 0.8; }
          50% { transform: translateY(240px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
