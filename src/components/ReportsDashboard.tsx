/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Calendar, User, Search, ArrowUpRight, ArrowDownRight, Briefcase, Tag, FileText } from 'lucide-react';
import { Invoice, Product, Service, Expense, TemplateSettings } from '../types';

interface ReportsDashboardProps {
  invoices: Invoice[];
  products: Product[];
  services: Service[];
  expenses: Expense[];
  templateSettings: TemplateSettings;
  onSelectInvoice?: (id: string) => void;
}

export default function ReportsDashboard({
  invoices,
  products,
  services,
  expenses,
  templateSettings,
  onSelectInvoice,
}: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'Invoices' | 'Clients' | 'Products' | 'Services' | 'Expenses'>('Invoices');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedClientFilter, setSelectedClientFilter] = useState('All');
  const [timeMode, setTimeMode] = useState<'month' | 'quarter'>('month');

  const currencySymbol = templateSettings.currencySymbol || '₦';

  // Format currency
  const formatValue = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper calculations for Invoices
  const getInvoicesSummary = () => {
    let paid = 0;
    let unpaid = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      const subtotal = inv.items.reduce((s, i) => s + i.amount, 0);
      const total = subtotal + inv.shippingFee + (subtotal * inv.vatRate / 100);

      if (inv.status === 'Paid') {
        paid += total;
      } else if (inv.status === 'Unpaid') {
        unpaid += total;
      } else if (inv.status === 'Overdue') {
        overdue += total;
      }
    });

    const totalInvoiced = paid + unpaid + overdue;
    return { paid, unpaid, overdue, totalInvoiced };
  };

  const { paid, unpaid, overdue, totalInvoiced } = getInvoicesSummary();

  // Monthly values for calendar charts
  const getMonthsInvoiced = () => {
    const list = Array(12).fill(0).map((_, i) => ({
      monthId: i,
      name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      amount: 0,
      count: 0
    }));

    invoices.forEach(inv => {
      const subtotal = inv.items.reduce((s, i) => s + i.amount, 0);
      const total = subtotal + inv.shippingFee + (subtotal * inv.vatRate / 100);
      const date = new Date(inv.issueDate);
      if (!isNaN(date.getTime())) {
        const monthNum = date.getMonth(); // 0-11
        list[monthNum].amount += total;
        list[monthNum].count += 1;
      }
    });

    return list;
  };

  const monthlyData = getMonthsInvoiced();
  const maxMonthlyAmount = Math.max(...monthlyData.map(m => m.amount), 1);

  // Client values
  const getClientsInvoiced = () => {
    const clientMap: { [key: string]: { amount: number; count: number } } = {};
    invoices.forEach(inv => {
      const subtotal = inv.items.reduce((s, i) => s + i.amount, 0);
      const total = subtotal + inv.shippingFee + (subtotal * inv.vatRate / 100);
      if (!clientMap[inv.clientName]) {
        clientMap[inv.clientName] = { amount: 0, count: 0 };
      }
      clientMap[inv.clientName].amount += total;
      clientMap[inv.clientName].count += 1;
    });

    return Object.keys(clientMap).map(name => ({
      name,
      amount: clientMap[name].amount,
      count: clientMap[name].count,
      percentage: totalInvoiced > 0 ? (clientMap[name].amount / totalInvoiced) * 100 : 0
    })).sort((a,b) => b.amount - a.amount);
  };

  const topClients = getClientsInvoiced();

  // Expenses calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm font-sans feature-card cursor-pointer" id="reports-main-dashboard">
      {/* Filters & Tabs Navigation */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-5 border-b border-stone-100 mb-6 select-none">
        <div>
          <span className="text-[11px] tracking-[0.06em] text-[#E54A13] uppercase font-black block mb-1">METRICS & ANALYTICS</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-[-0.035em] text-stone-900 flex items-center gap-2">
            Reports & Analytics
          </h2>
          <p className="text-[13px] text-stone-500 mt-1">Interactive commercial ledgers, cash flows, and analytics.</p>
        </div>

        {/* Tab List */}
        <div className="flex flex-wrap gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
          {(['Invoices', 'Clients', 'Products', 'Services', 'Expenses'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all border-0 cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#E54A13] text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-6 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs select-none">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-400 font-bold uppercase text-[10px]">Date:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-stone-705 text-stone-700 outline-none font-sans focus:border-[#E54A13] text-[11px] font-bold"
          >
            <option value="2026">This year (2026)</option>
            <option value="2025">Last year (2025)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-400 font-bold uppercase text-[10px]">Client:</span>
          <select 
            value={selectedClientFilter} 
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-stone-705 text-stone-700 outline-none font-sans focus:border-[#E54A13] text-[11px] font-bold"
          >
            <option value="All">All clients</option>
            {topClients.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER INVOICES REPORT */}
      {activeTab === 'Invoices' && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Ring widget and breakdown of receipts */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Pie card summary */}
            <div className="md:col-span-5 bg-stone-50 p-5 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-semibold">Total Invoice Generation</span>
                <p className="text-2xl font-black text-stone-800 mt-1 font-sans tracking-tight">{formatValue(totalInvoiced)}</p>
                <p className="text-[10px] text-stone-400 font-sans mt-0.5">Includes VAT and shipping costs</p>
              </div>

              {/* Graphical CSS Pie chart donut representing proportions of Paid vs Unpaid */}
              <div className="my-6 flex justify-center relative">
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-transparent border-[12px] border-stone-200"
                  style={{
                    backgroundImage: totalInvoiced > 0 
                      ? `conic-gradient(#10B981 0% ${paid / totalInvoiced * 100}%, #E54A13 ${paid / totalInvoiced * 100}% ${(paid + overdue) / totalInvoiced * 100}%, #94A3B8 ${(paid + overdue) / totalInvoiced * 100}% 100%)`
                      : 'none'
                  }}
                >
                  <div className="absolute inset-2 w-[100px] h-[100px] rounded-full bg-stone-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-sans text-stone-400 uppercase font-semibold">Unpaid</span>
                    <span className="text-xs font-bold font-sans text-[#E54A13] mt-0.5">
                      {totalInvoiced > 0 ? `${((unpaid + overdue)/totalInvoiced * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between items-center text-stone-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Paid
                  </span>
                  <span className="font-bold">{formatValue(paid)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E54A13]" /> Unpaid
                  </span>
                  <span className="font-bold">{formatValue(unpaid)}</span>
                </div>
                {overdue > 0 && (
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Overdue
                    </span>
                    <span className="font-bold">{formatValue(overdue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactivity Graph */}
            <div className="md:col-span-7 bg-stone-50 p-5 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4 select-none">
                <span className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-semibold">Sales Distribution</span>
                <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-stone-200">
                  <button 
                    onClick={() => setTimeMode('month')}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg border-0 cursor-pointer ${timeMode === 'month' ? 'bg-orange-55 shadow-sm bg-orange-50 text-[#E54A13]' : 'text-stone-500'}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setTimeMode('quarter')}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg border-0 cursor-pointer ${timeMode === 'quarter' ? 'bg-orange-55 shadow-sm bg-orange-50 text-[#E54A13]' : 'text-stone-505 text-stone-500'}`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>

              {/* Month graph bars */}
              {timeMode === 'month' ? (
                <div className="h-44 flex items-end justify-between gap-1 w-full pt-4">
                  {monthlyData.map((m) => {
                    const pct = (m.amount / maxMonthlyAmount) * 100;
                    return (
                      <div key={m.name} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-white border border-stone-200 text-[9px] text-stone-850 text-stone-800 px-1.5 py-0.5 rounded-xl font-sans hidden group-hover:block whitespace-nowrap z-10 shadow-sm font-bold">
                          {formatValue(m.amount)} ({m.count} inv)
                        </div>
                        {/* Fill line */}
                        <div className="w-3.5 bg-stone-200 rounded-t-sm h-36 flex items-end justify-center">
                          <div 
                            className="w-full bg-[#E54A13] rounded-t-sm transition-all duration-500 hover:bg-orange-600"
                            style={{ height: `${pct > 0 ? Math.max(pct, 4) : 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-stone-400 mt-1.5 font-bold uppercase font-sans">{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex items-end justify-around gap-4 w-full pt-4">
                  {[
                    { name: 'Q1 (Jan-Mar)', val: monthlyData.slice(0,3).reduce((s,m) => s+m.amount, 0) },
                    { name: 'Q2 (Apr-Jun)', val: monthlyData.slice(3,6).reduce((s,m) => s+m.amount, 0) },
                    { name: 'Q3 (Jul-Sep)', val: monthlyData.slice(6,9).reduce((s,m) => s+m.amount, 0) },
                    { name: 'Q4 (Oct-Dec)', val: monthlyData.slice(9,12).reduce((s,m) => s+m.amount, 0) },
                  ].map((q) => {
                    const qMax = Math.max(1, paid + unpaid);
                    const pct = (q.val / qMax) * 100;
                    return (
                      <div key={q.name} className="flex-1 flex flex-col items-center group relative cursor-pointer max-w-[60px]">
                        <div className="absolute bottom-full mb-1 bg-white border border-stone-200 text-[10px] text-stone-805 text-stone-800 px-2 py-0.5 rounded-xl font-sans hidden group-hover:block whitespace-nowrap z-10 shadow-sm font-bold">
                          {formatValue(q.val)}
                        </div>
                        <div className="w-6 bg-stone-200 rounded-t-sm h-36 flex items-end justify-center">
                          <div 
                            className="w-full bg-[#E54A13] rounded-t-sm transition-all duration-500"
                            style={{ height: `${pct > 0 ? Math.max(pct, 4) : 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-stone-405 text-stone-400 mt-1.5 font-sans font-bold uppercase">{q.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[10px] text-stone-400 text-center font-sans mt-3">Hover columns to audit specific quarterly and bimonthly values.</p>
            </div>
          </div>

          {/* Month list rows (Exactly as shown at the botton of screen) */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4">
            <h4 className="text-[11px] font-bold text-stone-400 uppercase font-sans tracking-wider mb-2.5">Detailed monthly breakdown table</h4>
            <div className="divide-y divide-stone-150">
              {monthlyData.map((m) => (
                <div key={m.name} className="py-2.5 flex justify-between items-center hover:bg-stone-100/50 px-2 rounded-lg transition-all text-xs font-sans">
                  <span className="text-stone-700 font-bold">{m.name} 2026</span>
                  <div className="flex gap-6 items-center">
                    <span className="text-stone-450 text-stone-400">{m.count} {m.count === 1 ? 'Invoice' : 'Invoices'}</span>
                    <span className="text-stone-800 font-extrabold w-24 text-right">{formatValue(m.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER CLIENTS REPORT */}
      {activeTab === 'Clients' && (
        <div className="space-y-5 animate-slide-up font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-bold mb-4">Top Invoiced Clients Proportion</h3>
              <div className="flex justify-center my-6">
                {/* Radial progress circle */}
                <div className="w-36 h-36 rounded-full border-8 border-stone-200 flex items-center justify-center relative bg-transparent"
                  style={{
                    backgroundImage: topClients.length > 0
                      ? 'conic-gradient(#E54A13 0% 100%)' // Simplistic representative for main client
                      : 'none'
                  }}
                >
                  <div className="absolute inset-1 w-[116px] h-[116px] rounded-full bg-stone-50 flex flex-col justify-center items-center">
                    <span className="text-[9px] text-stone-400 uppercase font-sans font-bold">Top Client</span>
                    <span className="text-xs font-extrabold text-[#E54A13] text-center font-sans px-2 overflow-hidden truncate max-w-full">
                      {topClients[0]?.name || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 font-sans mt-0.5">100% Volume</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-bold mb-4">Clients Directory Valuation</h3>
              <div className="space-y-3.5">
                {topClients.map((client, index) => (
                  <div key={client.name} className="p-3 bg-white rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-orange-50 text-[#E54A13] flex items-center justify-center font-extrabold text-[10px] font-sans">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="font-extrabold text-stone-800">{client.name}</p>
                        <p className="text-[10px] text-stone-400 font-sans">{client.count} billing event</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-stone-800 font-sans">{formatValue(client.amount)}</p>
                      <span className="text-[9px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.2 rounded-lg">
                        {client.percentage.toFixed(0)}% SHARE
                      </span>
                    </div>
                  </div>
                ))}

                {topClients.length === 0 && (
                  <p className="text-center py-8 text-xs text-stone-400 font-sans italic">No clients found to evaluate.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER PRODUCTS, SERVICES & EXPENSES REPORTS LISTING */}
      {(activeTab === 'Products' || activeTab === 'Services' || activeTab === 'Expenses') && (
        <div className="space-y-4 animate-slide-up font-sans">
          {/* Display lists or elegant empty states */}
          {activeTab === 'Products' && (
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs text-stone-800">
              <h3 className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-bold mb-4">Stock Ledger Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white border border-stone-100 rounded-xl flex gap-3.5 items-start">
                    {item.imageUrl && (
                      <div className="w-12 h-12 rounded bg-white border border-stone-100 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-bold text-stone-800 text-sm">{item.name}</p>
                        <span className="font-extrabold text-[#E54A13] font-sans">{formatValue(item.price)}</span>
                      </div>
                      <p className="text-[10.5px] text-stone-400 truncate leading-normal mt-1">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-sans uppercase font-bold">Unit: {item.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Services' && (
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs text-stone-800">
              <h3 className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-bold mb-4">Services Catalog & Alignments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white border border-stone-100 rounded-xl flex gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-bold text-stone-805 text-stone-800 text-sm">{item.name}</p>
                        <span className="font-extrabold text-[#E54A13] font-sans">{formatValue(item.price)}</span>
                      </div>
                      <p className="text-[10.5px] text-stone-400 truncate mt-1 leading-normal">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2 font-sans text-[9px]">
                        <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-bold uppercase">Unit: {item.unit}</span>
                        {item.durationMinutes && (
                          <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-bold">Duration: {item.durationMinutes} mins</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Expenses' && (
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 text-xs text-stone-800">
              <div className="flex justify-between items-baseline mb-4">
                <h3 className="text-[10px] text-stone-400 uppercase font-sans tracking-wider font-bold">Expenditure & Financial Outflow Logs</h3>
                <span className="text-xs font-sans font-extrabold text-[#E54A13]">Total Outgoing: {formatValue(totalExpenses)}</span>
              </div>
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-3 bg-white hover:bg-stone-100/40 transition-all border border-stone-100 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-stone-800 text-xs">{exp.description}</p>
                        <span className="text-[9px] px-1.5 py-0.2 bg-stone-100 text-stone-500 rounded uppercase font-sans font-bold">{exp.category}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-sans mt-1">Vendor: {exp.vendor} • Date: {exp.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#E54A13] font-sans text-sm">-{formatValue(exp.amount)}</p>
                      <span className="text-[9px] font-sans uppercase bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded font-bold">
                        {exp.paid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}

                {expenses.length === 0 && (
                  <p className="text-center py-8 text-xs text-stone-400 font-sans italic">No expenses logged yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
