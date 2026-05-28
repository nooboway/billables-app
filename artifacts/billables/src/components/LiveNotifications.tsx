import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, ChevronDown, X } from 'lucide-react';
import { Notification } from '../types';
import { useLocalStorage } from '../lib/persistence';

interface LiveNotificationsProps {
  notifications: Notification[];
  onClearNotifications: () => void;
}

export default function LiveNotifications({
  notifications,
  onClearNotifications,
}: LiveNotificationsProps) {
  const [collapsed, setCollapsed] = useLocalStorage<boolean>('activity_collapsed', false);
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full font-sans">
        {visibleToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-stone-100 border border-stone-200 rounded-xl p-4 shadow-xl flex items-start gap-3 backdrop-blur-md animate-slide-up hover:border-stone-300 transition-all cursor-pointer relative"
          >
            <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-xs text-stone-900">{toast.title}</span>
                <span className="text-[10px] text-stone-500 tabular-nums">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setVisibleToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-stone-500 hover:text-stone-900 shrink-0 ml-1 hover:bg-stone-200 p-1 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-xl w-full shadow-sm">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors rounded-t-xl"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-stone-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Activity Feed
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20 tabular-nums">
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
          <div className="px-4 pb-4">
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs italic">
                  Systems nominal. No recent activity.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 bg-white border border-stone-200 rounded-lg flex gap-3 items-start hover:bg-stone-50 transition-all text-xs"
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-bold text-stone-900 text-xs truncate">{notif.title}</p>
                        <span className="text-[9px] text-stone-400 shrink-0 ml-2 tabular-nums">{notif.timestamp}</span>
                      </div>
                      <p className="text-stone-500 leading-relaxed text-[11px] break-words">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-200 text-right">
                <button
                  onClick={onClearNotifications}
                  className="text-[10px] text-stone-500 hover:text-stone-900 font-bold uppercase"
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
