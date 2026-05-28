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
    setProgressStep('Processing file...');
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
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-stone-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl border border-stone-200">
        <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-200 flex items-center justify-center text-stone-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Import Document</h3>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono mt-0.5">Parse via Local AI</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-stone-200 text-stone-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
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
                className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-stone-900">Upload PDF or Image</p>
                <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
                  Drag and drop your file here, or click to browse. Processing is handled locally.
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </>
          )}

          {status === 'parsing' && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm font-bold text-stone-900">{progressStep}</p>
              {progressRatio > 0 && (
                <div className="w-64 h-1.5 bg-stone-100 rounded-full mx-auto mt-4 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round(progressRatio * 100))}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {status === 'done' && result?.kind === 'error' && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-stone-900">Extraction Failed</p>
              <p className="text-xs text-stone-500 mt-2">{result.reason}</p>
              <button
                onClick={reset}
                className="mt-6 px-6 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {status === 'done' && result?.kind === 'ok' && (
            <ExtractedSummary
              data={result.data}
              confidence={result.confidence}
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
  data, confidence, onUseIt, onCancel,
}: {
  data: ExtractedInvoice; confidence: 'high' | 'low';
  onUseIt: () => void; onCancel: () => void;
}) {
  const Row = ({ label, value }: { label: string; value?: string | number | undefined }) => (
    <div className="flex justify-between py-2 text-xs border-b border-stone-100 last:border-0">
      <span className="text-stone-500 font-medium">{label}</span>
      <span className={`font-mono ${value ? 'text-stone-900' : 'text-stone-300'}`}>{value || '-'}</span>
    </div>
  );

  return (
    <div>
      <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
        confidence === 'high' ? 'bg-green-50/50 border-green-100 text-green-800' : 'bg-yellow-50/50 border-yellow-100 text-yellow-800'
      }`}>
        {confidence === 'high' ? <Check className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
        <p className="text-xs leading-relaxed">
          {confidence === 'high'
            ? 'High confidence extraction. Review the fields below before importing.'
            : 'Low confidence extraction. Some fields may need manual correction.'}
        </p>
      </div>

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-6">
        <Row label="Invoice Number" value={data.invoiceId} />
        <Row label="Issue Date" value={data.issueDate} />
        <Row label="Due Date" value={data.dueDate} />
        <Row label="Client Name" value={data.clientName} />
        <Row label="Client Email" value={data.clientEmail} />
        <Row label="Total Amount" value={data.total !== undefined ? `${data.currencySymbol ?? ''}${data.total.toLocaleString()}` : undefined} />
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors">
          Discard
        </button>
        <button
          onClick={onUseIt}
          className="flex-1 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
        >
          Import Data
        </button>
      </div>
    </div>
  );
}
