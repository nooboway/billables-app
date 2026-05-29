/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Root router shell. Owns the URL <-> activeScreen sync so that:
 *  - /                 → landing (MarketingHero)
 *  - /overview         → dashboard
 *  - /documents        → invoice list
 *  - /catalogs         → products + services manager
 *  - /reports          → analytics
 *  - /expenses         → expense ledger
 *  - /invoice/:id      → invoice inspector for that id
 *  - anything else     → 404
 *
 * Implementation note — the existing App component owns ALL workspace
 * state (invoices, products, etc) and decides which screen to render
 * based on its own activeScreen + selectedInvoiceId state. Rather than
 * untangle that in one shot, this Root simply translates the URL into
 * the equivalent App props and lets App keep doing its thing. The
 * extraction into per-screen components happens in a later commit.
 */

import { Router, Route, Switch, Redirect, useLocation, useParams } from 'wouter';
import App from './App';
import NotFound from './components/NotFound';
import InvoicePublicView from './components/InvoicePublicView';

// Stable per-screen component references so wouter doesn't remount on
// every parent render (it tracks Route.component by identity, so an
// inline arrow would remount App on every navigation tick).
const LandingScreen   = () => <App initialScreen="landing" />;
const OverviewScreen  = () => <App initialScreen="overview" />;
const DocumentsScreen = () => <App initialScreen="documents" />;
const CatalogsScreen  = () => <App initialScreen="catalogs" />;
const ReportsScreen   = () => <App initialScreen="reports" />;
const ExpensesScreen  = () => <App initialScreen="expenses" />;

function InvoiceRoute() {
  const params = useParams<{ id: string }>();
  return <App initialScreen="documents" initialInvoiceId={params.id ?? null} />;
}

function PreviewRoute() {
  const params = useParams<{ token: string }>();
  return <InvoicePublicView token={params.token ?? ''} />;
}

const DashboardRedirect = () => <Redirect to="/overview" />;
const InvoicesRedirect  = () => <Redirect to="/documents" />;

/** Programmatic navigation hook so child screens can push URL changes
 *  without dragging wouter's useLocation through every prop chain. */
export function useNavigate() {
  const [, setLocation] = useLocation();
  return setLocation;
}

export default function Root() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  return (
    <Router base={base}>
      <Switch>
        <Route path="/"          component={LandingScreen} />
        <Route path="/overview"  component={OverviewScreen} />
        <Route path="/documents" component={DocumentsScreen} />
        <Route path="/catalogs"  component={CatalogsScreen} />
        <Route path="/reports"   component={ReportsScreen} />
        <Route path="/expenses"  component={ExpensesScreen} />
        <Route path="/invoice/:id" component={InvoiceRoute} />
        <Route path="/preview/:token" component={PreviewRoute} />
        {/* Friendly aliases */}
        <Route path="/dashboard" component={DashboardRedirect} />
        <Route path="/invoices"  component={InvoicesRedirect} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}
