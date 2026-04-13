/**
 * Common utilities for handling files and blobs in the browser.
 */

/**
 * Converts a blob URL (like blob:http://...) back into a File object.
 * We use this to restore images on the canvas when saving a draft.
 */
export async function blobUrlToFile(
  blobUrl: string,
  fileName: string,
  mimeType?: string,
): Promise<File> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType ?? blob.type });
}
