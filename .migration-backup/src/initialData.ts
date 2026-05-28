/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusinessDetails, BankAccount, VatSettings, TemplateSettings, Invoice, Product, Service, Expense, Workspace } from './types';

// Let's create highly polished inline SVG data URLs for high-fidelity rendering without external dependencies
export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="45" fill="%231a1a2e" stroke="%233b82f6" stroke-width="2"/>
  <path d="M35 30 C 50 20, 50 45, 35 55 C 20 65, 80 50, 65 70" fill="none" stroke="%2360a5fa" stroke-width="6" stroke-linecap="round"/>
  <circle cx="35" cy="30" r="4" fill="%2338bdf8"/>
  <circle cx="65" cy="70" r="4" fill="%2338bdf8"/>
  <text x="32" y="90" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="%2394a3b8" letter-spacing="1">SYLENS</text>
</svg>`;

export const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <path d="M20 50 Q 50 15, 60 45 T 90 25 T 110 55 T 140 35 T 170 50 M60 25 L 140 65 M50 55 L 130 15" fill="none" stroke="%231d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="70" y="75" font-family="'Brush Script MT', cursive, sans-serif" font-size="12" fill="%231e3a8a">Dr. Justice</text>
</svg>`;

export const DEFAULT_SKU_TEA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <rect x="0" y="0" width="300" height="400" rx="12" fill="%230f172a" stroke="%231e293b" stroke-width="4"/>
  
  <!-- Outer glowing borders -->
  <rect x="15" y="15" width="270" height="370" rx="8" fill="none" stroke="%2322c55e" stroke-dasharray="10 5" stroke-width="2" opacity="0.6"/>
  
  <!-- Tea Bag / Container illustration -->
  <defs>
    <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%231b4332" />
      <stop offset="100%" stop-color="%23081c15" />
    </linearGradient>
  </defs>
  
  <rect x="60" y="60" width="180" height="240" rx="16" fill="url(%23bagGrad)" stroke="%232d6a4f" stroke-width="3"/>
  
  <!-- Packaging Header -->
  <text x="150" y="95" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="900" fill="%2352b788" letter-spacing="3">PREMIUM HERBAL</text>
  <text x="150" y="125" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="900" fill="%23ffffff" letter-spacing="1">DETOX TEA</text>
  
  <!-- Mint/Tea leaf vectors -->
  <path d="M150 150 C120 180, 150 200, 150 200 C150 200, 180 180, 150 150 Z" fill="%2374c69d" stroke="%2340916c" stroke-width="1.5"/>
  <path d="M130 180 C110 200, 130 215, 130 215 C130 215, 150 200, 130 180 Z" fill="%2395d5b2" stroke="%2340916c" stroke-width="1.5" opacity="0.8"/>
  <path d="M170 185 C190 205, 170 218, 170 218 C170 218, 150 205, 170 185 Z" fill="%23b7e4c7" stroke="%2340916c" stroke-width="1.5" opacity="0.8"/>
  
  <!-- Detailed Ingredients checklist -->
  <text x="150" y="245" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="%23d8f3dc">Milk Thistle • Dandelion • Licorice • Peppermint</text>
  <text x="150" y="260" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="%2352b788">28 COUNT HERBAL BAGS</text>
  
  <!-- Bottom seal -->
  <rect x="63" y="275" width="174" height="22" rx="4" fill="%231e293b" stroke="%23475569" stroke-width="1"/>
  <text x="150" y="289" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%2394a3b8">100% ORGANIC &amp; DIETARY SUPPLEMENT</text>
  
  <!-- Footer warning note -->
  <rect x="30" y="325" width="240" height="45" rx="6" fill="%231e1b4b" stroke="%23312e81" stroke-width="1"/>
  <text x="150" y="342" text-anchor="middle" font-family="sans-serif" font-size="8" font-style="italic" fill="%23c7d2fe">SKU PHOTO: DETOX TEA</text>
  <text x="150" y="356" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23fc8181">Do not accept package if safety seal is broken.</text>
