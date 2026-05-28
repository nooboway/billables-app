/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Invoice extractor — pure client-side.
 *
 * Three execution paths:
 *   1. Text PDF       → pdf.js extracts text directly (fast, exact)
 *   2. Image-only PDF → pdf.js rasterizes pages to canvas, tesseract.js
 *                       OCRs each canvas (slow, ~3s/page, ~95% accuracy)
 *   3. Image file     → tesseract.js OCRs the image directly
 *
 * Heuristic field parser then runs over the assembled text in all three
 * cases to identify the fields that drive our Invoice schema.
 *
 * Both pdf.js and tesseract.js are dynamically imported so they stay
 * out of the main bundle until the user actually opens the import
 * flow. No data ever leaves the browser. No API calls. No tracking.
 */

import type { InvoiceItem } from '../types';
import { unifyToPdfDataUrl } from './fileUnify';

export type ExtractKind = 'text-pdf' | 'image-pdf' | 'image';

export type ExtractResult =
  | { kind: 'ok'; via: ExtractKind; data: ExtractedInvoice; rawText: string; confidence: 'high' | 'low'; originalPdfDataUrl?: string; originalFileName?: string }
  | { kind: 'error'; reason: string };

export interface ExtractedInvoice {
  invoiceId?: string;
  orderNo?: string;
  issueDate?: string;          // YYYY-MM-DD
  dueDate?: string;            // YYYY-MM-DD
  clientName?: string;
  clientEmail?: string;
  clientStreet?: string;
  clientCity?: string;
  items: Pick<InvoiceItem, 'description' | 'qty' | 'price' | 'amount'>[];
  subtotal?: number;
  vatRate?: number;
  shippingFee?: number;
  total?: number;
  currencySymbol?: string;
  notes?: string;
}

/** Progress reporter so the dialog can show a spinner + step label. */
export type ProgressFn = (step: string, ratio?: number) => void;

// ── pdf.js loader (cached) ──────────────────────────────────────────
let _pdfjsPromise: Promise<any> | null = null;
function loadPdfjs() {
  if (!_pdfjsPromise) {
    _pdfjsPromise = (async () => {
      const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return _pdfjsPromise;
}

// ── tesseract.js loader (cached) ────────────────────────────────────
let _tesseractPromise: Promise<any> | null = null;
function loadTesseract() {
  if (!_tesseractPromise) {
    _tesseractPromise = import('tesseract.js');
  }
  return _tesseractPromise;
}

// ── text PDF path ───────────────────────────────────────────────────
async function extractPdfText(file: File): Promise<{ text: string; pdf: any } | { text: null; pdf: any }> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  }
  const joined = pages.join('\n');
  if (joined.replace(/\s/g, '').length < 40) return { text: null, pdf };
  return { text: joined, pdf };
}

// ── OCR path for an image-only PDF ──────────────────────────────────
async function ocrPdfPages(pdf: any, onProgress: ProgressFn): Promise<string> {
  const tesseract = await loadTesseract();
  // Single shared worker for all pages — pay the model-load cost once.
  const worker = await tesseract.createWorker('eng', undefined, {
    // Suppress the noisy internal log; we surface our own progress.
  });
  try {
    const out: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      onProgress(`Reading page ${p} of ${pdf.numPages}…`, (p - 1) / pdf.numPages);
      const page = await pdf.getPage(p);
      // 2x scale — sharper text for OCR; trade-off is memory.
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context.');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      out.push(data.text || '');
      canvas.width = 0; // release backing memory
      canvas.height = 0;
    }
    return out.join('\n');
  } finally {
    try { await worker.terminate(); } catch { /* ignore */ }
  }
}

// ── OCR path for a standalone image file ────────────────────────────
async function ocrImageFile(file: File, onProgress: ProgressFn): Promise<string> {
  const tesseract = await loadTesseract();
  onProgress('Loading OCR model…', 0.05);
  const worker = await tesseract.createWorker('eng');
  try {
    onProgress('Reading text from image…', 0.4);
    const { data } = await worker.recognize(file);
    return data.text || '';
  } finally {
    try { await worker.terminate(); } catch { /* ignore */ }
  }
}

// ── Heuristic field parser ──────────────────────────────────────────
function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return undefined;
}

function normaliseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`;
  const dmy = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (dmy) {
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${yyyy}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  }
  const MONTHS: Record<string, string> = {
    jan:'01', january:'01', feb:'02', february:'02', mar:'03', march:'03',
    apr:'04', april:'04', may:'05', jun:'06', june:'06', jul:'07', july:'07',
    aug:'08', august:'08', sep:'09', sept:'09', september:'09', oct:'10', october:'10',
    nov:'11', november:'11', dec:'12', december:'12',
  };
  const named = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (named) {
    const mm = MONTHS[named[2].toLowerCase()];
    if (mm) return `${named[3]}-${mm}-${named[1].padStart(2,'0')}`;
  }
  return undefined;
}

function parseMoney(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d.,\-]/g, '').replace(/,(?=\d{3}(\D|$))/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function parseInvoiceFields(text: string): ExtractedInvoice & { _confidence: 'high' | 'low' } {
  const currencySymbol = firstMatch(text, [/([\$£€₦])/]) || undefined;

  const invoiceId = firstMatch(text, [
    /invoice\s*(?:no|number|#)\.?\s*[:#]?\s*([A-Z0-9\-]{2,20})/i,
    /inv\s*[:#]?\s*([A-Z0-9\-]{2,20})/i,
    /#\s*0*(\d{3,8})/,
  ]);

  const orderNo = firstMatch(text, [
    /(?:order|po|reference)\s*(?:no|number|#)?\.?\s*[:#]?\s*([A-Z0-9\-]{2,20})/i,
  ]);

  const issueDate = normaliseDate(firstMatch(text, [
    /(?:date|issued|invoice date)\s*[:#]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:date|issued|invoice date)\s*[:#]?\s*(\d{4}-\d{1,2}-\d{1,2})/i,
    /(?:date|issued|invoice date)\s*[:#]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /\b(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/,
  ]));

  const dueDate = normaliseDate(firstMatch(text, [
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{4}-\d{1,2}-\d{1,2})/i,
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  ]));

  const billToBlock = text.match(/(?:bill(?:ed)?\s*to|issued\s*to|invoice\s*to)\s*[:.]?\s*([^\n]+(?:\n[^\n]+){0,4})/i);
  let clientName: string | undefined;
  let clientEmail: string | undefined;
  let clientStreet: string | undefined;
  let clientCity: string | undefined;
  if (billToBlock) {
    const lines = billToBlock[1].split(/\s{2,}|\n/).map(l => l.trim()).filter(Boolean);
    clientName = lines[0];
    for (const ln of lines) {
      const em = ln.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
      if (em && !clientEmail) clientEmail = em[0];
      const addr = ln.match(/\d+\s+[\w\s,.-]+/);
      if (addr && !clientStreet && !ln.includes('@')) clientStreet = ln;
    }
  }
  if (!clientEmail) clientEmail = firstMatch(text, [/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i]);

  const total = parseMoney(firstMatch(text, [
    /(?:amount\s+due|grand\s*total|total\s+due|total)\s*[:#]?\s*([\$£€₦]?\s*[\d,]+(?:\.\d{1,2})?)/i,
  ]));
  const subtotal = parseMoney(firstMatch(text, [
    /subtotal\s*[:#]?\s*([\$£€₦]?\s*[\d,]+(?:\.\d{1,2})?)/i,
  ]));
  const vatRate = (() => {
    const m = text.match(/(?:tax|vat)\s*[\(\[]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
    return m ? parseFloat(m[1]) : undefined;
  })();

  const items: ExtractedInvoice['items'] = [];
  const lineCandidates = text.split(/\s{2,}|\n/);
  const itemRegex = /^([A-Za-z][A-Za-z0-9 ,.\-\/&()]{2,60})\s+\$?([\d,]+(?:\.\d{1,2})?)(?:\/hr| hours?| hrs?)?\s+(\d{1,3})\s+\$?([\d,]+(?:\.\d{1,2})?)$/;
  for (const ln of lineCandidates) {
    const m = ln.trim().match(itemRegex);
    if (m) {
      const price = parseMoney(m[2]);
      const qty = parseInt(m[3], 10);
      const amount = parseMoney(m[4]);
      if (price !== undefined && qty > 0 && amount !== undefined) {
        items.push({ description: m[1].trim(), qty, price, amount });
      }
    }
  }

  const confidence: 'high' | 'low' = (invoiceId && total !== undefined) ? 'high' : 'low';

  return {
    invoiceId, orderNo, issueDate, dueDate,
    clientName, clientEmail, clientStreet, clientCity,
    items, subtotal, vatRate, total, currencySymbol,
    _confidence: confidence,
  };
}

// ── Public entry point ──────────────────────────────────────────────
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function extractInvoice(
  file: File,
  onProgress: ProgressFn = () => {},
): Promise<ExtractResult> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isImage = IMAGE_TYPES.includes(file.type) || ['png','jpg','jpeg','webp'].includes(ext);
  const isPdf   = file.type === 'application/pdf' || ext === 'pdf';

  if (!isPdf && !isImage) {
    return { kind: 'error', reason: `Unsupported file type "${file.type || ext}". Drop a PDF, PNG, JPG or WebP.` };
  }

  try {
    // Kick off file unification in parallel — produces the normalized
    // PDF data URL we attach to the resulting invoice. We don't fail
    // the whole extraction if unification breaks (rare); the data
    // payload still goes through.
    const originalPdfPromise = unifyToPdfDataUrl(file).catch((err) => {
      console.warn('[fileUnify] failed:', err);
      return undefined as string | undefined;
    });

    if (isImage) {
      const text = await ocrImageFile(file, onProgress);
      const { _confidence, ...data } = parseInvoiceFields(text);
      const originalPdfDataUrl = await originalPdfPromise;
      return {
        kind: 'ok', via: 'image', data, rawText: text, confidence: _confidence,
        originalPdfDataUrl, originalFileName: file.name,
      };
    }

    // PDF path: try text first, fall back to OCR if image-only.
    onProgress('Reading PDF…', 0.05);
    const { text, pdf } = await extractPdfText(file);
    if (text !== null) {
      const { _confidence, ...data } = parseInvoiceFields(text);
      const originalPdfDataUrl = await originalPdfPromise;
      return {
        kind: 'ok', via: 'text-pdf', data, rawText: text, confidence: _confidence,
        originalPdfDataUrl, originalFileName: file.name,
      };
    }
    onProgress('PDF has no text layer — running OCR…', 0.15);
    const ocrText = await ocrPdfPages(pdf, onProgress);
    const { _confidence, ...data } = parseInvoiceFields(ocrText);
    const originalPdfDataUrl = await originalPdfPromise;
    return {
      kind: 'ok', via: 'image-pdf', data, rawText: ocrText, confidence: _confidence,
      originalPdfDataUrl, originalFileName: file.name,
    };
  } catch (e: any) {
    return { kind: 'error', reason: e?.message || 'Failed to read that file.' };
  }
}

// Back-compat alias for the older import that only handled PDFs.
export const extractInvoiceFromPdf = extractInvoice;
