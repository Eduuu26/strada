import { Platform } from 'react-native';
import { DEFAULT_VEHICLE_PHOTOS, VEHICLE_PHOTO_PRESETS } from '../../data/vehiclePhotoAssets';
import type { VehicleType } from '../../types';

export const MAX_VEHICLE_PHOTO_BYTES = 6 * 1024 * 1024;
export const MAX_VEHICLE_PHOTO_MB = 6;

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const KNOWN_PHOTO_URLS = new Set([
  ...Object.values(DEFAULT_VEHICLE_PHOTOS),
  ...VEHICLE_PHOTO_PRESETS.map((p) => p.url),
]);

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  const base64 = dataUrl.slice(comma + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function assertVehiclePhotoSize(url: string): void {
  if (!url.startsWith('data:image/')) return;
  const bytes = estimateDataUrlBytes(url);
  if (bytes > MAX_VEHICLE_PHOTO_BYTES) {
    throw new Error(`La foto supera ${MAX_VEHICLE_PHOTO_MB} MB. Elige otra imagen más ligera.`);
  }
}

function isKnownVehiclePhotoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (KNOWN_PHOTO_URLS.has(trimmed)) return true;
  return /^https?:\/\//i.test(trimmed);
}

function isSkinTone(r: number, g: number, b: number): boolean {
  return r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;
}

type ImageMetrics = {
  skinRatio: number;
  variance: number;
  edgeScore: number;
  aspect: number;
  bottomDarkRatio: number;
};

function analyzeCanvasPixels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): ImageMetrics {
  const sampleW = 24;
  const sampleH = 18;
  const data = ctx.getImageData(0, 0, width, height).data;
  let skin = 0;
  let total = 0;
  let sum = 0;
  let sumSq = 0;
  let edges = 0;
  let bottomDark = 0;
  let bottomTotal = 0;

  for (let sy = 0; sy < sampleH; sy += 1) {
    for (let sx = 0; sx < sampleW; sx += 1) {
      const x = Math.floor((sx / (sampleW - 1)) * (width - 1));
      const y = Math.floor((sy / (sampleH - 1)) * (height - 1));
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      total += 1;
      sum += lum;
      sumSq += lum * lum;
      if (isSkinTone(r, g, b)) skin += 1;
      if (y > height * 0.66) {
        bottomTotal += 1;
        if (lum < 85) bottomDark += 1;
      }
      if (x > 0 && y > 0) {
        const li = ((y - 1) * width + (x - 1)) * 4;
        const lr = data[li];
        const lg = data[li + 1];
        const lb = data[li + 2];
        const prevLum = 0.299 * lr + 0.587 * lg + 0.114 * lb;
        if (Math.abs(lum - prevLum) > 28) edges += 1;
      }
    }
  }

  const mean = sum / Math.max(total, 1);
  const variance = sumSq / Math.max(total, 1) - mean * mean;

  return {
    skinRatio: skin / Math.max(total, 1),
    variance,
    edgeScore: edges / Math.max(total, 1),
    aspect: width / Math.max(height, 1),
    bottomDarkRatio: bottomDark / Math.max(bottomTotal, 1),
  };
}

function evaluateMetrics(metrics: ImageMetrics, expectedType: VehicleType): string | null {
  if (metrics.skinRatio > 0.34) {
    return 'La imagen parece una persona u otra cosa, no un vehículo.';
  }
  if (metrics.variance < 180) {
    return 'La imagen no parece una foto real de un vehículo.';
  }
  const vehicleScore = metrics.edgeScore * 0.55 + metrics.bottomDarkRatio * 0.25 + Math.min(metrics.variance / 900, 1) * 0.2;
  if (vehicleScore < 0.22) {
    return 'No detectamos un coche o moto en la foto. Sube una imagen clara de tu vehículo.';
  }

  if (expectedType === 'coche' && metrics.aspect < 0.75) {
    return 'La foto no parece un coche. Comprueba el tipo de vehículo seleccionado.';
  }
  if (expectedType === 'moto' && metrics.aspect > 2.4 && metrics.edgeScore < 0.12) {
    return 'La foto no parece una moto. Comprueba el tipo de vehículo seleccionado.';
  }

  return null;
}

function validateOnWeb(url: string, expectedType: VehicleType): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
        resolve(`La foto es demasiado pequeña (mín. ${MIN_WIDTH}×${MIN_HEIGHT} px).`);
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        const maxSide = 640;
        let w = img.width;
        let h = img.height;
        if (w > maxSide) {
          h = (h * maxSide) / w;
          w = maxSide;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const metrics = analyzeCanvasPixels(ctx, w, h);
        resolve(evaluateMetrics(metrics, expectedType));
      } catch {
        resolve('No se pudo analizar la imagen.');
      }
    };
    img.onerror = () => resolve('No se pudo cargar la imagen.');
    img.src = url;
  });
}

function validateOnNative(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const { Image: RNImage } = require('react-native');
      RNImage.getSize(
        url,
        (width: number, height: number) => {
          if (width < MIN_WIDTH || height < MIN_HEIGHT) {
            resolve(`La foto es demasiado pequeña (mín. ${MIN_WIDTH}×${MIN_HEIGHT} px).`);
            return;
          }
          resolve(null);
        },
        () => resolve('No se pudo cargar la imagen.'),
      );
    } catch {
      resolve(null);
    }
  });
}

/** Valida tamaño y, en web, que la imagen parezca un vehículo del tipo indicado. */
export async function validateVehiclePhoto(
  url: string,
  expectedType: VehicleType,
): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return 'Sube al menos una foto de tu coche o moto.';
  if (isKnownVehiclePhotoUrl(trimmed) && !trimmed.startsWith('data:')) return null;

  try {
    assertVehiclePhotoSize(trimmed);
  } catch (e) {
    return e instanceof Error ? e.message : 'Foto demasiado grande.';
  }

  if (Platform.OS === 'web' && trimmed.startsWith('data:image/')) {
    return validateOnWeb(trimmed, expectedType);
  }

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('file:') || trimmed.startsWith('content:')) {
    return validateOnNative(trimmed);
  }

  return null;
}
