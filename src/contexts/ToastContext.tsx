import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    show: (message: string, type?: ToastType, duration?: number) => void;
  };
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
    error: (msg: string, duration?: number) => showToast(msg, 'error', duration || 5000),
    warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration || 4500),
    info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
    show: showToast
  };

  // Safe window.alert interceptor to prevent accidental thread freezing in iframe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg?: any) => {
        const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
        if (text?.toLowerCase().includes('berhasil') || text?.toLowerCase().includes('sukses')) {
          toast.success(text);
        } else if (text?.toLowerCase().includes('gagal') || text?.toLowerCase().includes('error') || text?.toLowerCase().includes('tidak diizinkan') || text?.toLowerCase().includes('dibatasi')) {
          toast.error(text);
        } else {
          toast.info(text);
        }
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((item) => {
            const isSuccess = item.type === 'success';
            const isError = item.type === 'error';
            const isWarning = item.type === 'warning';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                  isSuccess
                    ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
                    : isError
                    ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/30'
                    : isWarning
                    ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-950/30'
                    : 'bg-slate-900/90 text-slate-100 border-slate-700/60 shadow-slate-950/30'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
                </div>

                <div className="flex-1 text-xs font-medium leading-relaxed whitespace-pre-line break-words">
                  {item.message}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="shrink-0 p-1 rounded-lg text-current opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
                  aria-label="Tutup pemberitahuan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside of provider
    return {
      toast: {
        success: (m) => console.log('[Toast Success]', m),
        error: (m) => console.error('[Toast Error]', m),
        warning: (m) => console.warn('[Toast Warning]', m),
        info: (m) => console.info('[Toast Info]', m),
        show: (m) => console.log('[Toast]', m)
      },
      showToast: (m) => console.log('[Toast]', m)
    };
  }
  return context;
};
