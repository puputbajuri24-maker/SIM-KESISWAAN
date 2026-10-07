import React, { useState } from 'react';
import {
  Megaphone,
  Pin,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Announcement } from '../../types';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { AnnouncementModal } from './AnnouncementModal';
import { AnnouncementListModal } from './AnnouncementListModal';

interface AnnouncementDashboardWidgetProps {
  onNavigate?: (tabId: string) => void;
}

export const AnnouncementDashboardWidget: React.FC<AnnouncementDashboardWidgetProps> = ({ onNavigate }) => {
  const { announcements } = useSchool();
  const { currentUser, isPembina, isPembinaOsim, isPembinaEkskul, isGuruBK, isWakaOrAdmin } = useAuth();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Filter announcements for current user
  const relevantAnnouncements = (announcements || []).filter(ann => {
    if (!ann || ann.isActive === false) return false;
    const target = (ann.targetRole || '').toLowerCase();
    if (target.includes('semua')) return true;
    if (isPembina || isPembinaOsim || isPembinaEkskul) {
      if (target.includes('pembina') || target.includes('osim') || target.includes('ekskul')) return true;
    }
    if (isGuruBK) {
      if (target.includes('bk') || target.includes('konseling')) return true;
    }
    if (isWakaOrAdmin) {
      if (target.includes('waka') || target.includes('admin')) return true;
    }
    return false;
  });

  if (relevantAnnouncements.length === 0) {
    return null;
  }

  // Sort: pinned first, then by priority (urgent > high > normal > low), then by date
  const priorityOrder: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
  const sorted = [...relevantAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const pA = priorityOrder[a.priority || 'normal'] || 2;
    const pB = priorityOrder[b.priority || 'normal'] || 2;
    if (pA !== pB) return pB - pA;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const featured = sorted[0];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-700 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            URGENT / SEGERA
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            PENTING
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-bold">
            INFO TAMBAHAN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-[10px] font-bold flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            INFORMASI
          </span>
        );
    }
  };

  return (
    <>
      <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    PENGUMUMAN & INSTRUKSI RESMI KESISWAAN
                  </span>
                  {featured.isPinned && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[9px] font-mono font-bold flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> PINNED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              {getPriorityBadge(featured.priority)}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline flex items-center gap-1 ml-1"
              >
                <span>Lihat Semua ({relevantAnnouncements.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="truncate">{featured.title}</span>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Target: {featured.targetRole}
                </span>
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed font-sans">
                {featured.content}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>Oleh: <strong className="text-slate-900 dark:text-slate-200 font-bold">{featured.authorName}</strong> ({featured.authorRole})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>Tanggal: <strong className="text-slate-900 dark:text-slate-200 font-bold">{featured.createdAt}</strong></span>
                </div>
                {featured.attachmentUrl && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <FileText className="w-3 h-3" />
                    <span>Lampiran Tersedia</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => {
                  setSelectedAnnouncement(featured);
                  setIsDetailModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs hover:scale-102"
              >
                <span>BACA DETAIL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAnnouncement(null);
          }}
        />
      )}

      {/* All List Modal */}
      <AnnouncementListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        announcements={announcements || []}
        readAnnouncementIds={[]}
        onMarkAsRead={() => {}}
        onMarkAllAsRead={() => {}}
      />
    </>
  );
};
