/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Activity panel. Renders real notifications emitted by the app
 * (invoice created, payment marked, settings saved, PDF errors, etc).
 * The fake simulated-event generator that used to live here has been
 * removed — this is now a true notification hub.
 *
 * The panel is collapsible: users who prefer a cleaner workspace can
 * dock it down to a header bar. Collapse state persists across
 * sessions via localStorage.
 */

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, ChevronDown, X } from 'lucide-react';
import { Notification } from '../types';
import { useLocalStorage } from '../lib/persistence';

interface LiveNotificationsProps {
  notifications: Notification[];
  onAddNotification: (notification: Notification) => void;
  onClearNotifications: () => void;
}

export default function LiveNotifications({
  notifications,
  onClearNotifications,
}: LiveNotificationsProps) {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>('activity_collapsed', false);
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  // Promote any new unread notification into a 4.5s toast. Compares
  // against the visible toasts list so we don't re-toast existing ones.
  useEffect(() => {
    const fresh = notifications.filter(n => !n.read).slice(0, 1);
    if (fresh.length === 0) return;
    const toast = fresh[0];
    setVisibleToasts(prev => (prev.find(t => t.id === toast.id) ? prev : [toast, ...prev].slice(0, 3)));
    const timer = setTimeout(() => {
      setVisibleToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4500);
    return () => clearTimeout(timer);
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />;
      default:
        return <Info className="w-5 h-5 text-[var(--primary)]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Floating toasts — top-right, dismissable */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full font-sans">
        {visibleToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white/95 border border-stone-200 rounded-xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md animate-slide-up hover:border-[var(--primary)] transition-all cursor-pointer relative"
          >
            <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-extrabold text-xs text-stone-900 uppercase font-sans">{toast.title}</span>
                <span className="text-[10px] text-stone-400 tabular-nums">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setVisibleToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-stone-400 hover:text-[var(--primary)] shrink-0 ml-1 hover:bg-orange-50 p-1 rounded-lg transition-all border-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Inline activity panel */}
      <div className="bg-white border border-stone-200 rounded-xl w-full shadow-sm font-sans">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex justify-between items-center px-5 py-3.5 cursor-pointer hover:bg-stone-50/60 transition-colors rounded-t-xl"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 select-none">
              Activity
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-orange-50 text-[var(--primary)] border border-orange-100 tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            strokeWidth={2.4}
          />
        </button>

        {!collapsed && (
          <div className="px-5 pb-4">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs italic">
                  No activity yet. Your invoice events, payment confirmations and settings changes will appear here.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex gap-2.5 items-start hover:bg-stone-100/50 transition-all text-xs"
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5 select-none">
                        <p className="font-bold text-stone-900 text-[10.5px] uppercase truncate">{notif.title}</p>
                        <span className="text-[9px] text-stone-400 shrink-0 ml-2 tabular-nums">{notif.timestamp}</span>
                      </div>
                      <p className="text-stone-600 leading-normal text-[10.5px] break-words">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-stone-200 text-right">
                <button
                  onClick={onClearNotifications}
                  className="text-[10px] text-stone-400 hover:text-[var(--primary)] font-bold uppercase bg-transparent p-0 border-0 cursor-pointer"
                >
                  Clear all ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
