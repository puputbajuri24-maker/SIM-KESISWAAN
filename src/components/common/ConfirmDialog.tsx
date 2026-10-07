import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  confirmVariant?: 'danger' | 'warning' | 'info' | 'success' | string;
  danger?: boolean;
  type?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant,
  confirmVariant,
  danger,
  type,
  isLoading = false
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const resolvedVariant: 'danger' | 'warning' | 'info' | 'success' =
    variant ||
    (confirmVariant === 'danger' || confirmVariant === 'warning' || confirmVariant === 'info' || confirmVariant === 'success' ? confirmVariant : undefined) ||
    (danger ? 'danger' : undefined) ||
    (type === 'danger' || type === 'warning' || type === 'info' || type === 'success' ? type : undefined) ||
    'danger';
  const finalConfirmText = confirmLabel || confirmText || 'Konfirmasi';
  const finalCancelText = cancelLabel || cancelText || 'Batal';

  const iconConfig = {
    danger: { icon: Trash2, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    warning: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    info: { icon: HelpCircle, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    success: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
  }[resolvedVariant];

  const btnColor = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 shadow-md',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 shadow-md',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md'
  }[resolvedVariant];

  const IconComponent = iconConfig.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              Promise.resolve().then(async () => {
                try {
                  await onConfirm();
                } catch (err) {
                  console.error('Error on confirm action:', err);
                }
              });
            }}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${btnColor} disabled:opacity-50`}
          >
            {isLoading ? 'Memproses...' : finalConfirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-1">
        <div className={`p-2.5 rounded-xl border ${iconConfig.color} shrink-0`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">
          {message}
        </p>
      </div>
    </Modal>
  );
};
