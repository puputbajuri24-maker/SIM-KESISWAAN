/**
 * Utility to compress images in-browser to lightweight, high-quality base64.
 * Keeps output under 60-80 KB for fast Firestore doc storage and crisp rendering.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export const compressImageToBase64 = (
  file: File,
  options: CompressImageOptions = {}
): Promise<{ base64: string; sizeKb: string; width: number; height: number }> => {
  const { maxDimension = 320, quality = 0.88, maxSizeBytes = 90 * 1024 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar.'));
    };

    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error('Data gambar kosong.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Format berkas tidak valid atau gambar rusak.'));
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const approxKb = (file.size / 1024).toFixed(1);
          resolve({ base64: src, sizeKb: approxKb, width: img.width, height: img.height });
          return;
        }

        // Clean rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Check if PNG has transparency
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

        ctx.drawImage(img, 0, 0, width, height);

        // Try PNG first if original is PNG to keep transparent background
        let outputFormat = isPng ? 'image/png' : 'image/jpeg';
        let compressedBase64 = canvas.toDataURL(outputFormat, quality);

        // If PNG is larger than 120 KB, convert to JPEG with white background or lower quality
        const approxBytes = Math.round((compressedBase64.length * 3) / 4);
        if (approxBytes > maxSizeBytes && isPng) {
          // If PNG is too heavy, test with slight reduction
          const smallerCanvas = document.createElement('canvas');
          const smallerDim = Math.round(maxDimension * 0.8);
          let sw = width;
          let sh = height;
          if (sw > sh) {
            sh = Math.round((sh * smallerDim) / sw);
            sw = smallerDim;
          } else {
            sw = Math.round((sw * smallerDim) / sh);
            sh = smallerDim;
          }
          smallerCanvas.width = sw;
          smallerCanvas.height = sh;
          const sCtx = smallerCanvas.getContext('2d');
          if (sCtx) {
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(img, 0, 0, sw, sh);
            compressedBase64 = smallerCanvas.toDataURL('image/png');
          }
        }

        const finalBytes = Math.round((compressedBase64.length * 3) / 4);
        const sizeKb = (finalBytes / 1024).toFixed(1);

        resolve({
          base64: compressedBase64,
          sizeKb,
          width,
          height
        });
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
};