</svg>`;

export const INITIAL_BUSINESS_DETAILS: BusinessDetails = {
  name: "SYLENS LIMITED",
  country: "Nigeria",
  street: "Gbemi oluwa Close, Opebi",
  aptSuite: "Apt, Suite",
  postalCode: "Postal Code",
  city: "lagos",
  taxRegNo: "123456789",
  contactPerson: "Dr. Justice",
  cell: "08078852666",
  phone: "07063630764",
  fax: "Fax",
  email: "onilejustice@gmail.com",
  website: "Website",
  logoUrl: DEFAULT_LOGO_SVG,
  signatureUrl: DEFAULT_SIGNATURE_SVG,
};

export const INITIAL_BANK_ACCOUNT: BankAccount = {
  accountHolder: "SYLENS LIMITED",
  bankName: "Moniepoint",
  accountNumber: "6716712799",
  iban: "",
  bicSwift: "",
  bankAddress: "Bank address",
};

export const INITIAL_VAT_SETTINGS: VatSettings = {
  applyToInvoices: true,
  taxLabel: "VAT",
  rate1: 7.5,
  rate2: 0.0,
  rate3: 0.0,
};

export const INITIAL_TEMPLATE_SETTINGS: TemplateSettings = {
  color: "#22c55e", // Green/Teal
  templateType: "Stripe",
  currency: "NGN",
  currencySymbol: "₦",
  language: "EN",
  paymentMethod: "e-transfer",
  dueDateDays: 3,
  estimateType: "Estimate",
  barcodeScannerEnabled: false,
  numberingFormat: "INV-",
};

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "621",
    clientName: "Pilot Abubakar",
    clientEmail: "pilotabubakar@example.com",
    clientCountry: "Nigeria",
    clientStreet: "Asokoro Extension",
    clientCity: "Abuja",
    issueDate: "2026-05-24",
    dueDate: "2026-05-27",
    paymentMethod: "e-transfer",
    orderNo: "oozz26",
    items: [
      {
        id: "item1",
        description: "Detox Tea\nTEARELAE - Detox Tea, 28 Count Herbal Liver Detox Tea Bag - Milk Thistle Seed, Dandelion Root, Licorice Root, Fennel, Turmeric, Peppermint Description",
        qty: 1,
        unit: "Pack",
        price: 43630,
        discount: 0,
        amount: 43630,
      },
      {
        id: "item2",
        description: "Consultation\n5 minute consultation",
        qty: 1,
        unit: "Session",
        price: 1000,
        discount: 0,
        amount: 1000,
      }
    ],
    shippingFee: 2320,
    vatRate: 0, // In the video calculation, 43630 + 1000 = 44630, + 2320 shipping = 46950. Tax was set to 0.0% on this invoice, with note of 7.5% total on custom layout option
    status: "Unpaid",
    skuPhotoUrl: DEFAULT_SKU_TEA_SVG,
    notes: "An advance payment of ₦46,950.00 is due by May 27, 2026. Thank you.",
    createdTime: "2026-05-24T08:09:00Z",
    history: [
      { event: "Created", timestamp: "2026-05-24T08:09:00Z" },
      { event: "Sent", timestamp: "2026-05-24T08:09:00Z" },
      { event: "Opened", timestamp: "2026-05-24T09:10:00Z" },
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Detox Tea",
    description: "TEARELAE - Detox Tea, 28 Count Herbal Liver Detox Tea Bag - Milk Thistle Seed, Dandelion Root, Licorice Root, Fennel, Turmeric, Peppermint Description",
    unit: "Pack",
    price: 43630,
    discount: 0,
    imageUrl: DEFAULT_SKU_TEA_SVG,
  },
  {
    id: "prod-2",
    name: "Sample Herbs Pack",
    description: "Organic green leaves pack containing premium blend",
    unit: "Pack",
    price: 3500,
    discount: 0,
  }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: "serv-1",
    name: "Consultation",
    description: "5 minute premium wellness consultation with Dr. Justice",
    unit: "Session",
    price: 1000,
    discount: 0,
    durationMinutes: 5,
  },
  {
    id: "serv-2",
    name: "Standard Therapy Align",
    description: "Clinical routine realignment therapy and consultation checkup",
    unit: "Hour",
    price: 12500,
    discount: 5,
    durationMinutes: 60,
  }
];

/** Seed workspace used on a brand-new install (no existing data). The
 *  migration in lib/persistence.ts builds a workspace from the user's
 *  existing flat keys when those are present, so this is only consulted
 *  the very first time the app runs in a fresh browser. */
export const SEED_WORKSPACE_ID = 'ws_1';

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: SEED_WORKSPACE_ID,
    businessDetails: INITIAL_BUSINESS_DETAILS,
    bankAccount: INITIAL_BANK_ACCOUNT,
    vatSettings: INITIAL_VAT_SETTINGS,
    templateSettings: INITIAL_TEMPLATE_SETTINGS,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    description: "Packaging supplier raw herbs print batch",
    vendor: "Lagos Printing Press Co.",
    category: "Supplies",
    date: "2026-05-20",
    paid: true,
    taxRate: 7.5,
    amount: 15400,
  },
  {
    id: "exp-2",
    description: "Express shipping delivery fuel logistics",
    vendor: "GIG Logistics",
    category: "Travel",
    date: "2026-05-22",
    paid: true,
    taxRate: 0,
    amount: 5000,
  }
];
