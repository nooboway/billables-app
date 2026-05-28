/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Settings, 
  HelpCircle, 
  LayoutDashboard, 
  FileText, 
  Database, 
  PieChart, 
  Plus, 
  Search, 
  CheckCircle, 
  User, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Inbox, 
  X, 
  CheckCircle2, 
  Eye, 
  ArrowRight,
  ShieldAlert,
  BellRing,
  Copy,
  Sun,
  Moon
} from 'lucide-react';

import {
  BusinessDetails,
  BankAccount,
  VatSettings,
  TemplateSettings,
  Invoice,
  Product,
  Service,
  Expense,
  InvoiceItem,
  Notification,
  InvoiceTemplate,
} from './types';

import {
  INITIAL_BUSINESS_DETAILS,
  INITIAL_BANK_ACCOUNT,
  INITIAL_VAT_SETTINGS,
  INITIAL_TEMPLATE_SETTINGS,
  INITIAL_INVOICES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_EXPENSES
} from './initialData';

import { useLocalStorage } from './lib/persistence';
import { useWorkspaces, useScopedLocalStorage, useWorkspaceIdentity } from './lib/workspaces';
import { applyAccent } from './lib/accent';
import { useNavigate } from './Root';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import PdfImportDialog from './components/PdfImportDialog';
import type { ExtractedInvoice } from './lib/pdfExtract';

import InvoicePreview from './components/InvoicePreview';
import LiveNotifications from './components/LiveNotifications';
import ReportsDashboard from './components/ReportsDashboard';
import ServicesProductsManager from './components/ServicesProductsManager';
import ExpensesTracker from './components/ExpensesTracker';
import SettingsDrawer from './components/SettingsDrawer';

import MarketingHero from './components/MarketingHero';

