import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X } from 'lucide-react';
import type { PhotoAsset } from '../types/driver';
import { processCanvasCapture } from '../utils/imageProcessor';

interface CameraCaptureModalProps {
  isOpen: boolean;
  title: string;
  filePrefix: string;
  onCapture: (photo: PhotoAsset) => void;
  onFallbackToFile: () => void;
  onClose: () => void;
}

export function CameraCaptureModal({
  isOpen,
  title,
  filePrefix,
  onCapture,
  onFallbackToFile,
  onClose,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setErrorMsg(null);
    setIsReady(false);

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setErrorMsg('Tu navegador no permite abrir la cámara directamente desde aquí.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setErrorMsg(
            'No se pudo iniciar la cámara. Verifica los permisos o selecciona una imagen desde tus archivos.'
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  function handleTakePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const maxDim = 1400;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height / width) * maxDim);
        width = maxDim;
      } else {
        width = Math.round((width / height) * maxDim);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const asset = processCanvasCapture(canvas, filePrefix);
    onCapture(asset);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            aria-label="Cerrar cámara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {errorMsg ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 text-slate-700 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{errorMsg}</p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToFile();
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Elegir imagen</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-200">
                    Iniciando cámara...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>Cambiar cámara</span>
                </button>

                <button
                  type="button"
                  disabled={!isReady}
                  onClick={handleTakePhoto}
                  className="min-h-[48px] flex-1 px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Tomar fotografía</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
