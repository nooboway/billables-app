/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PDF invoice extractor — pure client-side.
 *
 * Loads pdf.js via dynamic import so it stays out of the main bundle
 * until the user actually opens the import flow. Pulls every text run
 * from the document, then runs heuristic regexes over the assembled
 * text to identify the fields that drive our Invoice schema.
 *
 * Honest about limitations:
 *  - Only handles text-based PDFs. Scanned / image PDFs return
 *    { kind: 'image' } and the UI tells the user to fill manually
 *    (OCR / vision-LLM support is a later layer).
 *  - Heuristics target the ~70% of invoices that follow conventional
 *    layouts. Anything wildly creative will under-extract; the user
 *    can always edit the pre-filled draft.
 *  - No data ever leaves the browser. No API calls. No tracking.
 */

import type { InvoiceItem } from '../types';

/** What an extraction attempt returns. */
export type ExtractResult =
  | { kind: 'ok'; data: ExtractedInvoice; rawText: string; confidence: 'high' | 'low' }
  | { kind: 'image'; reason: string }
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

/**
 * Pull every text run out of a PDF and concatenate with newlines.
 * Returns null if the PDF has no extractable text (image-only).
 */
async function extractText(file: File): Promise<string | null> {
  // Lazy-import so this ~500KB dep doesn't bloat the main bundle.
  const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
  // Worker: in dev/prod we feed it the worker bundled with pdfjs.
  // `?url` is a Vite-native asset import.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;

  const pages: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }

  const joined = pages.join('\n');
  // If the document is image-only the text content will be (near-)
  // empty — treat anything under ~40 chars as "no real text".
  if (joined.replace(/\s/g, '').length < 40) return null;
  return joined;
}

/** Try a list of regexes in order, return the first capture group. */
function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return undefined;
}

/** Convert "12/06/2024" / "12.06.2024" / "16 June 2025" / "2024-06-12" → YYYY-MM-DD. */
function normaliseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();

  // ISO already
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`;

  // dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  const dmy = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (dmy) {
    const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${yyyy}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  }

  // "16 June 2025"
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

  return undefined; // give up — user can fix in the creator
}

/** Pull a money number out of "$2,750.00" / "₦46,950" / "USD 250.00". */
function parseMoney(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d.,\-]/g, '').replace(/,(?=\d{3}(\D|$))/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Heuristic field extractor. Runs over the joined PDF text and returns
 * whatever it can confidently identify. Confidence is "high" if we
 * found at least an invoice id + a total; "low" otherwise.
 */
export function parseInvoiceFields(text: string): ExtractedInvoice & { _confidence: 'high' | 'low' } {
  // Currency symbol — first one we see wins.
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
    /\b(\d{1,2}\s+[A-Za-z]+\s+\d{4})\b/,                     // standalone "16 June 2025"
  ]));

  const dueDate = normaliseDate(firstMatch(text, [
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{4}-\d{1,2}-\d{1,2})/i,
    /(?:due|pay by|payment due)\s*[:#]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  ]));

  // Client block sits after a "Bill to" / "Issued to" / "Billed to" header.
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
  // Fallback email — anywhere in the doc.
  if (!clientEmail) clientEmail = firstMatch(text, [/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i]);

  // Totals.
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

  // Line items — naïve: scan lines, take rows with a description followed
  // by 2-4 numbers. Highly approximate; user verifies in the creator.
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
    invoiceId,
    orderNo,
    issueDate,
    dueDate,
    clientName,
    clientEmail,
    clientStreet,
    clientCity,
    items,
    subtotal,
    vatRate,
    total,
    currencySymbol,
    _confidence: confidence,
  };
}

/** Public entry point. Hand it a File, get back an ExtractResult. */
export async function extractInvoiceFromPdf(file: File): Promise<ExtractResult> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return { kind: 'error', reason: `Not a PDF — got "${file.type || file.name.split('.').pop()}". Image / OCR support is coming later.` };
  }
  let text: string | null;
  try {
    text = await extractText(file);
  } catch (e: any) {
    return { kind: 'error', reason: e?.message || 'Failed to open the PDF.' };
  }
  if (text === null) {
    return {
      kind: 'image',
      reason: 'This PDF is image-only (likely scanned or photographed). The current extractor reads text PDFs; OCR support will land in a follow-up.',
    };
  }
  const { _confidence, ...data } = parseInvoiceFields(text);
  return { kind: 'ok', data, rawText: text, confidence: _confidence };
}
