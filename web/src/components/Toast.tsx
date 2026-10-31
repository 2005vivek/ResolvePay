'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ShieldCheck } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  spotlight?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, spotlight?: boolean) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, spotlight?: boolean) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Auto-trigger spotlight for critical warnings or defended actions
    const shouldSpotlight = spotlight !== undefined 
      ? spotlight 
      : (type === 'warning' || title?.toLowerCase().includes('defended') || title?.toLowerCase().includes('sla'));

    setToasts((prev) => [...prev, { id, type, title, message, spotlight: shouldSpotlight }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const activeSpotlightToast = toasts.find(t => t.spotlight);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* SPOTLIGHT BACKDROP OVERLAY FOR HIGH-PRIORITY WARNINGS / DEFENDED ACTIONS */}
      {activeSpotlightToast && (
        <div 
          onClick={() => dismissToast(activeSpotlightToast.id)}
          className="fixed inset-0 z-50 transition-opacity duration-300 spotlight-active flex flex-col items-center justify-start pt-8 sm:pt-12 px-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-xl rounded-xl border-2 p-5 sm:p-6 shadow-2xl transition-all animate-top-slide cursor-default"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: activeSpotlightToast.type === 'warning' ? 'var(--sla-border)' : 'var(--status-emerald)' 
            }}
          >
            <div className="flex items-start justify-between gap-3.5">
              <div className="flex items-start gap-3.5">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 shadow-inner"
                  style={{
                    backgroundColor: activeSpotlightToast.type === 'warning' ? 'var(--sla-badge-bg)' : 'var(--status-emerald-bg)',
                    color: activeSpotlightToast.type === 'warning' ? 'var(--sla-badge-text)' : 'var(--status-emerald)'
                  }}
                >
                  {activeSpotlightToast.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div 
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 font-mono"
                    style={{
                      backgroundColor: activeSpotlightToast.type === 'warning' ? 'var(--sla-badge-bg)' : 'var(--status-emerald-bg)',
                      color: activeSpotlightToast.type === 'warning' ? 'var(--sla-badge-text)' : 'var(--status-emerald)'
                    }}
                  >
                    {activeSpotlightToast.type === 'warning' ? 'Strict SLA Alert' : 'Dispute Defense Protected'}
                  </div>
                  <h3 className="font-serif-heading text-base sm:text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                    {activeSpotlightToast.title || 'Attention Required'}
                  </h3>
                  <p className="text-xs mt-1.5 leading-relaxed font-sans-body" style={{ color: 'var(--text-secondary)' }}>
                    {activeSpotlightToast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => dismissToast(activeSpotlightToast.id)}
                className="p-1 rounded-md hover:opacity-80 text-base font-bold shrink-0 transition"
                style={{ color: 'var(--foreground)' }}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 pt-3.5 border-t flex items-center justify-end gap-2.5" style={{ borderColor: 'var(--border-color)' }}>
              <button 
                onClick={() => dismissToast(activeSpotlightToast.id)} 
                className="px-3.5 py-1.5 text-xs font-semibold rounded border transition hover:opacity-80"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                Dismiss
              </button>
              <button 
                onClick={() => dismissToast(activeSpotlightToast.id)} 
                className="px-4 py-1.5 text-xs font-bold rounded shadow-sm text-white transition hover:brightness-105"
                style={{ backgroundColor: activeSpotlightToast.type === 'warning' ? '#D97706' : '#059669' }}
              >
                Acknowledge & Protect
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* STANDARD TOP SLIDING TOASTS (Constrained strictly to top and responsive) */}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 sm:right-6 z-40 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.filter(t => !t.spotlight).map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 transition-all duration-300 animate-top-slide"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--foreground)'
            }}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />}
            </div>

            <div className="flex-1 text-xs leading-relaxed font-sans-body">
              {toast.title && (
                <div className="font-bold mb-0.5 font-serif-heading" style={{ color: 'var(--foreground)' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ color: 'var(--text-secondary)' }}>{toast.message}</div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition focus:outline-none"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
