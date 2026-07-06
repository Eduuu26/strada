import { tryGetSupabase } from './client';

export type MediaCategory = 'posts' | 'vehicles' | 'avatars' | 'routes' | 'meetups';

const BUCKET = 'strada-media';

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

async function sourceToBlob(source: string): Promise<{ blob: Blob; mime: string }> {
  if (source.startsWith('data:')) {
    const res = await fetch(source);
    const blob = await res.blob();
    const mime = source.slice(5, source.indexOf(';')) || blob.type || 'image/jpeg';
    return { blob, mime };
  }
  const res = await fetch(source);
  const blob = await res.blob();
  return { blob, mime: blob.type || 'image/jpeg' };
}

function extForMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

/** Sube una imagen local (data URL o uri) a Storage. URLs http(s) se devuelven sin cambios. */
export async function uploadUserImage(
  userId: string,
  category: MediaCategory,
  sourceUrl: string,
): Promise<string> {
  const trimmed = sourceUrl?.trim();
  if (!trimmed) return trimmed;
  if (isRemoteUrl(trimmed)) return trimmed;

  const sb = tryGetSupabase();
  if (!sb) return trimmed;

  const { blob, mime } = await sourceToBlob(trimmed);
  const ext = extForMime(mime);
  const path = `${userId}/${category}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw new Error('No se pudo subir la imagen. Inténtalo de nuevo.');

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
