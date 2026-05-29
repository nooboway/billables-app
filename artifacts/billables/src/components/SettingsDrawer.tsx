import React, { useState } from 'react';
import { X, Save, Building, Plus, Trash2 } from 'lucide-react';
import { BusinessDetails, BankAccount, VatSettings, TemplateSettings } from '../types';

const DEFAULT_PAYMENT_METHODS = ['Bank Transfer', 'PayPal', 'Paystack', 'Stripe', 'Cash', 'Cheque', 'e-Transfer', 'Other'];

interface SettingsDrawerProps {
  isOpen: boolean; onClose: () => void;
  businessDetails: BusinessDetails; onUpdateBusinessDetails: (d: BusinessDetails) => void;
  bankAccount: BankAccount; onUpdateBankAccount: (a: BankAccount) => void;
  vatSettings: VatSettings; onUpdateVatSettings: (v: VatSettings) => void;
  templateSettings: TemplateSettings; onUpdateTemplateSettings: (t: TemplateSettings) => void;
}

export default function SettingsDrawer({
  isOpen, onClose,
  businessDetails, onUpdateBusinessDetails,
  bankAccount, onUpdateBankAccount,
  templateSettings, onUpdateTemplateSettings
}: SettingsDrawerProps) {
  const [tab, setTab] = useState<'brand'|'bank'|'template'>('brand');

  const [biz, setBiz] = useState(businessDetails);
  const [bank, setBank] = useState(bankAccount);
  const [tpl, setTpl] = useState(templateSettings);
  const [methods, setMethods] = useState<string[]>(
    templateSettings.customPaymentMethods ?? DEFAULT_PAYMENT_METHODS
  );

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setBiz({ ...biz, [field]: ev.target!.result as string }); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateBusinessDetails(biz);
    onUpdateBankAccount(bank);
    onUpdateTemplateSettings({ ...tpl, customPaymentMethods: methods });
    onClose();
  };

  const figureFont = tpl.figureFont ?? 'tabular';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-slide-left">
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">Workspace Settings</h2>
            <p className="text-xs text-stone-500 mt-0.5">Configure your business identity and defaults.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-1">
          <button onClick={()=>setTab('brand')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${tab==='brand'?'bg-white border-x border-t border-stone-200 text-stone-900':'text-stone-500 hover:bg-stone-200/50'}`}>Identity</button>
          <button onClick={()=>setTab('bank')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${tab==='bank'?'bg-white border-x border-t border-stone-200 text-stone-900':'text-stone-500 hover:bg-stone-200/50'}`}>Banking</button>
          <button onClick={()=>setTab('template')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${tab==='template'?'bg-white border-x border-t border-stone-200 text-stone-900':'text-stone-500 hover:bg-stone-200/50'}`}>Templates</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'brand' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Business Name</label><input type="text" value={biz.name} onChange={e=>setBiz({...biz, name: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Tax Reg No</label><input type="text" value={biz.taxRegNo} onChange={e=>setBiz({...biz, taxRegNo: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
              </div>
              <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Email</label><input type="email" value={biz.email} onChange={e=>setBiz({...biz, email: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">City</label><input type="text" value={biz.city} onChange={e=>setBiz({...biz, city: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Street</label><input type="text" value={biz.street} onChange={e=>setBiz({...biz, street: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {biz.logoUrl ? <img src={biz.logoUrl} className="w-16 h-16 rounded border border-stone-200 object-contain p-1" alt="Logo"/> : <div className="w-16 h-16 rounded border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300"><Building className="w-6 h-6"/></div>}
                  <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"><input type="file" className="hidden" onChange={e => handleLogoUpload(e, 'logoUrl')} />Upload Image</label>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Signature</label>
                <div className="flex items-center gap-4">
                  {biz.signatureUrl ? <img src={biz.signatureUrl} className="h-12 border border-stone-200 object-contain p-1" alt="Sig"/> : <div className="w-32 h-12 rounded border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 text-xs">No signature</div>}
                  <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"><input type="file" className="hidden" onChange={e => handleLogoUpload(e, 'signatureUrl')} />Upload Scan</label>
                </div>
              </div>
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Account Holder</label><input type="text" value={bank.accountHolder} onChange={e=>setBank({...bank, accountHolder: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Bank Name</label><input type="text" value={bank.bankName} onChange={e=>setBank({...bank, bankName: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Account Number</label><input type="text" value={bank.accountNumber} onChange={e=>setBank({...bank, accountNumber: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none font-mono" /></div>
              </div>
              <div className="pt-4 border-t border-stone-100 space-y-1">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">PayPal Payment Link</label>
                <input type="url" placeholder="https://paypal.me/yourusername" value={bank.paymentLink || ''} onChange={e=>setBank({...bank, paymentLink: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none font-mono" />
                <p className="text-[10px] text-stone-400">Rendered as a "Pay with PayPal" button on your invoice. Also works for Stripe or any payment URL.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Paystack Link</label>
                <input type="text" placeholder="https://paystack.com/pay/..." value={bank.paystackLink || ''} onChange={e=>setBank({...bank, paystackLink: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none font-mono" />
              </div>
            </div>
          )}

          {tab === 'template' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Default Template</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Minimal', 'Executive', 'Studio', 'Classic', 'Stripe'].map(t => (
                    <button key={t} onClick={() => setTpl({...tpl, templateType: t as any})} className={`p-3 rounded-lg border text-sm font-bold transition-all text-left ${tpl.templateType === t ? 'border-primary bg-primary/5 text-primary' : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Brand Color</label>
                <div className="flex gap-3">
                  {['#E54A13', '#0F1729', '#22C55E', '#3B82F6'].map(c => (
                    <button key={c} onClick={() => setTpl({...tpl, color: c})} className={`w-8 h-8 rounded-full border-2 ${tpl.color === c ? 'border-stone-900 scale-110' : 'border-transparent hover:scale-110'} transition-transform`} style={{backgroundColor: c}}></button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Currency Symbol</label><input type="text" value={tpl.currencySymbol} onChange={e=>setTpl({...tpl, currencySymbol: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
                <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Net Terms (Days)</label><input type="number" value={tpl.dueDateDays} onChange={e=>setTpl({...tpl, dueDateDays: parseInt(e.target.value)})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none" /></div>
              </div>

              {/* Figure font */}
              <div className="pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Figure Style</label>
                <p className="text-[11px] text-stone-400 mb-3">Controls how amounts and numbers look on your invoices.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'tabular', label: 'Modern', preview: '1,234.00', cls: 'tabular-nums tracking-tight font-sans' },
                    { key: 'mono',    label: 'Classic', preview: '1,234.00', cls: 'font-mono' },
                    { key: 'serif',   label: 'Elegant', preview: '1,234.00', cls: 'font-["Lora",Georgia,serif] tabular-nums' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setTpl({...tpl, figureFont: opt.key as any})}
                      className={`p-3 rounded-lg border text-left transition-all ${figureFont === opt.key ? 'border-primary bg-primary/5' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                    >
                      <div className={`text-lg mb-1 text-stone-900 ${opt.cls} ${figureFont === opt.key ? 'text-primary' : ''}`}>{opt.preview}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${figureFont === opt.key ? 'text-primary' : 'text-stone-400'}`}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable payment methods */}
              <div className="pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Payment Methods</label>
                <p className="text-[11px] text-stone-400 mb-3">Customize the options shown in the invoice creator. Click any label to rename it.</p>
                <div className="space-y-2">
                  {methods.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m}
                        onChange={e => setMethods(methods.map((v, i) => i === idx ? e.target.value : v))}
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-primary outline-none"
                      />
                      <button
                        onClick={() => setMethods(methods.filter((_, i) => i !== idx))}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setMethods([...methods, ''])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Method
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50">
          <button onClick={handleSave} className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
            <Save className="w-4 h-4"/> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
