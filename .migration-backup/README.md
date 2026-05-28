# Billable

**By Sylens.** High-fidelity multi-business invoicing and operations workspace.
React + Vite + TypeScript + Tailwind v4, styled with the
[Declotr Design System](https://declotr.com).

## Features

- **Invoices** — create, edit, clone, mark paid, delete, with 5 PDF
  templates (Stripe, Classic, Serif, Modern, Simple)
- **PDF export** — full-fidelity vector-quality download via
  jsPDF + html2canvas
- **QR payment codes** — embedded in invoice PDFs (via `react-qr-code`)
- **Products & services catalog** — reusable line items with pricing,
  description, unit
- **Expenses tracker** — categorised, tax-aware ledger
- **Reports dashboard** — revenue, recovery rate, top clients
- **Live notifications** — in-app activity log
- **Workspace settings** — business identity, bank/payout details,
  VAT rates, default template
- **Theme** — light + dark
- **Local-only persistence** — every entity is stored in
  `localStorage` under the `billables_*` namespace. No backend
  required; the app works fully offline after first load.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

`server.ts` runs Express + Vite middleware in dev. In production,
`npm run build` outputs a static SPA to `dist/` plus a bundled
`dist/server.cjs` if you want to host with Node.

## Project layout

```
billables-app/
├─ index.html               ← entry HTML
├─ server.ts                ← dev Express + Vite SSR shell
├─ src/
│  ├─ main.tsx              ← React entry
│  ├─ App.tsx               ← top-level state + screens
│  ├─ types.ts              ← shared TS types
│  ├─ initialData.ts        ← demo seed data
│  ├─ index.css             ← imports + Tailwind v4 @theme
│  ├─ styles/
│  │  ├─ tokens.css         ← design-kit CSS custom properties
│  │  ├─ components.css     ← design-kit component classes
│  │  └─ animations.css     ← design-kit keyframes + utilities
│  ├─ lib/
│  │  └─ persistence.ts     ← localStorage hooks + legacy migration
│  └─ components/
│     ├─ MarketingHero.tsx
│     ├─ InvoicePreview.tsx
│     ├─ LiveNotifications.tsx
│     ├─ ReportsDashboard.tsx
│     ├─ ServicesProductsManager.tsx
│     ├─ ExpensesTracker.tsx
│     └─ SettingsDrawer.tsx
```

## Design system

The whole UI is built on the Declotr design kit (in `src/styles/`).
Tokens are exposed both as raw CSS custom properties (`var(--primary)`,
`var(--shadow-md)`) and as Tailwind utilities (`bg-primary`,
`rounded-r-md`, `ease-default`) via `src/index.css`'s `@theme` block.

| Token        | Value                                     |
|--------------|-------------------------------------------|
| Primary      | `#E54A13`                                 |
| Dark BG      | `#09090B`                                 |
| Font         | Inter                                     |
| Easing       | `cubic-bezier(0.16, 1, 0.3, 1)`           |

## Notes

- This is a frontend-only app. The `/api/v1/*` mock endpoints in
  `server.ts` exist for future expansion and are not used by the React
  app — every entity lives in `localStorage`.
- Legacy `sylens_*` localStorage keys are migrated to `billables_*`
  on first load (see `src/lib/persistence.ts`).
- All timestamps use the visitor's local clock; no timezone hardcoding.

## License

Apache-2.0
