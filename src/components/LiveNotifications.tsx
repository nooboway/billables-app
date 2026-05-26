/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, Play, Pause, RefreshCw, X } from 'lucide-react';
import { Notification } from '../types';

interface LiveNotificationsProps {
  notifications: Notification[];
  onAddNotification: (notification: Notification) => void;
  onClearNotifications: () => void;
}

export default function LiveNotifications({
  notifications,
  onAddNotification,
  onClearNotifications,
}: LiveNotificationsProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  // Simulation messages pool
  const SIMULATION_EVENTS = [
    { title: "Invoice Opened", message: "Client Pilot Abubakar viewed Invoice #621 for ₦46,950.00", type: "info" as const },
    { title: "Payment Completed", message: "₦46,950.00 received via e-transfer from MoniePoint", type: "success" as const },
    { title: "Invoice Created", message: "Draft Invoice #622 generated for Dr. Justice - 43,630.00", type: "success" as const },
    { title: "Quote Received", message: "New custom quote request for '8x Packs Detox Tea' from Port Harcourt", type: "info" as const },
    { title: "Inventory Low", message: "Stock level for Deluxe Detox Tea bags dropped below 15 packs", type: "warning" as const },
    { title: "Payment Alert", message: "Partial transfer of ₦10,000.00 initiated by guest sub-agent", type: "alert" as const },
    { title: "Settings Saved", message: "VAT rates modified to 7.5% globally across documents", type: "success" as const },
    { title: "Estimate Accepted", message: "Estimate #032 for alignment therapy approved by Abubakar", type: "success" as const },
  ];

  // Periodic simulation generator
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const randomEvent = SIMULATION_EVENTS[Math.floor(Math.random() * SIMULATION_EVENTS.length)];
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: randomEvent.title,
        message: randomEvent.message,
        type: randomEvent.type,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        read: false,
      };

      onAddNotification(newNotif);

      // Add to visible toasts stack
      setVisibleToasts(prev => [newNotif, ...prev].slice(0, 3));

      // Auto dismiss toast from screen after 4.5 seconds
      setTimeout(() => {
        setVisibleToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 4500);

    }, 11000); // trigger every 11 seconds for fresh activity

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle manual trigger
  const handleManualTrigger = () => {
    const randomEvent = SIMULATION_EVENTS[Math.floor(Math.random() * SIMULATION_EVENTS.length)];
    const newNotif: Notification = {
      id: `notif-manual-${Date.now()}`,
      title: `${randomEvent.title} (Simulated)`,
      message: randomEvent.message,
      type: randomEvent.type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      read: false,
    };

    onAddNotification(newNotif);
    setVisibleToasts(prev => [newNotif, ...prev].slice(0, 3));
    setTimeout(() => {
      setVisibleToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4500);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" id="notif-success-icon" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" id="notif-warning-icon" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-[#E54A13]" id="notif-alert-icon" />;
      default:
        return <Info className="w-5 h-5 text-[#E54A13]" id="notif-info-icon" />;
    }
  };

  return (
    <>
      {/* Floating Active Desktop Toasts (Bottom-Right corner or Top-Right) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full font-sans" id="notification-toasts-container">
        {visibleToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white/95 border border-slate-200 rounded-xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md animate-slide-up hover:border-[#E54A13] transition-all cursor-pointer relative"
          >
            <div className="shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-extrabold text-xs text-slate-900 uppercase font-sans">{toast.title}</span>
                <span className="text-[10px] text-slate-550 text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-650 text-slate-600 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => setVisibleToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-[#E54A13] shrink-0 ml-1 hover:bg-orange-50 p-1 rounded-lg transition-all border-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Control Module and Stream Pane (Inlined or embedded in components) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 w-full shadow-sm font-sans" id="live-stream-control-panel">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-4 h-4 text-[#E54A13]" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E54A13] rounded-full animate-ping" />
              )}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans select-none">
              Live Activity Simulation Streams
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualTrigger}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-[#E54A13] hover:text-[#E54A13] text-slate-600 hover:bg-orange-50/20 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Manually trigger new event"
            >
              <RefreshCw className="w-3 h-3 text-[#E54A13] animate-spin-slow" />
              Simulate Event
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 rounded-lg transition-all cursor-pointer border-0 ${isPlaying ? 'bg-orange-50 text-[#E54A13]' : 'bg-slate-100 text-slate-400'}`}
              title={isPlaying ? "Pause automated stream" : "Play automated stream"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="notifications-stream-list">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-sans italic">
              Waiting for client activity... Try generating an invoice or clicking 'Simulate Event' above.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5 items-start hover:bg-slate-100/50 transition-all text-xs"
              >
                <div className="shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5 select-none">
                    <p className="font-bold text-slate-900 text-[10.5px] uppercase truncate font-sans">{notif.title}</p>
                    <span className="text-[9px] text-slate-400 shrink-0 font-mono ml-2">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 font-sans leading-normal text-[10.5px] break-words">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200 text-right">
            <button
              onClick={onClearNotifications}
              className="text-[10px] text-slate-400 hover:text-[#E54A13] font-sans font-bold uppercase bg-transparent p-0 border-0 cursor-pointer"
            >
              Clear Logs ({notifications.length})
            </button>
          </div>
        )}
      </div>
    </>
  );
}
