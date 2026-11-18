import type { PhotoAsset } from '../types/driver';

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.84;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return 0;
  const base64 = dataUrl.slice(commaIdx + 1);
  return Math.floor((base64.length * 3) / 4);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen seleccionada.'));
    };
    img.src = objectUrl;
  });
}

export async function processImageFile(file: File): Promise<PhotoAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido (JPG, PNG o WEBP).');
  }

  const img = await loadImageFromFile(file);
  const { naturalWidth, naturalHeight } = img;

  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (naturalWidth > MAX_DIMENSION || naturalHeight > MAX_DIMENSION) {
    if (naturalWidth >= naturalHeight) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.round((naturalHeight / naturalWidth) * MAX_DIMENSION);
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.round((naturalWidth / naturalHeight) * MAX_DIMENSION);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo procesar la fotografía en este navegador.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    dataUrl,
    fileName: file.name || 'fotografia.jpg',
    sizeBytes: estimateBase64Bytes(dataUrl),
  };
}

export function processCanvasCapture(canvas: HTMLCanvasElement, baseName: string): PhotoAsset {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  return {
    dataUrl,
    fileName: `${baseName}-${Date.now()}.jpg`,
    sizeBytes: estimateBase64Bytes(dataUrl),
  };
}
