import { OsimMeeting, OsimMeetingAttendee, OsimMeetingActionItem, OsimMeetingStatus } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * Format nomor Berita Acara Notulen Rapat OSIM otomatis
 * Contoh: 01/BA-NOTULEN/OSIM/X/2026
 */
export function generateMeetingDocNumber(sequenceNumber: number, dateStr: string): string {
  const pad = String(Math.max(1, sequenceNumber)).padStart(2, '0');
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
    isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth()
  ] || 'X';

  return `${pad}/BA-NOTULEN/OSIM/${monthRoman}/${year}`;
}

/**
 * Format notulen rapat menjadi teks terstruktur rapi untuk disalin (WhatsApp / Laporan)
 */
export function formatMeetingForClipboard(m: OsimMeeting, schoolName: string = 'MADRASAH ALIYAH NEGERI'): string {
  const attendeesList = Array.isArray(m.attendees) && m.attendees.length > 0
    ? m.attendees.map((a, i) => `   ${i + 1}. ${a.name} (${a.roleOrPosition}) - [${a.presentStatus}]`).join('\n')
    : `   (Total Hadir: ${m.attendeesCount || 0} peserta)`;

  const actionItemsList = Array.isArray(m.actionItems) && m.actionItems.length > 0
    ? m.actionItems.map((item, i) => `   ${i + 1}. ${item.task} (PJ: ${item.assignee}${item.deadline ? ` | Batas: ${item.deadline}` : ''}) [${item.status}]`).join('\n')
    : '   -';

  return `*BERITA ACARA & NOTULENSI RAPAT OSIM*
*${schoolName.toUpperCase()}*
No. Dokumen: ${m.meetingNumber || '-'}

📌 *Agenda/Topik:* ${m.title}
🏷 *Jenis Rapat:* ${m.type}
📅 *Hari/Tanggal:* ${m.date}
⏰ *Waktu:* ${m.startTime} - ${m.endTime} WIB
📍 *Tempat:* ${m.location}
👤 *Pimpinan Rapat:* ${m.leader} ${m.leaderPosition ? `(${m.leaderPosition})` : ''}
✍️ *Notulis (Sekretaris):* ${m.secretary}

==============================
📋 *AGENDA PEMBAHASAN:*
${m.agenda || '-'}

==============================
💡 *HASIL KEPUTUSAN / MUSYAWARAH:*
${m.decisionNotes || '-'}

==============================
🎯 *TINDAK LANJUT & PEMBAGIAN TUGAS:*
${actionItemsList}

==============================
👥 *DAFTAR HADIR:*
${attendeesList}

==============================
Status: ${m.status || 'Draft'}
${m.wakaNotes ? `Catatan Pembina: "${m.wakaNotes}"\n` : ''}${m.approvedBy ? `Disahkan oleh: ${m.approvedBy} (${m.approvedAt || '-'})\n` : ''}
_Dicatat resmi melalui SIM Kesiswaan - Modul BPH Sekretaris OSIM_`;
}

/**
 * Fetch seluruh notulen rapat OSIM dari Firestore
 */
export async function fetchOsimMeetingsFromFirestore(): Promise<OsimMeeting[]> {
  try {
    const q = query(collection(db, 'osim_meetings'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const results: OsimMeeting[] = [];
    snap.forEach(d => {
      const data = d.data() as OsimMeeting;
      if (!data.isDeleted) {
        results.push({ ...data, id: d.id });
      }
    });
    return results;
  } catch (e) {
    console.warn('fetchOsimMeetingsFromFirestore fallback to default query:', e);
    const snap = await getDocs(collection(db, 'osim_meetings'));
    const results: OsimMeeting[] = [];
    snap.forEach(d => {
      const data = d.data() as OsimMeeting;
      if (!data.isDeleted) {
        results.push({ ...data, id: d.id });
      }
    });
    return results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
}

/**
 * Validasi isian notulen sebelum disimpan
 */
export function validateOsimMeetingPayload(data: Partial<OsimMeeting>): { isValid: boolean; error?: string } {
  if (!data.title || !data.title.trim()) {
    return { isValid: false, error: 'Judul/agenda rapat wajib diisi.' };
  }
  if (!data.date) {
    return { isValid: false, error: 'Tanggal pelaksanaan rapat wajib diisi.' };
  }
  if (!data.leader || !data.leader.trim()) {
    return { isValid: false, error: 'Nama pimpinan rapat wajib diisi.' };
  }
  if (!data.secretary || !data.secretary.trim()) {
    return { isValid: false, error: 'Nama notulis (BPH Sekretaris) wajib diisi.' };
  }
  if (!data.decisionNotes || !data.decisionNotes.trim()) {
    return { isValid: false, error: 'Hasil keputusan rapat wajib diisi.' };
  }
  return { isValid: true };
}
