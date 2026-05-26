/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Save, Building, CreditCard, Percent, Palette, Globe, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { BusinessDetails, BankAccount, VatSettings, TemplateSettings } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businessDetails: BusinessDetails;
  onUpdateBusinessDetails: (details: BusinessDetails) => void;
  bankAccount: BankAccount;
  onUpdateBankAccount: (account: BankAccount) => void;
  vatSettings: VatSettings;
  onUpdateVatSettings: (settings: VatSettings) => void;
  templateSettings: TemplateSettings;
  onUpdateTemplateSettings: (settings: TemplateSettings) => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  businessDetails,
  onUpdateBusinessDetails,
  bankAccount,
  onUpdateBankAccount,
  vatSettings,
  onUpdateVatSettings,
  templateSettings,
  onUpdateTemplateSettings,
}: SettingsDrawerProps) {
  const [activeSection, setActiveSection] = useState<'menu' | 'business' | 'payment' | 'vat' | 'template' | 'security'>('menu');

  // Local state copy for forms
  const [localDetails, setLocalDetails] = useState<BusinessDetails>({ ...businessDetails });
  const [localBank, setLocalBank] = useState<BankAccount>({ ...bankAccount });
  const [localVat, setLocalVat] = useState<VatSettings>({ ...vatSettings });
  const [localTemplate, setLocalTemplate] = useState<TemplateSettings>({ ...templateSettings });

  if (!isOpen) return null;

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessDetails(localDetails);
    setActiveSection('menu');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankAccount(localBank);
    setActiveSection('menu');
  };

  const handleSaveVat = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVatSettings(localVat);
    setActiveSection('menu');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTemplateSettings(localTemplate);
    setActiveSection('menu');
  };

  // Color options for layout presets
  const ACCENT_COLORS = [
    { name: 'Teal Green', value: '#22c55e' },
    { name: 'Royal Blue', value: '#2563eb' },
    { name: 'Moniepoint Blue', value: '#0284c7' },
    { name: 'Steel Slate', value: '#475569' },
    { name: 'Neon Purple', value: '#a855f7' },
    { name: 'Rose Red', value: '#e11d48' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="settings-drawer-backdrop">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10 text-xs">
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            {activeSection !== 'menu' && (
              <button 
                onClick={() => setActiveSection('menu')}
                className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition-all mr-1"
              >
                ← Back
              </button>
            )}
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">
              {activeSection === 'menu' && 'Settings'}
              {activeSection === 'business' && 'Business details'}
              {activeSection === 'payment' && 'Payment options'}
              {activeSection === 'vat' && 'VAT settings'}
              {activeSection === 'template' && 'Template design'}
              {activeSection === 'security' && 'Security & Language'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* MENU SCREEN */}
          {activeSection === 'menu' && (
            <div className="space-y-6" id="settings-main-menu-list">
              {/* Sylvia Banner group */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black font-display text-sm">
                  SL
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">SYLENS LIMITED</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Trial Active • 5 days left</p>
                </div>
              </div>

              {/* General Business Categories */}
              <div className="space-y-2">
                <p className="font-bold text-slate-500 uppercase font-mono tracking-widest text-[9px] px-1 mb-1">Business Settings</p>
                
                <button 
                  onClick={() => { setLocalDetails({ ...businessDetails }); setActiveSection('business'); }}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-bold text-slate-200">Business details</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Address, email, contact person, signature</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400 font-mono transition-all">→</span>
                </button>

                <button 
                  onClick={() => { setLocalBank({ ...bankAccount }); setActiveSection('payment'); }}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="font-bold text-slate-200">Payment options</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Moniepoint standard bank transfer ledger</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400 font-mono transition-all">→</span>
                </button>

                <button 
                  onClick={() => { setLocalVat({ ...vatSettings }); setActiveSection('vat'); }}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Percent className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-bold text-slate-200">VAT settings</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Enable, edit tax labels and percentage logs</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400 font-mono transition-all">→</span>
                </button>
              </div>

              {/* Documents styling group */}
              <div className="space-y-2">
                <p className="font-bold text-slate-500 uppercase font-mono tracking-widest text-[9px] px-1 mb-1">Documents Design</p>

                <button 
                  onClick={() => { setLocalTemplate({ ...templateSettings }); setActiveSection('template'); }}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-bold text-slate-200">Template design & settings</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Color palette, Stripe layouts, currency, due days</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400 font-mono transition-all">→</span>
                </button>
              </div>

              {/* Accounts & Access group */}
              <div className="space-y-2">
                <p className="font-bold text-slate-500 uppercase font-mono tracking-widest text-[9px] px-1 mb-1">Account & Preferences</p>

                <button 
                  onClick={() => setActiveSection('security')}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <div>
                      <p className="font-bold text-slate-200">Language, Security & Team</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">System preferences, workspace credentials keys</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400 font-mono transition-all">→</span>
                </button>
              </div>

              {/* Secondary visual guidelines */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 leading-normal">
                <p className="font-semibold text-slate-400 uppercase font-mono text-[9px] mb-1">Developer Notice</p>
                <p>These settings persist inside client-side local cache storage so edits are saved instantly across browser reloads.</p>
              </div>
            </div>
          )}

          {/* EDIT BUSINESS FORM */}
          {activeSection === 'business' && (
            <form onSubmit={handleSaveBusiness} className="space-y-4 animate-slide-up">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Company Registered Name</label>
                <input 
                  type="text" 
                  value={localDetails.name}
                  onChange={(e) => setLocalDetails({ ...localDetails, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Country</label>
                  <input 
                    type="text" 
                    value={localDetails.country}
                    onChange={(e) => setLocalDetails({ ...localDetails, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">City</label>
                  <input 
                    type="text" 
                    value={localDetails.city}
                    onChange={(e) => setLocalDetails({ ...localDetails, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Street address</label>
                <input 
                  type="text" 
                  value={localDetails.street}
                  onChange={(e) => setLocalDetails({ ...localDetails, street: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Apt, Suite</label>
                  <input 
                    type="text" 
                    value={localDetails.aptSuite}
                    onChange={(e) => setLocalDetails({ ...localDetails, aptSuite: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Postal Code</label>
                  <input 
                    type="text" 
                    value={localDetails.postalCode}
                    onChange={(e) => setLocalDetails({ ...localDetails, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Tax Registration Number</label>
                <input 
                  type="text" 
                  value={localDetails.taxRegNo}
                  onChange={(e) => setLocalDetails({ ...localDetails, taxRegNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                />
              </div>

              <p className="font-bold text-slate-500 uppercase font-mono tracking-widest text-[9px] pt-2 mb-1">Contact Details</p>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Authorized Representative (Contact Person)</label>
                <input 
                  type="text" 
                  value={localDetails.contactPerson}
                  onChange={(e) => setLocalDetails({ ...localDetails, contactPerson: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Cell Mobile Line</label>
                  <input 
                    type="text" 
                    value={localDetails.cell}
                    onChange={(e) => setLocalDetails({ ...localDetails, cell: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Direct Office Phone</label>
                  <input 
                    type="text" 
                    value={localDetails.phone}
                    onChange={(e) => setLocalDetails({ ...localDetails, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Business Email</label>
                <input 
                  type="email" 
                  value={localDetails.email}
                  onChange={(e) => setLocalDetails({ ...localDetails, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Website</label>
                <input 
                  type="text" 
                  value={localDetails.website}
                  onChange={(e) => setLocalDetails({ ...localDetails, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded font-bold font-display uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-xs border border-transparent cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Business details
              </button>
            </form>
          )}

          {/* EDIT PAYMENT OPTION FORM */}
          {activeSection === 'payment' && (
            <form onSubmit={handleSaveBank} className="space-y-4 animate-slide-up">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Account Holder Name</label>
                <input 
                  type="text" 
                  value={localBank.accountHolder}
                  onChange={(e) => setLocalBank({ ...localBank, accountHolder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Bank Name</label>
                  <input 
                    type="text" 
                    value={localBank.bankName}
                    onChange={(e) => setLocalBank({ ...localBank, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Account Number</label>
                  <input 
                    type="text" 
                    value={localBank.accountNumber}
                    onChange={(e) => setLocalBank({ ...localBank, accountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">IBAN Code (Optional)</label>
                <input 
                  type="text" 
                  value={localBank.iban}
                  onChange={(e) => setLocalBank({ ...localBank, iban: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">BIC / SWIFT Ledger</label>
                <input 
                  type="text" 
                  value={localBank.bicSwift}
                  onChange={(e) => setLocalBank({ ...localBank, bicSwift: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Branch Physical Location Address</label>
                <textarea 
                  value={localBank.bankAddress}
                  onChange={(e) => setLocalBank({ ...localBank, bankAddress: e.target.value })}
                  className="w-full h-16 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded px-3 py-1.5 text-slate-200 outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded font-bold font-display uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-xs border border-transparent cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Bank Ledger Account
              </button>
            </form>
          )}

          {/* EDIT VAT SETTINGS FORM */}
          {activeSection === 'vat' && (
            <form onSubmit={handleSaveVat} className="space-y-5 animate-slide-up">
              {/* Apply tag toggle */}
              <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <p className="font-bold text-slate-200 text-xs">Apply VAT globally to invoices</p>
                  <p className="text-[10px] text-slate-500 mt-1">If enabled, tax formulas are computed on standard subtotals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localVat.applyToInvoices}
                    onChange={(e) => setLocalVat({ ...localVat, applyToInvoices: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-805 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Tax Label Name/Tag</label>
                <input 
                  type="text" 
                  value={localVat.taxLabel}
                  onChange={(e) => setLocalVat({ ...localVat, taxLabel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 disabled:opacity-50 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                  placeholder="VAT"
                  disabled={!localVat.applyToInvoices}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Rate 1 (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localVat.rate1}
                    onChange={(e) => setLocalVat({ ...localVat, rate1: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 disabled:opacity-50 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                    disabled={!localVat.applyToInvoices}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Rate 2 (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localVat.rate2}
                    onChange={(e) => setLocalVat({ ...localVat, rate2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 disabled:opacity-50 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                    disabled={!localVat.applyToInvoices}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Rate 3 (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localVat.rate3}
                    onChange={(e) => setLocalVat({ ...localVat, rate3: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 disabled:opacity-50 rounded px-3 py-2 text-slate-200 outline-none font-mono"
                    disabled={!localVat.applyToInvoices}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 p-3.5 bg-indigo-950/40 border border-indigo-900 rounded-lg text-slate-400 leading-normal">
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px]">Tax modifications are reflected in new invoices only. Unsaved details will be discarded if the modal closes.</p>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded font-bold font-display uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-xs border border-transparent cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Tax Settings
              </button>
            </form>
          )}

          {/* EDIT TEMPLATE STYLING FORM */}
          {activeSection === 'template' && (
            <form onSubmit={handleSaveTemplate} className="space-y-4 animate-slide-up font-mono">
              <div className="space-y-2">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Accent Branding Colour Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setLocalTemplate({ ...localTemplate, color: color.value })}
                      className={`h-10 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                        localTemplate.color === color.value ? 'border-amber-400 scale-105' : 'border-transparent hover:scale-[1.02]'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {localTemplate.color === color.value && (
                        <span className="w-2 h-2 rounded-full bg-white outline outline-black outline-2" />
                      )}
                    </button>
                  ))}
                </div>
                {/* Manual color picker input */}
                <div className="flex gap-2.5 items-center mt-2 bg-slate-950 p-2.5 rounded border border-slate-800 font-sans text-xs">
                  <input 
                    type="color" 
                    value={localTemplate.color} 
                    onChange={(e) => setLocalTemplate({ ...localTemplate, color: e.target.value })}
                    className="w-6 h-6 rounded bg-transparent border-0 outline-none cursor-pointer"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">Custom Hex code:</span>
                  <input 
                    type="text" 
                    value={localTemplate.color} 
                    onChange={(e) => setLocalTemplate({ ...localTemplate, color: e.target.value })}
                    className="w-24 px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded font-mono text-[11px] text-white uppercase outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Document Template Style</label>
                <select 
                  value={localTemplate.templateType}
                  onChange={(e) => setLocalTemplate({ ...localTemplate, templateType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 outline-none text-[11px] uppercase font-bold"
                >
                  <option value="Stripe">Stripe (Premium borderless grid)</option>
                  <option value="Modern">Modern Minimalist Accent</option>
                  <option value="Classic">Classic Corporate</option>
                  <option value="Minimalist">Minimalist Slate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Currency</label>
                  <select 
                    value={localTemplate.currency}
                    onChange={(e) => {
                      const vals: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', CAD: 'CA$' };
                      setLocalTemplate({ 
                        ...localTemplate, 
                        currency: e.target.value,
                        currencySymbol: vals[e.target.value] || '$'
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none text-[11px]"
                  >
                    <option value="NGN">Naira (NGN)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="GBP">Pound Sterling (GBP)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="CAD">Canadian Dollar (CAD)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Language</label>
                  <select 
                    value={localTemplate.language}
                    onChange={(e) => setLocalTemplate({ ...localTemplate, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none text-[11px]"
                  >
                    <option value="EN">English (EN)</option>
                    <option value="FR">French (FR)</option>
                    <option value="ES">Spanish (ES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Payment Term Duration</label>
                  <select 
                    value={localTemplate.dueDateDays}
                    onChange={(e) => setLocalTemplate({ ...localTemplate, dueDateDays: parseInt(e.target.value) || 3 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none text-[11px]"
                  >
                    <option value="1">Due same day</option>
                    <option value="3">3 Days (Default)</option>
                    <option value="7">7 Days (Weekly)</option>
                    <option value="15">15 Days (Bi-weekly)</option>
                    <option value="30">30 Days (Net-30)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-display">Default Method</label>
                  <input 
                    type="text" 
                    value={localTemplate.paymentMethod}
                    onChange={(e) => setLocalTemplate({ ...localTemplate, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none text-[11px]"
                    placeholder="e-transfer"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded font-bold font-display uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all text-xs border border-transparent cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Template Configurations
              </button>
            </form>
          )}

          {/* EDIT SECURITY & PREFERENCES FORM */}
          {activeSection === 'security' && (
            <div className="space-y-5 animate-slide-up text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">WORKSPACE MEMBERS (My Team)</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-b-slate-900">
                    <span className="text-slate-200 font-bold">Dr. Justice (You)</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-[9px] uppercase">Owner Administrator</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Assistant Auditor</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] uppercase">Access Pending</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">MFA Security Encryption</span>
                <p className="text-[10.5px] text-slate-500 font-sans leading-normal">Session protection keys are monitored in real-time. If you believe your Private Relay link on AppleID has been breached, reset keys below.</p>
                <button
                  type="button"
                  onClick={() => alert("Simulation Action: MFA keys reset successfully!")}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-820 hover:text-white transition-all text-[10px] uppercase font-bold"
                >
                  Reset Security Credentials
                </button>
              </div>

              <div className="p-4 bg-rose-950/20 border border-rose-900 rounded-xl space-y-2.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-display">Destructive Actions</span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Default Cache Overlap:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to restore default initial business states? This clears all newly added estimates and invoices.")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-900 text-white rounded hover:bg-rose-800 transition-all text-[10px] uppercase font-bold border-0 cursor-pointer"
                  >
                    Reset Application Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
