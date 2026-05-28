import React from 'react';
import QRCode from 'react-qr-code';
import { Invoice, BusinessDetails, BankAccount, TemplateSettings } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
  businessDetails: BusinessDetails;
  bankAccount: BankAccount;
  templateSettings: TemplateSettings;
}

export default function InvoicePreview({
  invoice, businessDetails, bankAccount, templateSettings
}: InvoicePreviewProps) {
  const currencySymbol = templateSettings.currencySymbol || '$';
  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  const vatAmount = (subtotal * invoice.vatRate) / 100;
  const grandTotal = subtotal + vatAmount + invoice.shippingFee;

  const format = (n: number) => `${currencySymbol}${n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  const tpl = invoice.templateType || 'Stripe';
  const color = templateSettings.color || '#E54A13';

  const PaymentCTAs = () => (
    <div className="flex flex-col gap-2 mt-6">
      {bankAccount.paystackLink && (
        <a href={bankAccount.paystackLink} target="_blank" rel="noreferrer" className="block text-center py-3 bg-[#0BA4DB] text-white font-bold rounded-md text-sm no-underline hover:bg-[#098bbd] transition-colors">
          Pay via Paystack
        </a>
      )}
      {bankAccount.paymentLink && (
        <a href={bankAccount.paymentLink} target="_blank" rel="noreferrer" className="block text-center py-3 bg-stone-900 text-white font-bold rounded-md text-sm no-underline hover:bg-stone-800 transition-colors">
          Pay Online
        </a>
      )}
    </div>
  );

  const QRCodeBlock = () => templateSettings.showQR && (bankAccount.paymentLink || bankAccount.paystackLink) ? (
    <div className="p-3 bg-white border border-stone-200 rounded-lg inline-block">
      <QRCode value={bankAccount.paymentLink || bankAccount.paystackLink || ''} size={64} level="L" />
    </div>
  ) : null;

  if (tpl === 'Minimal') {
    return (
      <div className="bg-white text-stone-900 p-12 max-w-3xl mx-auto font-sans shadow-2xl border border-stone-200 min-h-[800px]">
        <div className="flex justify-between items-start mb-16">
          <div>
            {businessDetails.logoUrl ? <img src={businessDetails.logoUrl} className="h-12 mb-4" alt="Logo"/> : null}
            <h1 className="text-3xl font-light tracking-tight text-stone-800">{businessDetails.name}</h1>
            <p className="text-stone-500 text-sm mt-1">{businessDetails.street}, {businessDetails.city}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">Invoice</p>
            <p className="text-xl font-mono text-stone-900">{invoice.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12 text-sm border-y border-stone-100 py-6">
          <div>
            <p className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-2">Billed To</p>
            <p className="font-medium text-stone-900">{invoice.clientName}</p>
            <p className="text-stone-500">{invoice.clientEmail}</p>
            <p className="text-stone-500">{invoice.clientStreet}</p>
          </div>
          <div className="text-right">
            <div className="flex justify-end gap-8">
              <div>
                <p className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-1">Issued</p>
                <p className="font-mono text-stone-900">{invoice.issueDate}</p>
              </div>
              <div>
                <p className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-1">Due</p>
                <p className="font-mono text-stone-900">{invoice.dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-12">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left font-bold text-stone-400 uppercase tracking-widest text-xs pb-3">Description</th>
              <th className="text-right font-bold text-stone-400 uppercase tracking-widest text-xs pb-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td className="py-4">
                  <p className="font-medium text-stone-900">{item.description.split('\n')[0]}</p>
                  {item.qty > 1 && <p className="text-xs text-stone-500">{item.qty} × {format(item.price)}</p>}
                </td>
                <td className="py-4 text-right font-mono text-stone-900">{format(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-3 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-mono">{format(subtotal)}</span></div>
            {vatAmount > 0 && <div className="flex justify-between text-stone-500"><span>Tax ({invoice.vatRate}%)</span><span className="font-mono">{format(vatAmount)}</span></div>}
            <div className="flex justify-between text-stone-900 font-bold text-lg pt-3 border-t border-stone-200">
              <span>Total</span><span className="font-mono">{format(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-between items-end">
          <div className="w-64 text-sm text-stone-500">
            {invoice.notes}
            <PaymentCTAs />
          </div>
          <QRCodeBlock />
        </div>
      </div>
    );
  }

  if (tpl === 'Executive') {
    return (
      <div className="bg-[#0F1729] text-stone-300 p-12 max-w-3xl mx-auto font-sans shadow-2xl min-h-[800px]">
        <div className="flex flex-col items-center border-b border-[#1E293B] pb-8 mb-8">
          {businessDetails.logoUrl && <div className="w-16 h-16 bg-white rounded-full p-2 flex items-center justify-center mb-4"><img src={businessDetails.logoUrl} className="max-h-full max-w-full" alt="Logo"/></div>}
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">{businessDetails.name}</h1>
          <p className="text-[#D4A853] tracking-widest text-xs mt-2 uppercase font-bold">Invoice {invoice.id}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-[#1E293B] p-6 rounded-lg">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">Billed To</p>
            <p className="text-white font-medium">{invoice.clientName}</p>
            <p className="text-sm mt-1">{invoice.clientEmail}</p>
          </div>
          <div className="bg-[#1E293B] p-6 rounded-lg grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">Issue Date</p><p className="text-white">{invoice.issueDate}</p></div>
            <div><p className="text-[10px] uppercase tracking-widest text-[#D4A853] font-bold mb-1">Due Date</p><p className="text-white">{invoice.dueDate}</p></div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-[#1E293B] text-stone-400">
              <th className="text-left py-3 font-medium uppercase text-xs tracking-wider">Item</th>
              <th className="text-right py-3 font-medium uppercase text-xs tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {invoice.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-[#0F1729]' : 'bg-[#151e32]'}>
                <td className="py-4 px-2">
                  <p className="text-white font-medium">{item.description.split('\n')[0]}</p>
                </td>
                <td className="py-4 px-2 text-right text-white font-mono">{format(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="bg-[#D4A853] text-[#0F1729] p-6 rounded-lg w-72">
            <div className="flex justify-between mb-2 text-sm font-bold opacity-80"><span>Subtotal</span><span>{format(subtotal)}</span></div>
            {vatAmount > 0 && <div className="flex justify-between mb-2 text-sm font-bold opacity-80"><span>Tax</span><span>{format(vatAmount)}</span></div>}
            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-[#0F1729]/20">
              <span>Total</span><span>{format(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="w-1/2">
            <PaymentCTAs />
          </div>
          <QRCodeBlock />
        </div>
      </div>
    );
  }

  if (tpl === 'Studio') {
    return (
      <div className="bg-[#FAF8F5] text-stone-800 p-0 max-w-3xl mx-auto font-sans shadow-2xl min-h-[800px] border border-stone-200">
        <div className="h-3 w-full" style={{ backgroundColor: color }}></div>
        <div className="p-12">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-12 text-stone-900">{businessDetails.name}</h1>
          
          <div className="grid grid-cols-3 gap-8 mb-16">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Invoice To</p>
              <p className="text-xl font-bold text-stone-900">{invoice.clientName}</p>
              <p className="text-sm mt-1">{invoice.clientEmail}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Details</p>
              <p className="text-sm"><strong>Inv:</strong> {invoice.id}</p>
              <p className="text-sm"><strong>Date:</strong> {invoice.issueDate}</p>
              <p className="text-sm text-red-600 font-bold"><strong>Due:</strong> {invoice.dueDate}</p>
            </div>
          </div>

          <div className="border-t-2 border-stone-900 pt-4 mb-12">
            {invoice.items.map(item => (
              <div key={item.id} className="flex justify-between py-4 border-b border-stone-200">
                <div>
                  <p className="font-bold text-stone-900">{item.description.split('\n')[0]}</p>
                  <p className="text-sm text-stone-500 mt-1">{item.qty} {item.unit} at {format(item.price)}</p>
                </div>
                <div className="font-bold text-lg font-mono">{format(item.amount)}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-start">
            <div className="w-1/2">
              {businessDetails.signatureUrl && <img src={businessDetails.signatureUrl} className="h-16 mb-2 opacity-80" alt="Signature"/>}
              <div className="w-32 h-px bg-stone-300 mb-1"></div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Authorized Signatory</p>
              <PaymentCTAs />
            </div>
            <div className="w-1/2 text-right">
              <p className="text-sm text-stone-500 mb-1">Subtotal: {format(subtotal)}</p>
              <p className="text-sm text-stone-500 mb-4">Tax: {format(vatAmount)}</p>
              <p className="text-4xl font-black text-stone-900 tracking-tighter">{format(grandTotal)}</p>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-2">Amount Due</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stripe & Classic fallbacks (simplifying for length, keeping Stripe premium)
  return (
    <div className="bg-white text-stone-900 p-12 max-w-3xl mx-auto font-sans shadow-2xl border border-stone-200 rounded-xl min-h-[800px]">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          {businessDetails.logoUrl ? (
            <img src={businessDetails.logoUrl} className="h-10 w-10 rounded-lg border border-stone-100 shadow-sm" alt="Logo"/>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm">{businessDetails.name[0]}</div>
          )}
          <span className="font-bold text-stone-900">{businessDetails.name}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Invoice {invoice.id}</p>
        </div>
      </div>

      <div className="mb-12">
        <p className="text-sm text-stone-500 mb-1">Amount Due</p>
        <p className="text-5xl font-bold tracking-tight text-stone-900 mb-2">{format(grandTotal)}</p>
        <p className="text-sm font-medium px-3 py-1 bg-stone-100 text-stone-600 rounded-md inline-block">Due {invoice.dueDate}</p>
      </div>

      <div className="bg-stone-50 rounded-xl p-6 mb-8 border border-stone-100 flex justify-between">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Billed To</p>
          <p className="font-bold text-sm">{invoice.clientName}</p>
          <p className="text-sm text-stone-500">{invoice.clientEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Issued On</p>
          <p className="font-medium text-sm">{invoice.issueDate}</p>
        </div>
      </div>

      <div className="mb-8">
        {invoice.items.map(item => (
          <div key={item.id} className="flex justify-between py-4 border-b border-stone-100 text-sm">
            <div>
              <p className="font-bold text-stone-900">{item.description.split('\n')[0]}</p>
              <p className="text-stone-500 text-xs mt-1">Qty: {item.qty}</p>
            </div>
            <div className="font-mono text-stone-900">{format(item.amount)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-12 text-sm">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>{format(subtotal)}</span></div>
          <div className="flex justify-between text-stone-500"><span>Tax</span><span>{format(vatAmount)}</span></div>
          <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total</span><span>{format(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-stone-100 flex justify-between items-center">
        <div className="w-64"><PaymentCTAs /></div>
        <QRCodeBlock />
      </div>
    </div>
  );
}
