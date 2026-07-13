import { removeBackground as aiRemoveBg } from '@imgly/background-removal';

export async function removeBackgroundFromImage(
  image: HTMLImageElement | string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const source = typeof image === 'string' ? image : image.src || image;

  const blob = await aiRemoveBg(source, {
    progress: (key, current, total) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 50;
      onProgress?.(pct);
    },
  });

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read result blob'));
    reader.readAsDataURL(blob);
  });
}

export function resizeImageToDataUrl(el: HTMLImageElement, maxWidth: number): string {
  const w = el.naturalWidth || el.width;
  const h = el.naturalHeight || el.height;
  if (!w || !h) throw new Error('Image has no pixel data');

  const scale = Math.min(1, maxWidth / w);
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const off = document.createElement('canvas');
  off.width = outW;
  off.height = outH;
  const ctx = off.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.drawImage(el, 0, 0, outW, outH);
  return off.toDataURL('image/png');
}
