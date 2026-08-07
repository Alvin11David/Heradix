/**
 * Downloads a remote or local browser resource as a file.
 *
 * Using an object URL after fetching the bytes is important for catalog images:
 * assigning a cross-origin URL directly to `a.download` is commonly ignored by
 * browsers and opens the image instead of saving it.
 */
export async function downloadBrowserFile(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(objectUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch {
    // A provider may reject CORS even though the resource is publicly viewable.
    // Keep the action useful by opening the resource as a last-resort fallback.
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return false;
  }
}

export function downloadBrowserBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  triggerBrowserDownload(objectUrl, filename);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function triggerBrowserDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}