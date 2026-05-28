/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * File unifier — turns any imported invoice (PDF / PNG / JPG / WebP)
 * into a single normalized PDF data URL we can attach to an Invoice.
 *
 * - PDF input  → pass through (read as data URL).
 * - Image input → wrap into a single-page PDF using jsPDF, sized to
 *   the image's natural dimensions so nothing is cropped or stretched.
 *
 * Everything runs in the browser. The Python CLI in scripts/ does the
 * equivalent for bulk / out-of-app work.
 */

import { jsPDF } from 'jspdf';

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function ext(file: File): string {
  return (file.name.split('.').pop() || '').toLowerCase();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = src;
  });
}

/**
 * Wrap an image File into a single-page PDF sized to the image's
 * natural pixel dimensions (interpreted at 72 dpi). Returns a data URL.
 */
async function imageToPdfDataUrl(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  // Use the image's natural px as PDF points so it renders 1:1 with
  // its source resolution.
  const w = img.naturalWidth || 800;
  const h = img.naturalHeight || 1000;

  const pdf = new jsPDF({
    unit: 'px',
    format: [w, h],
    orientation: w >= h ? 'landscape' : 'portrait',
    hotfixes: ['px_scaling'],
  });

  // jsPDF picks the format from the data URL prefix.
  const format = dataUrl.startsWith('data:image/png') ? 'PNG'
    : dataUrl.startsWith('data:image/webp') ? 'WEBP'
    : 'JPEG';

  pdf.addImage(dataUrl, format, 0, 0, w, h, undefined, 'FAST');
  return pdf.output('datauristring');
}

/** Public entry point used by the import flow. */
export async function unifyToPdfDataUrl(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || ext(file) === 'pdf';
  if (isPdf) return fileToDataUrl(file);

  const isImage = IMAGE_TYPES.has(file.type) || IMAGE_EXTS.has(ext(file));
  if (isImage) return imageToPdfDataUrl(file);

  throw new Error(`Cannot unify file type "${file.type || ext(file) || 'unknown'}".`);
}
