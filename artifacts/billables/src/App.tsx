import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Settings, LayoutDashboard, FileText, PieChart, Plus, ChevronRight, ChevronLeft, Mail, Download, Edit2, Copy, Box, TrendingUp, Sun, Moon, Menu, X as XIcon, ScanLine } from 'lucide-react';

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

  // Render landing/marketing page when at root
  if (activeScreen === 'landing') {
    return <MarketingHero onEnterApp={() => { navigate('/overview'); }} />;
  }

  const pushNotification = (title: string, message: string, type: 'info'|'success'|'warning'|'alert' = 'info') => {
    setNotifications(prev => [{ id: `n-${Date.now()}`, title, message, type, timestamp: new Date().toLocaleTimeString(), read: false }, ...prev].slice(0, 50));
  };

  // Gamification Metrics
  const totalRev = invoices.filter(i=>i.status==='Paid').reduce((sum, i) => sum + i.items.reduce((s,it)=>s+it.amount,0), 0);
  const monthlyGoal = 50000;
  const goalProgress = Math.min((totalRev / monthlyGoal) * 100, 100);
  const streak = invoices.filter(i => new Date(i.issueDate).getMonth() === new Date().getMonth()).length;

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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {!selectedInvoiceId && activeScreen === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Monthly Revenue', val: totalRev, col: 'text-stone-900' },
                  { label: 'Outstanding', val: invoices.filter(i=>i.status==='Unpaid').reduce((s,i)=>s+i.items[0]?.amount||0,0), col: 'text-stone-500' },
                  { label: 'Expenses', val: expenses.reduce((s,e)=>s+e.amount,0), col: 'text-stone-500' },
                  { label: 'Active Clients', val: new Set(invoices.map(i=>i.clientName)).size, col: 'text-primary', num: true }
                ].map((s,i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-2xl font-black ${s.col} ${s.num?'':'font-mono'}`}>{s.num ? s.val : `$${s.val.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-stone-900">Recent Invoices</h3>
                    <button onClick={()=>setActiveScreen('documents')} className="text-xs font-bold text-primary uppercase tracking-wider">View All</button>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {invoices.slice(0,5).map(inv => (
                      <div key={inv.id} onClick={() => setSelectedInvoiceId(inv.id)} className="py-3 flex justify-between items-center cursor-pointer hover:bg-stone-50 px-2 rounded-lg -mx-2 transition-colors">
                        <div><div className="font-bold text-stone-900 text-sm">{inv.clientName}</div><div className="text-xs text-stone-500">{inv.id} • {inv.issueDate}</div></div>
                        <div className="text-right"><div className="font-mono font-bold text-stone-900 text-sm">${inv.items.reduce((s,i)=>s+i.amount,0).toLocaleString()}</div><div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${inv.status==='Paid'?'text-green-500':inv.status==='Overdue'?'text-red-500':'text-stone-400'}`}>{inv.status}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-primary/10">🔥</div>
                    <h3 className="font-black text-primary text-lg">{streak} Invoices</h3>
                    <p className="text-xs text-primary/70 font-bold uppercase tracking-widest mt-1">This Month's Streak</p>
                  </div>
                  <LiveNotifications notifications={notifications} onClearNotifications={()=>setNotifications([])} />
                </div>
              </div>
            </div>
          )}

          {!selectedInvoiceId && activeScreen === 'documents' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex gap-4 mb-6">
                <button onClick={()=>setIsPdfImportOpen(true)} className="px-4 py-2 bg-stone-100 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-stone-200 transition-colors">Import PDF</button>
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    <tr><th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} onClick={()=>setSelectedInvoiceId(inv.id)} className="hover:bg-stone-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-stone-900">{inv.id}</td>
                        <td className="px-6 py-4 font-bold text-stone-900">{inv.clientName}</td>
                        <td className="px-6 py-4 text-stone-500">{inv.issueDate}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${inv.status==='Paid'?'bg-green-100 text-green-700':inv.status==='Overdue'?'bg-red-100 text-red-700':'bg-stone-100 text-stone-600'}`}>{inv.status}</span></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-stone-900">${inv.items.reduce((s,i)=>s+i.amount,0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!selectedInvoiceId && activeScreen === 'expenses' && <div className="max-w-5xl mx-auto"><ExpensesTracker expenses={expenses} onAddExpense={e=>{setExpenses([e,...expenses]); pushNotification('Expense Added', `Logged ${e.description}`);}} onRemoveExpense={id=>setExpenses(expenses.filter(e=>e.id!==id))} templateSettings={templateSettings}/></div>}
          {!selectedInvoiceId && activeScreen === 'reports' && <div className="max-w-5xl mx-auto"><ReportsDashboard invoices={invoices} products={products} services={services} expenses={expenses} templateSettings={templateSettings}/></div>}
          {!selectedInvoiceId && activeScreen === 'catalogs' && <div className="max-w-5xl mx-auto"><ServicesProductsManager products={products} services={services} onAddProduct={p=>setProducts([p,...products])} onRemoveProduct={id=>setProducts(products.filter(p=>p.id!==id))} onAddService={s=>setServices([s,...services])} onRemoveService={id=>setServices(services.filter(s=>s.id!==id))} templateSettings={templateSettings}/></div>}

          {/* Invoice Inspector */}
          {selectedInvoiceId && selectedInvoice && (
            <div className="max-w-6xl mx-auto flex gap-8">
              <div className="flex-1 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden relative min-h-[800px]">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button onClick={async () => {
                    const el = document.getElementById('invoice-capture-area');
                    if(!el) return;
                    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
                    pdf.save(`invoice-${selectedInvoice.id}.pdf`);
                    pushNotification('PDF Exported', `Saved invoice-${selectedInvoice.id}.pdf`);
                  }} className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-lg"><Download className="w-4 h-4"/></button>
                </div>
                <div id="invoice-capture-area" className="w-full h-full bg-stone-100 overflow-y-auto">
                  <InvoicePreview invoice={selectedInvoice} businessDetails={businessDetails} bankAccount={bankAccount} templateSettings={templateSettings} />
                </div>
              </div>

              <div className="w-80 shrink-0 space-y-4">
                <button onClick={() => setSelectedInvoiceId(null)} className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-widest hover:text-stone-900 mb-4"><ChevronRight className="w-4 h-4 rotate-180"/> Back to list</button>
                
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
                  <div><div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Status</div><div className={`text-lg font-black uppercase tracking-tight ${selectedInvoice.status==='Paid'?'text-green-500':selectedInvoice.status==='Overdue'?'text-red-500':'text-stone-900'}`}>{selectedInvoice.status}</div></div>
                  {selectedInvoice.status !== 'Paid' && (
                    <button onClick={() => {
                      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? {...i, status: 'Paid'} : i));
                      pushNotification('Payment Confirmed', `Invoice #${selectedInvoice.id} marked as paid.`, 'success');
                    }} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors">Mark as Paid</button>
                  )}
                  <button onClick={() => setReminderModalOpen(true)} className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"><Mail className="w-4 h-4"/> Send Reminder</button>
                  
                  <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-2">
                    <button className="py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1"><Edit2 className="w-3.5 h-3.5"/> Edit</button>
                    <button onClick={() => {
                      const clone = {...selectedInvoice, id: `INV-${Date.now().toString().slice(-4)}`, status: 'Unpaid' as const, createdTime: new Date().toISOString()};
                      setInvoices([clone, ...invoices]);
                      setSelectedInvoiceId(clone.id);
                      pushNotification('Invoice Cloned', `Created draft #${clone.id}`);
                    }} className="py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5"/> Clone</button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                  <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Audit Trail</h3>
                  <div className="space-y-4">
                    {selectedInvoice.history.map((h, i) => (
                      <div key={i} className="flex gap-3 text-sm relative">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 relative z-10 shadow-[0_0_0_4px_white]"></div>
                        {i !== selectedInvoice.history.length-1 && <div className="absolute top-2.5 left-1 bottom-[-20px] w-px bg-stone-100"></div>}
                        <div><div className="font-bold text-stone-900">{h.event}</div><div className="text-[10px] text-stone-500 font-mono mt-0.5">{new Date(h.timestamp).toLocaleString()}</div></div>
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
      <PdfImportDialog isOpen={isPdfImportOpen} onClose={()=>setIsPdfImportOpen(false)} onApply={(p) => {pushNotification('Imported', 'Loaded data from PDF.');}} />

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
                <textarea className="w-full h-32 p-3 bg-white border border-stone-200 rounded-lg text-sm focus:border-primary outline-none leading-relaxed" defaultValue={`Hi ${selectedInvoice.clientName},\n\nJust a quick note that Invoice #${selectedInvoice.id} for $${selectedInvoice.items.reduce((s,i)=>s+i.amount,0)} is due on ${selectedInvoice.dueDate}.\n\nYou can pay online using the link in the invoice.\n\nBest,\n${businessDetails.name}`} />
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
      />
    </div>
  );
}
