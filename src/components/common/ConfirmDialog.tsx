import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRM_ACTION',
  cancelText = 'CANCEL',
  variant = 'danger',
  isLoading = false
}) => {
  const iconConfig = {
    danger: { icon: Trash2, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
    warning: { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    info: { icon: HelpCircle, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    success: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
  }[variant];

  const btnColor = {
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-orange-600 hover:bg-orange-500 text-white',
    info: 'bg-blue-600 hover:bg-blue-500 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white'
  }[variant];

  const IconComponent = iconConfig.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-mono text-zinc-400 bg-[#161618] border border-[#27272a] rounded hover:border-zinc-700 hover:text-zinc-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`px-3 py-1 text-xs font-mono rounded font-semibold transition-all ${btnColor} disabled:opacity-50`}
          >
            {isLoading ? 'PROCESSING...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-1">
        <div className={`p-2 rounded border ${iconConfig.color} shrink-0`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans pt-0.5">
          {message}
        </p>
      </div>
    </Modal>
  );
};
