import React, { useEffect, useState } from 'react';
import InvoicePreview from './InvoicePreview';
import { Invoice, BusinessDetails, BankAccount, TemplateSettings } from '../types';

interface PreviewData {
  invoiceData: Invoice;
  businessDetails: BusinessDetails;
  bankAccount: BankAccount;
  templateSettings: TemplateSettings;
}

export default function InvoicePublicView({ token }: { token: string }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!token) { setError('Invalid preview link.'); return; }
    fetch(`/proxy-api/invoice-preview/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Preview not found or has expired.');
        return r.json();
      })
      .then((d: PreviewData) => {
        setData(d);
        fetch(`/proxy-api/invoice-preview/${token}/seen`, { method: 'POST' })
          .then(() => setSeen(true))
          .catch(() => {});
      })
      .catch(e => setError(e.message));
  }, [token]);

  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-stone-900 mb-2">Link unavailable</h1>
        <p className="text-sm text-stone-500">{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
        <p className="text-sm text-stone-500 font-medium">Loading invoice…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6 text-center">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">
            Invoice from {data.businessDetails?.name || 'your vendor'}
          </p>
        </div>
        <InvoicePreview
          invoice={data.invoiceData}
          businessDetails={data.businessDetails}
          bankAccount={data.bankAccount}
          templateSettings={data.templateSettings}
        />
        {seen && (
          <p className="text-center text-[10px] text-stone-400 mt-6 uppercase tracking-widest">
            Marked as viewed · {new Date().toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
