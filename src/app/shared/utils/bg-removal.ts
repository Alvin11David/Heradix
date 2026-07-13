
export function removeBackgroundFromImage(el: HTMLImageElement, tolerance = 46): string {
  const w = el.naturalWidth || el.width;
  const h = el.naturalHeight || el.height;
  if (!w || !h) throw new Error('Image has no pixel data');

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.drawImage(el, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;


  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  let r = 0, g = 0, b = 0;
  corners.forEach(([x, y]) => {
    const i = (y * w + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  });
  r /= corners.length;
  g /= corners.length;
  b /= corners.length;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - r;
    const dg = data[i + 1] - g;
    const db = data[i + 2] - b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < tolerance) {
      data[i + 3] = Math.round(data[i + 3] * (dist / tolerance));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return off.toDataURL('image/png');
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
