import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Settings, LayoutDashboard, FileText, PieChart, Plus, ChevronRight, ChevronLeft, Mail, Download, Edit2, Copy, Box, TrendingUp, Sun, Moon, Menu, X as XIcon, ScanLine, Trash2, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Share2, Eye } from 'lucide-react';

import { BusinessDetails, BankAccount, VatSettings, TemplateSettings, Invoice, Product, Service, Expense, Notification } from './types';
import { useWorkspaces, useScopedLocalStorage, useWorkspaceIdentity } from './lib/workspaces';
import { useLocalStorage } from './lib/persistence';
import { INITIAL_TEMPLATE_SETTINGS, INITIAL_BUSINESS_DETAILS, INITIAL_BANK_ACCOUNT, INITIAL_VAT_SETTINGS, INITIAL_INVOICES, INITIAL_PRODUCTS, INITIAL_SERVICES, INITIAL_EXPENSES, SEED_WORKSPACE_ID } from './initialData';
import { applyAccent } from './lib/accent';
import { useNavigate } from './Root';

import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import PdfImportDialog from './components/PdfImportDialog';
import InvoicePreview from './components/InvoicePreview';
import LiveNotifications from './components/LiveNotifications';
import ReportsDashboard from './components/ReportsDashboard';
import ServicesProductsManager from './components/ServicesProductsManager';
import ExpensesTracker from './components/ExpensesTracker';
import SettingsDrawer from './components/SettingsDrawer';
import MarketingHero from './components/MarketingHero';
import InvoiceCreator from './components/InvoiceCreator';
import PdfTemplateScanner from './components/PdfTemplateScanner';

type Screen = 'landing' | 'overview' | 'documents' | 'catalogs' | 'reports' | 'expenses';

interface AppProps {
  initialScreen?: Screen;
  initialInvoiceId?: string | null;
}

