import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone,
  AlertTriangle,
  Flame,
  Info,
  CheckCircle2,
  Calendar,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { Announcement } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface AnnouncementPopupModalProps {
  announcements: Announcement[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (announcementId: string) => void;
  onMarkAllAsRead: () => void;
}

export const AnnouncementPopupModal: React.FC<AnnouncementPopupModalProps> = ({
  announcements,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const { currentUser } = useAuth();
  const { schoolSetting } = useSchool();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !announcements || announcements.length === 0 || typeof document === 'undefined') {
    return null;
  }

  const safeIndex = Math.min(currentIndex, announcements.length - 1);
  const currentAnn = announcements[safeIndex];

  const handleNext = () => {
    if (safeIndex < announcements.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const handleAcknowledgeCurrent = () => {
    if (currentAnn) {
      onMarkAsRead(currentAnn.id);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Mendesak':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold tracking-wide animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            PRIORITAS MENDESAK
          </span>
        );
      case 'Penting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            PENTING / PERHATIAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold tracking-wide">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            INFORMASI RESMI
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto font-sans">
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center pointer-events-none">
        <div
          className="relative w-full max-w-xl bg-[#111114] border border-[#2d2d34] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans my-6 pointer-events-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Header Accent */}
        <div
          className={`h-1.5 w-full ${
            currentAnn.priority === 'Mendesak'
              ? 'bg-gradient-to-r from-red-500 via-amber-500 to-red-600'
              : currentAnn.priority === 'Penting'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
              : 'bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-600'
          }`}
        />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] bg-[#16161a] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  PENGUMUMAN DARI KESISWAAN
                </span>
                {announcements.length > 1 && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-[#222228] px-2 py-0.5 rounded-full border border-[#2e2e36]">
                    {safeIndex + 1} dari {announcements.length}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-zinc-300 mt-0.5">
                {schoolSetting?.name || 'MADRASAH ALIYAH NEGERI'}
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a] transition-colors"
            title="Tutup Sementara"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Announcement Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Target & Priority Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#222226]">
            <div>{getPriorityBadge(currentAnn.priority)}</div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-[#1e1e24] text-zinc-300 border border-[#2a2a32]">
                Target: <strong>{currentAnn.targetRole}</strong>
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug tracking-tight">
              {currentAnn.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Tanggal: {currentAnn.publishDate}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Oleh: <strong className="text-zinc-200">{currentAnn.authorName}</strong> ({currentAnn.authorRole || 'Pimpinan Kesiswaan'})
                </span>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="p-4 rounded-xl bg-[#18181c] border border-[#2a2a32] text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-sans shadow-inner">
            {currentAnn.content}
          </div>

          {/* Attachment Link if present */}
          {currentAnn.attachmentUrl && (
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-blue-300">
                <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium truncate max-w-[280px]">
                  {currentAnn.attachmentName || 'Dokumen / Tautan Lampiran'}
                </span>
              </div>
              <a
                href={currentAnn.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 shrink-0"
              >
                <span>Buka Tautan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Target User Greetings / Note */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start space-x-2.5 text-[11px] text-emerald-300 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span>
                Pesan ini ditujukan untuk <strong>{currentUser?.displayName}</strong> ({currentUser?.role === 'guru_bk' ? 'Guru BK' : currentUser?.role === 'pembina_osim' ? 'Pembina OSIM' : 'Guru Pembina'}). Klik <em>"Saya Mengerti & Tandai Telah Dibaca"</em> agar notifikasi popup ini tidak berulang.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="p-4 sm:p-5 border-t border-[#27272a] bg-[#16161a] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Stepper Navigation */}
          {announcements.length > 1 ? (
            <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0}
                className="p-1.5 rounded-lg bg-[#222228] border border-[#2e2e36] text-zinc-300 hover:bg-[#2c2c34] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Pengumuman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-zinc-400 px-2">
                {safeIndex + 1} / {announcements.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={safeIndex === announcements.length - 1}
                className="p-1.5 rounded-lg bg-[#222228] border border-[#2e2e36] text-zinc-300 hover:bg-[#2c2c34] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Pengumuman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Tutup Sementara
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {announcements.length > 1 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-3 py-2 rounded-xl bg-[#222228] hover:bg-[#2d2d34] border border-[#2e2e36] text-xs font-semibold text-zinc-300 transition-colors"
              >
                Tandai Semua Dibaca
              </button>
            )}
            <button
              type="button"
              onClick={handleAcknowledgeCurrent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Saya Mengerti & Tandai Telah Dibaca</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
