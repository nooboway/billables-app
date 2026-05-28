/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Accent theming. Each workspace owns a brand color stored on its
 * TemplateSettings.color. applyAccent mutates the global CSS custom
 * properties so every component that reads var(--primary) (and the
 * other accent vars) reskins instantly — no React re-render needed.
 *
 * Ported from the Billables interactive prototype (app/app.jsx).
 */

export interface Accent {
  name: string;
  color: string;
  dark: string;
  light: string;
  soft: string;
  bg: string;
  glow: string;
}

export const ACCENTS: Accent[] = [
  { name: 'Orange',  color: '#E54A13', dark: '#C13A0E', light: '#FF6B3D', soft: '#F08C5A', bg: '#FFF4ED', glow: 'rgba(229,74,19,0.12)' },
  { name: 'Indigo',  color: '#3B5BFF', dark: '#2A48D6', light: '#6580FF', soft: '#7E94FF', bg: '#EEF2FF', glow: 'rgba(59,91,255,0.12)' },
  { name: 'Emerald', color: '#0E9F6E', dark: '#087854', light: '#3CC58E', soft: '#62D7A6', bg: '#ECFDF5', glow: 'rgba(14,159,110,0.12)' },
  { name: 'Plum',    color: '#7C3AED', dark: '#5B25BB', light: '#9F6CF5', soft: '#B791F8', bg: '#F5F3FF', glow: 'rgba(124,58,237,0.12)' },
];

/** Find a preset by its primary hex (case-insensitive); falls back to Orange. */
export function findAccent(hex: string | undefined): Accent {
  if (!hex) return ACCENTS[0];
  return ACCENTS.find(a => a.color.toLowerCase() === hex.toLowerCase()) ?? ACCENTS[0];
}

/** Apply an accent to the document root by mutating CSS custom
 *  properties. Safe to call on every render — it's an O(7) no-op when
 *  the value hasn't changed. */
export function applyAccent(hex: string | undefined): void {
  if (typeof document === 'undefined') return;
  const a = findAccent(hex);
  const r = document.documentElement.style;
  r.setProperty('--primary',       a.color);
  r.setProperty('--primary-dark',  a.dark);
  r.setProperty('--primary-light', a.light);
  r.setProperty('--primary-soft',  a.soft);
  r.setProperty('--orange-bg',     a.bg);     // legacy var name kept for back-compat
  r.setProperty('--primary-glow',  a.glow);
}