const AnimatedCounter = ({ value, prefix = '', fractionDigits = 2 }: { value: number; prefix?: string; fractionDigits?: number }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const previousValueRef = React.useRef(0);

  useEffect(() => {
    const start = previousValueRef.current;
    const duration = 1200; // 1.2s animation
    const startTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = progress * (2 - progress);

      setCurrentValue(start + easeOutQuad * (value - start));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCurrentValue(value);
        previousValueRef.current = value;
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  // tabular-nums + Inter so digits don't jiggle as the counter animates
  // and the figure reads as a professional financial number rather
  // than as terminal/code output.
  return (
    <span style={{ fontFamily: 'var(--font)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
      {prefix}{currentValue.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}
    </span>
  );
};

type Screen = 'landing' | 'overview' | 'documents' | 'catalogs' | 'reports' | 'expenses';

interface AppProps {
  initialScreen?: Screen;
  initialInvoiceId?: string | null;
}

export default function App({ initialScreen = 'landing', initialInvoiceId = null }: AppProps = {}) {
  // Navigation: 'landing' | 'overview' | 'documents' | 'catalogs' | 'reports' | 'expenses'
  const [activeScreen, setActiveScreen] = useState<Screen>(initialScreen);
  
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const nextDark = !isDarkTheme;
    setIsDarkTheme(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  // Document level tab for documents list
  const [docTab, setDocTab] = useState<'invoices' | 'estimates'>('invoices');

  // Workspaces (multi-business). Each workspace owns its own identity
  // and its own scoped pool of invoices/products/services/expenses/
  // notifications. Switching workspace re-mounts the App subtree (see
  // Root.tsx keying) so the scoped hooks re-read from the new keys.
  const { active: activeWorkspace, activeId, workspaces, setActiveId,
          addWorkspace, renameWorkspace, removeWorkspace,
          updateWorkspace } = useWorkspaces();

  // Identity comes off the active workspace; setters mutate the
  // workspace record rather than separate flat keys.
  const businessDetails = activeWorkspace.businessDetails ?? INITIAL_BUSINESS_DETAILS;
  const bankAccount     = activeWorkspace.bankAccount     ?? INITIAL_BANK_ACCOUNT;
  const vatSettings     = activeWorkspace.vatSettings     ?? INITIAL_VAT_SETTINGS;
  const templateSettings= activeWorkspace.templateSettings?? INITIAL_TEMPLATE_SETTINGS;
  const { setBusinessDetails, setBankAccount, setVatSettings, setTemplateSettings } =
    useWorkspaceIdentity(activeWorkspace, updateWorkspace);

  // Per-workspace entity pools.
  const [invoices, setInvoices]   = useScopedLocalStorage<Invoice[]>('invoices', activeId, INITIAL_INVOICES);
  const [products, setProducts]   = useScopedLocalStorage<Product[]>('products', activeId, INITIAL_PRODUCTS);
  const [services, setServices]   = useScopedLocalStorage<Service[]>('services', activeId, INITIAL_SERVICES);
  const [expenses, setExpenses]   = useScopedLocalStorage<Expense[]>('expenses', activeId, INITIAL_EXPENSES);

  const [notifications, setNotifications] = useScopedLocalStorage<Notification[]>('notifications', activeId, [
    {
      id: 'init-notif',
      title: 'Workspace Activated',
      message: `${businessDetails.name || 'Your workspace'} is synchronized. Real-time activity log ready.`,
      timestamp: '08:09 AM',
      type: 'success',
      read: false,
    },
  ]);

  // Active overlay dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(initialInvoiceId);
  const [detailTab, setDetailTab] = useState<'summary' | 'preview' | 'history'>('summary');

  // Apply the active workspace's accent color to the document root so
  // every var(--primary) reference re-skins instantly when the user
  // switches workspace or picks a different brand color in Settings.
  useEffect(() => {
    applyAccent(templateSettings.color);
  }, [templateSettings.color]);

  // URL sync — whenever the active screen or selected invoice changes,
  // mirror it into the URL bar so deep links + browser back/forward work
  // and the user can share a link to any view. Skipped while sitting on
  // the landing page (/) so MarketingHero's enter-app CTA stays in
  // control of the initial transition.
  const navigate = useNavigate();
  useEffect(() => {
    if (activeScreen === 'landing') return;
    const target = selectedInvoiceId
      ? `/invoice/${selectedInvoiceId}`
      : `/${activeScreen}`;
    if (window.location.pathname !== target) {
      navigate(target);
    }
  }, [activeScreen, selectedInvoiceId, navigate]);

  // Inspector client status filter
  const [inspectorStatusFilter, setInspectorStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');

  // PDF Export loading state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // (Persistence is handled by useLocalStorage above — no manual
  //  useEffect writers required.)

  // Automated Overdue Check on Workspace Load.
  // Uses today's actual ISO date so this stays correct on every run
  // rather than the literal '2026-05-26' that was hardcoded before.
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let updatedNeeded = false;
    const nextInvoices = invoices.map(inv => {
      if (inv.status === 'Unpaid' && inv.dueDate < todayStr) {
        updatedNeeded = true;
        // Seed immediate warning alert
        setTimeout(() => {
          handleAddNotification({
            id: `notif-overdue-${inv.id}-${Date.now()}`,
            title: 'Invoice Overdue Alert',
            message: `Invoice #${inv.id} for ${inv.clientName} has exceeded due date (${inv.dueDate}).`,
            type: 'alert',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        }, 120);
        return {
          ...inv,
          status: 'Overdue' as const,
          history: [
            ...inv.history,
            { event: 'Auto-detected Overdue by System', timestamp: new Date().toISOString() }
          ]
        };
      }
      return inv;
    });

    if (updatedNeeded) {
      setInvoices(nextInvoices);
    }
  }, []);

  // Handle Notifications stream
  const handleAddNotification = (newNotif: Notification) => {
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // INVOICE CREATION HANDLERS
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientStreet, setNewClientStreet] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [invoiceIdInput, setInvoiceIdInput] = useState('');
  const [newOrderNo, setNewOrderNo] = useState('');
  const [newShipping, setNewShipping] = useState(2320);
  const [newVatRate, setNewVatRate] = useState(vatSettings.applyToInvoices ? vatSettings.rate1 : 0);
  const [newIssueDate, setNewIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + templateSettings.dueDateDays * 86400000).toISOString().split('T')[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('Stripe');
  const [selectedItemsList, setSelectedItemsList] = useState<Array<{ id: string; qty: number; desc: string; price: number; unit: string }>>([]);
  const [isAddingCustomRow, setIsAddingCustomRow] = useState(false);
  const [customRowDesc, setCustomRowDesc] = useState('');
  const [customRowPrice, setCustomRowPrice] = useState(0);
  // Edit ⇄ Preview toggle inside the creator modal. Lets the user
  // see a live render of the in-progress invoice in any of the 5
  // templates before committing to save.
  const [creatorMode, setCreatorMode] = useState<'edit' | 'preview'>('edit');

  // PDF import dialog — toggled from the Documents header.
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);

  /** Apply extraction payload to the creator's form state. Anything
   *  the parser didn't detect is left as the user's current value. */
  const handleApplyExtracted = (d: ExtractedInvoice) => {
    if (d.invoiceId)    setInvoiceIdInput(d.invoiceId);
    if (d.orderNo)      setNewOrderNo(d.orderNo);
    if (d.issueDate)    setNewIssueDate(d.issueDate);
    if (d.dueDate)      setNewDueDate(d.dueDate);
    if (d.clientName)   setNewClientName(d.clientName);
    if (d.clientEmail)  setNewClientEmail(d.clientEmail);
    if (d.clientStreet) setNewClientStreet(d.clientStreet);
    if (d.clientCity)   setNewClientCity(d.clientCity);
    if (d.vatRate !== undefined) setNewVatRate(d.vatRate);
    if (d.items.length > 0) {
      setSelectedItemsList(d.items.map((it, idx) => ({
        id: `import-${Date.now()}-${idx}`,
        qty: it.qty,
        desc: it.description,
        price: it.price,
        unit: 'unit',
      })));
    }
    setEditingInvoiceId(null);
    setIsCreatorOpen(true);
    setCreatorMode('edit');
    handleAddNotification({
      id: `notif-import-${Date.now()}`,
      title: 'Invoice imported from PDF',
      message: `${d.items.length} line item(s) and ${[d.invoiceId, d.clientName, d.total].filter(Boolean).length} header field(s) pre-filled. Review and save.`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    });
  };

  const resetCreatorStates = () => {
    setEditingInvoiceId(null);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientStreet('');
    setNewClientCity('');
    setInvoiceIdInput('');
    setNewOrderNo('');
    setNewShipping(2320);
    setNewVatRate(vatSettings.applyToInvoices ? vatSettings.rate1 : 0);
    setSelectedTemplate('Stripe');
    setNewIssueDate(new Date().toISOString().split('T')[0]);
    setNewDueDate(new Date(Date.now() + templateSettings.dueDateDays * 86400000).toISOString().split('T')[0]);
    setSelectedItemsList([]);
  };

  const generateNextInvoiceNumber = () => {
    const format = templateSettings.numberingFormat || 'INV-';
    
    const match = format.match(/^(.*?)0+$/);
    if (match) {
      const prefix = match[1];
      const zeroCount = format.length - prefix.length;
      const nums = invoices
        .map(inv => inv.id)
        .filter(id => id.startsWith(prefix))
        .map(id => parseInt(id.slice(prefix.length), 10))
        .filter(n => !isNaN(n));
        
      const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
      const nextNum = maxNum + 1;
      return `${prefix}${nextNum.toString().padStart(zeroCount, '0')}`;
    }
    
    const prefix = format;
    const nums = invoices
      .map(inv => inv.id)
      .filter(id => id.startsWith(prefix))
      .map(id => parseInt(id.slice(prefix.length), 10))
      .filter(n => !isNaN(n));
      
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const nextNum = maxNum === 0 ? 1 : maxNum + 1;
    
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  };

  const handleOpenCreator = () => {
    resetCreatorStates();
    setInvoiceIdInput(generateNextInvoiceNumber());
    setIsCreatorOpen(true);
  };


  const handleOpenEditDoc = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setInvoiceIdInput(inv.id);
    setNewClientName(inv.clientName);
    setNewClientEmail(inv.clientEmail ?? '');
    setNewClientStreet(inv.clientStreet ?? '');
    setNewClientCity(inv.clientCity ?? '');
    setNewOrderNo(inv.orderNo ?? '');
    setNewShipping(inv.shippingFee);
    setNewVatRate(inv.vatRate);
    setSelectedTemplate(inv.templateType || 'Stripe');
    setNewIssueDate(inv.issueDate);
    setNewDueDate(inv.dueDate);
    setSelectedItemsList(inv.items.map(it => ({
      id: it.id,
      qty: it.qty,
      desc: it.description,
      price: it.price,
      unit: it.unit || 'Unit'
    })));
    setIsCreatorOpen(true);
  };

  const handleCloneInvoice = (inv: Invoice) => {
    setEditingInvoiceId(null);
    setInvoiceIdInput(generateNextInvoiceNumber());
    setNewClientName(inv.clientName);
    setNewClientEmail(inv.clientEmail ?? '');
    setNewClientStreet(inv.clientStreet ?? '');
    setNewClientCity(inv.clientCity ?? '');
    setNewOrderNo(`O-${Math.floor(100000 + Math.random() * 900000)}`);
    setNewShipping(inv.shippingFee);
    setNewVatRate(inv.vatRate);
    setSelectedTemplate(inv.templateType || 'Stripe');
    setNewIssueDate(new Date().toISOString().split('T')[0]);
    setNewDueDate(new Date(Date.now() + templateSettings.dueDateDays * 86400000).toISOString().split('T')[0]);
    setSelectedItemsList(inv.items.map(it => ({
      id: it.id,
      qty: it.qty,
      desc: it.description,
      price: it.price,
      unit: it.unit || 'Unit'
    })));
    setIsCreatorOpen(true);

    handleAddNotification({
      id: `notif-clone-${Date.now()}`,
      title: 'Invoice Cloned',
      message: `Invoice #${inv.id} metrics duplicated into new template drafting.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    });
  };

  const handleInsertPredefinedItem = (itemId: string, type: 'product' | 'service') => {
    if (type === 'product') {
      const prod = products.find(p => p.id === itemId);
      if (prod) {
        setSelectedItemsList(prev => [
          ...prev, 
          { id: prod.id, qty: 1, desc: `${prod.name}\n${prod.description}`, price: prod.price, unit: prod.unit }
        ]);
      }
    } else {
      const serv = services.find(s => s.id === itemId);
      if (serv) {
        setSelectedItemsList(prev => [
          ...prev, 
          { id: serv.id, qty: 1, desc: `${serv.name}\n${serv.description}`, price: serv.price, unit: serv.unit }
        ]);
      }
    }
  };

  const handleAddCustomRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRowDesc) return;
    setSelectedItemsList(prev => [
      ...prev,
      { id: `custom-${Date.now()}`, qty: 1, desc: customRowDesc, price: customRowPrice, unit: 'Unit' }
    ]);
    setCustomRowDesc('');
    setCustomRowPrice(0);
    setIsAddingCustomRow(false);
  };

  const handleSubmitNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || selectedItemsList.length === 0) {
      alert("Please specify a billed client and check at least one line item!");
      return;
    }

    const compiledItems: InvoiceItem[] = selectedItemsList.map(it => ({
      id: it.id,
      description: it.desc,
      qty: it.qty,
      unit: it.unit,
      price: it.price,
      discount: 0,
      amount: it.qty * it.price,
    }));

    const finalId = invoiceIdInput || generateNextInvoiceNumber();

    if (editingInvoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === editingInvoiceId) {
          return {
            ...inv,
            id: finalId,
            clientName: newClientName,
            clientEmail: newClientEmail,
            clientStreet: newClientStreet,
            clientCity: newClientCity,
            issueDate: newIssueDate,
            dueDate: newDueDate,
            orderNo: newOrderNo || inv.orderNo,
            items: compiledItems,
            shippingFee: newShipping,
            vatRate: newVatRate,
            templateType: selectedTemplate,
            history: [
              ...inv.history,
              { event: 'Modified', timestamp: new Date().toISOString() }
            ]
          };
        }
        return inv;
      }));

      // Raise notification
      handleAddNotification({
        id: `notif-updated-${Date.now()}`,
        title: 'Invoice Updated',
        message: `Invoice #${finalId} for ${newClientName} has been successfully updated.`,
        type: 'info',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });

      // Clear selection details to trigger fresh summary update
      setSelectedInvoiceId(finalId);
    } else {
      const newInvoice: Invoice = {
        id: finalId,
        clientName: newClientName,
        clientEmail: newClientEmail,
        clientCountry: businessDetails.country,
        clientStreet: newClientStreet,
        clientCity: newClientCity,
        issueDate: newIssueDate,
        dueDate: newDueDate,
        paymentMethod: templateSettings.paymentMethod,
        orderNo: newOrderNo || `O-${Math.floor(100000 + Math.random() * 900000)}`,
        items: compiledItems,
        shippingFee: newShipping,
        vatRate: newVatRate,
        status: 'Unpaid',
        templateType: selectedTemplate,
        skuPhotoUrl: selectedItemsList.some(i => i.desc.startsWith('Detox Tea')) ? products[0]?.imageUrl : undefined,
        notes: `An advance payment of total due is requested by settlement deadlines. Thank you.`,
        createdTime: new Date().toISOString(),
        history: [
          { event: 'Created', timestamp: new Date().toISOString() },
          { event: 'Sent', timestamp: new Date().toISOString() },
        ]
      };

      setInvoices(prev => [newInvoice, ...prev]);

      // Live Simulator event trigger
      handleAddNotification({
        id: `notif-created-${Date.now()}`,
        title: 'Invoice Created',
        message: `Invoice #${newInvoice.id} generated for client ${newInvoice.clientName}`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    }

    setIsCreatorOpen(false);
    resetCreatorStates();
  };

  // OVERVIEW STATS AUDITOR
  const getOverviewStats = () => {
    let overdueCount = 0;
    let overdueVal = 0;

    let unpaidCount = 0;
    let unpaidVal = 0;

    let paidCount = 0;
    let paidVal = 0;

    invoices.forEach(inv => {
      const itemsSum = inv.items.reduce((s, i) => s + i.amount, 0);
      const total = itemsSum + inv.shippingFee + (itemsSum * inv.vatRate / 100);

      if (inv.status === 'Paid') {
        paidCount++;
        paidVal += total;
      } else if (inv.status === 'Unpaid') {
        unpaidCount++;
        unpaidVal += total;
      } else if (inv.status === 'Overdue') {
        overdueCount++;
        overdueVal += total;
      }
    });

    return {
      overdueCount, overdueVal,
      unpaidCount, unpaidVal,
      paidCount, paidVal
    };
  };

  const { overdueCount, overdueVal, unpaidCount, unpaidVal, paidCount, paidVal } = getOverviewStats();

  // Selected invoice helper
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  // Inspector client status filter list
  const clientInvoices = selectedInvoice 
    ? invoices.filter(inv => inv.clientName === selectedInvoice.clientName)
    : [];
  const filteredClientInvoices = clientInvoices.filter(inv => {
    if (inspectorStatusFilter === 'All') return true;
    return inv.status === inspectorStatusFilter;
  });

  // Filtered documents
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return inv.clientName.toLowerCase().includes(q) || inv.id.includes(q);
  });

  const handleAddPaymentToInvoice = (invId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          status: 'Paid',
          history: [
            ...inv.history,
            { event: 'Paid', timestamp: new Date().toISOString() }
          ]
        };
      }
      return inv;
    }));

    handleAddNotification({
      id: `notif-pay-${Date.now()}`,
      title: 'Payment Confirmed',
      message: `Invoice #${invId} paid in full. Ledger update processed.`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    });
  };

  const handleDeleteInvoice = (invId: string) => {
    if (confirm(`Confirm permanent deletion of Invoice #${invId}?`)) {
      setInvoices(prev => prev.filter(i => i.id !== invId));
      setSelectedInvoiceId(null);

      // Trigger deletion notification alert
      handleAddNotification({
        id: `notif-deleted-${Date.now()}`,
        title: 'Invoice Deleted',
        message: `Invoice #${invId} has been deleted from the database ledger.`,
        type: 'warning',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;
    setIsGeneratingPDF(true);

    handleAddNotification({
      id: `notif-pdf-start-${Date.now()}`,
      title: 'Assembling Export',
      message: `Packaging document visuals of Invoice #${selectedInvoice.id} clientside...`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    });

    const element = document.getElementById('invoice-capture-area');
    if (!element) {
      alert('Preview capture target container was not found in the DOM.');
      setIsGeneratingPDF(false);
      return;
    }

    try {
      // Small delay for asset stability and nice UX
      await new Promise(r => setTimeout(r, 450));

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution crisp DPI multiplier
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff', // Clean white paper background
        scrollX: 0,
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgWidth = 210; // Width of A4 in mm
      const pageHeight = 297; // Height of A4 in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${selectedInvoice.id}.pdf`);

      handleAddNotification({
        id: `notif-pdf-success-${Date.now()}`,
        title: 'Document Saved',
        message: `High-fidelity PDF of Invoice #${selectedInvoice.id} compiled and saved.`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    } catch (err: any) {
      console.error(err);
      handleAddNotification({
        id: `notif-pdf-fail-${Date.now()}`,
        title: 'PDF Save Failed',
        message: err?.message || 'Error occurred during rendering steps.',
        type: 'warning',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (activeScreen === 'landing') {
    return <MarketingHero onEnterApp={() => setActiveScreen('overview')} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col relative font-sans" id="sylens-application-root">
      
      {/* Main Top Header Navigation Toolbar */}
      <header className="p-4 bg-white border-b border-b-stone-200 flex justify-between items-center" id="main-navigation-toolbar">
        <div className="flex items-center gap-4">
          {/* App Logo style of web.declotr.com */}
          <div className="flex items-center gap-0.5 cursor-pointer pr-4 border-r border-stone-200" onClick={() => setActiveScreen('overview')}>
            <span className="text-2xl font-black tracking-tighter text-stone-950 lowercase font-sans">billable</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E54A13] self-end mb-1.5"></span>
          </div>

          {/* Multi-business switcher */}
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeId={activeId}
            setActiveId={setActiveId}
            addWorkspace={addWorkspace}
            renameWorkspace={renameWorkspace}
            removeWorkspace={removeWorkspace}
          />
        </div>

        {/* Global Toolbar Tabs with Elegant Highlights */}
        <nav className="hidden md:flex gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs shadow-inner">
          <button
            onClick={() => { setActiveScreen('overview'); setSelectedInvoiceId(null); }}
            className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all text-[10px] tracking-wider cursor-pointer ${
              activeScreen === 'overview' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setActiveScreen('documents'); setSelectedInvoiceId(null); }}
            className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all text-[10px] tracking-wider cursor-pointer ${
              activeScreen === 'documents' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => { setActiveScreen('catalogs'); setSelectedInvoiceId(null); }}
            className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all text-[10px] tracking-wider cursor-pointer ${
              activeScreen === 'catalogs' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Product Library
          </button>
          <button
            onClick={() => { setActiveScreen('reports'); setSelectedInvoiceId(null); }}
            className={`px-3.5 py-1.5 rounded-md font-bold uppercase transition-all text-[10px] tracking-wider cursor-pointer ${
              activeScreen === 'reports' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            Analytics Reports
          </button>
        </nav>

        {/* Audit link & Preferences */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-stone-100 border border-stone-200 rounded-lg hover:border-[#E54A13] hover:text-[#E54A13] text-stone-500 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 bg-stone-100 border border-stone-200 rounded-lg hover:border-[#E54A13] hover:text-[#E54A13] text-stone-500 transition-all cursor-pointer"
            title="Open Workspace Settings"
            id="settings-trigger-button"
          >
            <Settings className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/nooboway/billables-app#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-600 hover:text-stone-950 flex items-center gap-1 uppercase text-[10px] border-none bg-transparent cursor-pointer font-bold tracking-wider no-underline"
            title="Open the project README on GitHub"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#E54A13]" />
            Help
          </a>
        </div>
      </header>

      {/* Main Container Work Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Screen View Swap (8 cols out of 12) */}
        <section className="lg:col-span-8 space-y-6" id="left-workspace-column">
          
          {/* SCREEN 1: OVERVIEW DASHBOARD */}
          {activeScreen === 'overview' && !selectedInvoiceId && (
            <motion.div 
              key="overview-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Heading Tab block */}
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
                <div>
                  <span className="text-[11px] tracking-[0.06em] text-[#E54A13] uppercase font-black block mb-1">REAL-TIME TELEMETRY</span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-[-0.035em] text-stone-900">Financial Summary Ledger</h2>
                  <p className="text-[13px] text-stone-500 mt-1">Workspace performance dashboard for real-time auditable ledger entries.</p>
                </div>
                <button 
                  onClick={() => setActiveScreen('reports')}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 hover:border-[#E54A13] text-[#E54A13] hover:bg-orange-50/50 flex items-center gap-1.5 font-mono uppercase text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <PieChart className="w-3.5 h-3.5 text-[#E54A13]" />
                  Detailed Reports
                </button>
              </div>

              {/* Grid cards displaying requested summary data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="overview-financial-cards-grid">
                
                {/* CARD 1: TOTAL AMOUNT PAID */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15px" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                  className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between h-36 feature-card shadow-sm cursor-pointer hover-lift hover-glow transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Amount Paid</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold flex items-center justify-center font-mono text-[9.5px]">
                      <AnimatedCounter value={paidCount} fractionDigits={0} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600 tracking-tight tabular-nums animate-pulse-dot" style={{ animationIterationCount: 1 }}>
                      <AnimatedCounter prefix={templateSettings.currencySymbol} value={paidVal} />
                    </h3>
                    <p className="text-[9.5px] text-stone-400 font-mono uppercase mt-1">Settled & Confirmed Ledger Balance</p>
                  </div>
                </motion.div>

                {/* CARD 2: TOTAL AMOUNT DUE */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15px" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
                  className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between h-36 feature-card shadow-sm cursor-pointer hover-lift hover-glow transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Amount Due</span>
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-bold flex items-center justify-center font-mono text-[9.5px]">
                      <AnimatedCounter value={overdueCount + unpaidCount} fractionDigits={0} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#E54A13] tracking-tight tabular-nums">
                      <AnimatedCounter prefix={templateSettings.currencySymbol} value={unpaidVal + overdueVal} />
                    </h3>
                    <p className="text-[9.5px] text-[#E54A13]/80 font-mono uppercase mt-1">Pending Bank Transfer Receivables</p>
                  </div>
                </motion.div>

                {/* CARD 3: OUTSTANDING INVOICES */}
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15px" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
                  className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between h-36 feature-card shadow-sm cursor-pointer hover-lift hover-glow transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Outstanding Bills</span>
                    <span className="text-[9.5px] text-[#E54A13] font-mono font-black uppercase">Active Ledger</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-stone-900 tracking-tight tabular-nums">
                      <AnimatedCounter value={unpaidCount + overdueCount} fractionDigits={0} /> <span className="text-xs text-stone-400 font-sans font-normal">invoices</span>
                    </h3>
                    <div className="flex gap-2.5 mt-1 font-mono text-[9.5px]">
                      <span className="text-rose-500 font-bold"><AnimatedCounter value={overdueCount} fractionDigits={0} /> Overdue</span>
                      <span className="text-stone-400 font-bold">•</span>
                      <span className="text-[#E54A13] font-bold"><AnimatedCounter value={unpaidCount} fractionDigits={0} /> Pending</span>
                    </div>
                  </div>
                </motion.div>

              </div>

              {/* Collections efficiency progress block */}
              {(() => {
                const totalInvoiced = paidVal + unpaidVal + overdueVal;
                const efficiencyRatio = totalInvoiced > 0 ? (paidVal / totalInvoiced) * 100 : 0;
                return (
                  <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm feature-card cursor-pointer">
                    <div className="flex justify-between items-end mb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider block">Capital Recovery Performance</span>
                        <p className="text-xs font-bold text-stone-700">Payment Collection Efficiency Rate</p>
                      </div>
                      <span className="text-xs font-mono font-black text-[#E54A13] bg-orange-50 px-2.5 py-1 rounded border border-orange-200"><AnimatedCounter value={efficiencyRatio} fractionDigits={1} />%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-3.5 border border-stone-200 p-0.5 overflow-hidden">
                      <div 
                        className="bg-[#E54A13] rounded-full h-full transition-all duration-1000 origin-left"
                        style={{ width: `${efficiencyRatio}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-stone-500 mt-2">
                      <span>Total Value Invoiced: {templateSettings.currencySymbol}{totalInvoiced.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      <span>Target: 100% Recovery</span>
                    </div>
                  </div>
                );
              })()}

              {/* DOCUMENTS LIST QUICK-VIEW MODULE */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl space-y-4 shadow-sm feature-card cursor-pointer">
                <div className="flex justify-between items-center flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-sm tracking-tight">RECENT INVOICES LIST</span>
                    <span className="text-[10px] py-0.5 px-2 bg-orange-50 border border-orange-100 text-[#E54A13] rounded-full font-mono font-bold uppercase">{filteredInvoices.length} entries</span>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <input 
                      type="text" 
                      placeholder="Search client/invoice id..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded px-3.5 py-1.5 pl-8 text-xs text-stone-800 outline-none transition-all placeholder-stone-400"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="divide-y divide-stone-100 select-none">
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 font-mono text-xs">
                      No invoices found matching query.
                    </div>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const itemsSum = inv.items.reduce((s, it) => s + it.amount, 0);
                      const totalVal = itemsSum + inv.shippingFee + (itemsSum * inv.vatRate / 100);
                      return (
                        <div 
                          key={inv.id}
                          onClick={() => { setSelectedInvoiceId(inv.id); setDetailTab('summary'); }}
                          className="py-3.5 flex justify-between items-center hover:bg-stone-50 px-3 rounded-lg transition-all cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-black text-stone-600 uppercase font-sans text-xs">
                              {inv.clientName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-stone-900 text-sm font-sans">{inv.clientName}</p>
                                <span className="text-[9px] text-stone-400 font-mono">#{inv.id}</span>
                              </div>
                              <div className="flex items-center gap-2.5 mt-1 font-mono text-[10px] text-stone-500">
                                <span className={`px-1.5 py-0.2 rounded border text-[8.5px] font-bold uppercase ${
                                  inv.status === 'Paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  inv.status === 'Overdue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-orange-50 border-orange-100 text-[#E54A13]'
                                }`}>
                                  {inv.status}
                                </span>
                                <span>Due: {inv.dueDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-stone-900 text-sm tracking-tight tabular-nums">
                              {templateSettings.currencySymbol}{totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <span className="text-[9px] font-bold text-stone-400 tracking-wide uppercase">
                              {inv.items.length} line items
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* SCREEN 2: ALL DOCUMENTS DIRECT PANEL */}
          {activeScreen === 'documents' && !selectedInvoiceId && (
            <motion.div 
              key="documents-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
                <div>
                  <span className="text-[11px] tracking-[0.06em] text-[#E54A13] uppercase font-black block mb-1">LEDGER DISTRIBUTION</span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-[-0.035em] text-stone-900">Documents Hub</h2>
                  <p className="text-[13px] text-stone-500 mt-1">Filter, search and export invoices, estimates and ledgers.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPdfImportOpen(true)}
                    title="Drop a PDF or image of an invoice — we extract its fields (OCR if needed) and pre-fill a new draft."
                    className="px-4 py-2.5 bg-white border border-stone-200 hover:border-[var(--primary)] hover:text-[var(--primary)] text-stone-700 font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-sm transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Import PDF / image
                  </button>
                  <button
                    onClick={handleOpenCreator}
                    className="px-4 py-2.5 bg-[#E54A13] hover:bg-orange-700 font-bold uppercase tracking-wider text-white rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Invoice
                  </button>
                </div>
              </div>

              {/* Invoices or Estimates Tabs */}
              <div className="flex space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-inner">
                <button
                  onClick={() => setDocTab('invoices')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    docTab === 'invoices' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => {
                    setDocTab('estimates');
                    alert("Estimates folder is currently empty. Switch back to 'Invoices' or click '+ Create' to generated estimates!");
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    docTab === 'estimates' ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Estimates (0)
                </button>
              </div>

              {/* Rendering simple lists */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm feature-card cursor-pointer">
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Search documents by code, customer or mail ledger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded px-4.5 py-2 pl-9 text-xs text-stone-800 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                </div>

                <div className="divide-y divide-stone-100 text-xs select-none">
                  {invoices.map(inv => {
                    const totalVal = inv.items.reduce((s,i) => s + i.amount, 0) + inv.shippingFee;
                    return (
                      <div 
                        key={inv.id}
                        onClick={() => { setSelectedInvoiceId(inv.id); setDetailTab('summary'); }}
                        className="py-3.5 flex justify-between items-center hover:bg-stone-50 px-3 rounded-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : inv.status === 'Overdue' ? 'bg-rose-500' : 'bg-[#E54A13]'}`} />
                          <div>
                            <p className="font-bold text-stone-900 font-sans text-sm">{inv.clientName}</p>
                            <p className="text-[10px] text-stone-400 mt-1">ID: #{inv.id} • Date: {inv.issueDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-stone-900 text-sm tabular-nums">{templateSettings.currencySymbol}{totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <span className={`px-1.5 py-0.2 rounded border text-[8.5px] font-bold uppercase mt-1 inline-block ${
                            inv.status === 'Paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            inv.status === 'Overdue' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-orange-50 border-orange-100 text-[#E54A13]'
                          }`}>{inv.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: CATALOG LIBRARY */}
          {activeScreen === 'catalogs' && (
            <motion.div 
              key="catalogs-library"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <ServicesProductsManager 
                products={products}
                onAddProduct={(p) => setProducts(prev => [...prev, p])}
                onRemoveProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
                services={services}
                onAddService={(s) => setServices(prev => [...prev, s])}
                onRemoveService={(id) => setServices(prev => prev.filter(s => s.id !== id))}
                templateSettings={templateSettings}
              />
            </motion.div>
          )}

          {/* SCREEN 4: REPORTS DASHBOARD */}
          {activeScreen === 'reports' && (
            <motion.div 
              key="reports-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <ReportsDashboard 
                invoices={invoices}
                products={products}
                services={services}
                expenses={expenses}
                templateSettings={templateSettings}
                onSelectInvoice={(id) => { setSelectedInvoiceId(id); setDetailTab('preview'); }}
              />
            </motion.div>
          )}

          {/* SCREEN 5: EXPENSES LEDGER */}
          {activeScreen === 'expenses' && (
            <motion.div 
              key="expenses-ledger"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <ExpensesTracker 
                expenses={expenses}
                onAddExpense={(e) => setExpenses(prev => [e, ...prev])}
                onRemoveExpense={(id) => setExpenses(prev => prev.filter(e => e.id !== id))}
                templateSettings={templateSettings}
              />
            </motion.div>
          )}

          {/* DETAIL INSPECTOR SCREEN (If selectedInvoiceId is active!) */}
          {selectedInvoiceId && selectedInvoice && (
            <div className="space-y-5 animate-slide-up bg-white p-5 rounded-2xl border border-stone-200 shadow-sm" id="invoice-inspector-pane">
              <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                <button 
                  onClick={() => setSelectedInvoiceId(null)}
                  className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
                >
                  ← Back to Workspace
                </button>
                <div className="text-right">
                  <span className="text-[10px] text-stone-450 text-stone-500 font-mono tracking-wider uppercase font-bold block">Active Invoice reference</span>
                  <span className="text-xs font-extrabold text-[#E54A13] font-mono">Invoice #{selectedInvoice.id}</span>
                </div>
              </div>

              {/* Quick status filter of client invoices */}
              <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E54A13]" />
                  <div>
                    <span className="text-stone-400 uppercase text-[9px] font-bold block leading-none">Client Invoices Filter</span>
                    <span className="text-stone-900 font-bold font-sans text-sm block mt-1">{selectedInvoice.clientName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-500 font-bold whitespace-nowrap">STATUS FILTER:</span>
                  <select 
                    value={inspectorStatusFilter}
                    onChange={(e) => setInspectorStatusFilter(e.target.value as any)}
                    className="bg-white border border-stone-200 text-stone-800 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] cursor-pointer"
                  >
                    <option value="All">All Statuses ({clientInvoices.length})</option>
                    <option value="Paid">Paid ({clientInvoices.filter(i => i.status === 'Paid').length})</option>
                    <option value="Unpaid">Unpaid ({clientInvoices.filter(i => i.status === 'Unpaid').length})</option>
                    <option value="Overdue">Overdue ({clientInvoices.filter(i => i.status === 'Overdue').length})</option>
                  </select>
                </div>
              </div>

              {/* List of client invoices filtered */}
              <div className="flex gap-2.5 pb-2.5 overflow-x-auto min-h-[50px] scrollbar-thin select-none border-b border-stone-200/60">
                {filteredClientInvoices.length === 0 ? (
                  <div className="text-stone-400 italic text-[11px] py-2 leading-none w-full text-center">
                    No client documents matching "{inspectorStatusFilter}"
                  </div>
                ) : (
                  filteredClientInvoices.map(inv => {
                    const totalVal = inv.items.reduce((s,i) => s + i.amount, 0) + inv.shippingFee;
                    const isActive = inv.id === selectedInvoice.id;
                    return (
                      <button
                        key={inv.id}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`px-3.5 py-2.5 border rounded-xl flex flex-col items-start gap-1 transition-all text-xs font-mono text-left cursor-pointer shrink-0 min-w-[145px] shadow-sm relative overflow-hidden ${
                          isActive 
                            ? 'bg-stone-900 border-stone-950 text-white hover:bg-stone-850' 
                            : 'bg-white border-stone-200 text-stone-700 hover:border-[#E54A13] hover:text-[#E54A13]'
                        }`}
                      >
                        <div className="flex justify-between w-full items-center gap-1.5 text-[9.5px]">
                          <span className={`font-black ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>#{inv.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                            inv.status === 'Paid' 
                              ? isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                              : inv.status === 'Overdue'
                              ? isActive ? 'bg-rose-500 text-white' : 'bg-rose-50 border border-rose-100 text-rose-600'
                              : isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 border border-orange-100 text-[#E54A13]'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <span className="font-black font-sans text-xs mt-0.5">
                          {templateSettings.currencySymbol}{totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[8.5px] mt-0.5 ${isActive ? 'text-stone-400' : 'text-stone-400'}`}>
                          {inv.issueDate}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Inspector Tabs (Summary, Preview, History) */}
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-inner">
                {(['summary', 'preview', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      detailTab === tab ? 'bg-white text-[#E54A13] shadow-sm' : 'text-stone-500 hover:text-stone-850'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB 1: SUMMARY DETAILS */}
              {detailTab === 'summary' && (
                <div className="p-5 bg-stone-50 rounded-2xl space-y-4 text-xs border border-stone-100 shadow-inner select-none">
                  <div className="space-y-1">
                    <span className="text-stone-400 uppercase text-[9px] font-bold">Client customer details</span>
                    <p className="text-sm font-bold text-stone-900 font-sans">{selectedInvoice.clientName}</p>
                    <p className="text-[11px] text-stone-500 font-mono">{selectedInvoice.clientEmail}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-y-stone-200/80">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Issue Date</span>
                      <span className="text-stone-800 font-bold font-sans">{selectedInvoice.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Due Date</span>
                      <span className="text-stone-800 font-bold font-sans">{selectedInvoice.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Shipping fee</span>
                      <span className="text-stone-800 font-bold font-sans">₦{selectedInvoice.shippingFee.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-bold">Status</span>
                      <span className={`font-bold uppercase text-[10px] ${
                        selectedInvoice.status === 'Paid' ? 'text-emerald-600' : 'text-[#E54A13]'
                      }`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-stone-400 uppercase text-[9px] font-bold">Items list billed</span>
                    <div className="space-y-1.5">
                      {selectedInvoice.items.map(it => (
                        <div key={it.id} className="p-2.5 bg-white rounded-lg border border-stone-200/60 flex justify-between items-center text-[11px]">
                          <span className="text-stone-700 font-sans font-medium">{it.description.split('\n')[0]} (x{it.qty})</span>
                          <span className="font-bold text-stone-900">₦{it.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2 pt-4 border-t border-stone-200">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => {
                          // Real behaviour: open the user's mail client
                          // to the recipient with a pre-filled subject,
                          // and log a real notification.
                          const subject = encodeURIComponent(`Invoice #${selectedInvoice.id} from ${businessDetails.name || 'us'}`);
                          const body = encodeURIComponent(`Hi ${selectedInvoice.clientName || ''},\n\nA gentle reminder that invoice #${selectedInvoice.id} is awaiting payment.\n\nThanks.`);
                          if (selectedInvoice.clientEmail) {
                            window.location.href = `mailto:${selectedInvoice.clientEmail}?subject=${subject}&body=${body}`;
                          }
                          handleAddNotification({
                            id: `notif-resend-${Date.now()}`,
                            title: 'Reminder Drafted',
                            message: selectedInvoice.clientEmail
                              ? `Opened a follow-up email for invoice #${selectedInvoice.id} to ${selectedInvoice.clientEmail}.`
                              : `Invoice #${selectedInvoice.id} has no client email on file — add one to enable mail.`,
                            type: selectedInvoice.clientEmail ? 'success' : 'warning',
                            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            read: false,
                          });
                        }}
                        className="flex-1 py-2 bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 font-bold rounded-lg uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-sm"
                      >
                        Resend Confirm Mail
                      </button>
                      {selectedInvoice.status !== 'Paid' && (
                        <button
                          onClick={() => handleAddPaymentToInvoice(selectedInvoice.id)}
                          className="flex-1 py-2 bg-[#E54A13] text-white hover:bg-orange-700 font-bold rounded-lg font-mono uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-sm border-0"
                        >
                          Confirm payment
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleOpenEditDoc(selectedInvoice)}
                        className="flex-1 py-2 bg-white border border-stone-200 text-stone-755 text-stone-705 text-stone-700 hover:text-[#E54A13] hover:border-[#E54A13] font-bold rounded-lg font-mono uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-sm"
                      >
                        Edit Parameters
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                        className="flex-1 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-lg font-mono uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                      >
                        Delete Invoice
                      </button>
                    </div>

                    {/* Clone Invoice Button with brand-matching dark focus flow */}
                    <button
                      onClick={() => handleCloneInvoice(selectedInvoice)}
                      className="w-full py-2.5 bg-stone-900 hover:bg-[#E54A13] text-white font-bold rounded-lg font-mono uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border border-stone-800"
                    >
                      <Copy className="w-3.5 h-3.5 text-white" />
                      Clone Invoice (Duplicate Template)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: RENDERED PDF PREVIEW (Exact look representing reference screenshots!) */}
              {detailTab === 'preview' && (
                <div className="p-1 overflow-x-auto">
                  <motion.div
                    key={`${selectedInvoiceId}-${selectedInvoice?.templateType || 'Stripe'}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div id="invoice-capture-area" className="w-full">
                      <InvoicePreview 
                        invoice={selectedInvoice}
                        businessDetails={businessDetails}
                        bankAccount={bankAccount}
                        templateSettings={templateSettings}
                      />
                    </div>
                  </motion.div>
                  <div className="mt-4 p-5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-xs font-mono shadow-inner">
                    <div className="flex gap-2.5 items-center">
                      <ShieldAlert className="w-5 h-5 text-[#E54A13]" />
                      <div className="select-none">
                        <p className="text-stone-800 font-bold">Fidelity Verification Complete</p>
                        <p className="text-[10px] text-stone-550 leading-normal mt-0.5">Vector fonts, handwriting path signatures and background patterns are correctly mapped.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isGeneratingPDF}
                      className={`px-3.5 py-1.5 rounded uppercase font-bold text-[10.5px] cursor-pointer shadow-sm transition-all border ${
                        isGeneratingPDF
                          ? 'bg-orange-100 border-orange-300 text-orange-700 cursor-wait animate-pulse'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-[#E54A13] hover:text-[#E54A13] hover:bg-orange-50/50'
                      }`}
                    >
                      {isGeneratingPDF ? 'Generating...' : 'Download as PDF'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE HISTORY LOGS */}
              {detailTab === 'history' && (
                <div className="p-5 bg-stone-50 rounded-2xl space-y-4 text-xs border border-stone-200 shadow-inner">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans">Log Event Timeline</span>
                  <div className="relative border-l border-stone-300 pl-4 space-y-5 ml-1 pt-1 pb-1 select-none">
                    {selectedInvoice.history.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-50 outline outline-stone-300 outline-1" />
                        <div>
                          <p className="font-bold text-stone-800">{h.event}</p>
                          <p className="text-[10.5px] text-stone-500 mt-0.5">
                            {new Date(h.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at{' '}
                            {new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </section>

               {/* RIGHT COLUMN: Interactive Notifications Stream & Direct Actions Drawer (4 cols) */}
        <section className="lg:col-span-4 space-y-6" id="right-workspace-column">
          
          {/* Quick Shortcuts Control Box */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-sm feature-card cursor-pointer">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-sans">Workspace Shortcut Controls</h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleOpenCreator}
                className="py-2.5 px-3 bg-[#E54A13] hover:bg-orange-700 font-bold uppercase text-[10px] rounded-lg text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center border-0 cursor-pointer shadow-sm animate-pulse-dot"
                style={{ animationIterationCount: 1 }}
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Issue Invoice</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="py-2.5 px-3 bg-white border border-stone-200 hover:border-[#E54A13] hover:text-[#E54A13] hover:bg-orange-50/20 text-stone-600 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-[#E54A13]" />
                <span>Preferences</span>
              </button>
            </div>

            <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-2 text-[10px] text-stone-500 uppercase font-mono tracking-wider font-bold">
              <button 
                onClick={() => setActiveScreen('catalogs')}
                className={`py-1 rounded text-center border bg-transparent hover:text-[#E54A13] hover:border-[#E54A13] transition-all cursor-pointer ${activeScreen === 'catalogs' ? 'text-[#E54A13] border-[#E54A13]' : 'border-stone-200 text-stone-600'}`}
              >
                Predefine SKU
              </button>
              <button 
                onClick={() => setActiveScreen('expenses')}
                className={`py-1 rounded text-center border bg-transparent hover:text-[#E54A13] hover:border-[#E54A13] transition-all cursor-pointer ${activeScreen === 'expenses' ? 'text-[#E54A13] border-[#E54A13]' : 'border-stone-200 text-stone-600'}`}
              >
                Expenses Ledger
              </button>
            </div>
          </div>

          {/* REAL-TIME CLIENT LOG STREAM */}
          <LiveNotifications 
            notifications={notifications}
            onAddNotification={handleAddNotification}
            onClearNotifications={handleClearNotifications}
          />

          {/* Business identity overview banner */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 text-xs font-mono space-y-1.5 select-none text-stone-500 leading-normal shadow-sm feature-card cursor-pointer">
            <div className="flex justify-between font-bold text-stone-800 text-[10px] uppercase font-sans mb-1.5">
              <span>Account Credentials</span>
              <span className="text-[#E54A13] font-bold">Connected</span>
            </div>
            <p className="truncate text-stone-600">Client ID: Private Relay Account W44ZRHJSVB</p>
            <p className="text-stone-600">Moniepoint Ledger: Registered</p>
            <p className="text-stone-600">VAT registration: 123456789</p>
          </div>

        </section>

      </main>

      {/* FOOTER METRICS ROW */}
      <footer className="bg-stone-950 border-t border-stone-850/60 p-4 mt-auto text-center text-[10.5px] font-mono text-stone-500">
        <p>© {new Date().getFullYear()} {businessDetails.name || 'Your workspace'} · <span style={{ color: 'var(--primary)' }}>Billable</span> by Sylens · All systems nominal</p>
      </footer>

      {/* SLIDE-OUT INVOICE CREATOR MODAL WINDOW */}
      {isCreatorOpen && (() => {
        // Build a draft Invoice from the current form state so the
        // Preview tab can render a live <InvoicePreview> using exactly
        // what the user will save.
        const draftInvoice: Invoice = {
          id: invoiceIdInput || editingInvoiceId || 'DRAFT',
          clientName: newClientName || 'New client',
          clientEmail: newClientEmail,
          clientCountry: businessDetails.country || '',
          clientStreet: newClientStreet,
          clientCity: newClientCity,
          issueDate: newIssueDate,
          dueDate: newDueDate,
          paymentMethod: templateSettings.paymentMethod,
          orderNo: newOrderNo,
          items: selectedItemsList.map((it) => ({
            id: it.id,
            description: it.desc,
            qty: it.qty,
            unit: it.unit,
            price: it.price,
            discount: 0,
            amount: it.price * it.qty,
          })),
          shippingFee: newShipping,
          vatRate: newVatRate,
          status: 'Draft',
          templateType: selectedTemplate,
          createdTime: new Date().toISOString(),
          history: [],
        };
        const canPreview = newClientName.trim().length > 0 && selectedItemsList.length > 0;
        const isPreviewing = creatorMode === 'preview' && canPreview;

        return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-stone-900/60 backdrop-blur-sm p-4" id="invoice-creator-overlay">
          <div className={`bg-white border border-stone-200 rounded-2xl w-full h-full max-h-[92vh] flex flex-col overflow-hidden text-xs shadow-2xl transition-[max-width] duration-200 ${isPreviewing ? 'max-w-5xl' : 'max-w-2xl'}`}>

            {/* Header toolbar — title + Edit/Preview tabs + close */}
            <div className="p-4 border-b border-stone-200 bg-white flex justify-between items-center gap-4 shrink-0">
              <h3 className="text-sm font-extrabold uppercase text-stone-950 flex items-center gap-2 min-w-0">
                <Plus className="w-4 h-4 text-[#E54A13] shrink-0" />
                <span className="truncate">
                  {editingInvoiceId ? `Edit invoice #${editingInvoiceId}` : 'New invoice'}
                </span>
              </h3>

              {/* Mode tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreatorMode('edit')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    creatorMode === 'edit'
                      ? 'bg-white text-[#E54A13] shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={!canPreview}
                  title={canPreview ? '' : 'Add a client name and at least one item to preview'}
                  onClick={() => canPreview && setCreatorMode('preview')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    !canPreview
                      ? 'text-stone-300 cursor-not-allowed'
                      : creatorMode === 'preview'
                        ? 'bg-white text-[#E54A13] shadow-sm cursor-pointer'
                        : 'text-stone-500 hover:text-stone-900 cursor-pointer'
                  }`}
                >
                  Preview
                </button>
              </div>

              <button
                onClick={() => { setIsCreatorOpen(false); resetCreatorStates(); setCreatorMode('edit'); }}
                className="p-1 rounded-lg bg-stone-100 hover:bg-orange-50 text-stone-500 hover:text-[#E54A13] transition-all border-0 cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PREVIEW MODE — renders a live InvoicePreview of the draft */}
            {isPreviewing && (
              <div className="flex-1 overflow-y-auto p-6 bg-stone-100">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Live preview · {selectedTemplate} template
                  </span>
                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
                    {(['Stripe','Classic','Serif','Modern','Simple','Circle','Wardiere','Bold'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          selectedTemplate === t
                            ? 'bg-[#E54A13] text-white'
                            : 'text-stone-500 hover:text-[#E54A13]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <InvoicePreview
                  invoice={draftInvoice}
                  businessDetails={businessDetails}
                  bankAccount={bankAccount}
                  templateSettings={{ ...templateSettings, templateType: selectedTemplate }}
                />
                <div className="pt-5 flex gap-3 sticky bottom-0">
                  <button
                    type="button"
                    onClick={() => setCreatorMode('edit')}
                    className="flex-1 py-2.5 bg-white border border-stone-200 hover:border-[#E54A13] text-stone-700 hover:text-[#E54A13] rounded-xl uppercase font-bold text-xs cursor-pointer shadow-sm transition-all"
                  >
                    ← Back to edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmitNewInvoice(e as any)}
                    className="flex-1 py-2.5 bg-[#E54A13] hover:bg-orange-700 text-white font-extrabold rounded-xl uppercase tracking-wider text-xs cursor-pointer shadow-md transition-all border-0"
                  >
                    {editingInvoiceId ? 'Update invoice' : 'Save & issue invoice'}
                  </button>
                </div>
              </div>
            )}

            {/* EDIT MODE — original form body */}
            {!isPreviewing && (
            <form onSubmit={handleSubmitNewInvoice} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">Invoice Ref ID</span>
                  <input 
                    type="text" 
                    placeholder="e.g. 622 (Auto if empty)"
                    value={invoiceIdInput}
                    onChange={(e) => setInvoiceIdInput(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">Reference Order No</span>
                  <input 
                    type="text" 
                    placeholder="e.g. oozz27"
                    value={newOrderNo}
                    onChange={(e) => setNewOrderNo(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm"
                  />
                </div>
              </div>

              {/* Client customer fields */}
              <div className="space-y-3.5">
                <span className="font-bold text-stone-800 uppercase tracking-widest text-[10px] font-sans block">Client customer coordinates</span>
                <div className="space-y-1">
                  <span className="text-stone-500">Billed Name / Entity</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Pilot Abubakar"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-2 text-xs font-sans text-stone-800 shadow-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-stone-500">Contact Email Address</span>
                    <input 
                      type="email" 
                      placeholder="e.g. pilot@example.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-2 text-xs font-sans text-stone-800 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-stone-500">City Location</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Abuja"
                      value={newClientCity}
                      onChange={(e) => setNewClientCity(e.target.value)}
                      className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-2 text-xs font-sans text-stone-800 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-500">Street / Area Address Description</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Asokoro Extension"
                    value={newClientStreet}
                    onChange={(e) => setNewClientStreet(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-2 text-xs font-sans text-stone-800 shadow-sm"
                  />
                </div>
              </div>

              {/* Items configuration lists */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline flex-wrap">
                  <span className="font-bold text-stone-800 uppercase tracking-widest text-[10px] font-sans block">Document Line Items</span>
                  <span className="text-[10px] text-stone-500 font-sans">Add predefined item from selectors or define custom row</span>
                </div>

                {/* Predefined selection pill bars */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <span className="text-[9px] text-stone-500 uppercase tracking-wider block font-sans font-bold">Predefined Catalog Items (Instantly Insert)</span>
                  <div className="flex flex-wrap gap-2">
                    {products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleInsertPredefinedItem(p.id, 'product')}
                        className="px-2.5 py-1 bg-white border border-stone-200 text-stone-700 rounded-lg hover:border-[#E54A13] hover:text-[#E54A13] hover:bg-orange-50/20 transition-all text-[11px] select-none text-left cursor-pointer font-sans shadow-sm font-semibold"
                      >
                        + Product: {p.name}
                      </button>
                    ))}
                    {services.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleInsertPredefinedItem(s.id, 'service')}
                        className="px-2.5 py-1 bg-white border border-stone-200 text-stone-700 rounded-lg hover:border-[#E54A13] hover:text-[#E54A13] hover:bg-orange-50/20 transition-all text-[11px] select-none text-left cursor-pointer font-sans shadow-sm font-semibold"
                      >
                        + Service: {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom row dynamic adder */}
                {isAddingCustomRow ? (
                  <div className="p-4 bg-stone-50 rounded-2xl space-y-2.5 animate-slide-up text-[11px] border border-stone-200">
                    <span className="font-bold uppercase text-[9px] text-stone-700 font-sans">Add Custom Row</span>
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-200/80">
                      <span className="font-bold">Description</span>
                      <textarea 
                        value={customRowDesc}
                        onChange={(e) => setCustomRowDesc(e.target.value)}
                        placeholder="Define item details..."
                        className="w-full h-12 bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-stone-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="font-bold text-stone-550 text-stone-500">Price (₦)</span>
                        <input 
                          type="number" 
                          value={customRowPrice || ''}
                          onChange={(e) => setCustomRowPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl p-1.5 text-stone-800"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          onClick={handleAddCustomRow}
                          className="px-3.5 py-1.5 bg-[#E54A13] hover:bg-orange-700 text-white font-bold uppercase rounded-lg border-0 cursor-pointer shadow-sm"
                        >
                          Insert Inline
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomRow(true)}
                    className="w-full py-2.5 bg-white border border-stone-200 border-dashed hover:border-[#E54A13] hover:text-[#E54A13] rounded-2xl text-stone-550 text-[11px] uppercase font-bold cursor-pointer transition-all shadow-sm"
                  >
                    + Define Arbitrary Item Row
                  </button>
                )}

                {/* Grid list of selected items in the build */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-stone-550 font-bold uppercase">Selected items list ({selectedItemsList.length})</span>
                  {selectedItemsList.length === 0 ? (
                    <div className="text-center p-6 bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 italic font-sans">
                      No items added yet. Click preset items or specify a custom row above to proceed.
                    </div>
                  ) : (
                    selectedItemsList.map((it, idx) => (
                      <div key={it.id} className="p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-bold text-stone-800 font-sans">{it.desc.split('\n')[0]}</p>
                          <p className="text-[10px] text-stone-500 font-sans mt-0.5">Price: ₦{it.price.toLocaleString()} • Qty: {it.qty}</p>
                        </div>
                        <div className="flex gap-2.5 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemsList(prev => prev.map((item, i) => i === idx ? { ...item, qty: Math.max(1, item.qty - 1) } : item));
                            }}
                            className="w-6 h-6 bg-stone-100 border border-stone-200 hover:border-[#E54A13] rounded-full text-stone-500 hover:text-[#E54A13] flex items-center justify-center font-bold cursor-pointer font-sans"
                          >
                            -
                          </button>
                          <span className="font-bold text-stone-800 font-sans">{it.qty}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemsList(prev => prev.map((item, i) => i === idx ? { ...item, qty: item.qty + 1 } : item));
                            }}
                            className="w-6 h-6 bg-stone-100 border border-stone-200 hover:border-[#E54A13] rounded-full text-stone-500 hover:text-[#E54A13] flex items-center justify-center font-bold cursor-pointer font-sans"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemsList(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-[#E54A13] hover:text-rose-700 font-bold ml-1.5 cursor-pointer"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shipping settings */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">Shipping Cargo Fee (₦)</span>
                  <input 
                    type="number" 
                    value={newShipping || ''}
                    onChange={(e) => setNewShipping(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm font-sans"
                    placeholder="2320"
                    min="0"
                  />
                </div>
                <div className="flex items-end justify-end text-right font-bold text-stone-700 text-sm py-2">
                  <div className="w-full text-right leading-none">
                    <span className="text-[10px] text-stone-500 uppercase block font-sans mb-1 font-bold">Interactive Subtotal</span>
                    <span className="font-sans text-[#E54A13] text-lg font-extrabold block">
                      ₦{(
                        selectedItemsList.reduce((sum, item) => sum + item.qty * item.price, 0) + newShipping
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional parameters: Dates & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">Issue Date</span>
                  <input 
                    type="date" 
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">Due Date</span>
                  <input 
                    type="date" 
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-stone-500 block uppercase text-[10px] font-bold">VAT Rate (%)</span>
                  <input 
                    type="number" 
                    value={newVatRate}
                    onChange={(e) => setNewVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] outline-none rounded-xl px-2.5 py-1.5 text-xs text-stone-800 shadow-sm font-sans"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* TEMPLATE CHOOSER SHOWN WHEN DETAILS ARE IMPUTED */}
              {newClientName && selectedItemsList.length > 0 && (
                <div className="space-y-3 p-4 bg-stone-150 p-4 bg-stone-50 rounded-2xl border border-dashed border-[#E54A13]/40 animate-slide-up animate-slide-up">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-800 uppercase tracking-widest text-[9.5px] block font-sans">Select Invoice Style Template (5 Varieties)</span>
                    <span className="text-[10px] text-[#E54A13] font-sans font-extrabold uppercase">{selectedTemplate} Active</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'Stripe',   label: 'Stripe',   desc: 'Sleek premium brand layout' },
                      { type: 'Classic',  label: 'Classic',  desc: 'Standard ledger borders' },
                      { type: 'Serif',    label: 'Serif',    desc: 'Editorial serif typography' },
                      { type: 'Modern',   label: 'Modern',   desc: 'Digital glowing tech design' },
                      { type: 'Simple',   label: 'Simple',   desc: 'Ultra-clean workspace focus' },
                      { type: 'Circle',   label: 'Circle',   desc: 'White minimalist, signature script' },
                      { type: 'Wardiere', label: 'Wardiere', desc: 'Peach band, two-column elegance' },
                      { type: 'Bold',     label: 'Bold',     desc: 'Cream typecentric editorial' },
                    ].map((tpl) => (
                      <button
                        key={tpl.type}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.type as InvoiceTemplate)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 outline-none ${
                          selectedTemplate === tpl.type 
                            ? 'bg-orange-50/80 border-[#E54A13] text-[#E54A13] shadow-md'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-[#E54A13] hover:text-[#E54A13] hover:bg-orange-50/10'
                        }`}
                      >
                        <span className="font-black text-[10px] block leading-none font-sans">{tpl.label}</span>
                        <span className="text-[8.5px] text-stone-400 font-sans leading-tight block mt-1">{tpl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsCreatorOpen(false); resetCreatorStates(); }}
                  className="flex-1 py-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl uppercase font-bold text-xs cursor-pointer border-0 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E54A13] hover:bg-orange-700 text-white font-extrabold rounded-xl uppercase tracking-wider text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-md transition-all border-0"
                >
                  {editingInvoiceId ? 'Update & Record Invoice' : 'Save & Issue Document'}
                </button>
              </div>

            </form>
            )}
          </div>
        </div>
        );
      })()}

      <PdfImportDialog
        isOpen={isPdfImportOpen}
        onClose={() => setIsPdfImportOpen(false)}
        onApply={handleApplyExtracted}
      />

      {/* GLOBAL SETTINGS SIDE-PANEL OVERLAY */}
      <SettingsDrawer 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        businessDetails={businessDetails}
        onUpdateBusinessDetails={(det) => {
          setBusinessDetails(det);
          // Trigger mock log
          handleAddNotification({
            id: `notif-biz-${Date.now()}`,
            title: 'Business Details Updated',
            message: 'Registrations modified. Brand logo is refreshed.',
            type: 'info',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        }}
        bankAccount={bankAccount}
        onUpdateBankAccount={(bank) => {
          setBankAccount(bank);
          handleAddNotification({
            id: `notif-bank-${Date.now()}`,
            title: 'Payment Terms Updated',
            message: `Custom Moniepoint ledger ${bank.accountNumber} assigned for payments routing.`,
            type: 'info',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        }}
        vatSettings={vatSettings}
        onUpdateVatSettings={(vat) => {
          setVatSettings(vat);
          handleAddNotification({
            id: `notif-vat-${Date.now()}`,
            title: 'VAT Rates Saved',
            message: `Tax configuration initialized with global rate: ${vat.rate1}%.`,
            type: 'info',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        }}
        templateSettings={templateSettings}
        onUpdateTemplateSettings={(temp) => {
          setTemplateSettings(temp);
          handleAddNotification({
            id: `notif-temp-${Date.now()}`,
            title: 'Layout Saved',
            message: `Templates modified to '${temp.templateType}' style format.`,
            type: 'info',
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        }}
      />

    </div>
  );
}
