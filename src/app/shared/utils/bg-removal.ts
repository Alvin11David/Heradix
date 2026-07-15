import { removeBackground as aiRemoveBg } from '@imgly/background-removal';

export async function removeBackgroundFromImage(
  image: Blob | HTMLImageElement | string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const source = image instanceof Blob ? image
    : typeof image === 'string' ? image
    : image.src || image;

  let highestPct = 0;

  let blob: Blob;
  try {
    blob = await aiRemoveBg(source, {
      progress: (key, current, total) => {
        const pct = total > 0 ? Math.round((current / total) * 100) : 50;
        if (pct > highestPct) highestPct = pct;
        onProgress?.(highestPct);
      },
      device: 'cpu',
      proxyToWorker: false,
      debug: true,
    });
  } catch (e: any) {
    const details = e?.message ?? String(e);
    if (details.toLowerCase().includes('onnxruntime') || details.toLowerCase().includes('session') || details.toLowerCase().includes('wasm')) {
      throw new Error(
        `The AI model could not start. ` +
        `For local dev, add COOP/COEP headers or use a browser that supports SharedArrayBuffer. ` +
        `Details: ${details}`
      );
    }
    if (details.toLowerCase().includes('fetch') || details.toLowerCase().includes('network') || details.toLowerCase().includes('cors')) {
      throw new Error(
        `The AI model (~88MB) could not be downloaded. ` +
        `Check your internet connection or firewall. ` +
        `Details: ${details}`
      );
    }
    throw e;
  }

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
