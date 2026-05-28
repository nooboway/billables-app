/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Top-nav dropdown that lets the user switch the active business,
 * spin up a new one, and rename or delete existing ones. Sources of
 * truth live in lib/workspaces.ts.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Building2, Pencil, Trash2, X } from 'lucide-react';
import type { Workspace } from '../types';

/** Props mirror the relevant pieces of useWorkspaces() so the owner
 *  (App.tsx) keeps a single instance of the underlying state. */
interface Props {
  workspaces: Workspace[];
  activeId: string;
  setActiveId: React.Dispatch<React.SetStateAction<string>>;
  addWorkspace: (name: string) => Workspace;
  renameWorkspace: (id: string, name: string) => void;
  removeWorkspace: (id: string) => void;
}

export default function WorkspaceSwitcher({
  workspaces, activeId, setActiveId, addWorkspace, renameWorkspace, removeWorkspace,
}: Props) {

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'add' | 'manage'>('list');
  const [newName, setNewName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active = workspaces.find(w => w.id === activeId) ?? workspaces[0];
  const activeName = active?.businessDetails?.name || 'Your workspace';

  // Click-outside / Escape to dismiss.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset to list view whenever the dropdown closes.
  useEffect(() => { if (!open) { setMode('list'); setRenameId(null); setNewName(''); } }, [open]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addWorkspace(name);
    setNewName('');
    setOpen(false);
  };

  const commitRename = () => {
    if (!renameId) return;
    const name = renameValue.trim();
    if (name) renameWorkspace(renameId, name);
    setRenameId(null);
    setRenameValue('');
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex flex-col items-start group cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold tracking-wide uppercase text-stone-800 group-hover:text-[var(--primary)] transition-colors">
            {activeName}
          </span>
          <ChevronDown className={`w-3 h-3 text-stone-400 group-hover:text-[var(--primary)] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
        </div>
        <span className="text-[8.5px] font-mono text-[var(--primary)] font-extrabold uppercase select-none tracking-widest">
          {workspaces.length > 1 ? `${workspaces.length} workspaces` : 'Workspace Terminal'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} strokeWidth={2.2} />
              <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {mode === 'add' ? 'Add business' : mode === 'manage' ? 'Manage businesses' : 'Your businesses'}
              </span>
            </div>
            {mode !== 'list' && (
              <button onClick={() => setMode('list')} className="text-stone-400 hover:text-stone-700" aria-label="Back">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {mode === 'list' && (
            <>
              <ul className="max-h-72 overflow-y-auto px-1.5 pb-1.5">
                {workspaces.map(ws => {
                  const isActive = ws.id === activeId;
                  const name = ws.businessDetails?.name || 'Untitled business';
                  return (
                    <li key={ws.id}>
                      <button
                        onClick={() => { setActiveId(ws.id); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left hover:bg-[var(--bg-muted)]"
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black"
                          style={{
                            background: isActive ? 'var(--orange-bg)' : 'var(--bg-muted)',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {ws.businessDetails?.email || ws.id}
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4" style={{ color: 'var(--primary)' }} strokeWidth={2.5} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t flex" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setMode('add')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--bg-muted)]"
                  style={{ color: 'var(--primary)' }}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add business
                </button>
                <div className="w-px" style={{ background: 'var(--border)' }} />
                <button
                  onClick={() => setMode('manage')}
                  className="flex-1 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--bg-muted)]"
                  style={{ color: 'var(--text)' }}
                >
                  Manage
                </button>
              </div>
            </>
          )}

          {mode === 'add' && (
            <div className="px-4 pb-4 pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Business name
              </label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="e.g. Acme Studios"
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font)',
                }}
              />
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                You can add bank details, VAT, logo and template later in Settings.
              </p>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setMode('list')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontFamily: 'var(--font)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ fontFamily: 'var(--font)', opacity: newName.trim() ? 1 : 0.5 }}
                >
                  Create & switch
                </button>
              </div>
            </div>
          )}

          {mode === 'manage' && (
            <ul className="max-h-80 overflow-y-auto px-1.5 pb-2">
              {workspaces.map(ws => {
                const name = ws.businessDetails?.name || 'Untitled business';
                const isOnly = workspaces.length === 1;
                const editing = renameId === ws.id;
                return (
                  <li key={ws.id} className="px-2 py-2 rounded-lg">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') { setRenameId(null); setRenameValue(''); }
                          }}
                          className="flex-1 px-2 py-1 rounded text-sm outline-none"
                          style={{
                            background: 'var(--bg-muted)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                        />
                        <button onClick={commitRename} className="btn btn-primary btn-sm">Save</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {name} {ws.id === activeId && <span className="text-[9px] ml-1 uppercase tracking-wider" style={{ color: 'var(--primary)' }}>active</span>}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ws.id}</div>
                        </div>
                        <button
                          title="Rename"
                          onClick={() => { setRenameId(ws.id); setRenameValue(name); }}
                          className="p-1.5 rounded hover:bg-[var(--bg-muted)]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title={isOnly ? 'Cannot delete the only workspace' : 'Delete'}
                          disabled={isOnly}
                          onClick={() => {
                            if (isOnly) return;
                            if (confirm(`Delete "${name}"? Its invoices, products, services, expenses and notifications will also be removed.`)) {
                              removeWorkspace(ws.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: isOnly ? 'var(--text-muted)' : '#dc2626' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
