import { Platform } from 'react-native';
import { sanitizeImageUrl } from './security/sanitize';
import {
  assertVehiclePhotoSize,
  estimateDataUrlBytes,
  MAX_VEHICLE_PHOTO_BYTES,
} from './security/vehiclePhotoValidation';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.82;

function compressUntilUnderLimit(dataUrl: string, maxW = MAX_WIDTH, quality = JPEG_QUALITY): Promise<string> {
  return compressDataUrl(dataUrl, maxW, quality).then(async (compressed) => {
    if (estimateDataUrlBytes(compressed) <= MAX_VEHICLE_PHOTO_BYTES) return compressed;
    if (quality <= 0.45) {
      throw new Error('La foto supera 6 MB incluso comprimida. Elige otra imagen.');
    }
    return compressUntilUnderLimit(compressed, Math.floor(maxW * 0.85), quality - 0.12);
  });
}

function compressDataUrl(dataUrl: string, maxW = MAX_WIDTH, quality = JPEG_QUALITY): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = (h * maxW) / w;
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
    img.src = dataUrl;
  });
}

function pickWebImage(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onWindowFocus);
      clearTimeout(focusTimer);
      clearTimeout(safetyTimer);
      resolve(value);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onWindowFocus);
      clearTimeout(focusTimer);
      clearTimeout(safetyTimer);
      reject(error);
    };

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      if (!file.type.startsWith('image/')) {
        finish(null);
        return;
      }
      if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
        fail(new Error('La foto supera 6 MB. Elige otra imagen más ligera.'));
        return;
      }
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res, rej) => {
          reader.onload = () => res(String(reader.result));
          reader.onerror = () => rej(new Error('read failed'));
          reader.readAsDataURL(file);
        });
        const compressed = await compressUntilUnderLimit(dataUrl);
        assertVehiclePhotoSize(compressed);
        finish(sanitizeImageUrl(compressed) || null);
      } catch (err) {
        if (err instanceof Error && err.message.includes('6 MB')) {
          fail(err);
          return;
        }
        finish(null);
      }
    };

    // Chrome 113+ y otros navegadores modernos
    input.addEventListener('cancel', () => finish(null));

    // Si cierran el diálogo sin elegir archivo, la ventana recupera el foco
    const onWindowFocus = () => {
      focusTimer = window.setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 400);
    };

    let focusTimer: ReturnType<typeof setTimeout>;
    const safetyTimer = window.setTimeout(() => finish(null), 120_000);

    input.click();
    // Esperar a que el diálogo esté abierto antes de escuchar el foco
    window.setTimeout(() => {
      if (!settled) window.addEventListener('focus', onWindowFocus);
    }, 400);
  });
}

/** Abre galería (web o nativo) y devuelve data URL o uri de la foto. */
export async function pickVehiclePhotoFromLibrary(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickWebImage();
  }

  const ImagePicker = await import('expo-image-picker');
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: JPEG_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg';
    const dataUrl = `data:${mime};base64,${asset.base64}`;
    try {
      assertVehiclePhotoSize(dataUrl);
    } catch {
      return null;
    }
    return sanitizeImageUrl(dataUrl) || asset.uri || null;
  }
  return sanitizeImageUrl(asset.uri) || asset.uri || null;
}

export async function takeVehiclePhoto(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickWebImage();
  }

  const ImagePicker = await import('expo-image-picker');
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: JPEG_QUALITY,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg';
    const dataUrl = `data:${mime};base64,${asset.base64}`;
    try {
      assertVehiclePhotoSize(dataUrl);
    } catch {
      return null;
    }
    return sanitizeImageUrl(dataUrl) || asset.uri || null;
  }
  return sanitizeImageUrl(asset.uri) || asset.uri || null;
}
