/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PDF invoice importer dialog.
 *
 * Drag-drop or browse-pick a PDF. We run client-side text extraction
 * via lib/pdfExtract, show the user what we found, and on accept we
 * fire onApply with the parsed payload so the parent (App.tsx) can
 * open the invoice creator with those fields pre-filled.
 */

import { useCallback, useRef, useState } from 'react';
import { FileText, Loader2, Check, AlertTriangle, X, Upload, ScanText } from 'lucide-react';
import { extractInvoice, ExtractResult, ExtractedInvoice, ExtractKind } from '../lib/pdfExtract';

interface ApplyPayload {
  data: ExtractedInvoice;
  originalPdfDataUrl?: string;
  originalFileName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (payload: ApplyPayload) => void;
}

export default function PdfImportDialog({ isOpen, onClose, onApply }: Props) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done'>('idle');
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressRatio, setProgressRatio] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setStatus('idle'); setResult(null); setDragOver(false);
    setProgressStep(''); setProgressRatio(0);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = useCallback(async (file: File) => {
    setStatus('parsing');
    setResult(null);
    setProgressStep('Loading…');
    setProgressRatio(0);
    const r = await extractInvoice(file, (step, ratio) => {
      setProgressStep(step);
      if (typeof ratio === 'number') setProgressRatio(ratio);
    });
    setResult(r);
    setStatus('done');
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-stone-900/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-900">Import invoice</h3>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {status === 'idle' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-[var(--primary)] bg-[var(--orange-bg)]' : 'border-stone-300 hover:border-[var(--primary)] bg-stone-50'
                }`}
              >
                <Upload className="w-7 h-7 mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                <p className="text-sm font-bold text-stone-800">Drop a PDF or image, or click to browse</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Text PDFs (fastest), scanned PDFs and photos / screenshots all work. Everything runs in your browser — nothing is uploaded.
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex items-center gap-3 mt-3 text-[10.5px] text-stone-400 leading-relaxed">
                <div className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Text PDF · instant</div>
                <div className="flex items-center gap-1.5"><ScanText className="w-3 h-3" /> Image / scan · ~3s per page (OCR loads on first use)</div>
              </div>
            </>
          )}

          {status === 'parsing' && (
            <div className="text-center py-10">
              <Loader2 className="w-7 h-7 mx-auto animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-sm font-bold text-stone-800 mt-3">{progressStep || 'Reading…'}</p>
              {progressRatio > 0 && (
                <div className="w-48 h-1 bg-stone-100 rounded-full mx-auto mt-3 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round(progressRatio * 100))}%`, background: 'var(--primary)' }}
                  />
                </div>
              )}
              <p className="text-[10.5px] text-stone-400 mt-3 max-w-xs mx-auto">
                First-time OCR pulls a ~2&thinsp;MB language model into the page; subsequent files reuse it.
              </p>
            </div>
          )}

          {status === 'done' && result?.kind === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-7 h-7 mx-auto text-rose-500" />
              <p className="text-sm font-bold text-stone-800 mt-3">Couldn't read that file</p>
              <p className="text-[11px] text-stone-500 mt-2">{result.reason}</p>
              <button
                onClick={reset}
                className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'done' && result?.kind === 'ok' && (
            <ExtractedSummary
              data={result.data}
              confidence={result.confidence}
              via={result.via}
              onUseIt={() => {
                onApply({
                  data: result.data,
                  originalPdfDataUrl: result.originalPdfDataUrl,
                  originalFileName: result.originalFileName,
                });
                handleClose();
              }}
              onCancel={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ExtractedSummary({
  data, confidence, via, onUseIt, onCancel,
}: {
  data: ExtractedInvoice; confidence: 'high' | 'low'; via: ExtractKind;
  onUseIt: () => void; onCancel: () => void;
}) {
  const viaLabel =
    via === 'text-pdf' ? 'Text PDF · exact'
    : via === 'image-pdf' ? 'Image-only PDF · OCR'
    : 'Image · OCR';
  const Row = ({ label, value }: { label: string; value?: string | number | undefined }) => (
    <div className="flex justify-between py-1.5 text-[12px] border-b border-stone-100 last:border-b-0">
      <span className="text-stone-500">{label}</span>
      <span className={`tabular-nums ${value ? 'text-stone-900 font-medium' : 'text-stone-300 italic'}`}>{value || 'not detected'}</span>
    </div>
  );
  return (
    <div>
      <div className={`mb-3 p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
        confidence === 'high'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-amber-50 border border-amber-200 text-amber-800'
      }`}>
        {confidence === 'high'
          ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
        <span className="flex-1">
          {confidence === 'high'
            ? 'Looks like a clean extraction. Review below and edit anything that looks off.'
            : 'Partial extraction — some fields couldn\'t be detected automatically. You\'ll fill the rest in the creator.'}
        </span>
        <span className="text-[9.5px] uppercase tracking-wider font-bold opacity-70 shrink-0">{viaLabel}</span>
      </div>

      <div className="space-y-0.5">
        <Row label="Invoice #"     value={data.invoiceId} />
        <Row label="Issue date"    value={data.issueDate} />
        <Row label="Due date"      value={data.dueDate} />
        <Row label="Client name"   value={data.clientName} />
        <Row label="Client email"  value={data.clientEmail} />
        <Row label="Total"         value={data.total !== undefined ? `${data.currencySymbol ?? ''}${data.total.toLocaleString()}` : undefined} />
        <Row label="Line items"    value={data.items.length || undefined} />
      </div>

      {data.items.length > 0 && (
        <div className="mt-3 rounded-lg border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-[2fr_0.5fr_0.7fr_0.7fr] gap-2 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-widest text-stone-500 bg-stone-50 border-b border-stone-200">
            <span>Description</span><span>Qty</span><span>Price</span><span className="text-right">Amount</span>
          </div>
          {data.items.slice(0, 6).map((it, i) => (
            <div key={i} className="grid grid-cols-[2fr_0.5fr_0.7fr_0.7fr] gap-2 px-3 py-1.5 text-[11px] border-b last:border-b-0 border-stone-100">
              <span className="text-stone-700 truncate">{it.description}</span>
              <span className="text-stone-700 tabular-nums">{it.qty}</span>
              <span className="text-stone-700 tabular-nums">{it.price.toLocaleString()}</span>
              <span className="text-stone-900 font-medium tabular-nums text-right">{it.amount.toLocaleString()}</span>
            </div>
          ))}
          {data.items.length > 6 && (
            <div className="px-3 py-1.5 text-[10px] text-stone-400 bg-stone-50">+{data.items.length - 6} more</div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider">
          Try another
        </button>
        <button
          onClick={onUseIt}
          className="flex-1 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow-sm"
          style={{ background: 'var(--primary)' }}
        >
          Use this data
        </button>
      </div>
    </div>
  );
}
