/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Expense, TemplateSettings } from '../types';

interface ExpensesTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (id: string) => void;
  templateSettings: TemplateSettings;
}

export default function ExpensesTracker({
  expenses,
  onAddExpense,
  onRemoveExpense,
  templateSettings,
}: ExpensesTrackerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [desc, setDesc] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<'Administration' | 'Advertising' | 'Travel' | 'Supplies' | 'Rent' | 'Other'>('Supplies');
  const [date, setDate] = useState('2026-05-26');
  const [amount, setAmount] = useState(0);
  const [paid, setPaid] = useState(true);

  const currencySymbol = templateSettings.currencySymbol || '₦';

  const formatValue = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || amount <= 0) return;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      description: desc,
      vendor: vendor || 'Direct Vendor',
      category,
      date,
      paid,
      taxRate: 7.5,
      amount,
    };

    onAddExpense(newExp);

    // Reset Form
    setDesc('');
    setVendor('');
    setAmount(0);
    setIsCreating(false);
  };  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm font-sans" id="expenses-tracker-module">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 select-none">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 font-sans">
            <Tag className="w-4 h-4 text-[#E54A13]" />
            Expenses Ledger
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Record business financial outgoing costs and inventory receipts.</p>
        </div>
        <span className="text-[11.5px] font-sans font-extrabold select-none px-2.5 py-1 bg-rose-50 border border-rose-100 text-[#E54A13] rounded-lg">
          Logged Outflow: {formatValue(expenses.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>

      {isCreating ? (
        <form onSubmit={handleSaveExpense} className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 space-y-3.5 animate-slide-up text-xs font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 select-none">
            <span className="font-extrabold text-[#E54A13] uppercase tracking-widest text-[9px] flex items-center gap-1.5 font-sans">
              <Plus className="w-3.5 h-3.5" />
              Log Business Outlay cost
            </span>
            <button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              className="text-slate-405 text-slate-400 hover:text-slate-600 font-bold uppercase cursor-pointer border-0 bg-transparent text-[10px]"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold block text-[10px] uppercase font-sans">Expense Description</label>
            <input 
              type="text" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Packing box design prints batch"
              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 shadow-sm font-sans outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block text-[10px] uppercase font-sans">Vendor Provider</label>
              <input 
                type="text" 
                value={vendor} 
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. GIG Logistics"
                className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 shadow-sm font-sans outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block text-[10px] uppercase font-sans">Expenditure Category</label>
              <select 
                value={category} 
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 shadow-sm font-sans outline-none"
              >
                <option value="Supplies">Supplies</option>
                <option value="Administration">Administration</option>
                <option value="Travel">Travel</option>
                <option value="Advertising">Advertising</option>
                <option value="Rent">Rent</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block text-[10px] uppercase font-sans">Date Logged</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 shadow-sm font-sans outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block text-[10px] uppercase font-sans">Amount Charged ({currencySymbol})</label>
              <input 
                type="number" 
                value={amount || ''} 
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 shadow-sm font-sans outline-none"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl select-none">
            <span className="font-sans text-slate-600 font-semibold text-xs">Has this cost been settled/paid?</span>
            <button
              type="button"
              onClick={() => setPaid(!paid)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                paid ? 'bg-orange-50 text-[#E54A13] border-[#E54A13]/40' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {paid ? 'PAID / SETTLED' : 'DRAFT / UNPAID'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#E54A13] hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wide transition-all cursor-pointer shadow-md border-0"
          >
            Log Outgoings Details
          </button>
        </form>
      ) : (
        <div className="mb-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-[#E54A13] hover:text-[#E54A13] text-slate-600 rounded-xl flex items-center gap-1.5 w-full justify-center transition-all cursor-pointer text-xs uppercase font-extrabold shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#E54A13]" />
            File outlay voucher
          </button>
        </div>
      )}

      {/* Expense Listing scrolling list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {expenses.length === 0 ? (
          <p className="text-center py-8 text-slate-400 font-sans text-xs italic">No logged expenses loaded.</p>
        ) : (
          expenses.map((exp) => (
            <div 
              key={exp.id} 
              className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-100/50 transition-all text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm font-sans">{exp.description}</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-[9px] text-slate-600 font-sans rounded uppercase font-bold">{exp.category}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Vendor: {exp.vendor} • Approved: {exp.date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right select-none">
                  <span className="font-sans font-extrabold text-[#E54A13] block text-sm">-{formatValue(exp.amount)}</span>
                  <span className={`text-[8.5px] font-extrabold font-sans uppercase ${exp.paid ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {exp.paid ? 'PAID' : 'DRAFT'}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveExpense(exp.id)}
                  className="p-1.5 bg-white border border-slate-200 hover:border-[#E54A13] text-slate-400 hover:text-[#E54A13] rounded-lg transition-all cursor-pointer shadow-sm"
                  title="Remove expense"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
