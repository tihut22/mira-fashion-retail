/**
 * Utility to download images directly to the user's phone or computer.
 * Supports SVG-to-PNG rasterization on a hidden canvas for BotFather compatibility.
 */
export async function downloadSvgAsPng(
  svgUrl: string,
  filename: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  try {
    const res = await fetch(svgUrl);
    const svgText = await res.text();

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobUrl = URLObj.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URLObj.revokeObjectURL(blobUrl);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URLObj.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URLObj.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.src = blobUrl;
  } catch (err) {
    console.error('Failed to export image as PNG:', err);
    // Fallback: trigger standard download of the SVG file
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = filename.replace('.png', '.svg');
    link.click();
  }
}

/**
 * Downloads an external image by fetching its blob and triggering download
 */
export async function downloadRemoteImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // If CORS prevents blob download, open the image in a new tab for manual save
    window.open(imageUrl, '_blank');
  }
}
