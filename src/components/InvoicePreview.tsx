/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Invoice, BusinessDetails, BankAccount, TemplateSettings } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
  businessDetails: BusinessDetails;
  bankAccount: BankAccount;
  templateSettings: TemplateSettings;
}

export default function InvoicePreview({
  invoice,
  businessDetails,
  bankAccount,
  templateSettings,
}: InvoicePreviewProps) {
  const currencySymbol = templateSettings.currencySymbol || '₦';
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * invoice.vatRate) / 100;
  const grandTotal = subtotal + vatAmount + invoice.shippingFee;

  const formatValue = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const activeTemplate = invoice.templateType || 'Stripe';
  const colorAccent = templateSettings.color || '#4f46e5';

  if (activeTemplate === 'Classic') {
    return (
      <div className="bg-white text-slate-900 p-8 rounded-xl border-t-8 shadow-md border-slate-700 max-w-4xl mx-auto overflow-x-auto relative font-sans text-xs">
        <div className="min-w-[650px]">
          {/* Classic Accounting Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-5 mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">COMMERCIAL INVOICE</h1>
              <p className="text-slate-500 font-mono text-[10px] mt-1">Ref No: #{invoice.id}</p>
            </div>
            {businessDetails.logoUrl && (
              <img src={businessDetails.logoUrl} alt="Logo" className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
            )}
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-[11px]">
            <div>
              <p className="font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">FROM (ISSUER)</p>
              <p className="font-semibold text-slate-950 text-sm">{businessDetails.name}</p>
              <p className="text-slate-600 leading-relaxed mt-1">
                {[businessDetails.street, businessDetails.aptSuite, businessDetails.city, businessDetails.country].filter(Boolean).join(', ')}
              </p>
              <p className="text-slate-500 font-mono mt-1">VAT Reg: {businessDetails.taxRegNo || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">BILL TO (CLIENT)</p>
              <p className="font-semibold text-slate-950 text-sm">{invoice.clientName}</p>
              <p className="text-slate-600 leading-relaxed mt-1">
                {[invoice.clientStreet, invoice.clientAptSuite, invoice.clientCity, invoice.clientCountry].filter(Boolean).join(', ')}
              </p>
              <p className="text-slate-500 font-mono mt-1">{invoice.clientEmail}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-250 grid grid-cols-4 gap-4 mb-6 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-sans">Date of Issue</span>
              <span className="font-bold text-slate-800">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-sans">Date of Maturity</span>
              <span className="font-bold text-slate-800">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-sans">Purchase Order</span>
              <span className="font-bold text-slate-800">{invoice.orderNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-sans">Method</span>
              <span className="font-bold text-indigo-700 uppercase">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Classic ledger lines */}
          <table className="w-full text-left border border-slate-300 mb-6 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2 px-3 border-r border-slate-300">Item Description</th>
                <th className="py-2 px-3 text-center border-r border-slate-300 w-20">Quantity</th>
                <th className="py-2 px-3 text-right border-r border-slate-300 w-24">Unit Rate</th>
                <th className="py-2 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 border-r border-slate-300">
                    <p className="font-bold text-slate-900">{item.description.split('\n')[0]}</p>
                    {item.description.split('\n').slice(1).join('\n') && (
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{item.description.split('\n').slice(1).join('\n')}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono">{item.qty} {item.unit}</td>
                  <td className="py-2.5 px-3 text-right border-r border-slate-300 font-mono">{formatValue(item.price)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatValue(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Classic summary row */}
          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="bg-slate-50 p-3 rounded text-[10px] border border-slate-200">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px] block mb-1">TERMS & MEMORANDUM</span>
              <p className="font-mono text-slate-600 leading-relaxed">{invoice.notes || 'Please remit payment as scheduled.'}</p>
            </div>
            <div className="space-y-1.5 text-right font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Sub-Total:</span>
                <span>{formatValue(subtotal)}</span>
              </div>
              {invoice.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Cargo:</span>
                  <span>{formatValue(invoice.shippingFee)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT Tax ({invoice.vatRate}%):</span>
                  <span>{formatValue(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-950 font-extrabold text-sm pt-2 border-t-2 border-slate-300">
                <span>TOTAL PAYABLE:</span>
                <span className="text-slate-950">{formatValue(grandTotal)}</span>
              </div>
              {businessDetails.signatureUrl && (
                <div className="pt-4 flex flex-col items-end">
                  <img src={businessDetails.signatureUrl} alt="Signature" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                  <p className="text-[9px] text-slate-400 mt-1 uppercase">Auth. Signature</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-250 text-center text-[9px] text-slate-500 font-mono">
            {bankAccount.bankName} Account: {bankAccount.accountNumber} • Holder: {bankAccount.accountHolder}
          </div>
        </div>
      </div>
    );
  }

  if (activeTemplate === 'Serif') {
    return (
      <div className="bg-amber-50/20 text-[#2c1d11] p-8 rounded-xl shadow-lg border border-amber-900/10 max-w-4xl mx-auto overflow-x-auto relative font-serif text-sm">
        {/* Editorial Serif Header Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-800" />
        
        <div className="min-w-[650px]">
          {/* Typographic Title Header */}
          <div className="text-center pt-4 mb-10">
            <h1 className="text-4xl font-light tracking-widest uppercase text-amber-950 font-semibold mb-1">INVOICE STATEMENT</h1>
            <p className="text-xs uppercase italic tracking-wider text-amber-900">Document No. {invoice.id} • Issued: {invoice.issueDate}</p>
          </div>

          {/* Core Information split column */}
          <div className="grid grid-cols-2 gap-10 mb-8 pb-6 border-b border-amber-900/15">
            <div>
              <p className="font-sans text-[10px] font-bold tracking-widest uppercase text-amber-800/80 mb-2">I. ORIGINATOR</p>
              <h2 className="text-lg font-bold text-amber-950">{businessDetails.name}</h2>
              <p className="text-amber-900/80 leading-relaxed text-[12px] mt-2 italic">
                {[businessDetails.street, businessDetails.aptSuite, businessDetails.city, businessDetails.country].filter(Boolean).join(', ')}
              </p>
              {businessDetails.taxRegNo && (
                <p className="text-amber-800 font-sans text-[9px] tracking-wide mt-2">VAT Registration: {businessDetails.taxRegNo}</p>
              )}
            </div>
            <div>
              <p className="font-sans text-[10px] font-bold tracking-widest uppercase text-amber-800/80 mb-2">II. RECIPIENT</p>
              <h2 className="text-lg font-bold text-amber-950">{invoice.clientName}</h2>
              <p className="text-amber-900/80 leading-relaxed text-[12px] mt-2 italic">
                {[invoice.clientStreet, invoice.clientAptSuite, invoice.clientCity, invoice.clientCountry].filter(Boolean).join(', ')}
              </p>
              <p className="font-sans text-[10.5px] text-amber-900/70 mt-2">{invoice.clientEmail}</p>
            </div>
          </div>

          {/* Serif elegant details summary block */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-amber-50/50 rounded-lg border border-amber-900/10 mb-8 text-[11px] font-sans">
            <div>
              <span className="text-amber-850 font-bold block uppercase text-[9px] text-amber-800">Maturity Date</span>
              <span className="text-slate-900 font-semibold">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-amber-850 font-bold block uppercase text-[9px] text-amber-800">Order Ref</span>
              <span className="text-slate-900 font-semibold">{invoice.orderNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-amber-850 font-bold block uppercase text-[9px] text-amber-800">Settlement</span>
              <span className="text-slate-900 font-semibold uppercase">{invoice.paymentMethod}</span>
            </div>
            <div>
              <span className="text-amber-850 font-bold block uppercase text-[9px] text-amber-800">Total Statements</span>
              <span className="text-amber-950 font-bold">{formatValue(grandTotal)}</span>
            </div>
          </div>

          {/* Table list */}
          <table className="w-full text-left border-collapse mb-8 text-xs font-sans">
            <thead>
              <tr className="border-b border-amber-900/30 text-amber-900 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 pr-4 font-serif text-sm">Item Details</th>
                <th className="py-3 text-center w-16">Qty</th>
                <th className="py-3 text-right w-24">Price</th>
                <th className="py-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-slate-800">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/20">
                  <td className="py-3 pr-4">
                    <p className="font-serif font-bold text-slate-900 text-sm">{item.description.split('\n')[0]}</p>
                    {item.description.split('\n').slice(1).join('\n') && (
                      <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1">{item.description.split('\n').slice(1).join('\n')}</p>
                    )}
                  </td>
                  <td className="py-3 text-center font-mono">{item.qty} {item.unit}</td>
                  <td className="py-3 text-right font-mono">{formatValue(item.price)}</td>
                  <td className="py-3 text-right font-serif font-bold text-amber-950 font-mono">{formatValue(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-8 items-start pt-4 border-t border-amber-900/15">
            <div className="italic text-amber-900/75 text-[11px] leading-relaxed">
              <p className="font-sans font-bold uppercase text-[9px] tracking-widest text-[#2c1d11] mb-1.5">Note of Conveyance</p>
              <p>{invoice.notes || 'The statement is generated securely. Thank you for your continued operations.'}</p>
            </div>
            <div className="space-y-2 text-right text-xs font-sans">
              <div className="flex justify-between text-amber-900/80">
                <span>Value Subtotal:</span>
                <span className="font-mono">{formatValue(subtotal)}</span>
              </div>
              {invoice.shippingFee > 0 && (
                <div className="flex justify-between text-amber-900/80">
                  <span>Logistics Cargo:</span>
                  <span className="font-mono">{formatValue(invoice.shippingFee)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between text-amber-900/80">
                  <span>V.A.T ({invoice.vatRate}%):</span>
                  <span className="font-mono">{formatValue(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-amber-950 font-bold text-sm pt-2.5 border-t border-amber-950/20">
                <span className="font-serif">STATEMENT DEBT:</span>
                <span className="font-serif text-lg text-amber-950">{formatValue(grandTotal)}</span>
              </div>
              
              {businessDetails.signatureUrl && (
                <div className="pt-4 flex flex-col items-end">
                  <img src={businessDetails.signatureUrl} alt="Signature" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                  <p className="text-[8.5px] tracking-wide text-amber-800 uppercase mt-1">Authorized Clearance</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-amber-900/10 text-center text-[10px] text-amber-800/60 font-serif">
            Direct Routing Bank: {bankAccount.bankName} • Account Holder: {bankAccount.accountHolder} • Account Number: {bankAccount.accountNumber}
          </div>
        </div>
      </div>
    );
  }

  if (activeTemplate === 'Modern') {
    return (
      <div className="bg-slate-950 text-slate-100 p-8 rounded-xl shadow-2xl border border-slate-800 max-w-4xl mx-auto overflow-x-auto relative font-mono text-[11px] leading-relaxed">
        {/* Futural cyber accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: colorAccent }} />
        
        <div className="min-w-[650px]">
          {/* Cybernetic header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-5 mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-widest block" style={{ color: colorAccent }}>Workspace Terminal Ledger</span>
              <h1 className="text-xl font-black text-white mt-1 uppercase tracking-tight">TRANSACTION INVOICE</h1>
            </div>
            <div className="text-right">
              <p className="text-slate-400">ID: #{invoice.id}</p>
              <p className="text-[10px] text-slate-500">TIMESTAMP: {invoice.issueDate}</p>
            </div>
          </div>

          {/* Details metadata block */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="font-bold text-slate-400 uppercase text-[9px] mb-2" style={{ color: colorAccent }}>01. SENDER ID</p>
              <p className="text-xs text-slate-100 font-bold">{businessDetails.name}</p>
              <p className="text-slate-400 font-sans mt-1.5 leading-snug">
                {[businessDetails.street, businessDetails.city, businessDetails.country].filter(Boolean).join(', ')}
              </p>
              {businessDetails.taxRegNo && <p className="text-slate-500 text-[10px] mt-1.5">Tax Ledger: {businessDetails.taxRegNo}</p>}
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="font-bold text-slate-400 uppercase text-[9px] mb-2" style={{ color: colorAccent }}>02. DESTINATION TARGET</p>
              <p className="text-xs text-slate-100 font-bold">{invoice.clientName}</p>
              <p className="text-slate-400 font-sans mt-1.5 leading-snug">
                {[invoice.clientStreet, invoice.clientCity, invoice.clientCountry].filter(Boolean).join(', ')}
              </p>
              <p className="text-[9.5px] mt-1.5 text-indigo-400">{invoice.clientEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 rounded border border-slate-800 text-center mb-6">
            <div>
              <span className="text-slate-550 text-[9px] uppercase block mb-0.5">Maturity Date</span>
              <span className="text-slate-200 font-bold">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-slate-550 text-[9px] uppercase block mb-0.5">Order Ref</span>
              <span className="text-slate-200 font-bold">{invoice.orderNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-550 text-[9px] uppercase block mb-0.5">Method Route</span>
              <span className="text-slate-200 font-bold uppercase">{invoice.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-550 text-[9px] uppercase block mb-0.5">System Sum</span>
              <span className="font-bold" style={{ color: colorAccent }}>{formatValue(grandTotal)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden border border-slate-800 mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-450 border-b border-slate-800">
                  <th className="py-2.5 px-3 uppercase tracking-wider text-[9px] text-slate-400">Ledger Entry</th>
                  <th className="py-2.5 px-3 text-center w-16 uppercase tracking-wider text-[9px] text-slate-400">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24 uppercase tracking-wider text-[9px] text-slate-400">Price</th>
                  <th className="py-2.5 px-3 text-right w-28 uppercase tracking-wider text-[9px] text-slate-450 text-slate-200">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/20">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/55">
                    <td className="py-2.5 px-3">
                      <p className="text-slate-200 font-bold font-sans">{item.description.split('\n')[0]}</p>
                      {item.description.split('\n').slice(1).join('\n') && (
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-snug">{item.description.split('\n').slice(1).join('\n')}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{item.qty} {item.unit}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{formatValue(item.price)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{formatValue(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary info and signature */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl text-[10px] leading-relaxed">
              <p className="font-bold text-slate-400 text-[9px] uppercase mb-1.5" style={{ color: colorAccent }}>MEMORANDUM_GUIDE</p>
              <p className="text-slate-400">{invoice.notes || 'No system errors. Please settle on time.'}</p>
            </div>
            <div className="space-y-1.5 text-right text-slate-400">
              <div className="flex justify-between">
                <span>Value Subtotal:</span>
                <span className="text-slate-200">{formatValue(subtotal)}</span>
              </div>
              {invoice.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Logistics Cargo:</span>
                  <span className="text-slate-200">{formatValue(invoice.shippingFee)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>V.A.T Tax ({invoice.vatRate}%):</span>
                  <span className="text-slate-200">{formatValue(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white font-black text-xs pt-2 border-t border-slate-800">
                <span>TOTAL SYSTEM PAYABLE:</span>
                <span className="text-lg" style={{ color: colorAccent }}>{formatValue(grandTotal)}</span>
              </div>
              
              {businessDetails.signatureUrl && (
                <div className="pt-4 flex flex-col items-end">
                  <img src={businessDetails.signatureUrl} alt="Signature" className="h-10 w-auto object-contain brightness-95 invert" referrerPolicy="no-referrer" />
                  <p className="text-[8.5px] uppercase text-slate-500 mt-1">Verification Code Sign</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850 text-center text-[9.5px] text-slate-500">
            PAYMENT_BRIDGE: {bankAccount.bankName} // ROUTING_HEX: #{bankAccount.accountNumber} // OWNER: {bankAccount.accountHolder}
          </div>
        </div>
      </div>
    );
  }

  if (activeTemplate === 'Simple') {
    return (
      <div className="bg-white text-slate-900 p-6 md:p-8 rounded-xl max-w-4xl mx-auto overflow-x-auto relative font-sans text-xs">
        <div className="min-w-[650px]">
          {/* Extremely Simple Minimalist layout */}
          <div className="flex justify-between items-baseline mb-8">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">INVOICE</h1>
              <p className="text-[10px] text-slate-500">Reference No. #{invoice.id}</p>
            </div>
            <div className="text-right text-[10px] text-slate-500 leading-normal">
              <p className="font-bold text-slate-850">{businessDetails.name}</p>
              <p>{businessDetails.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <span className="text-[9px] uppercase text-slate-400 font-bold block mb-1">To:</span>
              <p className="text-base font-bold text-slate-950 leading-tight">{invoice.clientName}</p>
              <p className="text-slate-600 font-sans mt-1">
                {[invoice.clientStreet, invoice.clientCity, invoice.clientCountry].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="columns-2 gap-4 text-[10px]">
              <div>
                <span className="font-bold text-slate-400 uppercase block">Dated</span>
                <span>{invoice.issueDate}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block">Due</span>
                <span className="font-bold text-slate-950">{invoice.dueDate}</span>
              </div>
              <div className="col-span-2 mt-2">
                <span className="font-bold text-slate-400 uppercase block">Remittance Channel</span>
                <span className="uppercase">{invoice.paymentMethod}</span>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-6 text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2.5 max-w-[320px]">Description</th>
                <th className="py-2.5 text-center w-16">Qty</th>
                <th className="py-2.5 text-right w-24">Unit Price</th>
                <th className="py-2.5 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-slate-800 pr-4">
                    <p className="font-bold text-slate-900">{item.description.split('\n')[0]}</p>
                    {item.description.split('\n').slice(1).join('\n') && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.description.split('\n').slice(1).join('\n')}</p>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-700 font-mono">{item.qty} {item.unit}</td>
                  <td className="py-3 text-right text-slate-700 font-mono">{formatValue(item.price)}</td>
                  <td className="py-3 text-right font-semibold text-slate-800 font-mono">{formatValue(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 items-start pt-4 border-t border-slate-900">
            <div className="text-[9.5px] text-slate-500 leading-relaxed font-sans mt-1">
              {invoice.notes || 'Please pay by due date. Thank you.'}
            </div>
            <div className="space-y-1 text-right text-[10.5px] text-slate-500 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatValue(subtotal)}</span>
              </div>
              {invoice.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatValue(invoice.shippingFee)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between">
                  <span>V.A.T Tax ({invoice.vatRate}%):</span>
                  <span>{formatValue(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-950 font-bold text-sm pt-1.5 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-slate-950 text-base">{formatValue(grandTotal)}</span>
              </div>
              
              {businessDetails.signatureUrl && (
                <div className="pt-4 flex flex-col items-end">
                  <img src={businessDetails.signatureUrl} alt="Signature" className="h-9 w-auto object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400">
            Bank transfer to: {bankAccount.bankName} / Account Number: {bankAccount.accountNumber} (Holder: {bankAccount.accountHolder})
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT STRIPE TEMPLATE
  return (
    <div className="bg-white text-slate-900 p-6 md:p-8 rounded-xl shadow-2xl border border-slate-200 max-w-4xl mx-auto overflow-x-auto relative">
      {/* Decorative Brand Accent Line */}
      <div 
        className="absolute top-0 left-0 right-0 h-2 rounded-t-xl"
        style={{ backgroundColor: colorAccent }}
      />

      <div className="min-w-[650px] font-sans text-xs">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wider text-slate-800 uppercase font-display">Invoice</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Original Copy</p>
          </div>
          {businessDetails.logoUrl ? (
            <img 
              src={businessDetails.logoUrl} 
              alt="Company Logo" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-dashed border-slate-300 rounded">
              No Logo
            </div>
          )}
        </div>

        {/* Addresses & Reference details */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-b-slate-100">
          <div>
            <p className="font-bold text-slate-700 uppercase mb-2 tracking-wide text-[10px] font-display text-xs">Seller Details</p>
            <p className="font-semibold text-sm text-slate-800">{businessDetails.name}</p>
            <p className="text-slate-600 leading-relaxed mt-1">
              {[
                businessDetails.street,
                businessDetails.aptSuite,
                businessDetails.city,
                businessDetails.country
              ].filter(Boolean).join(', ')}
            </p>
            {businessDetails.taxRegNo && (
              <p className="text-slate-500 mt-2 font-mono text-[10px]">Tax Reg No: {businessDetails.taxRegNo}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1 tracking-wide text-[10px] font-display">Invoice No.</p>
              <p className="text-slate-800 font-bold font-mono text-sm">#{invoice.id}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1 tracking-wide text-[10px] font-display">Issue Date</p>
              <p className="text-slate-600 font-mono">{invoice.issueDate}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1 tracking-wide text-[10px] font-display">Due Date</p>
              <p className="text-slate-600 font-mono font-semibold">{invoice.dueDate}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1 tracking-wide text-[10px] font-display">Order No.</p>
              <p className="text-slate-600 font-mono">{invoice.orderNo || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="font-bold text-slate-700 uppercase mb-1 tracking-wide text-[10px] font-display">Payment Method</p>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-105 bg-slate-100 text-slate-700 font-semibold uppercase">
                {invoice.paymentMethod || templateSettings.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="mb-8">
          <p className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-1 font-display">Bill To</p>
          <p className="text-base font-bold text-slate-800">{invoice.clientName}</p>
          {(invoice.clientStreet || invoice.clientCity) && (
            <p className="text-slate-600 mt-1 max-w-sm">
              {[
                invoice.clientStreet,
                invoice.clientAptSuite,
                invoice.clientCity,
                invoice.clientCountry
              ].filter(Boolean).join(', ')}
            </p>
          )}
          {invoice.clientEmail && (
            <p className="text-slate-500 font-mono mt-1 text-[10px]">{invoice.clientEmail}</p>
          )}
        </div>

        {/* Invoice Items Table */}
        <div className="mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 max-w-[320px]">Description</th>
                <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-center w-16">Qty</th>
                <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right w-24">Unit Price</th>
                {invoice.items.some(i => i.discount > 0) && (
                  <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right w-20">Discount</th>
                )}
                <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50/50">
                  <td className="py-3 whitespace-pre-line text-slate-800 pr-4">
                    <p className="font-semibold text-slate-900">{item.description.split('\n')[0]}</p>
                    {item.description.split('\n').slice(1).join('\n') && (
                      <p className="text-[10px] text-slate-500 leading-normal mt-1 max-w-lg">
                        {item.description.split('\n').slice(1).join('\n')}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-700 font-mono">
                    {item.qty} <span className="text-[9px] text-slate-400">{item.unit || 'Unit'}</span>
                  </td>
                  <td className="py-3 text-right text-slate-700 font-mono">
                    {formatValue(item.price)}
                  </td>
                  {invoice.items.some(i => i.discount > 0) && (
                    <td className="py-3 text-right text-rose-600 font-mono">
                      {item.discount > 0 ? `${item.discount}%` : '—'}
                    </td>
                  )}
                  <td className="py-3 text-right font-bold text-slate-800 font-mono">
                    {formatValue(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Signature layout */}
        <div className="grid grid-cols-2 gap-8 items-start mb-8 mt-6 pt-4 border-t border-t-slate-100">
          <div>
            {invoice.notes && (
              <div className="bg-slate-50 border-l-4 p-3 rounded rounded-l-none text-slate-700 leading-relaxed text-[10px]" style={{ borderColor: colorAccent }}>
                <p className="font-semibold uppercase tracking-wider text-[9px] text-slate-500 mb-1">Payment Instructions</p>
                <p className="font-mono">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatValue(subtotal)}</span>
            </div>
            {invoice.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping:</span>
                <span className="font-mono">{formatValue(invoice.shippingFee)}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT ({invoice.vatRate}%):</span>
                <span className="font-mono">{formatValue(vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-900 font-bold text-sm pt-2 border-t border-dashed border-slate-200">
              <span className="text-slate-800">Total Due:</span>
              <span className="font-mono text-base font-bold" style={{ color: colorAccent }}>
                {formatValue(grandTotal)}
              </span>
            </div>

            {/* Signature Area */}
            {businessDetails.signatureUrl && (
              <div className="pt-6 flex flex-col items-end">
                <p className="text-[10px] text-slate-400 font-display italic mb-1">Issued by, signature:</p>
                <img 
                  src={businessDetails.signatureUrl} 
                  alt="Authorized Signature" 
                  className="h-12 w-auto object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Contact Details & Direct Ledger details */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-[10px] mb-8 leading-relaxed font-mono">
          <div>
            <p className="font-bold text-slate-700 font-display uppercase text-[8px] tracking-wider mb-1">Call / Cell</p>
            <p className="text-slate-600">{businessDetails.phone || 'N/A'}</p>
            <p className="text-slate-600">{businessDetails.cell || 'N/A'}</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 font-display uppercase text-[8px] tracking-wider mb-1">Email / Web</p>
            <p className="text-slate-600 text-ellipsis overflow-hidden">{businessDetails.email}</p>
            <p className="text-slate-600">{businessDetails.website || 'N/A'}</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 font-display uppercase text-[8px] tracking-wider mb-1">Bank Payment Account</p>
            <p className="text-slate-800 font-bold">{bankAccount.bankName} - {bankAccount.accountNumber}</p>
            <p className="text-slate-600 text-[9px]">Holder: {bankAccount.accountHolder}</p>
          </div>
        </div>

        {/* Dynamic SKU Photo section (Exactly as shown on screens!) */}
        {invoice.skuPhotoUrl && (
          <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-55 bg-slate-50 text-slate-700">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
              <div className="shrink-0 w-44 bg-slate-950 p-2 rounded-lg border border-slate-250 shadow-sm flex justify-center">
                <img 
                  src={invoice.skuPhotoUrl} 
                  alt="SKU Preview Attached" 
                  className="h-44 w-auto object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs font-display">SKU PRODUCT ATTACHMENT DETAILS</h4>
                <p className="text-slate-500 leading-normal mt-1.5 text-[10.5px]">
                  Each physical package is shipped with strict validation stickers. If your delivered items do not match this product photography or if the sealing seal has been broken, do not sign off or accept the shipment.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-500">
                    ID: {invoice.items[0]?.id || 'SKU-DETOX-1'}
                  </span>
                  <span className="px-2 py-1 bg-white border border-slate-250 rounded text-[9px] font-mono text-emerald-600 font-bold">
                    VERIFIED SKU
                  </span>
                  <span className="px-2 py-1 bg-white border border-slate-250 rounded text-[9px] font-mono text-rose-500 font-bold">
                    SECURITY PROTECTED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
