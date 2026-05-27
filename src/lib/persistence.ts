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

const MIGRATION_FLAG = KEY_PREFIX + 'migrated_v1';

function runMigrationOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
      const existing = localStorage.getItem(oldKey);
      if (existing !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, existing);
      }
      localStorage.removeItem(oldKey);
    }
    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch {
    // Private mode / quota exceeded — silently bail. Reads & writes
    // below all fall back to defaults if storage is unavailable.
  }
}
runMigrationOnce();

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
