/**
 * Approximate download file size for a transparent PNG at a given target width,
 * for display in the size picker (PNGWing/CleanPNG-style "know before you download").
 * PNGs with an alpha channel compress inconsistently depending on content, so this
 * is a heuristic (not a byte-exact measurement) — good enough for a helpful estimate.
 */
export function estimatePngFileSize(originalWidth: number, originalHeight: number, targetWidth: number): number {
  const aspect = originalHeight / originalWidth || 1;
  const w = targetWidth > 0 ? targetWidth : originalWidth;
  const h = Math.round(w * aspect);
  // RGBA source, ~0.55 bytes/px average after PNG deflate for photographic cutouts with
  // a transparent background (large flat alpha=0 regions compress very well).
  const bytes = w * h * 0.55;
  return Math.round(bytes);
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
