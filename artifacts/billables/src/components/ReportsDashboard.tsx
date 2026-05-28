import React, { useState } from 'react';
import { Calendar, User } from 'lucide-react';
import { Invoice, Product, Service, Expense, TemplateSettings } from '../types';

interface ReportsDashboardProps {
  invoices: Invoice[];
  products: Product[];
  services: Service[];
  expenses: Expense[];
  templateSettings: TemplateSettings;
}

export default function ReportsDashboard({
  invoices, products, services, expenses, templateSettings
}: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'Invoices' | 'Clients' | 'Catalog'>('Invoices');

  const formatVal = (n: number) => `${templateSettings.currencySymbol || '₦'}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalInv = invoices.reduce((sum, inv) => {
    const sub = inv.items.reduce((s, i) => s + i.amount, 0);
    return sum + sub + inv.shippingFee + (sub * inv.vatRate / 100);
  }, 0);
  const paid = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.items.reduce((s,i)=>s+i.amount,0) + inv.shippingFee, 0); // Simplified for visual
  const unpaid = totalInv - paid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Analytics</h2>
          <p className="text-sm text-stone-500 mt-1">Real-time telemetry on operations.</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          {(['Invoices', 'Clients', 'Catalog'] as const).map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Invoices' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-stone-900 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between min-h-[240px]">
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Revenue</div>
              <div className="text-4xl font-black tracking-tighter">{formatVal(totalInv)}</div>
            </div>
            <div className="space-y-2 mt-8">
              <div className="flex justify-between text-sm border-b border-stone-800 pb-2">
                <span className="text-green-400">Collected</span>
                <span className="font-mono">{formatVal(paid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Outstanding</span>
                <span className="font-mono">{formatVal(unpaid)}</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6">Annual Trajectory (Mock)</div>
            <div className="flex-1 flex items-end justify-between gap-2 h-32">
              {Array.from({length: 12}).map((_, i) => {
                const height = Math.max(10, Math.random() * 100);
                return (
                  <div key={i} className="flex-1 bg-stone-100 rounded-t-sm hover:bg-stone-200 transition-colors relative group">
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-sm" style={{ height: `${height}%` }}></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Clients' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Client Distribution</h3>
          </div>
          <div className="p-4 text-sm text-stone-500 text-center py-12">Client metrics populate as invoices are paid.</div>
        </div>
      )}

      {activeTab === 'Catalog' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Items</h3>
            <span className="text-xs font-bold text-stone-400">{products.length} Products, {services.length} Services</span>
          </div>
          <div className="p-4 text-sm text-stone-500 text-center py-12">Manage catalog items in the Catalogs tab.</div>
        </div>
      )}
    </div>
  );
}