export default function App({ initialScreen = 'overview', initialInvoiceId = null }: AppProps) {
  const [activeScreen, setActiveScreen] = useState<Screen>(initialScreen);
  const navigate = useNavigate();
  const { active: activeWorkspace, activeId, workspaces, setActiveId, addWorkspace, renameWorkspace, removeWorkspace, updateWorkspace } = useWorkspaces();

  const businessDetails = activeWorkspace.businessDetails ?? INITIAL_BUSINESS_DETAILS;
  const bankAccount = activeWorkspace.bankAccount ?? INITIAL_BANK_ACCOUNT;
  const vatSettings = activeWorkspace.vatSettings ?? INITIAL_VAT_SETTINGS;
  const templateSettings = activeWorkspace.templateSettings ?? INITIAL_TEMPLATE_SETTINGS;
  const { setBusinessDetails, setBankAccount, setVatSettings, setTemplateSettings } = useWorkspaceIdentity(activeWorkspace, updateWorkspace);

  const isSeedWs = activeId === SEED_WORKSPACE_ID;
  const [invoices, setInvoices] = useScopedLocalStorage<Invoice[]>('invoices', activeId, isSeedWs ? INITIAL_INVOICES : []);
  const [products, setProducts] = useScopedLocalStorage<Product[]>('products', activeId, isSeedWs ? INITIAL_PRODUCTS : []);
  const [services, setServices] = useScopedLocalStorage<Service[]>('services', activeId, isSeedWs ? INITIAL_SERVICES : []);
  const [expenses, setExpenses] = useScopedLocalStorage<Expense[]>('expenses', activeId, isSeedWs ? INITIAL_EXPENSES : []);
  const [notifications, setNotifications] = useScopedLocalStorage<Notification[]>('notifications', activeId, []);

  const [dataSeedDone, setDataSeedDone] = useLocalStorage<boolean>('data_seeded_v1', false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('sidebar_collapsed', false);
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('app_theme', 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(initialInvoiceId);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Self-heal workspaces that have null identity fields from old migration
  useEffect(() => {
    if (!activeWorkspace.businessDetails || !activeWorkspace.bankAccount || !activeWorkspace.vatSettings || !activeWorkspace.templateSettings) {
      updateWorkspace(activeId, {
        businessDetails: activeWorkspace.businessDetails ?? INITIAL_BUSINESS_DETAILS,
        bankAccount: activeWorkspace.bankAccount ?? INITIAL_BANK_ACCOUNT,
        vatSettings: activeWorkspace.vatSettings ?? INITIAL_VAT_SETTINGS,
        templateSettings: activeWorkspace.templateSettings ?? INITIAL_TEMPLATE_SETTINGS,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // One-time entity seeder: seeds initial invoices/products/services/expenses into
  // the seed workspace if they're currently empty (handles migrated installs where
  // the scoped entity keys were created but left empty).
  useEffect(() => {
    if (!dataSeedDone && isSeedWs) {
      if (invoices.length === 0) setInvoices(INITIAL_INVOICES);
      if (products.length === 0) setProducts(INITIAL_PRODUCTS);
      if (services.length === 0) setServices(INITIAL_SERVICES);
      if (expenses.length === 0) setExpenses(INITIAL_EXPENSES);
      setDataSeedDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { applyAccent(templateSettings.color); }, [templateSettings.color]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [theme]);

  useEffect(() => {
    if (activeScreen === 'landing') return;
    const target = selectedInvoiceId ? `/invoice/${selectedInvoiceId}` : `/${activeScreen}`;
    if (window.location.pathname !== target) navigate(target);
  }, [activeScreen, selectedInvoiceId, navigate]);

  // Poll API server to detect when a customer opens a preview link
  const _pollInv = invoices.find(i => i.id === selectedInvoiceId);
  const _pollToken = _pollInv?.previewToken;
  const _pollSeen  = _pollInv?.previewSeen;
  useEffect(() => {
    if (!_pollToken || _pollSeen) return;
    const invId = selectedInvoiceId!;
    const check = async () => {
      try {
        const res = await fetch(`/proxy-api/api/invoice-preview/${_pollToken}/status`);
        if (!res.ok) return;
        const { seen, seenAt } = await res.json();
        if (seen) {
          setInvoices(prev => prev.map(i => i.id === invId
            ? { ...i, previewSeen: true, history: [...i.history, { event: 'Preview Seen by Customer', timestamp: seenAt || new Date().toISOString() }] }
            : i
          ));
          setNotifications(prev => [{
            id: `n-${Date.now()}`, title: 'Invoice Viewed',
            message: 'Your customer opened the preview link.',
            type: 'success' as const, timestamp: new Date().toLocaleTimeString(), read: false,
          }, ...prev].slice(0, 50));
        }
      } catch { /* network error, silently ignore */ }
    };
    check();
    const tid = setInterval(check, 15000);
    return () => clearInterval(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_pollToken, _pollSeen, selectedInvoiceId]);

  // Render landing/marketing page when at root
  if (activeScreen === 'landing') {
    return <MarketingHero onEnterApp={() => { navigate('/overview'); }} />;
  }

  const pushNotification = (title: string, message: string, type: 'info'|'success'|'warning'|'alert' = 'info') => {
    setNotifications(prev => [{ id: `n-${Date.now()}`, title, message, type, timestamp: new Date().toLocaleTimeString(), read: false }, ...prev].slice(0, 50));
  };

  // KPI calculations
  const invTotal    = (inv: Invoice) => inv.items.reduce((s,it)=>s+it.amount,0) + inv.shippingFee + (inv.items.reduce((s,it)=>s+it.amount,0) * (inv.vatRate||0) / 100);
  const totalBilled  = invoices.reduce((s,i)=>s+invTotal(i),0);
  const totalPaid    = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+invTotal(i),0);
  const totalOutstanding = invoices.filter(i=>i.status==='Unpaid'||i.status==='Overdue').reduce((s,i)=>s+invTotal(i),0);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const monthlyGoal = 50000;
  const goalProgress = Math.min((totalPaid / monthlyGoal) * 100, 100);
  const thisMonth = new Date().getMonth();
  const monthInvoices = invoices.filter(i => new Date(i.issueDate).getMonth() === thisMonth);

  const downloadPdf = async (inv: Invoice) => {
    const el = document.getElementById(`pdf-preview-${inv.id}`);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
    pdf.save(`invoice-${inv.id}.pdf`);
    pushNotification('PDF Exported', `Saved invoice-${inv.id}.pdf`);
  };

  const sharePreview = async (inv: Invoice) => {
    try {
      const res = await fetch('/proxy-api/api/invoice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceData: inv, businessDetails, bankAccount, templateSettings }),
      });
      if (!res.ok) throw new Error('Server error');
      const { token } = await res.json();
      setInvoices(prev => prev.map(i => i.id === inv.id
        ? { ...i, previewToken: token, previewSeen: false, history: [...i.history, { event: 'Preview Link Generated', timestamp: new Date().toISOString() }] }
        : i
      ));
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const url = `${window.location.origin}${base}/preview/${token}`;
      await navigator.clipboard.writeText(url);
      pushNotification('Preview Link Copied', 'Link is in your clipboard — send it to your customer via WhatsApp or email.', 'success');
    } catch {
      pushNotification('Error', 'Could not generate preview link. Make sure the API server is running.', 'alert');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  const SCREEN_LABELS: Record<string, string> = {
    overview: 'Overview', documents: 'Invoices', expenses: 'Expenses',
    catalogs: 'Catalog', reports: 'Analytics',
  };

  const NavItem = ({ id, icon: Icon, label }: { id: Screen, icon: any, label: string }) => {
    const isActive = activeScreen === id && !selectedInvoiceId;
    return (
      <button
        title={sidebarCollapsed ? label : undefined}
        onClick={() => { setActiveScreen(id); setSelectedInvoiceId(null); }}
        className={`w-full flex items-center rounded-xl transition-all duration-150
          ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
          ${isActive ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 font-medium'}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!sidebarCollapsed && <span className="text-sm truncate">{label}</span>}
      </button>
    );
  };

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans">
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        style={{ width: sidebarCollapsed ? 64 : 240 } as React.CSSProperties}
        className={`bg-white border-r border-stone-200 flex flex-col z-50 shadow-sm shrink-0 transition-[width,transform] duration-200 ease-in-out
          fixed md:relative inset-y-0 left-0 h-full
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-5 z-30 w-6 h-6 bg-stone-200 hover:bg-stone-300 border border-stone-300 rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          <ChevronLeft className={`w-3.5 h-3.5 text-stone-600 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Workspace area */}
        <div className={`border-b border-stone-100 overflow-hidden ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
          {sidebarCollapsed ? (
            <div
              title={businessDetails.name}
              className="w-9 h-9 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-xs mx-auto cursor-default select-none"
            >
              {businessDetails.name.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} setActiveId={setActiveId} addWorkspace={addWorkspace} renameWorkspace={renameWorkspace} removeWorkspace={removeWorkspace} />
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <NavItem id="overview"   icon={LayoutDashboard} label="Overview"  />
          <NavItem id="documents"  icon={FileText}        label="Invoices"  />
          <NavItem id="expenses"   icon={TrendingUp}      label="Expenses"  />
          <NavItem id="catalogs"   icon={Box}             label="Catalog"   />
          <NavItem id="reports"    icon={PieChart}        label="Analytics" />
        </div>

        {/* Bottom */}
        <div className={`border-t border-stone-100 ${sidebarCollapsed ? 'p-2 space-y-1' : 'p-3 space-y-2'}`}>
          {!sidebarCollapsed && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                <span className="truncate mr-2">Goal</span><span className="shrink-0">{goalProgress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${goalProgress}%` }} />
              </div>
            </div>
          )}
          <button
            title={sidebarCollapsed ? 'Settings' : undefined}
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors font-medium text-sm
              ${sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Settings</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-14 md:h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors shrink-0"
            >
              {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-base md:text-lg font-black text-stone-900 tracking-tight truncate">
              {selectedInvoiceId ? `Invoice #${selectedInvoiceId}` : (SCREEN_LABELS[activeScreen] ?? activeScreen)}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              title="Scan PDF template — extract brand colors & logo from any invoice PDF"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Scan PDF</span>
            </button>
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {!selectedInvoiceId && activeScreen === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-5">

              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Total Billed',
                    value: totalBilled,
                    sub: `${invoices.length} invoice${invoices.length!==1?'s':''}`,
                    icon: ArrowUpRight,
                    iconColor: 'text-stone-400',
                    valColor: 'text-stone-900',
                  },
                  {
                    label: 'Collected',
                    value: totalPaid,
                    sub: `${invoices.filter(i=>i.status==='Paid').length} paid`,
                    icon: CheckCircle2,
                    iconColor: 'text-green-500',
                    valColor: 'text-green-600',
                  },
                  {
                    label: 'Outstanding',
                    value: totalOutstanding,
                    sub: `${invoices.filter(i=>i.status==='Unpaid'||i.status==='Overdue').length} unpaid`,
                    icon: Clock,
                    iconColor: 'text-amber-500',
                    valColor: 'text-amber-600',
                  },
                  {
                    label: 'Expenses',
                    value: totalExpenses,
                    sub: `${expenses.length} line${expenses.length!==1?'s':''}`,
                    icon: ArrowDownRight,
                    iconColor: 'text-red-400',
                    valColor: 'text-red-500',
                  },
                ].map((k, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{k.label}</span>
                      <k.icon className={`w-4 h-4 ${k.iconColor}`} />
                    </div>
                    <div className={`text-xl md:text-2xl font-black font-mono ${k.valColor}`}>
                      {templateSettings.currencySymbol}{k.value.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}
                    </div>
                    <div className="text-[10px] text-stone-400 font-medium mt-1">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Goal bar */}
              <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-6">
                <div className="shrink-0">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Revenue Goal Progress</div>
                  <div className="text-sm font-black text-stone-900 font-mono">{templateSettings.currencySymbol}{totalPaid.toLocaleString()} <span className="font-medium text-stone-400">/ {templateSettings.currencySymbol}{monthlyGoal.toLocaleString()}</span></div>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width:`${goalProgress}%`}} />
                  </div>
                </div>
                <div className="shrink-0 text-sm font-black text-stone-700">{goalProgress.toFixed(1)}%</div>
              </div>

              {/* Main content row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Recent Invoices */}
                <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <h3 className="text-sm font-black text-stone-900">Recent Invoices</h3>
                    <button onClick={()=>setActiveScreen('documents')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3"/>
                    </button>
                  </div>
                  <div className="divide-y divide-stone-50">
                    {invoices.length === 0 && (
                      <div className="px-5 py-10 text-center text-stone-400 text-sm">No invoices yet. Create your first invoice.</div>
                    )}
                    {invoices.slice(0,6).map(inv => {
                      const amt = invTotal(inv);
                      const statusCls = inv.status==='Paid'?'bg-green-50 text-green-700':inv.status==='Overdue'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';
                      return (
                        <div key={inv.id} className="flex items-center px-5 py-3 hover:bg-stone-50 cursor-pointer transition-colors group" onClick={()=>setSelectedInvoiceId(inv.id)}>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-900 text-sm truncate">{inv.clientName}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{inv.id} · {inv.issueDate}</div>
                          </div>
                          <div className={`mx-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${statusCls}`}>{inv.status}</div>
                          <div className="font-mono font-black text-stone-900 text-sm shrink-0 w-24 text-right">{templateSettings.currencySymbol}{amt.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* This month stats */}
                  <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">This Month</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-stone-600">Invoices issued</span>
                        <span className="font-black text-stone-900 font-mono">{monthInvoices.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-stone-600">Unique clients</span>
                        <span className="font-black text-stone-900 font-mono">{new Set(invoices.map(i=>i.clientName)).size}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-stone-600">Overdue</span>
                        <span className={`font-black font-mono ${invoices.filter(i=>i.status==='Overdue').length>0?'text-red-600':'text-stone-400'}`}>
                          {invoices.filter(i=>i.status==='Overdue').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                        <span className="text-sm font-bold text-stone-700">Collection rate</span>
                        <span className="font-black text-stone-900 font-mono">
                          {totalBilled > 0 ? `${((totalPaid/totalBilled)*100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity feed */}
                  <LiveNotifications notifications={notifications} onClearNotifications={()=>setNotifications([])} />
                </div>
              </div>
            </div>
          )}

          {!selectedInvoiceId && activeScreen === 'documents' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-stone-400 font-medium">{invoices.length} invoice{invoices.length!==1?'s':''} total</p>
                <button onClick={()=>setIsPdfImportOpen(true)} className="px-3 py-1.5 bg-stone-100 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-stone-200 transition-colors">Import PDF</button>
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {invoices.length === 0 ? (
                  <div className="py-16 text-center text-stone-400">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-30"/>
                    <p className="text-sm font-bold">No invoices yet</p>
                    <p className="text-xs mt-1">Hit <span className="font-bold text-stone-600">New Invoice</span> to get started</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-5 py-3">Invoice</th>
                        <th className="px-5 py-3">Client</th>
                        <th className="hidden md:table-cell px-5 py-3">Issued</th>
                        <th className="hidden md:table-cell px-5 py-3">Due</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-3 py-3 w-20" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {invoices.map(inv => {
                        const amt = invTotal(inv);
                        return (
                          <tr key={inv.id} className="hover:bg-stone-50 transition-colors group">
                            <td className="px-5 py-3 font-mono font-bold text-stone-700 cursor-pointer" onClick={()=>setSelectedInvoiceId(inv.id)}>{inv.id}</td>
                            <td className="px-5 py-3 font-bold text-stone-900 cursor-pointer" onClick={()=>setSelectedInvoiceId(inv.id)}>{inv.clientName}</td>
                            <td className="hidden md:table-cell px-5 py-3 text-stone-500 text-xs" onClick={()=>setSelectedInvoiceId(inv.id)}>{inv.issueDate}</td>
                            <td className="hidden md:table-cell px-5 py-3 text-stone-500 text-xs" onClick={()=>setSelectedInvoiceId(inv.id)}>{inv.dueDate}</td>
                            <td className="px-5 py-3 cursor-pointer" onClick={()=>setSelectedInvoiceId(inv.id)}>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                                ${inv.status==='Paid'?'bg-green-100 text-green-700':inv.status==='Overdue'?'bg-red-100 text-red-700':'bg-amber-50 text-amber-700'}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-stone-900 cursor-pointer" onClick={()=>setSelectedInvoiceId(inv.id)}>
                              {templateSettings.currencySymbol}{amt.toLocaleString()}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  title="Download PDF"
                                  onClick={async(e)=>{
                                    e.stopPropagation();
                                    setSelectedInvoiceId(inv.id);
                                    await new Promise(r=>setTimeout(r,300));
                                    const el = document.getElementById('invoice-capture-area');
                                    if(!el) return;
                                    const canvas = await html2canvas(el, {scale:2, useCORS:true});
                                    const pdf = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
                                    pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,pdf.internal.pageSize.getWidth(),(canvas.height*pdf.internal.pageSize.getWidth())/canvas.width);
                                    pdf.save(`invoice-${inv.id}.pdf`);
                                    pushNotification('PDF Exported',`Saved invoice-${inv.id}.pdf`);
                                  }}
                                  className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                                ><Download className="w-3.5 h-3.5"/></button>
                                <button
                                  title="Delete invoice"
                                  onClick={(e)=>{ e.stopPropagation(); setDeleteConfirm(inv.id); }}
                                  className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                ><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {!selectedInvoiceId && activeScreen === 'expenses' && <div className="max-w-5xl mx-auto"><ExpensesTracker expenses={expenses} onAddExpense={e=>{setExpenses([e,...expenses]); pushNotification('Expense Added', `Logged ${e.description}`);}} onRemoveExpense={id=>setExpenses(expenses.filter(e=>e.id!==id))} templateSettings={templateSettings}/></div>}
          {!selectedInvoiceId && activeScreen === 'reports' && <div className="max-w-5xl mx-auto"><ReportsDashboard invoices={invoices} products={products} services={services} expenses={expenses} templateSettings={templateSettings}/></div>}
          {!selectedInvoiceId && activeScreen === 'catalogs' && <div className="max-w-5xl mx-auto"><ServicesProductsManager products={products} services={services} onAddProduct={p=>setProducts([p,...products])} onRemoveProduct={id=>setProducts(products.filter(p=>p.id!==id))} onAddService={s=>setServices([s,...services])} onRemoveService={id=>setServices(services.filter(s=>s.id!==id))} templateSettings={templateSettings}/></div>}

          {/* Invoice Inspector */}
          {selectedInvoiceId && selectedInvoice && (
            <div className="max-w-6xl mx-auto flex gap-6">
              {/* Invoice canvas */}
              <div className="flex-1 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden relative min-h-[800px]">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button
                    title="Download PDF"
                    onClick={async () => {
                      const el = document.getElementById('invoice-capture-area');
                      if(!el) return;
                      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
                      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
                      pdf.save(`invoice-${selectedInvoice.id}.pdf`);
                      pushNotification('PDF Exported', `Saved invoice-${selectedInvoice.id}.pdf`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-lg text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5"/> Download PDF
                  </button>
                </div>
                <div id="invoice-capture-area" className="w-full h-full bg-stone-100 overflow-y-auto">
                  <InvoicePreview invoice={selectedInvoice} businessDetails={businessDetails} bankAccount={bankAccount} templateSettings={templateSettings} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-72 shrink-0 space-y-3">
                <button onClick={() => setSelectedInvoiceId(null)} className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-180"/> Back
                </button>

                {/* Status card */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Invoice {selectedInvoice.id}</div>
                      <div className={`text-base font-black uppercase tracking-tight
                        ${selectedInvoice.status==='Paid'?'text-green-600':selectedInvoice.status==='Overdue'?'text-red-600':'text-amber-600'}`}>
                        {selectedInvoice.status}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${selectedInvoice.status==='Paid'?'bg-green-50':selectedInvoice.status==='Overdue'?'bg-red-50':'bg-amber-50'}`}>
                      {selectedInvoice.status==='Paid'
                        ? <CheckCircle2 className="w-4 h-4 text-green-600"/>
                        : selectedInvoice.status==='Overdue'
                          ? <AlertCircle className="w-4 h-4 text-red-600"/>
                          : <Clock className="w-4 h-4 text-amber-600"/>}
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono text-stone-900">
                    {templateSettings.currencySymbol}{invTotal(selectedInvoice).toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-400 font-medium">Due {selectedInvoice.dueDate} · {selectedInvoice.clientName}</div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-2">
                  {selectedInvoice.status !== 'Paid' && (
                    <button onClick={() => {
                      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? {...i, status: 'Paid', history: [...i.history, {event:'Marked Paid', timestamp:new Date().toISOString()}]} : i));
                      pushNotification('Payment Confirmed', `Invoice #${selectedInvoice.id} marked as paid.`, 'success');
                    }} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Mark as Paid
                    </button>
                  )}
                  <button onClick={() => setReminderModalOpen(true)} className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-3.5 h-3.5"/> Send Reminder
                  </button>
                  <button
                    onClick={() => sharePreview(selectedInvoice)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5"/>
                    {selectedInvoice.previewToken ? 'New Preview Link' : 'Share Preview Link'}
                  </button>
                  {selectedInvoice.previewToken && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${selectedInvoice.previewSeen ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      <Eye className="w-3.5 h-3.5 shrink-0"/>
                      {selectedInvoice.previewSeen ? 'Seen by customer ✓' : 'Awaiting customer view…'}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => {
                      const clone = {...selectedInvoice, id: `INV-${Date.now().toString().slice(-4)}`, status: 'Unpaid' as const, createdTime: new Date().toISOString(), history: [{event:'Cloned',timestamp:new Date().toISOString()}]};
                      setInvoices([clone, ...invoices]);
                      setSelectedInvoiceId(clone.id);
                      pushNotification('Invoice Cloned', `Created #${clone.id}`);
                    }} className="py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1">
                      <Copy className="w-3 h-3"/> Clone
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(selectedInvoice.id)}
                      className="py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3"/> Delete
                    </button>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Audit Trail</h3>
                  <div className="space-y-3">
                    {selectedInvoice.history.map((h, i) => (
                      <div key={i} className="flex gap-3 text-sm relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 relative z-10" />
                        {i !== selectedInvoice.history.length-1 && <div className="absolute top-3 left-[3px] bottom-[-12px] w-px bg-stone-100"/>}
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 text-xs">{h.event}</div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">{new Date(h.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={()=>setIsSettingsOpen(false)} businessDetails={businessDetails} onUpdateBusinessDetails={setBusinessDetails} bankAccount={bankAccount} onUpdateBankAccount={setBankAccount} vatSettings={vatSettings} onUpdateVatSettings={setVatSettings} templateSettings={templateSettings} onUpdateTemplateSettings={setTemplateSettings} />
      <PdfImportDialog isOpen={isPdfImportOpen} onClose={()=>setIsPdfImportOpen(false)} onApply={(_p) => {pushNotification('Imported', 'Loaded data from PDF.');}} />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-black text-stone-900 mb-1">Delete Invoice?</h2>
            <p className="text-sm text-stone-500 mb-6">Invoice <span className="font-mono font-bold text-stone-700">#{deleteConfirm}</span> will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors">Cancel</button>
              <button onClick={()=>{
                setInvoices(invoices.filter(i=>i.id!==deleteConfirm));
                if(selectedInvoiceId===deleteConfirm) setSelectedInvoiceId(null);
                pushNotification('Invoice Deleted', `#${deleteConfirm} removed.`, 'warning');
                setDeleteConfirm(null);
              }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-black text-stone-900 mb-4 tracking-tight">Send Reminder</h2>
            <div className="space-y-4 mb-6">
              <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">To</label><input type="text" readOnly value={selectedInvoice.clientEmail} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600 outline-none" /></div>
              <div><label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Subject</label><input type="text" defaultValue={`Following up: Invoice #${selectedInvoice.id}`} className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary outline-none font-bold" /></div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Message</label>
                <textarea className="w-full h-32 p-3 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary outline-none leading-relaxed" defaultValue={`Hi ${selectedInvoice.clientName},\n\nJust a quick note that Invoice #${selectedInvoice.id} for ${templateSettings.currencySymbol}${invTotal(selectedInvoice)} is due on ${selectedInvoice.dueDate}.\n\nYou can pay online using the link in the invoice.\n\nBest,\n${businessDetails.name}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setReminderModalOpen(false)} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase transition-colors">Cancel</button>
              <button onClick={()=>{
                setInvoices(invoices.map(i=>i.id===selectedInvoice.id ? {...i, history: [...i.history, {event: 'Reminder Sent', timestamp: new Date().toISOString()}]} : i));
                setReminderModalOpen(false);
                pushNotification('Reminder Sent', `Follow up sent to ${selectedInvoice.clientEmail}`, 'success');
              }} className="flex-1 py-2.5 bg-primary hover:bg-[#C13A0E] text-white rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"><Mail className="w-4 h-4"/> Open in Email</button>
            </div>
          </div>
        </div>
      )}

      <PdfTemplateScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentTemplate={templateSettings}
        onApply={(patch, logoUrl) => {
          setTemplateSettings({ ...templateSettings, ...patch });
          if (logoUrl) setBusinessDetails({ ...businessDetails, logoUrl });
          pushNotification('Template Applied', 'Brand colors & logo updated from PDF.', 'success');
        }}
      />

      <InvoiceCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSave={(invoice) => {
          setInvoices(prev => [invoice, ...prev]);
          setSelectedInvoiceId(invoice.id);
          setActiveScreen('documents');
          pushNotification('Invoice Created', `#${invoice.id} for ${invoice.clientName}`, 'success');
        }}
        templateSettings={templateSettings}
        vatSettings={vatSettings}
        products={products}
        services={services}
        businessName={businessDetails.name}
        businessDetails={businessDetails}
        bankAccount={bankAccount}
      />
    </div>
  );
}
