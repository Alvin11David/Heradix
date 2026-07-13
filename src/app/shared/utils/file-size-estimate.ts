
export function estimatePngFileSize(originalWidth: number, originalHeight: number, targetWidth: number): number {
  const aspect = originalHeight / originalWidth || 1;
  const w = targetWidth > 0 ? targetWidth : originalWidth;
  const h = Math.round(w * aspect);


  const bytes = w * h * 0.55;
  return Math.round(bytes);
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
