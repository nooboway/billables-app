import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Expense, TemplateSettings } from '../types';
import { motion } from 'motion/react';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [paid, setPaid] = useState(true);

  const currencySymbol = templateSettings.currencySymbol || '₦';

  const formatValue = (num: number) => `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || typeof amount !== 'number' || amount <= 0) return;

    onAddExpense({
      id: `exp-${Date.now()}`,
      description: desc,
      vendor: vendor || 'Unknown Vendor',
      category,
      date,
      paid,
      taxRate: 0,
      amount,
    });

    setDesc('');
    setVendor('');
    setAmount('');
    setIsCreating(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Expenses</h2>
          <p className="text-sm text-stone-500 mt-1">Track operational outflows and overhead.</p>
        </div>
        <div className="px-4 py-2 bg-stone-100 rounded-lg border border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-2">Total Logged</span>
          <span className="font-mono font-bold text-stone-900">{formatValue(totalExpenses)}</span>
        </div>
      </div>

      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full py-4 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </button>
      ) : (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-stone-50 border border-stone-200 rounded-xl p-6 space-y-4"
          onSubmit={handleSaveExpense}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-stone-900">New Expense Record</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-xs font-bold text-stone-500 hover:text-stone-900">CANCEL</button>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Description</label>
            <input 
              type="text" required value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. AWS Hosting"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Vendor</label>
              <input 
                type="text" value={vendor} onChange={e => setVendor(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Amazon Web Services"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Category</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Administration">Administration</option>
                <option value="Advertising">Advertising</option>
                <option value="Travel">Travel</option>
                <option value="Supplies">Supplies</option>
                <option value="Rent">Rent</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Date</label>
              <input 
                type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Amount ({currencySymbol})</label>
              <input 
                type="number" required min="0.01" step="0.01" value={amount} onChange={e => setAmount(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaid(!paid)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                paid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {paid ? 'STATUS: PAID' : 'STATUS: PENDING'}
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
              Save Record
            </button>
          </div>
        </motion.form>
      )}

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">No expenses recorded yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-bold">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Vendor / Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-stone-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-bold text-stone-900">{exp.description}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{exp.paid ? <span className="text-green-600">Paid</span> : 'Pending'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-stone-900">{exp.vendor}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{exp.category}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-600">{exp.date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-stone-900 text-right">{formatValue(exp.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onRemoveExpense(exp.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
