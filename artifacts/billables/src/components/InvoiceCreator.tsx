import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check, Package, Eye, EyeOff } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceTemplate, TemplateSettings, VatSettings, Product, Service, BusinessDetails, BankAccount } from '../types';
import InvoicePreview from './InvoicePreview';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  templateSettings: TemplateSettings;
  vatSettings: VatSettings;
  products: Product[];
  services: Service[];
  businessName: string;
  businessDetails?: BusinessDetails;
  bankAccount?: BankAccount;
}

function genId(format: string): string {
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  if (format.includes('0000')) return format.replace('0000', num);
  if (format.includes('-')) return format + num;
  return `INV-${num}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TEMPLATES: { id: InvoiceTemplate; label: string; desc: string; color: string }[] = [
  { id: 'Simple',   label: 'Simple',     desc: 'Clean & minimal',       color: '#f5f5f4' },
  { id: 'Stripe',   label: 'Stripe',     desc: 'Tech-forward stripes',   color: '#1a1a2e' },
  { id: 'Classic',  label: 'Classic',    desc: 'Professional & bold',    color: '#fff8f0' },
  { id: 'Modern',   label: 'Modern',     desc: 'Contemporary layout',    color: '#0f172a' },
  { id: 'Wardiere', label: 'Wardiere',   desc: 'Editorial serif style',  color: '#f0ebe3' },
];

const UNITS = ['hrs', 'days', 'units', 'pcs', 'kg', 'flat'];
const DEFAULT_PAYMENT_METHODS = ['Bank Transfer', 'PayPal', 'Paystack', 'Stripe', 'Cash', 'Cheque', 'e-Transfer', 'Other'];
const CURRENCIES = [
  { code: 'USD', symbol: '$' }, { code: 'NGN', symbol: '₦' }, { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' }, { code: 'CAD', symbol: 'CA$' }, { code: 'ZAR', symbol: 'R' },
];

const emptyItem = (): InvoiceItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  description: '', qty: 1, unit: 'units', price: 0, discount: 0, amount: 0,
});

const calcAmount = (item: InvoiceItem) =>
  Math.round(item.qty * item.price * (1 - item.discount / 100) * 100) / 100;

type Step = 1 | 2 | 3;

const FALLBACK_BIZ: BusinessDetails = {
  name: 'Your Business', country: '', street: '', aptSuite: '', postalCode: '',
  city: '', taxRegNo: '', contactPerson: '', cell: '', phone: '', fax: '',
  email: '', website: '',
};
const FALLBACK_BANK: BankAccount = {
  accountHolder: '', bankName: '', accountNumber: '', iban: '', bicSwift: '', bankAddress: '',
};

export default function InvoiceCreator({
  isOpen, onClose, onSave,
  templateSettings, vatSettings, products, services, businessName,
  businessDetails, bankAccount,
}: Props) {
  const initDate = today();
  const initDue = addDays(initDate, templateSettings.dueDateDays ?? 14);

  const [step, setStep] = useState<Step>(1);
  const [showPreview, setShowPreview] = useState(false);

  // Step 1 — Client + Meta
  const [clientName, setClientName]       = useState('');
  const [clientEmail, setClientEmail]     = useState('');
  const [clientStreet, setClientStreet]   = useState('');
  const [clientCity, setClientCity]       = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [invoiceId, setInvoiceId]         = useState(() => genId(templateSettings.numberingFormat ?? 'INV-0000'));
  const [issueDate, setIssueDate]         = useState(initDate);
  const [dueDate, setDueDate]             = useState(initDue);
  const [orderNo, setOrderNo]             = useState('');
  const [paymentMethod, setPaymentMethod] = useState(templateSettings.paymentMethod ?? 'Bank Transfer');
  const [currency, setCurrency]           = useState(templateSettings.currency ?? 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(templateSettings.currencySymbol ?? '$');

  // Step 2 — Line Items
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [showCatalog, setShowCatalog] = useState(false);

  // Step 3 — Finalize
  const [vatEnabled, setVatEnabled]     = useState(vatSettings.applyToInvoices ?? false);
  const [vatRate, setVatRate]           = useState(vatSettings.rate1 ?? 0);
  const [shippingFee, setShippingFee]   = useState(0);
  const [notes, setNotes]               = useState('');
  const [templateType, setTemplateType] = useState<InvoiceTemplate>(templateSettings.templateType ?? 'Simple');

  // Reset when reopened
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setShowPreview(false);
    setClientName(''); setClientEmail(''); setClientStreet('');
    setClientCity(''); setClientCountry('');
    setInvoiceId(genId(templateSettings.numberingFormat ?? 'INV-0000'));
    setIssueDate(today());
    setDueDate(addDays(today(), templateSettings.dueDateDays ?? 14));
    setOrderNo(''); setPaymentMethod(templateSettings.paymentMethod ?? 'Bank Transfer');
    setCurrency(templateSettings.currency ?? 'USD');
    setCurrencySymbol(templateSettings.currencySymbol ?? '$');
    setItems([emptyItem()]);
    setVatEnabled(vatSettings.applyToInvoices ?? false);
    setVatRate(vatSettings.rate1 ?? 0);
    setShippingFee(0); setNotes('');
    setTemplateType(templateSettings.templateType ?? 'Simple');
    setShowCatalog(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Derived totals
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const vatAmount = vatEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const total = subtotal + vatAmount + shippingFee;
  const fmt = (n: number) => `${currencySymbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Build a preview invoice from current form state
  const previewInvoice: Invoice = {
    id: invoiceId || 'PREVIEW',
    clientName: clientName || 'Client Name',
    clientEmail, clientCountry, clientStreet, clientCity,
    issueDate, dueDate, paymentMethod, orderNo,
    items, shippingFee,
    vatRate: vatEnabled ? vatRate : 0,
    status: 'Unpaid',
    notes, templateType,
    createdTime: new Date().toISOString(),
    history: [],
  };
  const previewTemplateSettings: TemplateSettings = { ...templateSettings, templateType, currencySymbol, currency };

  // Item helpers
  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const merged = { ...it, ...patch };
      merged.amount = calcAmount(merged);
      return merged;
    }));
  };
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const addFromCatalog = (item: Product | Service) => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      description: item.name,
      qty: 1,
      unit: item.unit,
      price: item.price,
      discount: item.discount ?? 0,
      amount: item.price * (1 - (item.discount ?? 0) / 100),
    }]);
    setShowCatalog(false);
  };

  // Validation per step
  const step1Valid = clientName.trim().length > 0 && invoiceId.trim().length > 0;
  const step2Valid = items.length > 0 && items.every(it => it.description.trim().length > 0 && it.price >= 0);

  const handleSave = () => {
    const invoice: Invoice = {
      id: invoiceId,
      clientName,
      clientEmail,
      clientCountry,
      clientStreet,
      clientCity,
      issueDate,
      dueDate,
      paymentMethod,
      orderNo,
      items,
      shippingFee,
      vatRate: vatEnabled ? vatRate : 0,
      status: 'Unpaid',
      notes,
      templateType,
      createdTime: new Date().toISOString(),
      history: [{ event: 'Invoice Created', timestamp: new Date().toISOString() }],
    };
    onSave(invoice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-stone-950/80 backdrop-blur-sm p-0 md:p-4">
      <div className={`w-full bg-white md:rounded-2xl shadow-2xl flex flex-col max-h-screen md:max-h-[92vh] overflow-hidden transition-all duration-300
        ${step === 3 && showPreview ? 'md:max-w-6xl' : 'md:max-w-3xl'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">New Invoice</h2>
            <p className="text-xs text-stone-400 mt-0.5">for {businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {([1, 2, 3] as Step[]).map(s => (
                <div key={s} className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-all
                  ${step === s ? 'bg-primary text-white' : step > s ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {step > s ? <Check className="w-3 h-3" /> : s}
                </div>
              ))}
            </div>
            {step === 3 && (
              <button
                onClick={() => setShowPreview(v => !v)}
                title={showPreview ? 'Hide preview' : 'Preview invoice'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border
                  ${showPreview ? 'bg-primary text-white border-primary' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'}`}
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step labels */}
        <div className="flex border-b border-stone-100 shrink-0">
          {[{ n: 1, label: 'Client & Info' }, { n: 2, label: 'Line Items' }, { n: 3, label: 'Finalize' }].map(({ n, label }) => (
            <div key={n} className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest transition-colors
              ${step === n ? 'text-primary border-b-2 border-primary' : step > n ? 'text-green-500' : 'text-stone-400'}`}>
              {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-hidden ${step === 3 && showPreview ? 'flex' : ''}`}>

          {/* Left pane (form) */}
          <div className={`overflow-y-auto ${step === 3 && showPreview ? 'w-1/2 border-r border-stone-100' : 'w-full'}`}>

            {/* ── Step 1: Client + Invoice Meta ── */}
            {step === 1 && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Client Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Client Name <span className="text-primary">*</span></label>
                      <input
                        autoFocus
                        type="text"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Acme Corporation"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors font-medium placeholder:text-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Email</label>
                      <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="billing@acme.com"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Country</label>
                      <input type="text" value={clientCountry} onChange={e => setClientCountry(e.target.value)} placeholder="United States"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Street Address</label>
                      <input type="text" value={clientStreet} onChange={e => setClientStreet(e.target.value)} placeholder="123 Main St"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">City</label>
                      <input type="text" value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="New York"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Invoice Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Invoice # <span className="text-primary">*</span></label>
                      <input type="text" value={invoiceId} onChange={e => setInvoiceId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Order / PO #</label>
                      <input type="text" value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="PO-001"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Issue Date</label>
                      <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors">
                        {(templateSettings.customPaymentMethods ?? DEFAULT_PAYMENT_METHODS).filter(Boolean).map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Currency</label>
                      <select value={currency} onChange={e => {
                        const c = CURRENCIES.find(c => c.code === e.target.value);
                        setCurrency(e.target.value);
                        if (c) setCurrencySymbol(c.symbol);
                      }}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Line Items ── */}
            {step === 2 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Line Items</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCatalog(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors">
                      <Package className="w-3.5 h-3.5" /> Catalog
                    </button>
                    <button onClick={addItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-[#C13A0E] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                </div>

                {showCatalog && (products.length > 0 || services.length > 0) && (
                  <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200 max-h-48 overflow-y-auto">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Pick from catalog</p>
                    <div className="space-y-1">
                      {[...products, ...services].map(item => (
                        <button key={item.id} onClick={() => addFromCatalog(item)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white text-left transition-colors group">
                          <div>
                            <div className="text-sm font-bold text-stone-900">{item.name}</div>
                            <div className="text-xs text-stone-400">{item.unit} · {item.discount ? `${item.discount}% off` : 'no discount'}</div>
                          </div>
                          <div className="font-mono font-bold text-sm text-stone-700">{currencySymbol}{item.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="hidden md:grid grid-cols-[2fr_80px_80px_110px_70px_110px_32px] gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 px-1">
                  <span>Description</span><span>Qty</span><span>Unit</span><span>Price</span><span>Disc%</span><span className="text-right">Amount</span><span />
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="group">
                      {/* Mobile: stacked */}
                      <div className="md:hidden bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text" value={item.description}
                            onChange={e => updateItem(item.id, { description: e.target.value })}
                            placeholder={`Item ${idx + 1} description`}
                            className="flex-1 px-2.5 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary outline-none placeholder:text-stone-300"
                          />
                          {items.length > 1 && (
                            <button onClick={() => removeItem(item.id)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Qty</label>
                            <input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary outline-none text-center" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Unit</label>
                            <select value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })}
                              className="w-full px-1.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:border-primary outline-none">
                              {UNITS.map(u => <option key={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Price</label>
                            <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary outline-none" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Disc%</label>
                            <input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary outline-none" />
                          </div>
                        </div>
                        <div className="text-right text-sm font-black text-stone-900 font-mono">{fmt(item.amount)}</div>
                      </div>

                      {/* Desktop: row */}
                      <div className="hidden md:grid grid-cols-[2fr_80px_80px_110px_70px_110px_32px] gap-2 items-center">
                        <input type="text" value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })}
                          placeholder={`Item ${idx + 1}`}
                          className="px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-stone-300 font-medium" />
                        <input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                          className="px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none text-center transition-colors" />
                        <select value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })}
                          className="px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-xs text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors">
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors" />
                        <input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          className="px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-900 focus:border-primary focus:bg-white outline-none text-center transition-colors" />
                        <div className="text-right font-mono font-black text-stone-900 text-sm">{fmt(item.amount)}</div>
                        {items.length > 1 ? (
                          <button onClick={() => removeItem(item.id)} className="p-1.5 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : <div />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                  <div className="text-right">
                    <div className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">Subtotal</div>
                    <div className="text-2xl font-black text-stone-900 font-mono">{fmt(subtotal)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Finalize ── */}
            {step === 3 && (
              <div className="p-6 space-y-6">
                {/* Template Picker */}
                <div>
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Invoice Template</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => setTemplateType(t.id)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${templateType === t.id ? 'border-primary shadow-md shadow-primary/10' : 'border-stone-100 hover:border-stone-200'}`}>
                        {templateType === t.id && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className="w-full h-8 rounded-md mb-2" style={{ background: t.color, border: '1px solid rgba(0,0,0,0.06)' }} />
                        <div className="text-xs font-bold text-stone-900 truncate">{t.label}</div>
                        <div className="text-[9px] text-stone-400 truncate">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* VAT + Shipping */}
                <div>
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Tax & Fees</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <button onClick={() => setVatEnabled(v => !v)}
                        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${vatEnabled ? 'bg-primary' : 'bg-stone-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${vatEnabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{vatSettings.taxLabel || 'VAT'}</div>
                        {vatEnabled && (
                          <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="0" max="100" step="0.1" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 bg-white border border-stone-200 rounded text-sm font-bold text-stone-900 focus:border-primary outline-none" />
                            <span className="text-xs text-stone-500 font-bold">%</span>
                          </div>
                        )}
                      </div>
                      {vatEnabled && <div className="font-mono font-bold text-sm text-stone-700 shrink-0">{fmt(vatAmount)}</div>}
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Shipping / Handling</label>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-bold text-sm shrink-0">{currencySymbol}</span>
                        <input type="number" min="0" step="0.01" value={shippingFee} onChange={e => setShippingFee(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 focus:border-primary outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Notes / Terms</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Payment terms, thank you message, bank details reminder…"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:border-primary focus:bg-white outline-none transition-colors resize-none placeholder:text-stone-300 leading-relaxed"
                  />
                </div>

                {/* Summary */}
                <div className="bg-stone-50 rounded-xl border border-stone-100 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Subtotal</span><span className="font-mono font-bold">{fmt(subtotal)}</span>
                  </div>
                  {vatEnabled && (
                    <div className="flex justify-between text-sm text-stone-500">
                      <span>{vatSettings.taxLabel || 'VAT'} ({vatRate}%)</span><span className="font-mono font-bold">{fmt(vatAmount)}</span>
                    </div>
                  )}
                  {shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-stone-500">
                      <span>Shipping</span><span className="font-mono font-bold">{fmt(shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span><span className="font-mono text-primary text-lg">{fmt(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right pane — live preview */}
          {step === 3 && showPreview && (
            <div className="w-1/2 overflow-y-auto bg-stone-100 p-4">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">Live Preview</div>
              <div style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '153.8%' }}>
                <InvoicePreview
                  invoice={previewInvoice}
                  businessDetails={businessDetails ?? FALLBACK_BIZ}
                  bankAccount={bankAccount ?? FALLBACK_BANK}
                  templateSettings={previewTemplateSettings}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center bg-stone-50/50 shrink-0">
          <button
            onClick={() => step > 1 ? setStep(s => (s - 1) as Step) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="text-xs text-stone-400 font-medium">Step {step} of 3</div>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!step2Valid || !step1Valid}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#C13A0E] text-white rounded-lg text-sm font-black transition-colors disabled:opacity-40 shadow-md shadow-primary/20"
            >
              <Check className="w-4 h-4" /> Create Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
