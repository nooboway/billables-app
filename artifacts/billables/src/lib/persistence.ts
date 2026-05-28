/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local-storage persistence helpers + one-shot migration from the
 * legacy `sylens_*` keys to the new `billables_*` keys.
 *
 * The legacy keys were left over from when this app was generated as
 * "SYLENS LIMITED" inside Google AI Studio. Migration runs once on
 * module load; afterwards everything reads/writes the new namespace.
 */

import { useEffect, useState } from 'react';

const KEY_PREFIX = 'billables_';

const LEGACY_KEY_MAP: Record<string, string> = {
  sylens_business:       KEY_PREFIX + 'business',
  sylens_bank:           KEY_PREFIX + 'bank',
  sylens_vat:            KEY_PREFIX + 'vat',
  sylens_template:       KEY_PREFIX + 'template',
  sylens_invoices:       KEY_PREFIX + 'invoices',
  sylens_products:       KEY_PREFIX + 'products',
  sylens_services:       KEY_PREFIX + 'services',
  sylens_expenses:       KEY_PREFIX + 'expenses',
  sylens_notifications:  KEY_PREFIX + 'notifications',
};

const MIGRATION_FLAG_V1 = KEY_PREFIX + 'migrated_v1';
const MIGRATION_FLAG_V2 = KEY_PREFIX + 'migrated_v2';

/** v1: rename `sylens_*` → `billables_*`. Idempotent via flag. */
function runMigrationV1(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_V1)) return;
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
      const existing = localStorage.getItem(oldKey);
      if (existing !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, existing);
      }
      localStorage.removeItem(oldKey);
    }
    localStorage.setItem(MIGRATION_FLAG_V1, '1');
  } catch {
    // Private mode / quota exceeded — silently bail. Reads & writes
    // below all fall back to defaults if storage is unavailable.
  }
}

/**
 * v2: introduce workspaces.
 *
 * Pre-v2 the app had a single business identity at `billables_business`
 * (+ bank/vat/template) and flat entity pools at `billables_invoices`,
 * `billables_products`, etc.
 *
 * Post-v2 each workspace owns its own identity AND its own scoped
 * entity pools at `billables_invoices_<wsId>`, etc. The migration
 * wraps the existing flat data into workspace `ws_1` and copies the
 * entity arrays into the scoped keys. The flat keys are LEFT IN PLACE
 * for one release as a safety net — a future cleanup commit will
 * remove them.
 */
const SCOPED_ENTITY_KEYS = ['invoices', 'products', 'services', 'expenses', 'notifications'] as const;
const SEED_WS_ID = 'ws_1';

function runMigrationV2(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_V2)) return;
    if (localStorage.getItem(KEY_PREFIX + 'workspaces')) {
      localStorage.setItem(MIGRATION_FLAG_V2, '1');
      return;
    }

    const readRaw = (n: string) => localStorage.getItem(KEY_PREFIX + n);

    const workspace = {
      id: SEED_WS_ID,
      businessDetails:  readRaw('business') ? JSON.parse(readRaw('business')!)  : null,
      bankAccount:      readRaw('bank')     ? JSON.parse(readRaw('bank')!)      : null,
      vatSettings:      readRaw('vat')      ? JSON.parse(readRaw('vat')!)       : null,
      templateSettings: readRaw('template') ? JSON.parse(readRaw('template')!)  : null,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(KEY_PREFIX + 'workspaces', JSON.stringify([workspace]));
    localStorage.setItem(KEY_PREFIX + 'active_workspace', SEED_WS_ID);

    for (const key of SCOPED_ENTITY_KEYS) {
      const flat = readRaw(key);
      const scoped = readRaw(`${key}_${SEED_WS_ID}`);
      if (flat !== null && scoped === null) {
        localStorage.setItem(KEY_PREFIX + `${key}_${SEED_WS_ID}`, flat);
      }
    }

    localStorage.setItem(MIGRATION_FLAG_V2, '1');
  } catch {
    // ignore
  }
}

runMigrationV1();
runMigrationV2();

/** Namespaced key builder for direct localStorage reads/writes. */
export const k = (name: string): string => KEY_PREFIX + name;

/** Read + JSON-parse a key, returning `fallback` on miss or parse error. */
export function readJSON<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k(name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-serialise and write. Silent on failure. */
export function writeJSON(name: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(k(name), JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * React hook: useState that syncs to localStorage under the billables_
 * namespace. Reads on mount, writes on every change. Functions as a
 * drop-in replacement for the inline `useState(() => JSON.parse(...))`
 * pattern that used to be sprinkled across App.tsx.
 */
export function useLocalStorage<T>(name: string, fallback: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => readJSON(name, fallback));
  useEffect(() => { writeJSON(name, state); }, [name, state]);
  return [state, setState];
}
