import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  size
}) => {
  const resolvedMaxWidth = maxWidth || size || 'lg';
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidthMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  const maxWidthClass = maxWidthMap[resolvedMaxWidth] || (resolvedMaxWidth.startsWith('max-w-') ? resolvedMaxWidth : 'max-w-lg');

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity cursor-pointer pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Alignment Container */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center pointer-events-none">
        <div
          className={`relative z-10 w-full ${maxWidthClass} bg-white dark:bg-[#111318] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-2xl text-left transform transition-all flex flex-col max-h-[90vh] pointer-events-auto my-6`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161922] rounded-t-2xl shrink-0">
            <div className="min-w-0 pr-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5 line-clamp-1 font-medium">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors shrink-0"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-slate-800 dark:text-slate-200 text-xs flex-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161922] rounded-b-2xl flex items-center justify-end gap-2 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
