/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Multi-business support. Each workspace is one business — its own
 * identity (BusinessDetails/Bank/VAT/template) and its own pool of
 * invoices, products, services, expenses, notifications.
 *
 * Storage model:
 *  - `billables_workspaces`           → Workspace[]  (identity + meta)
 *  - `billables_active_workspace`     → string       (active id)
 *  - `billables_<entity>_<wsId>`      → entity array, scoped by ws
 *
 * Switching active workspace re-points which scoped key the per-entity
 * hooks read from. Root.tsx keys the App subtree on the active
 * workspace id so the data hooks re-initialise cleanly on switch.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage, readJSON, writeJSON } from './persistence';
import {
  Workspace,
  BusinessDetails,
  BankAccount,
  VatSettings,
  TemplateSettings,
} from '../types';
import {
  INITIAL_WORKSPACES,
  SEED_WORKSPACE_ID,
  INITIAL_BUSINESS_DETAILS,
  INITIAL_BANK_ACCOUNT,
  INITIAL_VAT_SETTINGS,
  INITIAL_TEMPLATE_SETTINGS,
} from '../initialData';

/** Generate a short, unique workspace id like "ws_a8f3b1". */
function newWorkspaceId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `ws_${rand}`;
}

/** Builds a fresh empty workspace with the supplied display name. */
export function makeWorkspace(name: string): Workspace {
  return {
    id: newWorkspaceId(),
    businessDetails: { ...INITIAL_BUSINESS_DETAILS, name, logoUrl: undefined, signatureUrl: undefined },
    bankAccount:     { ...INITIAL_BANK_ACCOUNT, accountHolder: name },
    vatSettings:     { ...INITIAL_VAT_SETTINGS },
    templateSettings:{ ...INITIAL_TEMPLATE_SETTINGS },
    createdAt: new Date().toISOString(),
  };
}

/** Central workspace store + active selector. */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>('workspaces', INITIAL_WORKSPACES);
  const [activeId, setActiveId] = useLocalStorage<string>('active_workspace', SEED_WORKSPACE_ID);

  // Self-healing: if the stored active id no longer exists (e.g. user
  // deleted the workspace in another tab), fall back to the first one.
  const safeActiveId = useMemo(() => {
    if (workspaces.find(w => w.id === activeId)) return activeId;
    return workspaces[0]?.id ?? SEED_WORKSPACE_ID;
  }, [workspaces, activeId]);

  const active = useMemo(
    () => workspaces.find(w => w.id === safeActiveId) ?? workspaces[0],
    [workspaces, safeActiveId],
  );

  const addWorkspace = useCallback((name: string): Workspace => {
    const ws = makeWorkspace(name || 'New business');
    setWorkspaces(prev => [...prev, ws]);
    setActiveId(ws.id);
    return ws;
  }, [setWorkspaces, setActiveId]);

  const updateWorkspace = useCallback((id: string, patch: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => (w.id === id ? { ...w, ...patch } : w)));
  }, [setWorkspaces]);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces(prev => prev.map(w => (
      w.id === id
        ? { ...w, businessDetails: { ...w.businessDetails, name } }
        : w
    )));
  }, [setWorkspaces]);

  const removeWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== id);
      // Refuse to delete the last one — UI should also enforce this.
      return next.length === 0 ? prev : next;
    });
    if (id === activeId) {
      const fallback = workspaces.find(w => w.id !== id);
      if (fallback) setActiveId(fallback.id);
    }
    // Wipe the deleted workspace's scoped entity pools so they don't
    // sit orphaned in localStorage forever.
    try {
      for (const name of ['invoices', 'products', 'services', 'expenses', 'notifications']) {
        localStorage.removeItem(`billables_${name}_${id}`);
      }
    } catch { /* ignore */ }
  }, [setWorkspaces, setActiveId, activeId, workspaces]);

  return {
    workspaces,
    activeId: safeActiveId,
    active,
    setActiveId,
    addWorkspace,
    updateWorkspace,
    renameWorkspace,
    removeWorkspace,
  };
}

/**
 * Workspace-scoped localStorage hook. Reads/writes
 * `billables_<name>_<activeId>`. When `activeId` changes (user
 * switched business), the hook re-loads state from the new key
 * synchronously before paint so the UI never flashes stale data.
 *
 * The write effect is gated on lastKey matching the current key so a
 * mid-switch render can't accidentally persist the previous
 * workspace's state under the new key.
 */
export function useScopedLocalStorage<T>(
  name: string,
  activeId: string,
  fallback: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const key = `${name}_${activeId}`;
  const [state, setState] = useState<T>(() => readJSON(key, fallback));
  const lastKey = useRef(key);

  // Reload on workspace switch, pre-paint to avoid flicker.
  useLayoutEffect(() => {
    if (lastKey.current !== key) {
      setState(readJSON(key, fallback));
      lastKey.current = key;
    }
    // fallback identity is allowed to change across renders; we don't
    // re-read on that — only on key change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on state change, but only if the key matches what we
  // loaded for. Prevents a stale write into the new workspace's key
  // on the render between switch and reload.
  useEffect(() => {
    if (lastKey.current === key) writeJSON(key, state);
  }, [key, state]);

  return [state, setState];
}

/** Per-workspace identity helpers — these update the workspace object
 *  in `billables_workspaces` rather than the legacy flat keys. */
export function useWorkspaceIdentity(
  active: Workspace,
  updateWorkspace: (id: string, patch: Partial<Workspace>) => void,
) {
  const setBusinessDetails = useCallback((next: BusinessDetails | ((p: BusinessDetails) => BusinessDetails)) => {
    const value = typeof next === 'function' ? (next as any)(active.businessDetails) : next;
    updateWorkspace(active.id, { businessDetails: value });
  }, [active.id, active.businessDetails, updateWorkspace]);

  const setBankAccount = useCallback((next: BankAccount | ((p: BankAccount) => BankAccount)) => {
    const value = typeof next === 'function' ? (next as any)(active.bankAccount) : next;
    updateWorkspace(active.id, { bankAccount: value });
  }, [active.id, active.bankAccount, updateWorkspace]);

  const setVatSettings = useCallback((next: VatSettings | ((p: VatSettings) => VatSettings)) => {
    const value = typeof next === 'function' ? (next as any)(active.vatSettings) : next;
    updateWorkspace(active.id, { vatSettings: value });
  }, [active.id, active.vatSettings, updateWorkspace]);

  const setTemplateSettings = useCallback((next: TemplateSettings | ((p: TemplateSettings) => TemplateSettings)) => {
    const value = typeof next === 'function' ? (next as any)(active.templateSettings) : next;
    updateWorkspace(active.id, { templateSettings: value });
  }, [active.id, active.templateSettings, updateWorkspace]);

  return { setBusinessDetails, setBankAccount, setVatSettings, setTemplateSettings };
}
