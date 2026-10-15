// ==============================================================================
// CARVLAK GROUP - SUPABASE STORAGE HELPER & IMAGE OPTIMIZER
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { compressImage } from './imageCompressor';

const BUCKET_NAME = 'media';

/**
 * Convierte un Data URL (base64) a un objeto Blob nativo
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/webp';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Comprime una imagen en el navegador y la sube a Supabase Storage
 * NUNCA almacena base64 en la base de datos; devuelve la URL pública.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'vehicles' | 'quotes' | 'inspections' | 'templates' = 'vehicles',
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<string> {
  try {
    // 1. Comprimir en cliente con HTML5 Canvas para optimizar peso (máx ~250KB)
    const compressedDataUrl = await compressImage(file, {
      maxWidth: options?.maxWidth || 1600,
      maxHeight: options?.maxHeight || 1600,
      quality: options?.quality || 0.82,
      format: 'image/webp'
    });

    const blob = dataUrlToBlob(compressedDataUrl);

    // 2. Si Supabase está disponible, subir al bucket 'media'
    if (isSupabaseConfigured && supabase) {
      const fileName = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (error) {
        console.warn('Error subiendo imagen a Supabase Storage:', error.message);
        // Fallback a URL comprimida temporal
        return compressedDataUrl;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    }

    // Modo sin conexión o desarrollo local: retornar data URL comprimido
    return compressedDataUrl;
  } catch (err) {
    console.error('Fallo en uploadImageToStorage:', err);
    throw err;
  }
}

/**
 * Descarga una imagen remota (ej: fotos de Tiendanube) y la almacena en el bucket propio de Supabase
 * Esto garantiza persistencia y evita fallas de CORS en el canvas de Redes Sociales.
 */
export async function copyRemoteImageToStorage(
  remoteUrl: string,
  folder: 'catalog' | 'tiendanube' = 'tiendanube'
): Promise<string> {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl;

  // Si ya está en nuestro Supabase Storage, retornar directamente
  if (remoteUrl.includes('supabase.co/storage/v1/object/public')) {
    return remoteUrl;
  }

  if (!isSupabaseConfigured || !supabase) {
    return remoteUrl;
  }

  try {
    const res = await fetch(remoteUrl, { mode: 'cors' });
    if (!res.ok) return remoteUrl;

    const blob = await res.blob();
    const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpeg';
    const fileName = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: blob.type || 'image/webp',
        upsert: true
      });

    if (error) {
      console.warn('No se pudo copiar foto remota a Storage:', error.message);
      return remoteUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    // Si falla por CORS u otro motivo, mantener la URL remota original para no interrumpir el flujo
    return remoteUrl;
  }
}

/**
 * Sube la imagen renderizada final del canvas de redes sociales a Supabase Storage (bucket media/social)
 * NUNCA almacena base64 en la base de datos; devuelve la URL pública.
 */
export async function uploadSocialImageToStorage(
  blob: Blob,
  fileNamePrefix: string = 'post'
): Promise<string> {
  const safePrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `social/${safePrefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);
        return publicUrlData.publicUrl;
      }
      if (error) {
        console.warn('Error subiendo imagen social a Supabase Storage:', error.message);
      }
    } catch (err) {
      console.warn('Fallo en uploadSocialImageToStorage:', err);
    }
  }

  // Fallback offline a Data URL para desarrollo local sin conexión
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Sube un archivo de video vertical (time-lapse) a Supabase Storage con validación de peso y progreso.
 * Límite recomendado: 25MB, límite máximo: 50MB.
 */
export async function uploadVideoToStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('El video supera el límite de 50MB. Por favor comprimilo o subí una versión más corta.');
  }

  // Notificar progreso inicial
  onProgress?.(10);

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const cleanExt = ['mp4', 'webm', 'mov', 'm4v'].includes(ext) ? ext : 'mp4';
      const fileName = `videos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${cleanExt}`;

      onProgress?.(30);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          contentType: file.type || `video/${cleanExt}`,
          upsert: true
        });

      onProgress?.(80);

      if (error) {
        console.warn('Error subiendo video a Supabase Storage:', error.message);
        throw new Error(`No se pudo subir el video a Supabase: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      onProgress?.(100);
      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error('Error en uploadVideoToStorage:', err);
      throw err;
    }
  }

  // Modo offline / local: Generar object URL para previsualizar inmediatamente
  onProgress?.(100);
  return URL.createObjectURL(file);
}
