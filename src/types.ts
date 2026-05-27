/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Single source of truth for invoice template variants. Used both on
 * the per-invoice level (Invoice.templateType) and on the workspace
 * default (TemplateSettings.templateType). Previously these were two
 * different unions which let mismatched assignments slip past tsc.
 */
export type InvoiceTemplate = 'Stripe' | 'Classic' | 'Serif' | 'Modern' | 'Simple';

export interface BusinessDetails {
  name: string;
  country: string;
  street: string;
  aptSuite: string;
  postalCode: string;
  city: string;
  taxRegNo: string;
  contactPerson: string;
  cell: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  logoUrl?: string;
  signatureUrl?: string;
}

export interface BankAccount {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  bicSwift: string;
  bankAddress: string;
  paymentLink?: string;
}

export interface VatSettings {
  applyToInvoices: boolean;
  taxLabel: string;
  rate1: number;
  rate2: number;
  rate3: number;
}

export interface TemplateSettings {
  color: string;
  templateType: InvoiceTemplate;
  currency: string;            // e.g. NGN, USD, GBP
  currencySymbol: string;      // ₦, $, £
  language: string;            // EN, FR, etc.
  paymentMethod: string;       // e-transfer, bank, cash
  dueDateDays: number;
  estimateType: 'Estimate' | 'Quote';
  barcodeScannerEnabled: boolean;
  numberingFormat: string;     // e.g. "INV-0000" or "INV-"
  showQR?: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  discount: number; // percentage
  amount: number;
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCountry: string;
  clientStreet: string;
  clientCity: string;
  clientAptSuite?: string;
  clientPostalCode?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  paymentMethod: string;
  orderNo: string;
  items: InvoiceItem[];
  shippingFee: number;
  vatRate: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';
  skuPhotoUrl?: string;
  notes?: string;
  templateType?: InvoiceTemplate;
  createdTime: string;
  history: Array<{
    event: string;
    timestamp: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  discount: number;
  imageUrl?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  discount: number;
  durationMinutes?: number;
}

export interface Expense {
  id: string;
  description: string;
  vendor: string;
  category: 'Administration' | 'Advertising' | 'Travel' | 'Supplies' | 'Rent' | 'Other';
  date: string;
  paid: boolean;
  taxRate: number;
  amount: number;
  invoicePhotoUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}
