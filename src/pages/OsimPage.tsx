import React, { useState, useMemo } from 'react';
import {
  Crown,
  Calendar,
  Users,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Award,
  MessageSquare,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Send,
  Building,
  Vote,
  Compass,
  FileText,
  ThumbsUp,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  UserCheck,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import {
  OsimMember,
  OsimWorkProgram,
  OsimAspiration,
  OsimMeeting,
  OsimSekbid,
  OsimProgramStatus
} from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { StatusBadge } from '../components/common/Badge';

export const OsimPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const {
    osimMembers,
    osimPrograms,
    osimAspirations,
    osimMeetings,
    teachers,
    addOsimMember,
    updateOsimMember,
    deleteOsimMember,
    addOsimProgram,
    updateOsimProgram,
    deleteOsimProgram,
    addOsimAspiration,
    updateOsimAspiration,
    deleteOsimAspiration,
    addOsimMeeting,
    updateOsimMeeting,
    deleteOsimMeeting,
    activeAcademicYear,
    schoolSetting
  } = useSchool();

  // Active view tab
  const [activeSubTab, setActiveSubTab] = useState<'proker' | 'struktur' | 'sidang' | 'aspirasi' | 'matriks'>('proker');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekbid, setFilterSekbid] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isProkerModalOpen, setIsProkerModalOpen] = useState(false);
  const [isProkerDetailOpen, setIsProkerDetailOpen] = useState(false);
  const [selectedProker, setSelectedProker] = useState<OsimWorkProgram | null>(null);
  const [isProkerDeleteOpen, setIsProkerDeleteOpen] = useState(false);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OsimMember | null>(null);
  const [isMemberDeleteOpen, setIsMemberDeleteOpen] = useState(false);

  const [isAspirationModalOpen, setIsAspirationModalOpen] = useState(false);
  const [isAspirationDetailOpen, setIsAspirationDetailOpen] = useState(false);
  const [isAspirationResponseOpen, setIsAspirationResponseOpen] = useState(false);
  const [selectedAspiration, setSelectedAspiration] = useState<OsimAspiration | null>(null);
  const [isAspirationDeleteOpen, setIsAspirationDeleteOpen] = useState(false);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isMeetingDetailOpen, setIsMeetingDetailOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<OsimMeeting | null>(null);
  const [isMeetingDeleteOpen, setIsMeetingDeleteOpen] = useState(false);

  // Forms data
  const [prokerForm, setProkerForm] = useState<Partial<OsimWorkProgram>>({
    title: '',
    sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    personInCharge: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: 'Lingkungan Sekolah / Kampus Madrasah',
    budgetEstimated: 5000000,
    budgetRealized: 0,
    targetParticipants: 'Seluruh Siswa & Pengurus',
    participantCount: 100,
    successIndicator: '',
    progressPercentage: 0,
    status: 'Diajukan',
    description: '',
    academicYear: activeAcademicYear
  });

  const [memberForm, setMemberForm] = useState<Partial<OsimMember>>({
    fullName: '',
    studentNis: '',
    className: 'XI RPL 1',
    position: 'Ketua Sekbid',
    sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    phone: '081234567890',
    email: '',
    status: 'Aktif',
    vision: '',
    flagshipProgram: '',
    period: activeAcademicYear
  });

  const [aspirationForm, setAspirationForm] = useState<Partial<OsimAspiration>>({
    studentName: currentUser?.displayName || 'Siswa Madrasah',
    studentClass: 'X RPL 1',
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    category: 'Kegiatan & Acara',
    upvotes: 1,
    status: 'Ditampung',
    academicYear: activeAcademicYear
  });

  const [responseNoteText, setResponseNoteText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'Ditampung' | 'Sedang Dibahas' | 'Direalisasikan' | 'Ditolak'>('Direalisasikan');

  const [meetingForm, setMeetingForm] = useState<Partial<OsimMeeting>>({
    title: '',
    type: 'Rapat Pleno Pengurus',
    date: new Date().toISOString().split('T')[0],
    startTime: '15:30',
    endTime: '17:00',
    location: 'Ruang Rapat OSIM & Kesiswaan',
    leader: 'Ketua Umum OSIM',
    secretary: 'Sekretaris Umum',
    attendeesCount: 25,
    agenda: '',
    decisionNotes: '',
    wakaNotes: '',
    academicYear: activeAcademicYear
  });

  const sekbidList: OsimSekbid[] = [
    'BPH (Badan Pengurus Harian)',
    'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
    'Sekbid 2: Wawasan Kebangsaan, Bela Negara & Kedisiplinan',
    'Sekbid 3: Akademik, Sains, Riset & Literasi',
    'Sekbid 4: Demokrasi, HAM, Kepemimpinan & Politik Pelajar',
    'Sekbid 5: Keterampilan, Kewirausahaan & Koperasi Siswa',
    'Sekbid 6: Kesehatan Jasmani, Olahraga & Lingkungan Hidup',
    'Sekbid 7: Sastra, Seni, Budaya & Bahasa',
    'Sekbid 8: Teknologi Informasi, Multimedia & Komunikasi'
  ];

  // Calculations & KPIs
  const totalBudgetEst = useMemo(() => {
    return osimPrograms.reduce((acc, p) => acc + (p.budgetEstimated || 0), 0);
  }, [osimPrograms]);

  const totalBudgetReal = useMemo(() => {
    return osimPrograms.reduce((acc, p) => acc + (p.budgetRealized || 0), 0);
  }, [osimPrograms]);

  const avgProgress = useMemo(() => {
    if (osimPrograms.length === 0) return 0;
    const sum = osimPrograms.reduce((acc, p) => acc + (p.progressPercentage || 0), 0);
    return Math.round(sum / osimPrograms.length);
  }, [osimPrograms]);

  const completedProgramsCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Selesai').length;
  }, [osimPrograms]);

  const activeProgramsCount = useMemo(() => {
    return osimPrograms.filter(p => p.status === 'Berlangsung' || p.status === 'Disetujui').length;
  }, [osimPrograms]);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return osimPrograms.filter(p => {
      const matchQuery =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sekbid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.personInCharge.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSekbid = filterSekbid === 'all' || p.sekbid === filterSekbid;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchQuery && matchSekbid && matchStatus;
    });
  }, [osimPrograms, searchQuery, filterSekbid, filterStatus]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return osimMembers.filter(m => {
      const matchQuery =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.studentNis.includes(searchQuery) ||
        m.className.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSekbid = filterSekbid === 'all' || m.sekbid === filterSekbid;
      return matchQuery && matchSekbid;
    });
  }, [osimMembers, searchQuery, filterSekbid]);

  // Proker Handlers
  const handleOpenAddProker = () => {
    setSelectedProker(null);
    setProkerForm({
      title: '',
      sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
      personInCharge: 'Pengurus Sekbid',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      location: 'Lingkungan Madrasah',
      budgetEstimated: 5000000,
      budgetRealized: 0,
      targetParticipants: 'Seluruh Siswa Madrasah',
      participantCount: 150,
      successIndicator: 'Terlaksananya kegiatan dengan partisipasi aktif dan zero insiden.',
      progressPercentage: 0,
      status: 'Diajukan',
      description: '',
      academicYear: activeAcademicYear
    });
    setIsProkerModalOpen(true);
  };

  const handleOpenEditProker = (p: OsimWorkProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProker(p);
    setProkerForm(p);
    setIsProkerModalOpen(true);
  };

  const handleOpenDetailProker = (p: OsimWorkProgram) => {
    setSelectedProker(p);
    setIsProkerDetailOpen(true);
  };

  const handleSaveProker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prokerForm.title || !prokerForm.sekbid) {
      alert('Mohon lengkapi judul program kerja dan seksi bidang penanggung jawab.');
      return;
    }

    try {
      if (selectedProker) {
        await updateOsimProgram(selectedProker.id, prokerForm);
      } else {
        await addOsimProgram({
          title: prokerForm.title!,
          sekbid: prokerForm.sekbid as OsimSekbid,
          personInCharge: prokerForm.personInCharge || 'Pengurus OSIM',
          startDate: prokerForm.startDate || new Date().toISOString().split('T')[0],
          endDate: prokerForm.endDate || '',
          location: prokerForm.location || 'Sekolah',
          budgetEstimated: Number(prokerForm.budgetEstimated) || 0,
          budgetRealized: Number(prokerForm.budgetRealized) || 0,
          targetParticipants: prokerForm.targetParticipants || 'Seluruh Siswa',
          participantCount: Number(prokerForm.participantCount) || 0,
          successIndicator: prokerForm.successIndicator || 'Kegiatan terlaksana sesuai target.',
          progressPercentage: Number(prokerForm.progressPercentage) || 0,
          status: (prokerForm.status as OsimProgramStatus) || 'Diajukan',
          description: prokerForm.description || '',
          academicYear: prokerForm.academicYear || activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving proker:', err);
    } finally {
      setIsProkerModalOpen(false);
      setSelectedProker(null);
    }
  };

  const handleDeleteProkerConfirm = async () => {
    if (selectedProker) {
      try {
        await deleteOsimProgram(selectedProker.id);
      } catch (err) {
        console.error('Error deleting proker:', err);
      } finally {
        setIsProkerDeleteOpen(false);
        setSelectedProker(null);
      }
    }
  };

  // Member Handlers
  const handleOpenDetailMember = (m: OsimMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(m);
    setIsMemberDetailOpen(true);
  };

  const handleOpenAddMember = () => {
    setSelectedMember(null);
    setMemberForm({
      fullName: '',
      studentNis: '',
      className: 'X RPL 1',
      position: 'Anggota Sekbid',
      sekbid: 'Sekbid 1: Keimanan, Ketaqwaan & Moderasi Beragama',
      phone: '081234567890',
      email: '',
      status: 'Aktif',
      vision: 'Mendedikasikan diri untuk kemajuan organisasi dan akhlak santri.',
      flagshipProgram: '',
      period: activeAcademicYear
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (m: OsimMember, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(m);
    setMemberForm(m);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.fullName || !memberForm.position) {
      alert('Mohon isi nama lengkap dan posisi/jabatan pengurus.');
      return;
    }

    try {
      if (selectedMember) {
        await updateOsimMember(selectedMember.id, memberForm);
      } else {
        await addOsimMember({
          fullName: memberForm.fullName!,
          studentNis: memberForm.studentNis || '24251000',
          className: memberForm.className || 'X RPL 1',
          position: memberForm.position as any,
          sekbid: memberForm.sekbid as OsimSekbid,
          phone: memberForm.phone || '-',
          email: memberForm.email || '',
          photoUrl: memberForm.photoUrl || '',
          status: (memberForm.status as any) || 'Aktif',
          vision: memberForm.vision || '',
          flagshipProgram: memberForm.flagshipProgram || '',
          period: memberForm.period || activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving member:', err);
    } finally {
      setIsMemberModalOpen(false);
      setSelectedMember(null);
    }
  };

  const handleDeleteMemberConfirm = async () => {
    if (selectedMember) {
      try {
        await deleteOsimMember(selectedMember.id);
      } catch (err) {
        console.error('Error deleting member:', err);
      } finally {
        setIsMemberDeleteOpen(false);
        setSelectedMember(null);
      }
    }
  };

  // Aspiration Handlers
  const handleOpenDetailAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setIsAspirationDetailOpen(true);
  };

  const handleOpenDeleteAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setIsAspirationDeleteOpen(true);
  };

  const handleDeleteAspirationConfirm = async () => {
    if (selectedAspiration) {
      try {
        await deleteOsimAspiration(selectedAspiration.id);
      } catch (err) {
        console.error('Error deleting aspiration:', err);
      } finally {
        setIsAspirationDeleteOpen(false);
        setSelectedAspiration(null);
      }
    }
  };

  const handleOpenAddAspiration = () => {
    setAspirationForm({
      studentName: currentUser?.displayName || 'Siswa Madrasah',
      studentClass: 'X RPL 1',
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      category: 'Kegiatan & Acara',
      upvotes: 1,
      status: 'Ditampung',
      academicYear: activeAcademicYear
    });
    setIsAspirationModalOpen(true);
  };

  const handleSaveAspiration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirationForm.title || !aspirationForm.content) {
      alert('Mohon lengkapi judul aspirasi dan isi pesan.');
      return;
    }

    try {
      await addOsimAspiration({
        studentName: aspirationForm.studentName || 'Anonim / Siswa Madrasah',
        studentClass: aspirationForm.studentClass || 'Umum',
        date: aspirationForm.date || new Date().toISOString().split('T')[0],
        title: aspirationForm.title!,
        content: aspirationForm.content!,
        category: aspirationForm.category as any,
        upvotes: 1,
        status: 'Ditampung',
        academicYear: aspirationForm.academicYear || activeAcademicYear
      });
    } catch (err) {
      console.error('Error saving aspiration:', err);
    } finally {
      setIsAspirationModalOpen(false);
    }
  };

  const handleOpenResponseAspiration = (asp: OsimAspiration, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAspiration(asp);
    setResponseNoteText(asp.responseNote || '');
    setResponseStatus(asp.status);
    setIsAspirationResponseOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedAspiration) return;
    try {
      await updateOsimAspiration(selectedAspiration.id, {
        status: responseStatus,
        responseNote: responseNoteText,
        respondedBy: currentUser?.displayName || 'Waka Kesiswaan / BPH OSIM',
        respondedAt: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error saving response:', err);
    } finally {
      setIsAspirationResponseOpen(false);
      setSelectedAspiration(null);
    }
  };

  const handleUpvoteAspiration = async (asp: OsimAspiration, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateOsimAspiration(asp.id, {
      upvotes: (asp.upvotes || 0) + 1
    });
  };

  // Meeting Handlers
  const handleOpenDetailMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setIsMeetingDetailOpen(true);
  };

  const handleOpenEditMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setMeetingForm(meet);
    setIsMeetingModalOpen(true);
  };

  const handleOpenDeleteMeeting = (meet: OsimMeeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMeeting(meet);
    setIsMeetingDeleteOpen(true);
  };

  const handleDeleteMeetingConfirm = async () => {
    if (selectedMeeting) {
      try {
        await deleteOsimMeeting(selectedMeeting.id);
      } catch (err) {
        console.error('Error deleting meeting:', err);
      } finally {
        setIsMeetingDeleteOpen(false);
        setSelectedMeeting(null);
      }
    }
  };

  const handleOpenAddMeeting = () => {
    setSelectedMeeting(null);
    setMeetingForm({
      title: '',
      type: 'Rapat Pleno Pengurus',
      date: new Date().toISOString().split('T')[0],
      startTime: '15:30',
      endTime: '17:00',
      location: 'Ruang Rapat OSIM & Kesiswaan',
      leader: 'Ketua Umum OSIM',
      secretary: 'Sekretaris Umum',
      attendeesCount: 25,
      agenda: '',
      decisionNotes: '',
      wakaNotes: '',
      academicYear: activeAcademicYear
    });
    setIsMeetingModalOpen(true);
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.agenda) {
      alert('Mohon isi nama pertemuan dan agenda rapat.');
      return;
    }

    try {
      if (selectedMeeting) {
        await updateOsimMeeting(selectedMeeting.id, meetingForm);
      } else {
        await addOsimMeeting({
          title: meetingForm.title!,
          type: meetingForm.type as any,
          date: meetingForm.date || new Date().toISOString().split('T')[0],
          startTime: meetingForm.startTime || '15:30',
          endTime: meetingForm.endTime || '17:00',
          location: meetingForm.location || 'Ruang Rapat OSIM',
          leader: meetingForm.leader || 'Ketua Umum OSIM',
          secretary: meetingForm.secretary || 'Sekretaris Umum',
          attendeesCount: Number(meetingForm.attendeesCount) || 20,
          agenda: meetingForm.agenda!,
          decisionNotes: meetingForm.decisionNotes || 'Rapat mufakat disetujui.',
          wakaNotes: meetingForm.wakaNotes || '',
          academicYear: meetingForm.academicYear || activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving meeting:', err);
    } finally {
      setIsMeetingModalOpen(false);
      setSelectedMeeting(null);
    }
  };

  // Helper status color
  const getStatusBadge = (status: OsimProgramStatus) => {
    switch (status) {
      case 'Selesai':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">SELESAI</span>;
      case 'Berlangsung':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse">BERLANGSUNG</span>;
      case 'Disetujui':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">DISETUJUI</span>;
      case 'Diajukan':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">DIAJUKAN</span>;
      case 'Draft':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">DRAFT</span>;
      case 'Dibatalkan':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">DIBATALKAN</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-5" id="osim-page-root">
      {/* Top Banner / Header Telemetry */}
      <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wider text-zinc-100 uppercase">
                  Organisasi Siswa Intra Madrasah (OSIM)
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  INTRAKURIKULER
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded">
                  T.A. {activeAcademicYear}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                Pusat Komando Manajemen Organisasi Pelajar, Perencanaan Program Kerja Intrakurikuler, Struktur Kabinet OSIM, Sidang Pleno, dan Kanal Aspirasi Suara Santri.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportActions
              data={osimPrograms}
              filename={`Laporan_Program_Kerja_OSIM_${activeAcademicYear}`}
              title="Ekspor Proker"
            />
            {isWakaOrAdmin && (
              <button
                id="btn-add-proker-top"
                onClick={handleOpenAddProker}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold tracking-wide transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Proker OSIM
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metric Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-zinc-800/80 font-mono">
          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Proker OSIM</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-zinc-100">{osimPrograms.length}</span>
              <span className="text-[10px] text-amber-400">{completedProgramsCount} Selesai</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Proker Berjalan</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-sky-400">{activeProgramsCount}</span>
              <span className="text-[10px] text-zinc-400">Aktif</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Ketercapaian Progres</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-emerald-400">{avgProgress}%</span>
              <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden self-center">
                <div className="bg-emerald-500 h-full" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Total Anggaran (RAB)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-zinc-200">Rp {(totalBudgetEst / 1000000).toFixed(1)}Jt</span>
              <span className="text-[10px] text-zinc-400">Total</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Pengurus Kabinet</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-indigo-400">{osimMembers.length}</span>
              <span className="text-[10px] text-zinc-400">8 Sekbid</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
            <span className="text-[10px] uppercase text-zinc-400 block font-sans font-medium">Aspirasi Santri</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-amber-400">{osimAspirations.length}</span>
              <span className="text-[10px] text-emerald-400 font-sans">Kotak Suara</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-0.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            id="tab-osim-proker"
            onClick={() => setActiveSubTab('proker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'proker'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Program Kerja Intrakurikuler ({osimPrograms.length})
          </button>

          <button
            id="tab-osim-struktur"
            onClick={() => setActiveSubTab('struktur')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'struktur'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Struktur Kabinet & Sekbid ({osimMembers.length})
          </button>

          <button
            id="tab-osim-sidang"
            onClick={() => setActiveSubTab('sidang')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'sidang'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Sidang Pleno & Notulensi ({osimMeetings.length})
          </button>

          <button
            id="tab-osim-aspirasi"
            onClick={() => setActiveSubTab('aspirasi')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'aspirasi'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Kotak Aspirasi Santri ({osimAspirations.length})
          </button>

          <button
            id="tab-osim-matriks"
            onClick={() => setActiveSubTab('matriks')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeSubTab === 'matriks'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Matriks Evaluasi & Anggaran
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUB-TAB 1: PROGRAM KERJA INTRAKURIKULER OSIM */}
      {/* ========================================================== */}
      {activeSubTab === 'proker' && (
        <div className="space-y-4" id="view-proker-osim">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari program kerja intrakurikuler, penanggung jawab, atau sekbid..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={filterSekbid}
                onChange={e => setFilterSekbid(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Sekbid & BPH</option>
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
              </select>

              {isWakaOrAdmin && (
                <button
                  onClick={handleOpenAddProker}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Baru
                </button>
              )}
            </div>
          </div>

          {/* Proker Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPrograms.map(proker => (
              <div
                key={proker.id}
                onClick={() => handleOpenDetailProker(proker)}
                className="bg-[#121214] border border-zinc-800 hover:border-amber-500/40 rounded-lg p-4 transition cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 line-clamp-1">
                      {proker.sekbid.split(':')[0]}
                    </span>
                    {getStatusBadge(proker.status)}
                  </div>

                  <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition leading-snug">
                    {proker.title}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {proker.description || proker.successIndicator}
                  </p>

                  <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">PJ / Pelaksana:</span>
                      <span className="text-zinc-200 font-medium truncate max-w-[170px]">{proker.personInCharge}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Waktu & Lokasi:</span>
                      <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[170px]">{proker.startDate} • {proker.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Alokasi Anggaran:</span>
                      <span className="text-amber-400 font-mono font-semibold">Rp {proker.budgetEstimated.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar & Actions */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>Progress Ketercapaian</span>
                    <span className="font-bold text-zinc-200">{proker.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        proker.progressPercentage >= 100
                          ? 'bg-emerald-500'
                          : proker.progressPercentage >= 50
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${proker.progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/40">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Target: {proker.participantCount || 'Seluruh'} peserta
                    </span>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {isWakaOrAdmin && (
                        <>
                          <button
                            onClick={e => handleOpenEditProker(proker, e)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition"
                            title="Edit Proker"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedProker(proker);
                              setIsProkerDeleteOpen(true);
                            }}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition"
                            title="Hapus Proker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12 bg-[#121214] border border-zinc-800 rounded-lg p-6">
              <Target className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Tidak ada program kerja intrakurikuler yang sesuai.</p>
              <p className="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter seksi bidang.</p>
              {isWakaOrAdmin && (
                <button
                  onClick={handleOpenAddProker}
                  className="mt-4 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                >
                  Tambah Program Kerja Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 2: STRUKTUR KABINET & SEKBID OSIM */}
      {/* ========================================================== */}
      {activeSubTab === 'struktur' && (
        <div className="space-y-5" id="view-struktur-osim">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari pengurus OSIM berdasarkan nama, NIS, kelas, atau jabatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterSekbid}
                onChange={e => setFilterSekbid(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Sekbid & BPH</option>
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {isWakaOrAdmin && (
                <button
                  onClick={handleOpenAddMember}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Pengurus
                </button>
              )}
            </div>
          </div>

          {/* Dewan Pembina & Penasihat Intrakurikuler (Synced with Dewan Guru & School Settings) */}
          <div className="bg-[#121214] border border-indigo-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-indigo-400">
                  DEWAN PEMBINA & PENASIHAT INTRAKURIKULER (OSIM)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ⚡ Tersinkronisasi Otomatis dari Dewan Guru
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Penanggung Jawab / Kepala Madrasah */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PENANGGUNG JAWAB UTAMA
                </span>
                <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.principalName || 'Kepala Madrasah'}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.principalNip || '-'}</p>
                <p className="text-[10px] text-zinc-500 mt-1">Kepala Madrasah Aliyah</p>
              </div>

              {/* Pengarah / Waka Kesiswaan */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PENGARAH & PENANGGUNG JAWAB
                </span>
                <h4 className="font-bold text-xs text-zinc-100 mt-2">{schoolSetting?.wakaKesiswaanName || schoolSetting?.wakaName || 'Waka Kesiswaan'}</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIP: {schoolSetting?.wakaNip || '-'}</p>
                <p className="text-[10px] text-zinc-500 mt-1">Wakil Kepala Bidang Kesiswaan</p>
              </div>

              {/* Pembina Resmi OSIM */}
              <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-lg p-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PEMBINA RESMI OSIM
                </span>
                <h4 className="font-bold text-xs text-zinc-100 mt-2">
                  {schoolSetting?.pembinaOsim || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.fullName || 'Belum Ditetapkan'}
                </h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  NIP: {schoolSetting?.pembinaOsimNip || teachers.find(t => t.role?.toLowerCase().includes('osim'))?.nip || '-'}
                </p>
                <p className="text-[10px] text-indigo-400 mt-1">Pembina Harian Organisasi Siswa</p>
              </div>
            </div>
          </div>

          {/* Badan Pengurus Harian (BPH) Highlight Section */}
          <div className="bg-[#121214] border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-amber-400">
                  BADAN PENGURUS HARIAN (BPH OSIM 2026/2027)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Ketua, Wakil, Sekretaris & Bendahara</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {osimMembers
                .filter(m => m.sekbid === 'BPH (Badan Pengurus Harian)')
                .map(bph => (
                  <div
                    key={bph.id}
                    onClick={() => handleOpenDetailMember(bph)}
                    className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-lg p-3.5 transition flex flex-col justify-between cursor-pointer group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        {bph.photoUrl ? (
                          <img
                            src={bph.photoUrl}
                            alt={bph.fullName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-sm">
                            {bph.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {bph.position}
                          </span>
                          <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 mt-1 truncate transition">{bph.fullName}</h4>
                          <p className="text-[10px] text-zinc-400 font-mono">{bph.className} • NIS {bph.studentNis}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 italic mt-2 line-clamp-2 border-t border-zinc-800 pt-2">
                        "{bph.vision || 'Mewujudkan visi madrasah berprestasi'}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-mono">📱 {bph.phone}</span>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleOpenDetailMember(bph, e)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                          title="Lihat Detail Pengurus"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {isWakaOrAdmin && (
                          <>
                            <button
                              onClick={e => handleOpenEditMember(bph, e)}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                              title="Edit Pengurus"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedMember(bph);
                                setIsMemberDeleteOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                              title="Hapus Pengurus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Seksi Bidang 1 - 8 Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
                DEWAN SEKSI BIDANG (SEKBID 1 - 8)
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Total {filteredMembers.filter(m => m.sekbid !== 'BPH (Badan Pengurus Harian)').length} Pengurus Sekbid</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMembers
                .filter(m => m.sekbid !== 'BPH (Badan Pengurus Harian)')
                .map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleOpenDetailMember(member)}
                    className="bg-[#121214] border border-zinc-800 hover:border-zinc-700 rounded-lg p-3.5 transition flex flex-col justify-between shadow-sm cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 line-clamp-1">
                          {member.sekbid}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {member.position}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 transition">{member.fullName}</h4>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {member.className} • NIS {member.studentNis}
                      </p>

                      {member.flagshipProgram && (
                        <div className="mt-2.5 bg-zinc-900/80 border border-zinc-800/80 rounded p-2 text-[10px]">
                          <span className="text-amber-400 font-semibold block mb-0.5">Program Unggulan:</span>
                          <span className="text-zinc-300">{member.flagshipProgram}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-mono">{member.phone}</span>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleOpenDetailMember(member, e)}
                          className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                          title="Lihat Detail Pengurus"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {isWakaOrAdmin && (
                          <>
                            <button
                              onClick={e => handleOpenEditMember(member, e)}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedMember(member);
                                setIsMemberDeleteOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 3: SIDANG PLENO, MUKER & NOTULENSI */}
      {/* ========================================================== */}
      {activeSubTab === 'sidang' && (
        <div className="space-y-4" id="view-sidang-osim">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
                ARSIP SIDANG PLENO & NOTULENSI RAPAT OSIM
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Dokumentasi Berita Acara, Keputusan Mufakat MUKER, dan Pengesahan Program Kerja Kesiswaan.
              </p>
            </div>

            {isWakaOrAdmin && (
              <button
                onClick={handleOpenAddMeeting}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Catat Notulensi Baru
              </button>
            )}
          </div>

          <div className="space-y-3">
            {osimMeetings.map(meet => (
              <div
                key={meet.id}
                onClick={() => handleOpenDetailMeeting(meet)}
                className="bg-[#121214] border border-zinc-800 rounded-lg p-4 hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {meet.type}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        📅 {meet.date} ({meet.startTime} - {meet.endTime} WIB)
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 mt-1.5 transition">{meet.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span>📍 {meet.location}</span>
                    <span>👥 {meet.attendeesCount} Peserta Hadir</span>
                    <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleOpenDetailMeeting(meet, e)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                        title="Lihat Detail Notulensi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isWakaOrAdmin && (
                        <>
                          <button
                            onClick={e => handleOpenEditMeeting(meet, e)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                            title="Edit Notulensi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => handleOpenDeleteMeeting(meet, e)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                            title="Hapus Notulensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded p-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">
                      AGENDA PEMBAHASAN:
                    </span>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">{meet.agenda}</p>
                    <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                      Pimpinan Rapat: <strong className="text-zinc-200">{meet.leader}</strong> • Notulis: <strong className="text-zinc-200">{meet.secretary}</strong>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 border border-zinc-800/80 rounded p-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1">
                      HASIL KEPUTUSAN & MUFAKAT:
                    </span>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">{meet.decisionNotes}</p>
                    {meet.wakaNotes && (
                      <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-amber-400/90 line-clamp-1">
                        Catatan Waka Kesiswaan: <em>"{meet.wakaNotes}"</em>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 4: KOTAK ASPIRASI SANTRI / SUARA SISWA */}
      {/* ========================================================== */}
      {activeSubTab === 'aspirasi' && (
        <div className="space-y-4" id="view-aspirasi-osim">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-200">
                KOTAK SUARA & ASPIRASI SANTRI (OSIM DIGIVOICE)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kanal transparan penampungan ide kreatif, usulan sarpras, kritik membangun, dan gagasan kegiatan dari santri untuk OSIM & Madrasah.
              </p>
            </div>

            <button
              onClick={handleOpenAddAspiration}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Aspirasi Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {osimAspirations.map(asp => (
              <div
                key={asp.id}
                onClick={() => handleOpenDetailAspiration(asp)}
                className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:border-amber-500/40 transition cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {asp.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        asp.status === 'Direalisasikan'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : asp.status === 'Sedang Dibahas'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {asp.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition">{asp.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">{asp.content}</p>

                  <div className="mt-2 text-[10px] font-mono text-zinc-500">
                    Oleh: <span className="text-zinc-300">{asp.studentName}</span> ({asp.studentClass}) • {asp.date}
                  </div>

                  {asp.responseNote && (
                    <div className="mt-3 bg-zinc-900/90 border border-emerald-500/20 rounded p-2.5 text-xs text-emerald-300">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-0.5">
                        Tanggapan Resmi ({asp.respondedBy}):
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-snug line-clamp-2">{asp.responseNote}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleUpvoteAspiration(asp, e)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-xs font-mono transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Dukungan ({asp.upvotes || 1})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => handleOpenDetailAspiration(asp, e)}
                      className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition"
                      title="Lihat Detail Aspirasi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isWakaOrAdmin && (
                      <>
                        <button
                          onClick={e => handleOpenResponseAspiration(asp, e)}
                          className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                        >
                          Beri Respon
                        </button>
                        <button
                          onClick={e => handleOpenDeleteAspiration(asp, e)}
                          className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-rose-400 transition"
                          title="Hapus Aspirasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-TAB 5: MATRIKS EVALUASI & ANGGARAN */}
      {/* ========================================================== */}
      {activeSubTab === 'matriks' && (
        <div className="space-y-4" id="view-matriks-osim">
          <div className="bg-[#121214] border border-zinc-800 p-4 rounded-lg">
            <h3 className="text-xs font-mono font-bold uppercase text-zinc-200 mb-1">
              MATRIKS ALOKASI ANGGARAN & STATUS PELAKSANAAN PROKER
            </h3>
            <p className="text-[11px] text-zinc-400">
              Evaluasi ketercapaian target indikator kinerja 8 Seksi Bidang OSIM Tahun Ajaran {activeAcademicYear}.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                    <th className="p-2.5">Seksi Bidang</th>
                    <th className="p-2.5">Program Kerja</th>
                    <th className="p-2.5">PJ Pelaksana</th>
                    <th className="p-2.5">Estimasi Biaya</th>
                    <th className="p-2.5">Realisasi</th>
                    <th className="p-2.5">Progres</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {osimPrograms.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-2.5 text-[11px] font-mono text-zinc-400">{p.sekbid.split(':')[0]}</td>
                      <td className="p-2.5 font-bold text-zinc-200">{p.title}</td>
                      <td className="p-2.5 text-xs text-zinc-400">{p.personInCharge}</td>
                      <td className="p-2.5 text-xs font-mono text-amber-400">Rp {p.budgetEstimated.toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-xs font-mono text-zinc-300">Rp {(p.budgetRealized || 0).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-xs font-mono text-emerald-400">{p.progressPercentage}%</td>
                      <td className="p-2.5">{getStatusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODALS */}
      {/* ========================================================== */}

      {/* Modal Tambah / Edit Proker */}
      <Modal
        isOpen={isProkerModalOpen}
        onClose={() => setIsProkerModalOpen(false)}
        title={selectedProker ? 'Ubah Program Kerja OSIM' : 'Tambah Program Kerja Intrakurikuler Baru'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProker} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Program Kerja / Kegiatan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Latihan Dasar Kepemimpinan Santri (LDKS 2026)"
                value={prokerForm.title}
                onChange={e => setProkerForm({ ...prokerForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Seksi Bidang Penanggung Jawab *</label>
              <select
                value={prokerForm.sekbid}
                onChange={e => setProkerForm({ ...prokerForm, sekbid: e.target.value as OsimSekbid })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {sekbidList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Penanggung Jawab (PJ) Pelaksana</label>
              <input
                type="text"
                placeholder="Nama Ketua Panitia / Sekbid"
                value={prokerForm.personInCharge}
                onChange={e => setProkerForm({ ...prokerForm, personInCharge: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Mulai Pelaksanaan *</label>
              <input
                type="date"
                required
                value={prokerForm.startDate}
                onChange={e => setProkerForm({ ...prokerForm, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal Selesai (Opsional)</label>
              <input
                type="date"
                value={prokerForm.endDate || ''}
                onChange={e => setProkerForm({ ...prokerForm, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Lokasi Pelaksanaan *</label>
              <input
                type="text"
                required
                placeholder="Aula Utama / Lapangan / Wisma"
                value={prokerForm.location}
                onChange={e => setProkerForm({ ...prokerForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Estimasi Anggaran (RAB Rp) *</label>
              <input
                type="number"
                required
                min={0}
                value={prokerForm.budgetEstimated}
                onChange={e => setProkerForm({ ...prokerForm, budgetEstimated: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Program Kerja</label>
              <select
                value={prokerForm.status}
                onChange={e => setProkerForm({ ...prokerForm, status: e.target.value as OsimProgramStatus })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Berlangsung">Berlangsung</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Progress Ketercapaian ({prokerForm.progressPercentage}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={prokerForm.progressPercentage || 0}
                onChange={e => setProkerForm({ ...prokerForm, progressPercentage: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Indikator Keberhasilan (KPI Target)</label>
              <input
                type="text"
                placeholder="Target capaian kuantitatif/kualitatif kegiatan"
                value={prokerForm.successIndicator}
                onChange={e => setProkerForm({ ...prokerForm, successIndicator: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Deskripsi & Rincian Teknis Kegiatan</label>
              <textarea
                rows={3}
                placeholder="Penjelasan latar belakang, konsep acara, dan tahapan eksekusi..."
                value={prokerForm.description}
                onChange={e => setProkerForm({ ...prokerForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsProkerModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Simpan Program Kerja
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Proker */}
      <Modal
        isOpen={isProkerDetailOpen}
        onClose={() => setIsProkerDetailOpen(false)}
        title="Detail Program Kerja Intrakurikuler OSIM"
        maxWidth="max-w-2xl"
      >
        {selectedProker && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  {selectedProker.sekbid}
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-1">{selectedProker.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Penanggung Jawab: <strong className="text-zinc-200">{selectedProker.personInCharge}</strong></p>
              </div>
              {getStatusBadge(selectedProker.status)}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded border border-zinc-800 font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-sans">Waktu & Tempat</span>
                <p className="text-zinc-200 mt-0.5">{selectedProker.startDate} {selectedProker.endDate && `s/d ${selectedProker.endDate}`}</p>
                <p className="text-zinc-400 text-[11px]">📍 {selectedProker.location}</p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-sans">Alokasi Anggaran (RAB)</span>
                <p className="text-amber-400 font-bold text-sm mt-0.5">Rp {selectedProker.budgetEstimated.toLocaleString('id-ID')}</p>
                <p className="text-zinc-400 text-[11px]">Realisasi: Rp {(selectedProker.budgetRealized || 0).toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Target Peserta:</span>
              <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">{selectedProker.targetParticipants} ({selectedProker.participantCount} Orang)</p>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Indikator Keberhasilan:</span>
              <p className="text-zinc-200 bg-zinc-900 p-2.5 rounded border border-zinc-800">{selectedProker.successIndicator}</p>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Deskripsi Kegiatan:</span>
              <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded border border-zinc-800 leading-relaxed whitespace-pre-line">
                {selectedProker.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                {isWakaOrAdmin && (
                  <>
                    <button
                      onClick={() => {
                        updateOsimProgram(selectedProker.id, { status: 'Disetujui', progressPercentage: 25 });
                        setIsProkerDetailOpen(false);
                      }}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold"
                    >
                      Setujui Proker
                    </button>
                    <button
                      onClick={() => {
                        updateOsimProgram(selectedProker.id, { status: 'Berlangsung', progressPercentage: 60 });
                        setIsProkerDetailOpen(false);
                      }}
                      className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold"
                    >
                      Mulai Eksekusi
                    </button>
                    <button
                      onClick={() => {
                        updateOsimProgram(selectedProker.id, { status: 'Selesai', progressPercentage: 100 });
                        setIsProkerDetailOpen(false);
                      }}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold"
                    >
                      Tandai Selesai (LPJ)
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsProkerDetailOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah / Edit Pengurus OSIM */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={selectedMember ? 'Ubah Data Pengurus OSIM' : 'Tambah Pengurus OSIM Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveMember} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap Siswa *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Al-Fatih"
              value={memberForm.fullName}
              onChange={e => setMemberForm({ ...memberForm, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">NIS Siswa</label>
              <input
                type="text"
                placeholder="24251001"
                value={memberForm.studentNis}
                onChange={e => setMemberForm({ ...memberForm, studentNis: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Kelas</label>
              <input
                type="text"
                placeholder="XI RPL 1"
                value={memberForm.className}
                onChange={e => setMemberForm({ ...memberForm, className: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Jabatan / Posisi *</label>
            <select
              value={memberForm.position}
              onChange={e => setMemberForm({ ...memberForm, position: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Ketua Umum OSIM">Ketua Umum OSIM</option>
              <option value="Wakil Ketua 1">Wakil Ketua 1</option>
              <option value="Wakil Ketua 2">Wakil Ketua 2</option>
              <option value="Sekretaris Umum">Sekretaris Umum</option>
              <option value="Wakil Sekretaris">Wakil Sekretaris</option>
              <option value="Bendahara Umum">Bendahara Umum</option>
              <option value="Wakil Bendahara">Wakil Bendahara</option>
              <option value="Ketua Sekbid">Ketua Sekbid</option>
              <option value="Anggota Sekbid">Anggota Sekbid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Seksi Bidang (Sekbid)</label>
            <select
              value={memberForm.sekbid}
              onChange={e => setMemberForm({ ...memberForm, sekbid: e.target.value as OsimSekbid })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {sekbidList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">No. WhatsApp / HP</label>
            <input
              type="text"
              placeholder="081234567890"
              value={memberForm.phone}
              onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Program Unggulan yang Diusung</label>
            <input
              type="text"
              placeholder="Contoh: Digital E-Voting & Madrasah Green"
              value={memberForm.flagshipProgram}
              onChange={e => setMemberForm({ ...memberForm, flagshipProgram: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Simpan Pengurus
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Kirim Aspirasi Siswa */}
      <Modal
        isOpen={isAspirationModalOpen}
        onClose={() => setIsAspirationModalOpen(false)}
        title="Sampaikan Aspirasi / Ide untuk OSIM & Madrasah"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAspiration} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Siswa / Pengirim</label>
            <input
              type="text"
              value={aspirationForm.studentName}
              onChange={e => setAspirationForm({ ...aspirationForm, studentName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Kategori Usulan *</label>
            <select
              value={aspirationForm.category}
              onChange={e => setAspirationForm({ ...aspirationForm, category: e.target.value as any })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Fasilitas & Sarpras">Fasilitas & Sarpras</option>
              <option value="Kegiatan & Acara">Kegiatan & Acara</option>
              <option value="Akademik & Pembelajaran">Akademik & Pembelajaran</option>
              <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
              <option value="Ekstrakurikuler">Ekstrakurikuler</option>
              <option value="Kesejahteraan Santri/Siswa">Kesejahteraan Santri/Siswa</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Judul Aspirasi *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Penambahan Stop Kontak di Gazebo Belajar"
              value={aspirationForm.title}
              onChange={e => setAspirationForm({ ...aspirationForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Aspirasi / Usulan Detail *</label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan alasan dan manfaat usulan ini bagi santri madrasah..."
              value={aspirationForm.content}
              onChange={e => setAspirationForm({ ...aspirationForm, content: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAspirationModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Kirim Aspirasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Respon Aspirasi */}
      <Modal
        isOpen={isAspirationResponseOpen}
        onClose={() => setIsAspirationResponseOpen(false)}
        title="Tanggapan Resmi Pengurus OSIM & Kesiswaan"
        maxWidth="max-w-md"
      >
        {selectedAspiration && (
          <div className="space-y-3 text-xs">
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
              <h4 className="font-bold text-zinc-100">{selectedAspiration.title}</h4>
              <p className="text-zinc-400 mt-1 text-[11px]">{selectedAspiration.content}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Status Tindak Lanjut</label>
              <select
                value={responseStatus}
                onChange={e => setResponseStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Ditampung">Ditampung</option>
                <option value="Sedang Dibahas">Sedang Dibahas</option>
                <option value="Direalisasikan">Direalisasikan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Isi Tanggapan / Keterangan Resmi</label>
              <textarea
                rows={4}
                placeholder="Tuliskan tindakan yang telah atau akan diambil oleh OSIM/Kesiswaan..."
                value={responseNoteText}
                onChange={e => setResponseNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAspirationResponseOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Simpan Tanggapan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Notulensi Rapat */}
      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title="Catat Notulensi Sidang Pleno / Rapat OSIM"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveMeeting} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Judul / Acara Rapat *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Evaluasi Bulanan Program Kerja OSIM"
              value={meetingForm.title}
              onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Jenis Pertemuan</label>
              <select
                value={meetingForm.type}
                onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Rapat Pleno Pengurus">Rapat Pleno Pengurus</option>
                <option value="Rapat BPH">Rapat BPH</option>
                <option value="Rapat Koordinasi Pembina">Rapat Koordinasi Pembina</option>
                <option value="Sidang Musyawarah Kerja (MUKER)">Sidang Musyawarah Kerja (MUKER)</option>
                <option value="Rapat Evaluasi Bulanan">Rapat Evaluasi Bulanan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Tanggal</label>
              <input
                type="date"
                value={meetingForm.date}
                onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Agenda Pembahasan *</label>
            <textarea
              required
              rows={2}
              placeholder="Rincian poin agenda yang dibahas..."
              value={meetingForm.agenda}
              onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Hasil Keputusan & Mufakat *</label>
            <textarea
              required
              rows={3}
              placeholder="Keputusan rapat, pembagian tugas, deadline..."
              value={meetingForm.decisionNotes}
              onChange={e => setMeetingForm({ ...meetingForm, decisionNotes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsMeetingModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Simpan Notulensi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Pengurus OSIM */}
      <Modal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        title="Detail Profil Pengurus OSIM"
        maxWidth="max-w-lg"
      >
        {selectedMember && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 bg-zinc-900/90 border border-zinc-800 p-3 rounded-lg">
              {selectedMember.photoUrl ? (
                <img
                  src={selectedMember.photoUrl}
                  alt={selectedMember.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border border-amber-500/40 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 shrink-0 text-xl">
                  {selectedMember.fullName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {selectedMember.position}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {selectedMember.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100 mt-1">{selectedMember.fullName}</h3>
                <p className="text-zinc-400 font-mono text-[11px] mt-0.5">
                  NIS: {selectedMember.studentNis} • Kelas: {selectedMember.className}
                </p>
                <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
                  Masa Bakti: {selectedMember.period || activeAcademicYear}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">Seksi Bidang:</span>
                <span className="text-zinc-200 font-semibold">{selectedMember.sekbid}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-mono">No. Telepon / WA:</span>
                <span className="text-zinc-200 font-mono">{selectedMember.phone || '-'}</span>
              </div>
              {selectedMember.email && (
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-500 block font-mono">Email:</span>
                  <span className="text-zinc-300 font-mono">{selectedMember.email}</span>
                </div>
              )}
            </div>

            {selectedMember.vision && (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block mb-1">
                  Visi & Komitmen:
                </span>
                <p className="text-zinc-300 leading-relaxed italic">"{selectedMember.vision}"</p>
              </div>
            )}

            {selectedMember.flagshipProgram && (
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block mb-1">
                  Program Unggulan yang Diusung:
                </span>
                <p className="text-zinc-200 font-medium">{selectedMember.flagshipProgram}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsMemberDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {isWakaOrAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemberDetailOpen(false);
                      handleOpenEditMember(selectedMember);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemberDetailOpen(false);
                      setIsMemberDeleteOpen(true);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Notulensi Sidang Pleno */}
      <Modal
        isOpen={isMeetingDetailOpen}
        onClose={() => setIsMeetingDetailOpen(false)}
        title="Detail Notulensi Sidang & Rapat OSIM"
        maxWidth="max-w-2xl"
      >
        {selectedMeeting && (
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {selectedMeeting.type}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  📅 {selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime} WIB)
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-100">{selectedMeeting.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-zinc-800 text-[11px] font-mono text-zinc-400">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Lokasi:</span>
                  <strong className="text-zinc-200">{selectedMeeting.location}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Kehadiran:</span>
                  <strong className="text-zinc-200">{selectedMeeting.attendeesCount} Orang</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Pimpinan Rapat:</span>
                  <strong className="text-zinc-200">{selectedMeeting.leader}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Notulis:</span>
                  <strong className="text-zinc-200">{selectedMeeting.secretary}</strong>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
                AGENDA PEMBAHASAN:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.agenda}</p>
            </div>

            <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1.5">
                HASIL KEPUTUSAN & MUFAKAT SIDANG:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedMeeting.decisionNotes}</p>
            </div>

            {selectedMeeting.wakaNotes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block mb-1">
                  Catatan Waka Kesiswaan / Pembina:
                </span>
                <p className="text-zinc-200 italic">{selectedMeeting.wakaNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsMeetingDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {isWakaOrAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeetingDetailOpen(false);
                      handleOpenEditMeeting(selectedMeeting);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Notulensi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeetingDetailOpen(false);
                      handleOpenDeleteMeeting(selectedMeeting);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Aspirasi Santri */}
      <Modal
        isOpen={isAspirationDetailOpen}
        onClose={() => setIsAspirationDetailOpen(false)}
        title="Detail Aspirasi & Suara Santri"
        maxWidth="max-w-lg"
      >
        {selectedAspiration && (
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {selectedAspiration.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedAspiration.status === 'Direalisasikan'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedAspiration.status === 'Sedang Dibahas'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedAspiration.status}
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-100">{selectedAspiration.title}</h3>
              <p className="text-zinc-400 font-mono text-[11px] mt-1">
                Pengirim: <strong className="text-zinc-200">{selectedAspiration.studentName}</strong> ({selectedAspiration.studentClass}) • Tanggal: {selectedAspiration.date}
              </p>
              <div className="mt-2 text-amber-400 font-mono text-[11px] flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{selectedAspiration.upvotes || 1} Santri Mendukung Aspirasi Ini</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1.5">
                ISI LENGKAP ASPIRASI:
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{selectedAspiration.content}</p>
            </div>

            {selectedAspiration.responseNote && (
              <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                    TANGGAPAN RESMI PENGURUS:
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{selectedAspiration.respondedAt}</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{selectedAspiration.responseNote}</p>
                <span className="text-[10px] font-mono text-zinc-500 block mt-2">
                  Ditanggapi oleh: {selectedAspiration.respondedBy || 'Pengurus OSIM'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAspirationDetailOpen(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition"
              >
                Tutup
              </button>
              {isWakaOrAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAspirationDetailOpen(false);
                      handleOpenResponseAspiration(selectedAspiration);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                  >
                    Beri Respon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAspirationDetailOpen(false);
                      handleOpenDeleteAspiration(selectedAspiration);
                    }}
                    className="px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Dialog Konfirmasi Hapus Proker */}
      <ConfirmDialog
        isOpen={isProkerDeleteOpen}
        onClose={() => setIsProkerDeleteOpen(false)}
        onConfirm={handleDeleteProkerConfirm}
        title="Hapus Program Kerja OSIM?"
        message={`Apakah Anda yakin ingin menghapus program kerja "${selectedProker?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Proker"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Pengurus */}
      <ConfirmDialog
        isOpen={isMemberDeleteOpen}
        onClose={() => setIsMemberDeleteOpen(false)}
        onConfirm={handleDeleteMemberConfirm}
        title="Hapus Pengurus OSIM?"
        message={`Apakah Anda yakin ingin menghapus "${selectedMember?.fullName}" dari struktur pengurus OSIM?`}
        confirmText="Hapus Pengurus"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Notulensi Sidang */}
      <ConfirmDialog
        isOpen={isMeetingDeleteOpen}
        onClose={() => setIsMeetingDeleteOpen(false)}
        onConfirm={handleDeleteMeetingConfirm}
        title="Hapus Notulensi Sidang / Rapat?"
        message={`Apakah Anda yakin ingin menghapus arsip notulensi "${selectedMeeting?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Notulensi"
        type="danger"
      />

      {/* Dialog Konfirmasi Hapus Aspirasi */}
      <ConfirmDialog
        isOpen={isAspirationDeleteOpen}
        onClose={() => setIsAspirationDeleteOpen(false)}
        onConfirm={handleDeleteAspirationConfirm}
        title="Hapus Aspirasi Santri?"
        message={`Apakah Anda yakin ingin menghapus aspirasi "${selectedAspiration?.title}"?`}
        confirmText="Hapus Aspirasi"
        type="danger"
      />
    </div>
  );
};
