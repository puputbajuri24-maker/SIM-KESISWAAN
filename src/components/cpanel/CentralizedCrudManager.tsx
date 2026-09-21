import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  GraduationCap, 
  Award, 
  HeartHandshake, 
  BookOpen, 
  Phone, 
  Mail, 
  Check, 
  X, 
  Sparkles,
  Lock,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { Teacher, Extracurricular, ExtracurricularMember, OsimMember, UserProfile, UserRole } from '../../types';

interface CentralizedCrudManagerProps {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onUpdateUserRole?: (uid: string, newRole: UserRole) => Promise<void>;
  onOpenRbacMatrix?: () => void;
}

export const CentralizedCrudManager: React.FC<CentralizedCrudManagerProps> = ({
  currentUser,
  allUsers,
  onUpdateUserRole,
  onOpenRbacMatrix
}) => {
  const { 
    teachers, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher,
    extracurriculars,
    addExtracurricular,
    updateExtracurricular,
    deleteExtracurricular,
    members,
    addMember,
    updateMember,
    deleteMember,
    osimMembers,
    addOsimMember,
    updateOsimMember,
    deleteOsimMember,
    students,
    activeAcademicYear
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'teachers' | 'pembina_intra' | 'pembina_ekstra' | 'guru_bk' | 'members'>('teachers');
  const [memberSubTab, setMemberSubTab] = useState<'ekskul' | 'osim'>('ekskul');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ==================== 1. MODAL STATES: TEACHER ====================
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    nip: '',
    gender: 'L' as 'L' | 'P',
    subject: '',
    phone: '',
    email: '',
    role: 'Guru Mata Pelajaran',
    isPembina: false,
    extracurricularName: '',
    status: 'Aktif'
  });

  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      fullName: '',
      nip: '',
      gender: 'L',
      subject: '',
      phone: '',
      email: '',
      role: 'Guru Mata Pelajaran',
      isPembina: false,
      extracurricularName: '',
      status: 'Aktif'
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherForm({
      fullName: t.fullName || '',
      nip: t.nip || '',
      gender: t.gender || 'L',
      subject: t.subject || '',
      phone: t.phone || '',
      email: t.email || '',
      role: t.role || 'Guru Mata Pelajaran',
      isPembina: Boolean(t.isPembina),
      extracurricularName: t.extracurricularName || '',
      status: t.isActive === false ? 'Nonaktif' : 'Aktif'
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName.trim()) {
      alert('Nama guru tidak boleh kosong.');
      return;
    }

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          fullName: teacherForm.fullName.trim(),
          nip: teacherForm.nip.trim(),
          gender: teacherForm.gender,
          subject: teacherForm.subject.trim(),
          phone: teacherForm.phone.trim(),
          email: teacherForm.email.trim(),
          role: teacherForm.role,
          isPembina: teacherForm.isPembina,
          extracurricularName: teacherForm.extracurricularName,
          isActive: teacherForm.status === 'Aktif'
        });
        showToast(`Data dewan guru "${teacherForm.fullName}" berhasil diperbarui.`);
      } else {
        await addTeacher({
          fullName: teacherForm.fullName.trim(),
          nip: teacherForm.nip.trim() || String(Math.floor(1000000000 + Math.random() * 9000000000)),
          gender: teacherForm.gender,
          subject: teacherForm.subject.trim() || 'Mata Pelajaran Umum',
          phone: teacherForm.phone.trim(),
          email: teacherForm.email.trim(),
          role: teacherForm.role,
          isPembina: teacherForm.isPembina,
          extracurricularName: teacherForm.extracurricularName,
          isActive: teacherForm.status === 'Aktif'
        });
        showToast(`Guru baru "${teacherForm.fullName}" berhasil ditambahkan.`);
      }
      setIsTeacherModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data guru.');
    }
  };

  const handleDeleteTeacherConfirm = async (t: Teacher) => {
    if (window.confirm(`Hapus guru "${t.fullName}" dari database master dewan guru? Tindakan ini akan disinkronkan ke seluruh modul terkait.`)) {
      try {
        await deleteTeacher(t.id);
        showToast(`Guru "${t.fullName}" telah berhasil dihapus.`);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data guru.');
      }
    }
  };

  // ==================== 2. MODAL STATES: PEMBINA INTRA (OSIM) ====================
  const [isPembinaIntraModalOpen, setIsPembinaIntraModalOpen] = useState(false);
  const [editingPembinaIntraId, setEditingPembinaIntraId] = useState<string | null>(null);
  const [pembinaIntraForm, setPembinaIntraForm] = useState({
    teacherId: '',
    customName: '',
    position: 'Pembina Utama OSIM',
    phone: '',
    email: '',
    academicYear: activeAcademicYear || '2024/2025'
  });

  const intraPembinaList = useMemo(() => {
    // Teachers with role indicating pembina osim, or users with role pembina_osim
    const list: { id: string; name: string; nip?: string; position: string; phone?: string; email?: string; source: 'teacher' | 'user' }[] = [];
    
    // From Teachers
    teachers.forEach(t => {
      const r = (t.role || '').toLowerCase();
      if (r.includes('osim') || r.includes('kesiswaan') || r.includes('waka') || t.isPembina && (t.extracurricularName || '').toLowerCase().includes('osim')) {
        list.push({
          id: t.id,
          name: t.fullName,
          nip: t.nip,
          position: t.role || 'Pembina OSIM',
          phone: t.phone,
          email: t.email,
          source: 'teacher'
        });
      }
    });

    // From allUsers with role pembina_osim
    allUsers.forEach(u => {
      if (u.role === 'pembina_osim') {
        if (!list.some(item => item.name.toLowerCase() === u.displayName.toLowerCase())) {
          list.push({
            id: u.uid,
            name: u.displayName,
            nip: u.nip,
            position: 'Pembina OSIM (Akun Login)',
            phone: u.phone,
            email: u.email,
            source: 'user'
          });
        }
      }
    });

    if (list.length === 0) {
      // Provide default council from dewan guru if none
      const sample = teachers.slice(0, 2);
      sample.forEach((t, i) => {
        list.push({
          id: t.id,
          name: t.fullName,
          nip: t.nip,
          position: i === 0 ? 'Pembina OSIM Putra' : 'Pembina OSIM Putri',
          phone: t.phone,
          email: t.email,
          source: 'teacher'
        });
      });
    }

    return list;
  }, [teachers, allUsers]);

  const handleOpenAddPembinaIntra = () => {
    setEditingPembinaIntraId(null);
    setPembinaIntraForm({
      teacherId: teachers[0]?.id || '',
      customName: '',
      position: 'Pembina OSIM',
      phone: '',
      email: '',
      academicYear: activeAcademicYear || '2024/2025'
    });
    setIsPembinaIntraModalOpen(true);
  };

  const handleSavePembinaIntra = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = teachers.find(t => t.id === pembinaIntraForm.teacherId);
    const targetName = selectedTeacher ? selectedTeacher.fullName : pembinaIntraForm.customName;

    if (!targetName.trim()) {
      alert('Nama Pembina OSIM harus diisi.');
      return;
    }

    try {
      if (selectedTeacher) {
        await updateTeacher(selectedTeacher.id, {
          role: pembinaIntraForm.position,
          isPembina: true,
          extracurricularName: 'OSIM'
        });
      }
      showToast(`Penugasan "${targetName}" sebagai ${pembinaIntraForm.position} berhasil disahkan.`);
      setIsPembinaIntraModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan penugasan pembina OSIM.');
    }
  };

  // ==================== 3. MODAL STATES: PEMBINA EKSTRAKURIKULER ====================
  const [isEkskulModalOpen, setIsEkskulModalOpen] = useState(false);
  const [editingEkskul, setEditingEkskul] = useState<Extracurricular | null>(null);
  const [ekskulForm, setEkskulForm] = useState({
    name: '',
    category: 'Olahraga' as any,
    description: '',
    coachTeacherId: '',
    coachName: '',
    assistantCoachName: '',
    day: 'Jumat' as any,
    startTime: '15:30',
    endTime: '17:00',
    location: '',
    quota: 30,
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  const handleOpenAddEkskul = () => {
    setEditingEkskul(null);
    setEkskulForm({
      name: '',
      category: 'Olahraga',
      description: '',
      coachTeacherId: teachers[0]?.id || '',
      coachName: teachers[0]?.fullName || '',
      assistantCoachName: '',
      day: 'Jumat',
      startTime: '15:30',
      endTime: '17:00',
      location: 'Lapangan Madrasah',
      quota: 30,
      status: 'Aktif'
    });
    setIsEkskulModalOpen(true);
  };

  const handleOpenEditEkskul = (e: Extracurricular) => {
    setEditingEkskul(e);
    const matchedTeacher = teachers.find(t => t.fullName.toLowerCase() === e.coachName.toLowerCase());
    setEkskulForm({
      name: e.name || '',
      category: e.category || 'Olahraga',
      description: e.description || '',
      coachTeacherId: matchedTeacher ? matchedTeacher.id : '',
      coachName: e.coachName || '',
      assistantCoachName: e.assistantCoachName || '',
      day: e.day || 'Jumat',
      startTime: e.startTime || '15:30',
      endTime: e.endTime || '17:00',
      location: e.location || '',
      quota: e.quota || 30,
      status: e.status || 'Aktif'
    });
    setIsEkskulModalOpen(true);
  };

  const handleSaveEkskul = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekskulForm.name.trim()) {
      alert('Nama Ekstrakurikuler tidak boleh kosong.');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === ekskulForm.coachTeacherId);
    const resolvedCoachName = selectedTeacher ? selectedTeacher.fullName : ekskulForm.coachName;

    try {
      if (editingEkskul) {
        await updateExtracurricular(editingEkskul.id, {
          name: ekskulForm.name.trim(),
          category: ekskulForm.category,
          description: ekskulForm.description,
          coachName: resolvedCoachName,
          assistantCoachName: ekskulForm.assistantCoachName,
          day: ekskulForm.day,
          startTime: ekskulForm.startTime,
          endTime: ekskulForm.endTime,
          location: ekskulForm.location,
          quota: Number(ekskulForm.quota) || 30,
          status: ekskulForm.status
        });
        showToast(`Data ekstrakurikuler & pembina "${ekskulForm.name}" berhasil diperbarui.`);
      } else {
        await addExtracurricular({
          name: ekskulForm.name.trim(),
          category: ekskulForm.category,
          description: ekskulForm.description || `Kegiatan pembinaan minat bakat ${ekskulForm.name}`,
          coachId: selectedTeacher?.id || `c_${Date.now()}`,
          coachName: resolvedCoachName,
          assistantCoachName: ekskulForm.assistantCoachName,
          day: ekskulForm.day,
          startTime: ekskulForm.startTime,
          endTime: ekskulForm.endTime,
          location: ekskulForm.location || 'Kampus Madrasah',
          quota: Number(ekskulForm.quota) || 30,
          memberCount: 0,
          status: ekskulForm.status,
          vision: 'Membentuk generasi berprestasi dan berkarakter mulia.',
          mission: 'Melatih kemampuan, disiplin, dan sportivitas peserta didik.',
          target: 'Juara tingkat kabupaten dan provinsi.',
          academicYear: activeAcademicYear || '2024/2025'
        });
        showToast(`Ekstrakurikuler baru "${ekskulForm.name}" berhasil didaftarkan di cPanel.`);
      }
      setIsEkskulModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan ekstrakurikuler.');
    }
  };

  const handleDeleteEkskulConfirm = async (e: Extracurricular) => {
    if (window.confirm(`Hapus unit ekstrakurikuler "${e.name}" beserta penetapan pembinanya? Tindakan ini terpusat dan permanen.`)) {
      try {
        await deleteExtracurricular(e.id);
        showToast(`Ekstrakurikuler "${e.name}" berhasil dihapus.`);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus ekstrakurikuler.');
      }
    }
  };

  // ==================== 4. MODAL STATES: GURU BK ====================
  const [isBkModalOpen, setIsBkModalOpen] = useState(false);
  const [bkForm, setBkForm] = useState({
    teacherId: teachers[0]?.id || '',
    counselorTitle: 'Koordinator Bimbingan Konseling (BK)',
    roomLocation: 'Ruang BK Lantai 1',
    phone: '',
    email: ''
  });

  const bkTeachersList = useMemo(() => {
    const list: { id: string; name: string; nip?: string; title: string; phone?: string; email?: string }[] = [];
    
    teachers.forEach(t => {
      const isBk = (t.subject || '').toLowerCase().includes('bk') || 
                   (t.subject || '').toLowerCase().includes('bimbingan') || 
                   (t.role || '').toLowerCase().includes('bk') ||
                   (t.role || '').toLowerCase().includes('konseling');
      if (isBk) {
        list.push({
          id: t.id,
          name: t.fullName,
          nip: t.nip,
          title: t.role || 'Guru Bimbingan Konseling',
          phone: t.phone,
          email: t.email
        });
      }
    });

    allUsers.forEach(u => {
      if (u.role === 'guru_bk') {
        if (!list.some(item => item.name.toLowerCase() === u.displayName.toLowerCase())) {
          list.push({
            id: u.uid,
            name: u.displayName,
            nip: u.nip,
            title: 'Guru BK (Akun Login)',
            phone: u.phone,
            email: u.email
          });
        }
      }
    });

    return list;
  }, [teachers, allUsers]);

  const handleOpenAddBk = () => {
    setBkForm({
      teacherId: teachers[0]?.id || '',
      counselorTitle: 'Guru Bimbingan Konseling (BK)',
      roomLocation: 'Ruang BK Madrasah',
      phone: '',
      email: ''
    });
    setIsBkModalOpen(true);
  };

  const handleSaveBk = async (e: React.FormEvent) => {
    e.preventDefault();
    const selTeacher = teachers.find(t => t.id === bkForm.teacherId);
    if (!selTeacher) {
      alert('Pilih guru dari daftar dewan guru.');
      return;
    }

    try {
      await updateTeacher(selTeacher.id, {
        subject: 'Bimbingan Konseling (BK)',
        role: bkForm.counselorTitle
      });

      // Also assign role guru_bk to user if match exists
      const matchedUser = allUsers.find(u => u.displayName.toLowerCase() === selTeacher.fullName.toLowerCase() || (u.nip && u.nip === selTeacher.nip));
      if (matchedUser && onUpdateUserRole) {
        await onUpdateUserRole(matchedUser.uid, 'guru_bk');
      }

      showToast(`Guru "${selTeacher.fullName}" resmi ditetapkan sebagai ${bkForm.counselorTitle}.`);
      setIsBkModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menetapkan Guru BK.');
    }
  };

  // ==================== 5. MODAL STATES: ANGGOTA (EKSKUL & OSIM) ====================
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ExtracurricularMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    studentId: '',
    extracurricularId: extracurriculars[0]?.id || '',
    role: 'Anggota',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    notes: ''
  });

  const [isOsimMemberModalOpen, setIsOsimMemberModalOpen] = useState(false);
  const [editingOsimMember, setEditingOsimMember] = useState<OsimMember | null>(null);
  const [osimMemberForm, setOsimMemberForm] = useState({
    studentId: '',
    position: 'Anggota',
    sekbid: 'Sekbid 1: Keimanan & Ketaqwaan' as any,
    departmentName: 'Seksi Bidang 1'
  });

  const handleOpenAddEkskulMember = () => {
    setEditingMember(null);
    setMemberForm({
      studentId: students[0]?.id || '',
      extracurricularId: extracurriculars[0]?.id || '',
      role: 'Anggota',
      status: 'Aktif',
      notes: ''
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditEkskulMember = (m: ExtracurricularMember) => {
    setEditingMember(m);
    setMemberForm({
      studentId: m.studentId,
      extracurricularId: m.extracurricularId,
      role: (m as any).role || 'Anggota',
      status: m.status || 'Aktif',
      notes: m.notes || ''
    });
    setIsMemberModalOpen(true);
  };

  const handleSaveEkskulMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.extracurricularId) {
      alert('Pilih ekstrakurikuler tujuan.');
      return;
    }

    try {
      const ekskul = extracurriculars.find(e => e.id === memberForm.extracurricularId);
      if (!ekskul) return;

      if (editingMember) {
        await updateMember(editingMember.id, {
          status: memberForm.status,
          notes: memberForm.notes,
          role: memberForm.role
        } as any);
        showToast(`Data keanggotaan "${editingMember.studentName}" berhasil diperbarui.`);
      } else {
        const student = students.find(s => s.id === memberForm.studentId);
        if (!student) {
          alert('Pilih siswa yang akan didaftarkan.');
          return;
        }

        // Check if already registered in this ekskul
        const already = members.some(m => m.studentId === student.id && m.extracurricularId === ekskul.id);
        if (already) {
          alert(`Siswa ${student.fullName} sudah terdaftar dalam ekstrakurikuler ${ekskul.name}.`);
          return;
        }

        await addMember({
          extracurricularId: ekskul.id,
          extracurricularName: ekskul.name,
          studentId: student.id,
          studentCode: student.code,
          studentName: student.fullName,
          studentNis: student.nis,
          studentClass: student.className,
          gender: student.gender,
          joinDate: new Date().toISOString().split('T')[0],
          status: memberForm.status,
          academicYear: activeAcademicYear || '2024/2025',
          notes: memberForm.notes
        });
        showToast(`Siswa "${student.fullName}" berhasil didaftarkan ke ekskul "${ekskul.name}".`);
      }
      setIsMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan anggota ekstrakurikuler.');
    }
  };

  const handleDeleteEkskulMemberConfirm = async (m: ExtracurricularMember) => {
    if (window.confirm(`Hapus keanggotaan "${m.studentName}" dari ekstrakurikuler ${m.extracurricularName}?`)) {
      try {
        await deleteMember(m.id);
        showToast(`Anggota "${m.studentName}" berhasil dihapus.`);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus anggota ekstrakurikuler.');
      }
    }
  };

  const handleOpenAddOsimMember = () => {
    setEditingOsimMember(null);
    setOsimMemberForm({
      studentId: students[0]?.id || '',
      position: 'Anggota',
      sekbid: 'Sekbid 1: Keimanan & Ketaqwaan',
      departmentName: 'Seksi Bidang 1'
    });
    setIsOsimMemberModalOpen(true);
  };

  const handleSaveOsimMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOsimMember) {
        await updateOsimMember(editingOsimMember.id, {
          position: osimMemberForm.position as any,
          sekbid: osimMemberForm.sekbid
        });
        showToast(`Jabatan kabinet "${editingOsimMember.fullName}" berhasil diperbarui.`);
      } else {
        const student = students.find(s => s.id === osimMemberForm.studentId);
        if (!student) {
          alert('Pilih siswa yang akan ditugaskan ke OSIM.');
          return;
        }

        await addOsimMember({
          studentId: student.id,
          studentCode: student.code,
          fullName: student.fullName,
          studentNis: student.nis,
          className: student.className,
          position: osimMemberForm.position as any,
          sekbid: osimMemberForm.sekbid,
          photoUrl: student.photoUrl || '',
          phone: (student as any).phone || '',
          status: 'Aktif',
          period: activeAcademicYear || '2024/2025'
        });
        showToast(`Siswa "${student.fullName}" resmi ditambahkan ke Kabinet OSIM sebagai ${osimMemberForm.position}.`);
      }
      setIsOsimMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan anggota kabinet OSIM.');
    }
  };

  const handleDeleteOsimMemberConfirm = async (om: OsimMember) => {
    if (window.confirm(`Hapus pengurus OSIM "${om.fullName}" (${om.position}) dari struktur kabinet?`)) {
      try {
        await deleteOsimMember(om.id);
        showToast(`Pengurus "${om.fullName}" berhasil dihapus dari kabinet OSIM.`);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus pengurus OSIM.');
      }
    }
  };

  // Filtered lists based on search
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchQ = (t.fullName || '').toLowerCase().includes(q) ||
                     (t.nip || '').includes(q) ||
                     (t.subject || '').toLowerCase().includes(q) ||
                     (t.role || '').toLowerCase().includes(q);
      return matchQ;
    });
  }, [teachers, searchQuery]);

  const filteredEkskuls = useMemo(() => {
    return extracurriculars.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchQ = (e.name || '').toLowerCase().includes(q) ||
                     (e.coachName || '').toLowerCase().includes(q) ||
                     (e.category || '').toLowerCase().includes(q);
      const matchCat = filterCategory === 'all' || e.category === filterCategory;
      return matchQ && matchCat;
    });
  }, [extracurriculars, searchQuery, filterCategory]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchQ = (m.studentName || '').toLowerCase().includes(q) ||
                     (m.studentNis || '').includes(q) ||
                     (m.extracurricularName || '').toLowerCase().includes(q) ||
                     (m.studentClass || '').toLowerCase().includes(q);
      return matchQ;
    });
  }, [members, searchQuery]);

  const filteredOsimMembers = useMemo(() => {
    return osimMembers.filter(om => {
      const q = searchQuery.toLowerCase();
      const matchQ = (om.fullName || '').toLowerCase().includes(q) ||
                     (om.studentNis || '').includes(q) ||
                     (om.position || '').toLowerCase().includes(q) ||
                     (om.sekbid || '').toLowerCase().includes(q);
      return matchQ;
    });
  }, [osimMembers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-900/30 border border-emerald-400/40 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mandatory Centralization Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pusat Kendali Data Master (CRUD Terpusat cPanel)
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Aturan Mutlak Aktif
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                Seluruh operasi <strong>Tambah, Edit, dan Hapus</strong> data Guru Pembina (Intra OSIM, Ekstrakurikuler, BK) dan Anggota (Ekskul & OSIM) dikendalikan secara mutlak dan terpusat di cPanel ini. Modul di luar cPanel ditiadakan fungsi CRUD-nya, <em>kecuali</em> Admin membuka checklist izin pada Matriks Hak Akses Peran.
              </p>
            </div>
          </div>

          {onOpenRbacMatrix && (
            <button
              onClick={onOpenRbacMatrix}
              className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all flex items-center gap-2 shrink-0 hover:border-indigo-400"
            >
              <span>Matriks Hak Akses Peran</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Sub-Menu Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#18181e] text-slate-400 hover:text-slate-200 hover:bg-[#202028]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>1. Master Dewan Guru ({teachers.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('pembina_intra'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pembina_intra'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-[#18181e] text-slate-400 hover:text-slate-200 hover:bg-[#202028]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>2. Pembina Intra (OSIM) ({intraPembinaList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('pembina_ekstra'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'pembina_ekstra'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-[#18181e] text-slate-400 hover:text-slate-200 hover:bg-[#202028]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. Pembina Ekstrakurikuler ({extracurriculars.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('guru_bk'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'guru_bk'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-[#18181e] text-slate-400 hover:text-slate-200 hover:bg-[#202028]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>4. Personel Guru BK ({bkTeachersList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'members'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-[#18181e] text-slate-400 hover:text-slate-200 hover:bg-[#202028]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. Anggota Ekskul & OSIM ({members.length + osimMembers.length})</span>
        </button>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141419] border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={`Cari di ${activeTab === 'teachers' ? 'Dewan Guru' : activeTab === 'pembina_intra' ? 'Pembina OSIM' : activeTab === 'pembina_ekstra' ? 'Ekstrakurikuler' : activeTab === 'guru_bk' ? 'Guru BK' : 'Anggota'}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#1c1c24] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {activeTab === 'teachers' && (
            <button
              onClick={handleOpenAddTeacher}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Guru Baru</span>
            </button>
          )}

          {activeTab === 'pembina_intra' && (
            <button
              onClick={handleOpenAddPembinaIntra}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tetapkan Pembina OSIM</span>
            </button>
          )}

          {activeTab === 'pembina_ekstra' && (
            <button
              onClick={handleOpenAddEkskul}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Unit Ekskul & Pembina</span>
            </button>
          )}

          {activeTab === 'guru_bk' && (
            <button
              onClick={handleOpenAddBk}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tetapkan Guru BK</span>
            </button>
          )}

          {activeTab === 'members' && memberSubTab === 'ekskul' && (
            <button
              onClick={handleOpenAddEkskulMember}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan Anggota Ekskul</span>
            </button>
          )}

          {activeTab === 'members' && memberSubTab === 'osim' && (
            <button
              onClick={handleOpenAddOsimMember}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pengurus OSIM</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TAB CONTENT: MASTER DEWAN GURU */}
      {/* ========================================================= */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121216]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181820] text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap & NIP</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Tugas / Penugasan</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Terpusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTeachers.map(t => (
                  <tr key={t.id} className="hover:bg-[#181822] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{t.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NIP: {t.nip || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.gender === 'P' ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {t.gender || 'L'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {t.subject || 'Guru Mapel'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                          {t.role || 'Guru'}
                        </span>
                        {t.isPembina && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                            Pembina: {t.extracurricularName || 'Ekskul'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {t.phone && <div>📞 {t.phone}</div>}
                      {t.email && <div>✉️ {t.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {t.isActive !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditTeacher(t)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all"
                          title="Edit Guru"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacherConfirm(t)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB CONTENT: PEMBINA INTRA (OSIM) */}
      {/* ========================================================= */}
      {activeTab === 'pembina_intra' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
            <strong>Penetapan Majelis Pembina OSIM Terpusat:</strong> Setiap pembina yang ditetapkan di sini akan otomatis disinkronkan ke struktur organisasi kabinet OSIM, daftar dewan guru, dan menu login pembina.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intraPembinaList.map((p, idx) => (
              <div key={p.id || idx} className="p-4 rounded-2xl bg-[#141419] border border-slate-800 hover:border-amber-500/40 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {p.position}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{p.name}</h4>
                    {p.nip && <div className="text-[11px] text-slate-400 font-mono">NIP: {p.nip}</div>}
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                  {p.phone && <div>📞 {p.phone}</div>}
                  {p.email && <div>✉️ {p.email}</div>}
                  <div className="text-slate-500">Kewenangan: Pengesahan Program, Proposal, & Draf Kegiatan OSIM</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      const selTeacher = teachers.find(t => t.id === p.id);
                      if (selTeacher) handleOpenEditTeacher(selTeacher);
                      else handleOpenAddPembinaIntra();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah Penugasan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB CONTENT: PEMBINA EKSTRAKURIKULER */}
      {/* ========================================================= */}
      {activeTab === 'pembina_ekstra' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121216]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181820] text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Ekstrakurikuler</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Pembina / Pelatih</th>
                  <th className="py-3 px-4">Jadwal & Lokasi</th>
                  <th className="py-3 px-4">Anggota / Kuota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Terpusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredEkskuls.map(e => (
                  <tr key={e.id} className="hover:bg-[#181822] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{e.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{e.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{e.coachName}</div>
                      {e.assistantCoachName && (
                        <div className="text-[10px] text-slate-400">Asisten: {e.assistantCoachName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300">
                      <div>🗓️ {e.day}, {e.startTime} - {e.endTime}</div>
                      <div className="text-slate-400">📍 {e.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{members.filter(m => m.extracurricularId === e.id).length}</span> / {e.quota || 30}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditEkskul(e)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                          title="Edit Ekskul & Pembina"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEkskulConfirm(e)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                          title="Hapus Ekstrakurikuler"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB CONTENT: PERSONEL GURU BK */}
      {/* ========================================================= */}
      {activeTab === 'guru_bk' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200">
            <strong>Penetapan Personel Guru BK Terpusat:</strong> Guru yang ditugaskan sebagai Guru BK akan otomatis diberikan hak akses modul Bimbingan Konseling dan catatan rekaman pendampingan siswa.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bkTeachersList.map(bk => (
              <div key={bk.id} className="p-4 rounded-2xl bg-[#141419] border border-slate-800 hover:border-purple-500/40 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {bk.title}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{bk.name}</h4>
                    {bk.nip && <div className="text-[11px] text-slate-400 font-mono">NIP: {bk.nip}</div>}
                  </div>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                  {bk.phone && <div>📞 {bk.phone}</div>}
                  {bk.email && <div>✉️ {bk.email}</div>}
                  <div className="text-slate-500">Tugas: Konseling Siswa, Home Visit, Pemanggilan Wali Santri</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      const selTeacher = teachers.find(t => t.id === bk.id);
                      if (selTeacher) handleOpenEditTeacher(selTeacher);
                      else handleOpenAddBk();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah Penugasan BK</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB CONTENT: ANGGOTA (EKSKUL & OSIM) */}
      {/* ========================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setMemberSubTab('ekskul')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                memberSubTab === 'ekskul'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#1a1a22] text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚽ Anggota Ekstrakurikuler ({members.length})
            </button>
            <button
              onClick={() => setMemberSubTab('osim')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                memberSubTab === 'osim'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#1a1a22] text-slate-400 hover:text-slate-200'
              }`}
            >
              🏛️ Pengurus Kabinet OSIM ({osimMembers.length})
            </button>
          </div>

          {memberSubTab === 'ekskul' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121216]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#181820] text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Siswa & NIS</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Ekstrakurikuler</th>
                    <th className="py-3 px-4">Tgl Bergabung</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Terpusat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-[#181822] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{m.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NIS: {m.studentNis}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {m.studentClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-300">
                        {m.extracurricularName}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {m.joinDate || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditEkskulMember(m)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="Edit Anggota"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEkskulMemberConfirm(m)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {memberSubTab === 'osim' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121216]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#181820] text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Pengurus & NIS</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Bidang / Sekbid</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4 text-right">Aksi Terpusat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredOsimMembers.map(om => (
                    <tr key={om.id} className="hover:bg-[#181822] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{om.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NIS: {om.studentNis}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {om.className}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          {om.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {om.sekbid || 'BPH'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {om.academicPeriod || '2024/2025'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDeleteOsimMemberConfirm(om)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="Hapus Pengurus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FORM DEWAN GURU */}
      {/* ========================================================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span>{editingTeacher ? 'Edit Data Dewan Guru' : 'Tambah Guru Baru (cPanel Master)'}</span>
              </h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.fullName}
                    onChange={e => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    placeholder="Contoh: Ahmad Dahlan, M.Pd"
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={teacherForm.nip}
                    onChange={e => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    placeholder="198001012005011001"
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jenis Kelamin</label>
                  <select
                    value={teacherForm.gender}
                    onChange={e => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mata Pelajaran Utama</label>
                  <input
                    type="text"
                    value={teacherForm.subject}
                    onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    placeholder="Matematika, Fikih, Bahasa Arab..."
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tugas / Jabatan Tambahan</label>
                  <input
                    type="text"
                    value={teacherForm.role}
                    onChange={e => setTeacherForm({ ...teacherForm, role: e.target.value })}
                    placeholder="Guru Mapel, Wali Kelas, Waka..."
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="guru@madrasah.sch.id"
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status Keaktifan</label>
                  <select
                    value={teacherForm.status}
                    onChange={e => setTeacherForm({ ...teacherForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Aktif">Aktif Mengajar</option>
                    <option value="Nonaktif">Nonaktif / Pensiun</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={teacherForm.isPembina}
                    onChange={e => setTeacherForm({ ...teacherForm, isPembina: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tugaskan sebagai Pembina Ekstrakurikuler / Organisasi</span>
                </label>
              </div>

              {teacherForm.isPembina && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nama Ekskul / Organisasi yang Dibina</label>
                  <input
                    type="text"
                    value={teacherForm.extracurricularName}
                    onChange={e => setTeacherForm({ ...teacherForm, extracurricularName: e.target.value })}
                    placeholder="Pramuka, PMR, Paskibra, OSIM..."
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Simpan ke Master cPanel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FORM PEMBINA INTRA (OSIM) */}
      {/* ========================================================= */}
      {isPembinaIntraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Tetapkan Majelis Pembina OSIM (Terpusat)</span>
              </h3>
              <button onClick={() => setIsPembinaIntraModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePembinaIntra} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Pilih Guru dari Master Dewan Guru *</label>
                <select
                  value={pembinaIntraForm.teacherId}
                  onChange={e => setPembinaIntraForm({ ...pembinaIntraForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.nip ? `NIP: ${t.nip}` : t.subject || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Jabatan Pembina OSIM</label>
                <select
                  value={pembinaIntraForm.position}
                  onChange={e => setPembinaIntraForm({ ...pembinaIntraForm, position: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Pembina Utama OSIM">Pembina Utama OSIM</option>
                  <option value="Pembina OSIM Putra">Pembina OSIM Putra</option>
                  <option value="Pembina OSIM Putri">Pembina OSIM Putri</option>
                  <option value="Pembina Pendamping Bidang Keagamaan">Pembina Pendamping Bidang Keagamaan</option>
                  <option value="Waka Kesiswaan (Penanggung Jawab)">Waka Kesiswaan (Penanggung Jawab)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPembinaIntraModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  Sahkan Pembina OSIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: FORM EKSTRAKURIKULER */}
      {/* ========================================================= */}
      {isEkskulModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>{editingEkskul ? 'Edit Unit Ekstrakurikuler & Pembina' : 'Tambah Unit Ekskul & Pembina Baru'}</span>
              </h3>
              <button onClick={() => setIsEkskulModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEkskul} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nama Ekstrakurikuler *</label>
                  <input
                    type="text"
                    required
                    value={ekskulForm.name}
                    onChange={e => setEkskulForm({ ...ekskulForm, name: e.target.value })}
                    placeholder="Pramuka, Futsal, Robotik, Tahfidz..."
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kategori</label>
                  <select
                    value={ekskulForm.category}
                    onChange={e => setEkskulForm({ ...ekskulForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Olahraga">Olahraga</option>
                    <option value="Seni">Seni</option>
                    <option value="Keagamaan">Keagamaan</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Kepemimpinan">Kepemimpinan</option>
                    <option value="Bela Negara">Bela Negara</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Sosial">Sosial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Pilih Pembina Utama (Dari Dewan Guru)</label>
                  <select
                    value={ekskulForm.coachTeacherId}
                    onChange={e => {
                      const sel = teachers.find(t => t.id === e.target.value);
                      setEkskulForm({
                        ...ekskulForm,
                        coachTeacherId: e.target.value,
                        coachName: sel ? sel.fullName : ekskulForm.coachName
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Tulis Nama Manual di Bawah --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nama Pembina / Pelatih</label>
                  <input
                    type="text"
                    required
                    value={ekskulForm.coachName}
                    onChange={e => setEkskulForm({ ...ekskulForm, coachName: e.target.value })}
                    placeholder="Nama Pembina / Pelatih"
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Hari Latihan</label>
                  <select
                    value={ekskulForm.day}
                    onChange={e => setEkskulForm({ ...ekskulForm, day: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jam Latihan (Mulai - Selesai)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ekskulForm.startTime}
                      onChange={e => setEkskulForm({ ...ekskulForm, startTime: e.target.value })}
                      placeholder="15:30"
                      className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={ekskulForm.endTime}
                      onChange={e => setEkskulForm({ ...ekskulForm, endTime: e.target.value })}
                      placeholder="17:00"
                      className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Lokasi Latihan</label>
                  <input
                    type="text"
                    value={ekskulForm.location}
                    onChange={e => setEkskulForm({ ...ekskulForm, location: e.target.value })}
                    placeholder="Lapangan Utama, Lab Komputer, Aula..."
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kapasitas / Kuota Anggota</label>
                  <input
                    type="number"
                    value={ekskulForm.quota}
                    onChange={e => setEkskulForm({ ...ekskulForm, quota: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={ekskulForm.description}
                  onChange={e => setEkskulForm({ ...ekskulForm, description: e.target.value })}
                  placeholder="Deskripsi kegiatan ekstrakurikuler..."
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEkskulModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Simpan Ekstrakurikuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: FORM GURU BK */}
      {/* ========================================================= */}
      {isBkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-purple-400" />
                <span>Tetapkan Personel Guru BK (Terpusat)</span>
              </h3>
              <button onClick={() => setIsBkModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBk} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Pilih Guru dari Master Dewan Guru *</label>
                <select
                  value={bkForm.teacherId}
                  onChange={e => setBkForm({ ...bkForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.nip ? `NIP: ${t.nip}` : t.subject || 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Penugasan / Jabatan BK</label>
                <input
                  type="text"
                  value={bkForm.counselorTitle}
                  onChange={e => setBkForm({ ...bkForm, counselorTitle: e.target.value })}
                  placeholder="Koordinator BK, Guru BK Kelas X..."
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ruang Bimbingan Konseling</label>
                <input
                  type="text"
                  value={bkForm.roomLocation}
                  onChange={e => setBkForm({ ...bkForm, roomLocation: e.target.value })}
                  placeholder="Ruang BK Gedung Utama Lantai 1"
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
                >
                  Sahkan Guru BK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5A: FORM ANGGOTA EKSKUL */}
      {/* ========================================================= */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                <span>{editingMember ? 'Edit Anggota Ekstrakurikuler' : 'Daftarkan Anggota Ekskul Baru'}</span>
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEkskulMember} className="p-6 space-y-4 text-xs">
              {!editingMember && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Pilih Siswa dari Database Madrasah *</label>
                  <select
                    value={memberForm.studentId}
                    onChange={e => setMemberForm({ ...memberForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.className} - NIS: {s.nis})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ekstrakurikuler Tujuan *</label>
                <select
                  disabled={Boolean(editingMember)}
                  value={memberForm.extracurricularId}
                  onChange={e => setMemberForm({ ...memberForm, extracurricularId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500 disabled:opacity-60"
                >
                  {extracurriculars.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.category} - Pembina: {e.coachName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status Keanggotaan</label>
                  <select
                    value={memberForm.status}
                    onChange={e => setMemberForm({ ...memberForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Peran / Jabatan</label>
                  <select
                    value={memberForm.role}
                    onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Anggota">Anggota</option>
                    <option value="Ketua Ekskul">Ketua Ekskul</option>
                    <option value="Wakil Ketua">Wakil Ketua</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  value={memberForm.notes}
                  onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })}
                  placeholder="Catatan keanggotaan atau prestasi siswa..."
                  className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5B: FORM PENGURUS OSIM */}
      {/* ========================================================= */}
      {isOsimMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#181820] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>{editingOsimMember ? 'Edit Pengurus Kabinet OSIM' : 'Tambah Pengurus Kabinet OSIM (Terpusat)'}</span>
              </h3>
              <button onClick={() => setIsOsimMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOsimMember} className="p-6 space-y-4 text-xs">
              {!editingOsimMember && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Pilih Siswa dari Database Madrasah *</label>
                  <select
                    value={osimMemberForm.studentId}
                    onChange={e => setOsimMemberForm({ ...osimMemberForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.className} - NIS: {s.nis})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Jabatan Kabinet</label>
                  <select
                    value={osimMemberForm.position}
                    onChange={e => setOsimMemberForm({ ...osimMemberForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Ketua OSIM">Ketua OSIM</option>
                    <option value="Wakil Ketua OSIM">Wakil Ketua OSIM</option>
                    <option value="Sekretaris 1">Sekretaris 1</option>
                    <option value="Sekretaris 2">Sekretaris 2</option>
                    <option value="Bendahara 1">Bendahara 1</option>
                    <option value="Bendahara 2">Bendahara 2</option>
                    <option value="Koordinator Sekbid">Koordinator Sekbid</option>
                    <option value="Anggota">Anggota</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Seksi Bidang (Sekbid)</label>
                  <select
                    value={osimMemberForm.sekbid}
                    onChange={e => setOsimMemberForm({ ...osimMemberForm, sekbid: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101015] border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="BPH (Badan Pengurus Harian)">BPH (Badan Pengurus Harian)</option>
                    <option value="Sekbid 1: Keimanan & Ketaqwaan">Sekbid 1: Keimanan & Ketaqwaan</option>
                    <option value="Sekbid 2: Budi Pekerti Luhur">Sekbid 2: Budi Pekerti Luhur</option>
                    <option value="Sekbid 3: Kepribadian Unggul, Wawasan Kebangsaan & Bela Negara">Sekbid 3: Kepribadian Unggul</option>
                    <option value="Sekbid 4: Prestasi Akademik, Seni & Olahraga">Sekbid 4: Prestasi Akademik & Olahraga</option>
                    <option value="Sekbid 5: Demokrasi, HAM, Pendidikan Politik & Lingkungan Hidup">Sekbid 5: Demokrasi & Lingkungan</option>
                    <option value="Sekbid 6: Kreativitas, Keterampilan & Kewirausahaan">Sekbid 6: Kewirausahaan & Teknologi</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOsimMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  Sahkan Pengurus OSIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
