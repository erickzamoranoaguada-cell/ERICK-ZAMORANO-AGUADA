import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AlertCircle, Camera, Eye, Image as ImageIcon, RefreshCw, Trash2, X } from 'lucide-react';
import type { PhotoAsset } from '../types/driver';
import { formatBytes, processImageFile } from '../utils/imageProcessor';
import { CameraCaptureModal } from './CameraCaptureModal';

interface PhotoUploadCardProps {
  id: string;
  label: string;
  helperText: string;
  filePrefix: string;
  value: PhotoAsset | null;
  error?: string;
  onChange: (photo: PhotoAsset | null) => void;
}

function isCoarseTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarsePointer || mobileUa;
}

export function PhotoUploadCard({
  id,
  label,
  helperText,
  filePrefix,
  value,
  error,
  onChange,
}: PhotoUploadCardProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  async function handleFileSelection(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLocalError(null);
    setIsProcessing(true);

    try {
      const processed = await processImageFile(file);
      onChange(processed);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'No se pudo cargar la fotografía seleccionada.'
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCameraAction() {
    setLocalError(null);
    if (isCoarseTouchDevice()) {
      cameraInputRef.current?.click();
      return;
    }
    setIsCameraModalOpen(true);
  }

  function handleGalleryAction() {
    setLocalError(null);
    galleryInputRef.current?.click();
  }

  const displayedError = localError || error;

  return (
    <div
      id={id}
      className={`rounded-2xl border bg-white p-4 sm:p-5 transition-colors ${
        displayedError ? 'border-red-400' : 'border-slate-200'
      }`}
    >
      <div className="space-y-1 mb-3.5">
        <label className="block text-sm font-semibold text-slate-900">
          {label} <span className="text-orange-700" aria-hidden="true">*</span>
        </label>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{helperText}</p>
      </div>

      {/* Hidden inputs: one with capture for native mobile camera, one without for gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelection}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelection}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img
              src={value.dataUrl}
              alt={`Vista previa: ${label}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-2.5 right-2.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
              aria-label={`Ampliar vista previa de ${label}`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Ampliar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="truncate max-w-[220px] font-medium text-slate-700">
              {value.fileName}
            </span>
            <span className="font-mono tabular-nums">{formatBytes(value.sizeBytes)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCameraAction}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 text-orange-700 shrink-0" />
              <span>Reemplazar (cámara)</span>
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleGalleryAction}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              <ImageIcon className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Elegir otra</span>
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onChange(null)}
              className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-700 inline-flex items-center justify-center transition-colors"
              aria-label={`Eliminar ${label}`}
              title="Quitar fotografía"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-3">
          {isProcessing ? (
            <div className="py-6 text-center text-sm text-slate-600">
              Procesando fotografía...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCameraAction}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Tomar foto</span>
              </button>
              <button
                type="button"
                onClick={handleGalleryAction}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-800 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
              >
                <ImageIcon className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Elegir de galería</span>
              </button>
            </div>
          )}
        </div>
      )}

      {displayedError && (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{displayedError}</span>
        </p>
      )}

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        title={label}
        filePrefix={filePrefix}
        onCapture={(photo) => {
          setLocalError(null);
          onChange(photo);
        }}
        onFallbackToFile={() => galleryInputRef.current?.click()}
        onClose={() => setIsCameraModalOpen(false)}
      />

      {isLightboxOpen && value && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada: ${label}`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900 truncate">{label}</p>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={value.dataUrl}
                alt={`Vista ampliada: ${label}`}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
