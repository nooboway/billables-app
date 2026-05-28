import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Building2, Pencil, Trash2, X } from 'lucide-react';
import type { Workspace } from '../types';

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
  const activeName = active?.businessDetails?.name || 'Workspace';

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
        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-xs">
          {activeName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold text-stone-900 truncate tracking-tight">{activeName}</div>
          <div className="text-[10px] text-stone-400 font-mono tracking-wider uppercase">Workspace</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border border-stone-200 shadow-2xl z-50 overflow-hidden"
        >
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                {mode === 'add' ? 'New Workspace' : mode === 'manage' ? 'Manage' : 'Switch Workspace'}
              </span>
            </div>
            {mode !== 'list' && (
              <button onClick={() => setMode('list')} className="text-stone-400 hover:text-stone-900">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {mode === 'list' && (
            <>
              <ul className="max-h-72 overflow-y-auto p-2 space-y-1">
                {workspaces.map(ws => {
                  const isActive = ws.id === activeId;
                  const name = ws.businessDetails?.name || 'Untitled';
                  return (
                    <li key={ws.id}>
                      <button
                        onClick={() => { setActiveId(ws.id); setOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-stone-50 text-stone-700'}`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-primary text-white' : 'bg-stone-200 text-stone-600'}`}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{name}</div>
                        </div>
                        {isActive && <Check className="w-4 h-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-stone-100 flex bg-stone-50">
                <button
                  onClick={() => setMode('add')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
                <div className="w-px bg-stone-200" />
                <button
                  onClick={() => setMode('manage')}
                  className="flex-1 py-3 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Manage
                </button>
              </div>
            </>
          )}

          {mode === 'add' && (
            <div className="p-4 bg-stone-50">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                Business Name
              </label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm bg-white"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setMode('list')} className="px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-900">Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {mode === 'manage' && (
            <ul className="max-h-80 overflow-y-auto p-2 space-y-1">
              {workspaces.map(ws => {
                const name = ws.businessDetails?.name || 'Untitled';
                const isOnly = workspaces.length === 1;
                const editing = renameId === ws.id;
                return (
                  <li key={ws.id} className="p-2 rounded-lg hover:bg-stone-50 group">
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
                          className="flex-1 px-2 py-1 rounded border border-stone-200 text-sm outline-none bg-white"
                        />
                        <button onClick={commitRename} className="px-2 py-1 bg-stone-900 text-white rounded text-xs font-bold">Save</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate text-stone-800">
                            {name} {ws.id === activeId && <span className="text-[9px] ml-2 px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-600 uppercase tracking-wider">Active</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => { setRenameId(ws.id); setRenameValue(name); }}
                          className="p-1.5 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isOnly}
                          onClick={() => {
                            if (isOnly) return;
                            if (confirm(`Delete "${name}"? This cannot be undone.`)) {
                              removeWorkspace(ws.id);
                            }
                          }}
                          className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
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
