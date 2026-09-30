/**
 * Compresses an image File or Data URL to ensure it never exceeds Firestore document limits (1MB).
 * Scales down dimensions (max 1024x1024) and compresses to image/jpeg with progressive quality.
 */
export async function compressImage(
  source: File | string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.75
): Promise<string> {
  // If it's an external HTTP/HTTPS URL, don't re-compress
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source;
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();

    const processImage = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        // Fill background white in case of transparent PNG being converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG
        let compressed = canvas.toDataURL('image/jpeg', quality);

        // If output size is still large (>300KB = ~400,000 base64 chars), reduce scale and quality
        if (compressed.length > 400000) {
          const halfCanvas = document.createElement('canvas');
          halfCanvas.width = Math.round(width * 0.75);
          halfCanvas.height = Math.round(height * 0.75);
          const halfCtx = halfCanvas.getContext('2d');
          if (halfCtx) {
            halfCtx.fillStyle = '#FFFFFF';
            halfCtx.fillRect(0, 0, halfCanvas.width, halfCanvas.height);
            halfCtx.drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
            compressed = halfCanvas.toDataURL('image/jpeg', 0.6);
          }
        }

        resolve(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onload = processImage;
    img.onerror = (e) => {
      console.warn('Image load error during compression:', e);
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
