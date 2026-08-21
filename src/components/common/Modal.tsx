import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`w-full ${maxWidthClass} bg-[#0d0d0f] rounded border border-[#27272a] shadow-2xl text-left transform transition-all flex flex-col max-h-[92vh]`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[#27272a] bg-[#121215] shrink-0">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-tight">{title}</h3>
              {subtitle && <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded bg-[#161618] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-zinc-300 text-xs">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-2.5 sm:p-3 border-t border-[#27272a] bg-[#121215] flex items-center justify-end gap-2 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
