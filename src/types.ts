/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  signatureUrl?: string; // Signature photo
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
  rate1: number; // e.g. 7.5
  rate2: number;
  rate3: number;
}

export interface TemplateSettings {
  color: string; // Hex or tailwind class
  templateType: 'Stripe' | 'Modern' | 'Classic' | 'Minimalist';
  currency: string; // e.g. NGN, USD, GBP
  currencySymbol: string; // ₦, $, £
  language: string; // EN, FR, etc.
  paymentMethod: string; // e-transfer, bank, cash
  dueDateDays: number; // e.g. 3 Days
  estimateType: 'Estimate' | 'Quote';
  barcodeScannerEnabled: boolean;
  numberingFormat: string; // e.g. "INV-0000" or simple numerical
  showQR?: boolean; // Show QR code for payments
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit: string; // Pack, Hour, Piece
  price: number;
  discount: number; // percentage
  amount: number;
}

export interface Invoice {
  id: string; // Auto or manual e.g. "621"
  clientName: string;
  clientEmail: string;
  clientCountry: string;
  clientStreet: string;
  clientCity: string;
  clientAptSuite?: string;
  clientPostalCode?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentMethod: string;
  orderNo: string;
  items: InvoiceItem[];
  shippingFee: number;
  vatRate: number; // percentage
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft';
  skuPhotoUrl?: string;
  notes?: string;
  templateType?: 'Stripe' | 'Classic' | 'Serif' | 'Modern' | 'Simple';
  createdTime: string; // log timestamp
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
