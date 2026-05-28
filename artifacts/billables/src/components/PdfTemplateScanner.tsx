import React, { useCallback, useRef, useState } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle, Wand2, Palette } from 'lucide-react';
import { BusinessDetails, TemplateSettings, InvoiceTemplate } from '../types';

interface ScanResult {
  bgColor: string;
  accentColor: string;
  textColor: string;
  isDark: boolean;
  fontStyle: 'serif' | 'sans' | 'mono';
  suggestedTemplate: InvoiceTemplate;
  colorPalette: string[];
  fontsDetected: string[];
  logoDataUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    templatePatch: Partial<TemplateSettings>,
    logoPatch?: string,
  ) => void;
  currentTemplate: TemplateSettings;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const API_URL = `${BASE}/proxy-api/api/pdf-template/extract`;

export default function PdfTemplateScanner({ isOpen, onClose, onApply, currentTemplate }: Props) {
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [applyLogo, setApplyLogo] = useState(true);
  const [applyColor, setApplyColor] = useState(true);
  const [applyTemplate, setApplyTemplate] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase('idle'); setResult(null); setErrMsg(''); setDragOver(false);
    setApplyLogo(true); setApplyColor(true); setApplyTemplate(true);
  };
  const handleClose = () => { reset(); onClose(); };

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrMsg('Please upload a PDF file.'); setPhase('error'); return;
    }
    setPhase('uploading');
    const form = new FormData();
    form.append('pdf', file);
    try {
      const resp = await fetch(API_URL, { method: 'POST', body: form });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      setResult(data as ScanResult);
      setPhase('done');
    } catch (e: any) {
      setErrMsg(e.message ?? 'Extraction failed. Check that the file is a valid PDF.');
      setPhase('error');
    }
  }, []);

  const handleApply = () => {
    if (!result) return;
    const patch: Partial<TemplateSettings> = {};
    if (applyColor) patch.color = result.accentColor;
    if (applyTemplate) patch.templateType = result.suggestedTemplate;
    onApply(patch, applyLogo && result.logoDataUrl ? result.logoDataUrl : undefined);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">Scan PDF Template</h3>
              <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-widest font-medium">
                Extract colors & logo from any invoice PDF
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* IDLE — drop zone */}
          {phase === 'idle' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
                  ${dragOver ? 'border-primary bg-primary/5' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
              >
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-bold text-stone-900 text-sm">Upload your PDF invoice template</p>
                <p className="text-xs text-stone-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Drop a branded invoice PDF here. A Python script will read its colors, logo, and style — no data leaves your machine.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Processed locally via Python + PyMuPDF
                </div>
              </div>
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
            </>
          )}

          {/* UPLOADING */}
          {phase === 'uploading' && (
            <div className="text-center py-14">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
              <p className="font-bold text-stone-900 text-sm">Reading PDF…</p>
              <p className="text-xs text-stone-400 mt-1">Extracting colors, logo, and font style</p>
            </div>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-bold text-stone-900 text-sm mb-1">Extraction Failed</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">{errMsg}</p>
              <button onClick={reset}
                className="mt-6 px-5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors">
                Try Again
              </button>
            </div>
          )}

          {/* DONE — preview + apply options */}
          {phase === 'done' && result && (
            <div className="space-y-4">
              {/* Color swatch */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <div className="flex gap-2">
                  <div title={`Background: ${result.bgColor}`} className="w-8 h-8 rounded-lg border border-stone-200 shadow-sm" style={{ background: result.bgColor }} />
                  <div title={`Accent: ${result.accentColor}`} className="w-8 h-8 rounded-lg border border-stone-200 shadow-sm" style={{ background: result.accentColor }} />
                  {result.colorPalette.map(c => (
                    <div key={c} title={c} className="w-8 h-8 rounded-lg border border-stone-200 shadow-sm" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-700 truncate">Palette extracted</p>
                  <p className="text-[10px] text-stone-400 truncate">{result.fontsDetected.join(', ') || 'fonts detected'}</p>
                </div>
              </div>

              {/* Logo preview */}
              {result.logoDataUrl && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                  <img src={result.logoDataUrl} alt="Extracted logo" className="h-10 w-auto max-w-[80px] object-contain rounded border border-stone-200 bg-white p-1" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stone-700">Logo found</p>
                    <p className="text-[10px] text-stone-400">Will be set as your business logo</p>
                  </div>
                </div>
              )}

              {/* Suggested template */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-700">Suggested template: <span className="text-primary">{result.suggestedTemplate}</span></p>
                  <p className="text-[10px] text-stone-400">{result.isDark ? 'Dark background detected' : 'Light background detected'} · {result.fontStyle} fonts</p>
                </div>
              </div>

              {/* What to apply */}
              <div className="border border-stone-100 rounded-xl overflow-hidden">
                <p className="px-4 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 border-b border-stone-100">Apply to workspace</p>
                {[
                  { key: 'applyColor', val: applyColor, set: setApplyColor, label: 'Brand accent color', sub: result.accentColor, swatch: result.accentColor },
                  { key: 'applyTemplate', val: applyTemplate, set: setApplyTemplate, label: 'Template layout', sub: result.suggestedTemplate, swatch: null },
                  ...(result.logoDataUrl ? [{ key: 'applyLogo', val: applyLogo, set: setApplyLogo, label: 'Business logo', sub: 'Set extracted image as logo', swatch: null }] : []),
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0">
                    <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-stone-900">{opt.label}</p>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5">
                        {opt.swatch && <span className="inline-block w-3 h-3 rounded-sm border border-stone-200" style={{ background: opt.swatch }} />}
                        {opt.sub}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'done' && result && (
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={handleClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-colors">
              Cancel
            </button>
            <button onClick={handleApply}
              className="flex-1 py-2.5 bg-primary hover:bg-[#C13A0E] text-white rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20">
              <CheckCircle className="w-4 h-4" /> Apply to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
