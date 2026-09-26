/**
 * Utility for client-side image compression and resizing using HTML5 Canvas.
 * Reduces 5MB-15MB mobile camera photos to ~150KB-300KB high quality webp/jpeg data URLs
 * in fractions of a second, preventing memory bloat and sluggish uploads.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg';
}

export const compressImage = (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // If not an image, fallback to standard FileReader data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas 2d context fails
          resolve(e.target?.result as string);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch {
          // Fallback to jpeg if webp not supported by browser canvas
          try {
            const fallbackUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(fallbackUrl);
          } catch (canvasErr) {
            resolve(e.target?.result as string);
          }
        }
      };

      img.onerror = () => {
        // Fallback to original read if image object fails to load
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Batch compress multiple files with progress callback
 */
export const compressMultipleImages = async (
  files: FileList | File[],
  options?: ImageCompressionOptions,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const fileArray = Array.from(files);
  const results: string[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    try {
      const compressed = await compressImage(file, options);
      results.push(compressed);
    } catch (err) {
      console.error(`Error compressing file ${file.name}:`, err);
    }
    if (onProgress) {
      onProgress(i + 1, fileArray.length);
    }
  }

  return results;
};
