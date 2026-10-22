import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Trophy,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Star,
  Users,
  ShieldCheck,
  Medal,
  Heart,
  TrendingUp,
  FileText,
  UserCheck,
  Search
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Achievement,
  AchievementLevel,
  AchievementCategory,
  StudentReward,
  RewardCategory,
  RewardStatus,
  SchoolRuleArticle
} from '../types';
import { OFFICIAL_SCHOOL_RULES } from '../services/officialRulesData';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

export const AchievementsPage: React.FC = () => {
  const { isWakaOrAdmin, currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'rewards' | 'achievements'>('rewards');
  const [isSavingAchievement, setIsSavingAchievement] = useState(false);
  const [isSavingReward, setIsSavingReward] = useState(false);

  const {
    achievements,
    rewards,
    students,
    classes,
    extracurriculars,
    schoolRules,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    addReward,
    updateReward,
    deleteReward,
    activeAcademicYear
  } = useSchool();

  // Filter States - Tab Achievements
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter States - Tab Rewards
  const [selectedRewardClass, setSelectedRewardClass] = useState<string>('all');
  const [selectedRewardCategory, setSelectedRewardCategory] = useState<string>('all');
  const [selectedRewardStatus, setSelectedRewardStatus] = useState<string>('all');

  // Modal States - Achievements
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Modal States - Rewards
  const [isRewardFormOpen, setIsRewardFormOpen] = useState(false);
  const [isRewardDetailOpen, setIsRewardDetailOpen] = useState(false);
  const [isRewardDeleteOpen, setIsRewardDeleteOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<StudentReward | null>(null);

  // Form State - Achievements
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '',
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    extracurricularId: '',
    extracurricularName: '',
    category: 'Olahraga',
    level: 'Kota/Kabupaten',
    rank: 'Juara 1',
    organizer: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    pointsAwarded: 20
  });

  // Form State - Rewards
  const [rewardFormData, setRewardFormData] = useState<Partial<StudentReward>>({
    studentId: '',
    studentName: '',
    studentNis: '',
    studentClass: '',
    rewardTitle: '',
    category: 'Kedisiplinan & Karakter',
    points: 10,
    date: new Date().toISOString().split('T')[0],
    officerName: currentUser?.displayName || 'Tim Kesiswaan',
    description: 'Pemberian poin apresiasi atas keteladanan siswa.',
    actionTaken: 'Pemberian piagam penghargaan & penambahan poin apresiasi',
    status: 'Diverifikasi'
  });

  const levels: AchievementLevel[] = [
    'Sekolah',
    'Kecamatan',
    'Kota/Kabupaten',
    'Provinsi',
    'Nasional',
    'Internasional'
  ];

  const rewardCategories: RewardCategory[] = [
    'Akademik',
    'Kedisiplinan & Karakter',
    'Keagamaan & Tahfidz',
    'Olahraga & Seni',
    'Kepemimpinan & Organisasi',
    'Sosial & Kepedulian',
    'Lainnya'
  ];

  // Modal fast selection state - Achievements
  const [achievementStudentSearchQuery, setAchievementStudentSearchQuery] = useState('');
  const [achievementStudentClassFilter, setAchievementStudentClassFilter] = useState('all');

  // Modal fast selection state - Rewards
  const [rewardStudentSearchQuery, setRewardStudentSearchQuery] = useState('');
  const [rewardStudentClassFilter, setRewardStudentClassFilter] = useState('all');

  // Filtered students for quick grid picker in Achievements modal
  const displayedAchievementStudents = useMemo(() => {
    return (students || []).filter(s => {
      if (achievementStudentClassFilter !== 'all' && s.className !== achievementStudentClassFilter) {
        return false;
      }
      if (!achievementStudentSearchQuery.trim()) return true;
      const q = achievementStudentSearchQuery.toLowerCase().trim();
      return (
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
      );
    });
  }, [students, achievementStudentSearchQuery, achievementStudentClassFilter]);

  // Filtered students for quick grid picker in Rewards modal
  const displayedRewardStudents = useMemo(() => {
    return (students || []).filter(s => {
      if (rewardStudentClassFilter !== 'all' && s.className !== rewardStudentClassFilter) {
        return false;
      }
      if (!rewardStudentSearchQuery.trim()) return true;
      const q = rewardStudentSearchQuery.toLowerCase().trim();
      return (
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
      );
    });
  }, [students, rewardStudentSearchQuery, rewardStudentClassFilter]);

  // Search query for official reward rules catalog in modal
  const [rewardRuleSearchQuery, setRewardRuleSearchQuery] = useState('');

  // List of reward rules from official handbook / schoolRules
  const rewardRules = useMemo(() => {
    const fromContext = (schoolRules || []).filter(
      r => r.type === 'penghargaan' || r.code?.startsWith('RW') || r.severity === 'Apresiasi' || (r.chapter && r.chapter.includes('Penghargaan'))
    );
    if (fromContext.length > 0) return fromContext;
    return (OFFICIAL_SCHOOL_RULES || []).filter(
      r => r.type === 'penghargaan' || r.code?.startsWith('RW') || r.severity === 'Apresiasi'
    );
  }, [schoolRules]);

  // Filtered reward rules for quick selection cards
  const displayedRewardRules = useMemo(() => {
    if (!rewardRules) return [];
    if (!rewardRuleSearchQuery.trim()) return rewardRules;
    const q = rewardRuleSearchQuery.toLowerCase().trim();
    return rewardRules.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.articleNumber && r.articleNumber.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.consequence && r.consequence.toLowerCase().includes(q))
    );
  }, [rewardRules, rewardRuleSearchQuery]);

  // Handler to auto-fill form from selected official reward rule
  const handleSelectRewardRule = (rule: SchoolRuleArticle) => {
    let cat: RewardCategory = 'Kedisiplinan & Karakter';
    if (rule.code === 'RW-03') cat = 'Keagamaan & Tahfidz';
    else if (rule.code === 'RW-07') cat = 'Akademik';
    else if (rule.code === 'RW-04' || rule.code === 'RW-05' || rule.code === 'RW-06') cat = 'Olahraga & Seni';
    else if (rule.code === 'RW-08') cat = 'Kepemimpinan & Organisasi';
    else if (rule.code === 'RW-01' || rule.code === 'RW-09') cat = 'Sosial & Kepedulian';
    else if (rule.code === 'RW-02') cat = 'Kedisiplinan & Karakter';

    const positivePoints = Math.abs(rule.points) || 10;

    setRewardFormData(prev => ({
      ...prev,
      rewardTitle: `[${rule.code || 'REWARD'}] ${rule.title}`,
      category: cat,
      points: positivePoints,
      description: rule.description || `Pemberian apresiasi berdasarkan ketentuan tata tertib resmi ${rule.code || ''}.`,
      actionTaken: rule.consequence || 'Pemberian piagam penghargaan & penambahan poin apresiasi siswa.',
      officerName: rule.authorizedOfficer || prev.officerName || currentUser?.displayName || 'Tim Kesiswaan'
    }));
  };

  // Count achievements per class
  const achievementCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(achievements, classes, students);
  }, [achievements, classes, students]);

  // Count rewards per class
  const rewardCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(rewards, classes, students);
  }, [rewards, classes, students]);

  // Filtered Achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === a.studentId);
        const match = isStudentInClass(a, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (selectedLevel !== 'all' && a.level !== selectedLevel) return false;
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      return true;
    });
  }, [achievements, selectedClass, selectedLevel, selectedCategory, classes, students]);

  // Filtered Rewards
  const filteredRewards = useMemo(() => {
    return rewards.filter(r => {
      if (selectedRewardClass !== 'all') {
        const student = students.find(s => s.id === r.studentId);
        const match = isStudentInClass(r, selectedRewardClass, classes) || (student && isStudentInClass(student, selectedRewardClass, classes));
        if (!match) return false;
      }
      if (selectedRewardCategory !== 'all' && r.category !== selectedRewardCategory) return false;
      if (selectedRewardStatus !== 'all' && (r.status || 'Diverifikasi') !== selectedRewardStatus) return false;
      return true;
    });
  }, [rewards, selectedRewardClass, selectedRewardCategory, selectedRewardStatus, classes, students]);

  // Statistics for Rewards Tab
  const rewardStats = useMemo(() => {
    const uniqueStudentIds = new Set(rewards.map(r => r.studentId).filter(Boolean));
    const totalPointsGiven = rewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
    const avgPoints = uniqueStudentIds.size > 0 ? Math.round(totalPointsGiven / uniqueStudentIds.size) : 0;

    return {
      totalRecipients: uniqueStudentIds.size,
      totalPointsGiven,
      avgPoints,
      totalRecords: rewards.length
    };
  }, [rewards]);

  // Helper to get student's total achievement points
  const getStudentTotalRewardPoints = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student?.achievementPoints !== undefined) {
      return student.achievementPoints;
    }
    const studentRews = rewards.filter(r => r.studentId === studentId);
    return studentRews.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  };

  // Handlers - Achievements
  const handleOpenAdd = () => {
    setSelectedAchievement(null);
    setAchievementStudentSearchQuery('');
    setAchievementStudentClassFilter('all');
    const defaultStudent = students[0];
    setFormData({
      title: '',
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      extracurricularId: extracurriculars[0]?.id || '',
      extracurricularName: extracurriculars[0]?.name || '',
      category: 'Olahraga',
      level: 'Kota/Kabupaten',
      rank: 'Juara 1',
      organizer: 'Dinas Pendidikan & Olahraga',
      date: new Date().toISOString().split('T')[0],
      description: 'Meraih prestasi membanggakan pada kompetisi.',
      pointsAwarded: 25
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ach: Achievement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAchievement(ach);
    setFormData(ach);
    setAchievementStudentSearchQuery('');
    setAchievementStudentClassFilter('all');
    setIsFormOpen(true);
  };

  const handleOpenDetail = (ach: Achievement) => {
    setSelectedAchievement(ach);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (ach: Achievement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedAchievement(ach);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.studentId || !formData.organizer) {
      toast.warning('Mohon isi nama prestasi/lomba, nama siswa, dan pihak penyelenggara.');
      return;
    }

    setIsSavingAchievement(true);
    try {
      const student = students.find(s => s.id === formData.studentId);
      const ekskul = extracurriculars.find(e => e.id === formData.extracurricularId);

      if (selectedAchievement) {
        await updateAchievement(selectedAchievement.id, {
          ...formData,
          studentName: student?.fullName || formData.studentName,
          studentNis: student?.nis || formData.studentNis,
          studentClass: student?.className || formData.studentClass,
          extracurricularName: ekskul?.name || formData.extracurricularName
        });
        toast.success(`Data prestasi "${formData.title}" berhasil diperbarui!`);
      } else {
        await addAchievement({
          title: formData.title!,
          studentId: formData.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentNis: student?.nis || '',
          studentClass: student?.className || '',
          extracurricularId: formData.extracurricularId || '',
          extracurricularName: ekskul?.name || 'Independen / Sekolah',
          category: formData.category as AchievementCategory,
          level: formData.level as AchievementLevel,
          rank: formData.rank!,
          organizer: formData.organizer!,
          date: formData.date!,
          description: formData.description || '',
          certificateUrl: formData.certificateUrl || '',
          pointsAwarded: Number(formData.pointsAwarded) || 20,
          academicYear: activeAcademicYear
        });
        toast.success(`Prestasi "${formData.title}" berhasil dicatat (+${formData.pointsAwarded} Poin)!`);
      }
      setIsFormOpen(false);
      setSelectedAchievement(null);
    } catch (err: any) {
      console.error('Error saving achievement:', err);
      toast.error('Gagal mencatat prestasi: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingAchievement(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedAchievement) {
      try {
        await deleteAchievement(selectedAchievement.id, selectedAchievement.studentId, selectedAchievement.pointsAwarded);
        toast.success('Data prestasi berhasil dihapus.');
      } catch (err) {
        console.error('Error deleting achievement:', err);
        toast.error('Gagal menghapus prestasi.');
      } finally {
        setIsDeleteOpen(false);
        setSelectedAchievement(null);
      }
    }
  };

  // Handlers - Rewards
  const handleOpenAddReward = () => {
    setSelectedReward(null);
    setRewardStudentSearchQuery('');
    setRewardStudentClassFilter('all');
    setRewardRuleSearchQuery('');
    const defaultStudent = students[0];
    setRewardFormData({
      studentId: defaultStudent?.id || '',
      studentName: defaultStudent?.fullName || '',
      studentNis: defaultStudent?.nis || '',
      studentClass: defaultStudent?.className || '',
      rewardTitle: '',
      category: 'Kedisiplinan & Karakter',
      points: 10,
      date: new Date().toISOString().split('T')[0],
      officerName: currentUser?.displayName || 'Tim Kesiswaan',
      description: 'Pemberian apresiasi atas keteladanan / kepatuhan disiplin siswa.',
      actionTaken: 'Pemberian piagam penghargaan & penambahan poin apresiasi',
      status: 'Diverifikasi'
    });
    setIsRewardFormOpen(true);
  };

  const handleOpenEditReward = (rew: StudentReward, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReward(rew);
    setRewardFormData(rew);
    setRewardStudentSearchQuery('');
    setRewardStudentClassFilter('all');
    setRewardRuleSearchQuery('');
    setIsRewardFormOpen(true);
  };

  const handleOpenDetailReward = (rew: StudentReward) => {
    setSelectedReward(rew);
    setIsRewardDetailOpen(true);
  };

  const handleOpenDeleteReward = (rew: StudentReward, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReward(rew);
    setIsRewardDeleteOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardFormData.studentId || !rewardFormData.rewardTitle) {
      toast.warning('Mohon pilih siswa dan isi judul/alasan apresiasi reward.');
      return;
    }

    setIsSavingReward(true);
    try {
      const student = students.find(s => s.id === rewardFormData.studentId);
      const points = Number(rewardFormData.points) || 10;

      if (selectedReward) {
        await updateReward(selectedReward.id, {
          ...rewardFormData,
          points,
          studentName: student?.fullName || rewardFormData.studentName,
          studentNis: student?.nis || rewardFormData.studentNis,
          studentClass: student?.className || rewardFormData.studentClass
        });
        toast.success(`Data reward untuk "${student?.fullName || 'siswa'}" berhasil diperbarui!`);
      } else {
        await addReward({
          studentId: rewardFormData.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentNis: student?.nis || '',
          studentClass: student?.className || '',
          studentCode: student?.code || '',
          rewardTitle: rewardFormData.rewardTitle!,
          category: (rewardFormData.category as RewardCategory) || 'Kedisiplinan & Karakter',
          points,
          date: rewardFormData.date!,
          officerName: rewardFormData.officerName || currentUser?.displayName || 'Tim Kesiswaan',
          description: rewardFormData.description || '',
          actionTaken: rewardFormData.actionTaken || 'Pemberian piagam penghargaan',
          status: (rewardFormData.status as RewardStatus) || 'Diverifikasi',
          academicYear: activeAcademicYear
        });
        toast.success(`Reward "${rewardFormData.rewardTitle}" untuk ${student?.fullName || 'siswa'} berhasil dicatat (+${points} Poin)!`);
      }
      setIsRewardFormOpen(false);
      setSelectedReward(null);
    } catch (err: any) {
      console.error('Error saving reward:', err);
      toast.error('Gagal mencatat reward: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleDeleteRewardConfirm = async () => {
    if (selectedReward) {
      try {
        await deleteReward(selectedReward.id, selectedReward.studentId, selectedReward.points);
        toast.success('Catatan reward siswa berhasil dihapus.');
      } catch (err) {
        console.error('Error deleting reward:', err);
        toast.error('Gagal menghapus catatan reward.');
      } finally {
        setIsRewardDeleteOpen(false);
        setSelectedReward(null);
      }
    }
  };

  // Columns - Achievements
  const achievementColumns: Column<Achievement>[] = [
    {
      header: 'Prestasi & Kejuaraan',
      accessorKey: 'title',
      sortable: true,
      cell: a => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{a.title}</p>
          <p className="text-[11px] text-slate-400">
            {a.extracurricularName || 'Sekolah'} • Penyelenggara: {a.organizer}
          </p>
        </div>
      )
    },
    {
      header: 'Peraih Prestasi (Siswa)',
      accessorKey: 'studentName',
      sortable: true,
      cell: a => (
        <div>
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{a.studentName}</span>
          <p className="text-[11px] text-slate-400">NIS: {a.studentNis} • Kelas: {a.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Capaian & Tingkat',
      accessorKey: 'rank',
      sortable: true,
      cell: a => (
        <div className="text-xs">
          <span className="font-extrabold text-amber-600 dark:text-amber-400">🏆 {a.rank}</span>
          <p className="text-[11px] text-slate-500 font-medium">Tingkat {a.level}</p>
        </div>
      )
    },
    {
      header: 'Poin & Tanggal',
      accessorKey: 'pointsAwarded',
      sortable: true,
      cell: a => (
        <div className="text-xs">
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900">
            +{a.pointsAwarded} Poin
          </span>
          <p className="text-[10px] text-slate-400 mt-1">📅 {a.date}</p>
        </div>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: a => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetail(a)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Piagam & Detail Prestasi"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEdit(a, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Prestasi Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDelete(a, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Prestasi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Columns - Rewards (Modeled identically like Violations table)
  const rewardColumns: Column<StudentReward>[] = [
    {
      header: 'Nama Siswa & Identitas',
      accessorKey: 'studentName',
      sortable: true,
      cell: r => {
        const totalRewardPts = getStudentTotalRewardPoints(r.studentId);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              {r.studentCode && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {r.studentCode}
                </span>
              )}
              <p className="font-bold text-slate-900 dark:text-slate-100">{r.studentName}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                NIS: {r.studentNis} • Kelas: {r.studentClass}
              </p>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded border bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                Total: +{totalRewardPts} Poin
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Bentuk Apresiasi / Reward',
      accessorKey: 'rewardTitle',
      sortable: true,
      cell: r => (
        <div>
          <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
            {r.rewardTitle}
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
            {r.description || r.actionTaken || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Kategori & Poin (+)',
      accessorKey: 'points',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-300 dark:border-emerald-800 shadow-xs">
            +{r.points} Poin
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
            ({r.category})
          </span>
        </div>
      )
    },
    {
      header: 'Tindakan & Petugas',
      accessorKey: 'actionTaken',
      cell: r => (
        <div className="text-xs">
          <p className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
            {r.actionTaken || 'Piagam Penghargaan'}
          </p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            Oleh: {r.officerName} • 📅 {r.date}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: r => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          {r.status || 'Diverifikasi'}
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: r => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenDetailReward(r)}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 transition-colors"
            title="Lihat Detail Reward"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenEditReward(r, e)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-400 transition-colors"
            title="Edit Reward Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => handleOpenDeleteReward(r, e)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 transition-colors"
            title="Hapus Reward"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              SISTEM APRESIASI & PRESTASI
            </span>
            <span className="text-xs text-slate-400">• Tahun Ajaran {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Buku Induk Prestasi & Reward Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen penghargaan, pemulihan poin keteladanan, dan rekam jejak juara siswa terintegrasi ke Firebase Firestore.
          </p>
        </div>

        {/* Tab Navigation (Opsi A) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-center shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Tabel Reward Siswa</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {rewards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Prestasi & Kejuaraan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold">
              {achievements.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TABEL REWARD SISWA (MIRIP TABEL VIOLATION)                         */}
      {/* ========================================================================= */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Penerima Reward</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                {rewardStats.totalRecipients} <span className="text-xs font-sans font-normal text-slate-400">Siswa</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Tercatat resmi di Firebase Firestore
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Poin Apresiasi</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
                +{rewardStats.totalPointsGiven} <span className="text-xs font-sans font-normal text-slate-400">Poin</span>
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Poin reward & pemutihan aktif
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rata-rata per Siswa</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                +{rewardStats.avgPoints} <span className="text-xs font-sans font-normal text-slate-400">Poin</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Rata-rata capaian apresiasi
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Transaksi Reward</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2 font-mono">
                {rewardStats.totalRecords} <span className="text-xs font-sans font-normal text-slate-400">Catatan</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Tersusun rapi seperti tabel pelanggaran
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Daftar & Rekapitulasi Poin Reward Siswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan reward dapat berupa piagam prestasi, teladan akhlak, maupun pemutihan poin pelanggaran.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ExportActions
                filename="rekapitulasi_reward_siswa"
                title="Laporan Rekapitulasi Poin Reward Siswa"
                data={filteredRewards}
                headers={[
                  { header: 'Tanggal', key: 'date' },
                  { header: 'Nama Siswa', key: 'studentName' },
                  { header: 'NIS', key: 'studentNis' },
                  { header: 'Kelas', key: 'studentClass' },
                  { header: 'Judul Apresiasi', key: 'rewardTitle' },
                  { header: 'Kategori', key: 'category' },
                  { header: 'Poin Reward (+)', key: 'points' },
                  { header: 'Tindakan', key: 'actionTaken' },
                  { header: 'Petugas / Guru', key: 'officerName' },
                  { header: 'Status', key: 'status' }
                ]}
              />

              <button
                type="button"
                onClick={handleOpenAddReward}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Berikan Reward</span>
              </button>
            </div>
          </div>

          {/* Class Grid Filter for Rewards */}
          <ClassGridFilter
            classes={classes}
            selectedClassId={selectedRewardClass}
            onSelectClass={setSelectedRewardClass}
            countsByClassId={rewardCountsByClassId}
            totalCount={rewards.length}
            label="Filter Reward Berdasarkan Rombel Kelas"
            itemUnit="Reward"
            colorScheme="emerald"
          />

          {/* Secondary Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <Filter className="w-4 h-4" />
              <span>Filter Kategori & Status:</span>
            </div>

            <select
              value={selectedRewardCategory}
              onChange={e => setSelectedRewardCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">Semua Kategori ({rewards.length})</option>
              {rewardCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedRewardStatus}
              onChange={e => setSelectedRewardStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="Diverifikasi">Diverifikasi</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Diberikan">Diberikan</option>
            </select>

            {(selectedRewardClass !== 'all' || selectedRewardCategory !== 'all' || selectedRewardStatus !== 'all') && (
              <button
                onClick={() => {
                  setSelectedRewardClass('all');
                  setSelectedRewardCategory('all');
                  setSelectedRewardStatus('all');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Rewards DataTable */}
          <DataTable
            id="rewards-table"
            data={filteredRewards}
            columns={rewardColumns}
            searchPlaceholder="Cari siswa, nama apresiasi, NIS, atau petugas..."
            searchableKeys={['rewardTitle', 'studentName', 'studentNis', 'category', 'officerName']}
            onRowClick={handleOpenDetailReward}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAFTAR PRESTASI & KEJUARAAN LOMBA                                  */}
      {/* ========================================================================= */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Piala & Kejuaraan Lomba Siswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data keikutsertaan kompetisi OSN, O2SN, FLS2N, KSM, dan turnamen resmi lainnya.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ExportActions
                filename="daftar_prestasi_siswa"
                title="Laporan Rekapitulasi Prestasi Siswa"
                data={filteredAchievements}
                headers={[
                  { header: 'Nama Prestasi', key: 'title' },
                  { header: 'Nama Siswa', key: 'studentName' },
                  { header: 'NIS', key: 'studentNis' },
                  { header: 'Kelas', key: 'studentClass' },
                  { header: 'Peringkat', key: 'rank' },
                  { header: 'Tingkat', key: 'level' },
                  { header: 'Kategori', key: 'category' },
                  { header: 'Penyelenggara', key: 'organizer' },
                  { header: 'Tanggal', key: 'date' },
                  { header: 'Poin Reward', key: 'pointsAwarded' }
                ]}
              />

              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Prestasi</span>
              </button>
            </div>
          </div>

          {/* Class Grid Filter */}
          <ClassGridFilter
            classes={classes}
            selectedClassId={selectedClass}
            onSelectClass={setSelectedClass}
            countsByClassId={achievementCountsByClassId}
            totalCount={achievements.length}
            label="Filter Prestasi Berdasarkan Rombel Kelas"
            itemUnit="Prestasi"
            colorScheme="amber"
          />

          {/* Secondary Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <Filter className="w-4 h-4" />
              <span>Filter Lanjutan:</span>
            </div>

            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">Semua Tingkat ({achievements.length})</option>
              {levels.map(lvl => (
                <option key={lvl} value={lvl}>
                  Tingkat {lvl}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">Semua Kategori</option>
              <option value="Akademik">Akademik</option>
              <option value="Olahraga">Olahraga</option>
              <option value="Seni">Seni & Budaya</option>
              <option value="Keagamaan">Keagamaan</option>
              <option value="Teknologi">Teknologi & Robotik</option>
              <option value="Kepemimpinan">Kepemimpinan</option>
            </select>

            {(selectedClass !== 'all' || selectedLevel !== 'all' || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedClass('all');
                  setSelectedLevel('all');
                  setSelectedCategory('all');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold ml-auto cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Table */}
          <DataTable
            id="achievements-table"
            data={filteredAchievements}
            columns={achievementColumns}
            searchPlaceholder="Cari nama lomba, siswa, atau penyelenggara..."
            searchableKeys={['title', 'studentName', 'studentNis', 'organizer', 'rank']}
            onRowClick={handleOpenDetail}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM BERIKAN REWARD SISWA                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRewardFormOpen}
        onClose={() => setIsRewardFormOpen(false)}
        title={selectedReward ? 'Edit Data Reward Siswa' : 'Berikan Reward & Apresiasi Siswa'}
        subtitle="Data akan tersimpan rapi di tabel rewards Firebase Firestore & memperbarui poin siswa"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsRewardFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSavingReward}
              onClick={handleSaveReward}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                isSavingReward ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingReward ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Firebase...</span>
                </>
              ) : (
                <span>Simpan Reward</span>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveReward} className="space-y-4">
          {/* Quick Select Student Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Siswa Penerima Reward *
              </label>
              {rewardFormData.studentName && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Terpilih: {rewardFormData.studentName} ({rewardFormData.studentClass || '-'})
                </span>
              )}
            </div>

            {/* Student Search & Class Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS siswa..."
                  value={rewardStudentSearchQuery}
                  onChange={e => setRewardStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <select
                value={rewardStudentClassFilter}
                onChange={e => setRewardStudentClassFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 shrink-0"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Interactive Student Selection Cards / Grid */}
            <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200/80 dark:border-slate-800 rounded-lg p-1.5 bg-slate-50/60 dark:bg-slate-900/60">
              {displayedRewardStudents.length === 0 ? (
                <div className="col-span-full py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada siswa yang cocok dengan pencarian "{rewardStudentSearchQuery}".
                </div>
              ) : (
                displayedRewardStudents.map(s => {
                  const isSelected = rewardFormData.studentId === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setRewardFormData({
                          ...rewardFormData,
                          studentId: s.id,
                          studentName: s.fullName,
                          studentNis: s.nis,
                          studentClass: s.className || '',
                          studentCode: s.code || ''
                        });
                      }}
                      className={`text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <p className="truncate font-semibold">{s.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          NIS: {s.nis || '-'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{s.className || '-'}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Pedoman Reward Berdasarkan Tata Tertib Resmi Sekolah */}
          {rewardRules && rewardRules.length > 0 && (
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Pedoman Reward & Apresiasi Tata Tertib Resmi ({rewardRules.length} Ketentuan)</span>
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Klik kartu untuk auto-fill</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari pedoman reward (kode, nama apresiasi, tahfidz, kejujuran, prestasi)..."
                  value={rewardRuleSearchQuery}
                  onChange={e => setRewardRuleSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="max-h-36 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {displayedRewardRules.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada pedoman reward yang cocok dengan "{rewardRuleSearchQuery}".
                  </div>
                ) : (
                  displayedRewardRules.map(r => {
                    const positivePoints = Math.abs(r.points) || 10;
                    const isSelected =
                      rewardFormData.rewardTitle === `[${r.code || 'REWARD'}] ${r.title}` ||
                      rewardFormData.rewardTitle === r.title;

                    return (
                      <button
                        type="button"
                        key={r.id || r.code}
                        onClick={() => handleSelectRewardRule(r)}
                        className={`text-left p-2 rounded-lg border text-xs transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-500 shadow-sm'
                            : 'border-emerald-200/80 dark:border-emerald-900/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-400 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            {r.code || r.articleNumber}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            +{positivePoints} Poin
                          </span>
                        </div>
                        <p className="text-[11px] font-medium line-clamp-1">{r.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                          {r.consequence || r.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bentuk Apresiasi / Judul Reward *
            </label>
            <input
              type="text"
              required
              value={rewardFormData.rewardTitle}
              onChange={e => setRewardFormData({ ...rewardFormData, rewardTitle: e.target.value })}
              placeholder="Contoh: Keteladanan Akhlakul Karimah / Hafalan Juz 30 / Juara 1 Olimpiade"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Reward
              </label>
              <select
                value={rewardFormData.category}
                onChange={e => setRewardFormData({ ...rewardFormData, category: e.target.value as RewardCategory })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {rewardCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Poin Reward Tambahan (+) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  required
                  value={rewardFormData.points}
                  onChange={e => setRewardFormData({ ...rewardFormData, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-emerald-600"
                />
                <div className="flex items-center gap-1">
                  {[5, 10, 20, 25].map(pts => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setRewardFormData({ ...rewardFormData, points: pts })}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                    >
                      +{pts}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Diberikan
              </label>
              <input
                type="date"
                required
                value={rewardFormData.date}
                onChange={e => setRewardFormData({ ...rewardFormData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Petugas / Guru Pemberi
              </label>
              <input
                type="text"
                value={rewardFormData.officerName}
                onChange={e => setRewardFormData({ ...rewardFormData, officerName: e.target.value })}
                placeholder="Contoh: Guru Pembina / Waka Kesiswaan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tindakan Apresiasi / Bentuk Penghargaan
            </label>
            <input
              type="text"
              value={rewardFormData.actionTaken}
              onChange={e => setRewardFormData({ ...rewardFormData, actionTaken: e.target.value })}
              placeholder="Contoh: Penyerahan piagam saat upacara & pemutihan poin pelanggaran"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Uraian / Keterangan Tambahan
            </label>
            <textarea
              rows={2}
              value={rewardFormData.description}
              onChange={e => setRewardFormData({ ...rewardFormData, description: e.target.value })}
              placeholder="Catatan prestasi, perilaku terpuji, atau kejuaraan yang diraih..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL REWARD SISWA                                                */}
      {/* ========================================================================= */}
      {selectedReward && (
        <Modal
          isOpen={isRewardDetailOpen}
          onClose={() => setIsRewardDetailOpen(false)}
          title={`Detail Apresiasi: ${selectedReward.rewardTitle}`}
          subtitle={`${selectedReward.studentName} (${selectedReward.studentClass} • NIS: ${selectedReward.studentNis})`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setIsRewardDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white cursor-pointer"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                  🎖️ {selectedReward.rewardTitle}
                </span>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-black text-xs shadow-xs">
                  +{selectedReward.points} Poin Reward
                </span>
              </div>
              <p><strong>Kategori:</strong> {selectedReward.category}</p>
              <p><strong>Tanggal Pemberian:</strong> {selectedReward.date}</p>
              <p><strong>Petugas / Guru Pencatat:</strong> {selectedReward.officerName}</p>
              <p><strong>Tindakan Apresiasi:</strong> {selectedReward.actionTaken || '-'}</p>
              <p><strong>Status:</strong> {selectedReward.status || 'Diverifikasi'}</p>
              <p className="mt-2 text-slate-700 dark:text-slate-300">
                <strong>Keterangan:</strong> {selectedReward.description || '-'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM CATAT PRESTASI LOMBA                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedAchievement ? 'Edit Prestasi Siswa' : 'Catat Prestasi Baru'}
        subtitle="Data prestasi akan diverifikasi dan menambah poin penghargaan siswa"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSavingAchievement}
              onClick={handleSave}
              className={`px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                isSavingAchievement ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSavingAchievement ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Prestasi</span>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick Select Student Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Siswa Peraih Prestasi *
              </label>
              {formData.studentName && (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  Terpilih: {formData.studentName} ({formData.studentClass || '-'})
                </span>
              )}
            </div>

            {/* Student Search & Class Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS siswa..."
                  value={achievementStudentSearchQuery}
                  onChange={e => setAchievementStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <select
                value={achievementStudentClassFilter}
                onChange={e => setAchievementStudentClassFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 shrink-0"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Interactive Student Selection Cards / Grid */}
            <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200/80 dark:border-slate-800 rounded-lg p-1.5 bg-slate-50/60 dark:bg-slate-900/60">
              {displayedAchievementStudents.length === 0 ? (
                <div className="col-span-full py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada siswa yang cocok dengan pencarian "{achievementStudentSearchQuery}".
                </div>
              ) : (
                displayedAchievementStudents.map(s => {
                  const isSelected = formData.studentId === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          studentId: s.id,
                          studentName: s.fullName,
                          studentNis: s.nis,
                          studentClass: s.className || ''
                        });
                      }}
                      className={`text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 font-bold shadow-sm ring-1 ring-amber-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <p className="truncate font-semibold">{s.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          NIS: {s.nis || '-'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{s.className || '-'}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lomba / Kejuaraan / Prestasi *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Juara 1 Olimpiade Sains Nasional (OSN) Bidang Informatika"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peringkat Capaian *
              </label>
              <input
                type="text"
                required
                value={formData.rank}
                onChange={e => setFormData({ ...formData, rank: e.target.value })}
                placeholder="Juara 1 / Medali Emas"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Kejuaraan
              </label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as AchievementLevel })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>
                    Tingkat {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as AchievementCategory })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Akademik">Akademik</option>
                <option value="Olahraga">Olahraga</option>
                <option value="Seni">Seni & Budaya</option>
                <option value="Keagamaan">Keagamaan</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Kepemimpinan">Kepemimpinan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pihak Penyelenggara *
              </label>
              <input
                type="text"
                required
                value={formData.organizer}
                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="Kemendikbudristek / Pemprov"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Raihan
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reward Poin Siswa (+)
              </label>
              <input
                type="number"
                value={formData.pointsAwarded}
                onChange={e => setFormData({ ...formData, pointsAwarded: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kaitkan ke Ekstrakurikuler
            </label>
            <select
              value={formData.extracurricularId}
              onChange={e => {
                const eks = extracurriculars.find(ek => ek.id === e.target.value);
                setFormData({
                  ...formData,
                  extracurricularId: e.target.value,
                  extracurricularName: eks?.name || 'Independen / Sekolah'
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Independen / Prestasi Sekolah</option>
              {extracurriculars.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan / Deskripsi Capaian
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi keikutsertaan lomba..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PRESTASI SISWA                                              */}
      {/* ========================================================================= */}
      {selectedAchievement && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Prestasi: ${selectedAchievement.title}`}
          subtitle={`${selectedAchievement.studentName} (${selectedAchievement.studentClass})`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white cursor-pointer"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-700 dark:text-amber-300 text-sm">
                  🏆 {selectedAchievement.rank} ({selectedAchievement.level})
                </span>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded font-bold">
                  +{selectedAchievement.pointsAwarded} Poin
                </span>
              </div>
              <p><strong>Kategori:</strong> {selectedAchievement.category}</p>
              <p><strong>Penyelenggara:</strong> {selectedAchievement.organizer}</p>
              <p><strong>Tanggal Raihan:</strong> {selectedAchievement.date}</p>
              <p><strong>Ekstrakurikuler Terkait:</strong> {selectedAchievement.extracurricularName || 'Sekolah'}</p>
              <p className="mt-2"><strong>Deskripsi:</strong> {selectedAchievement.description || '-'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG: HAPUS PRESTASI                                            */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Prestasi"
        message={`Apakah Anda yakin ingin menghapus catatan prestasi "${selectedAchievement?.title}"?`}
        confirmText="Hapus Prestasi"
        variant="danger"
      />

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG: HAPUS REWARD SISWA                                        */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={isRewardDeleteOpen}
        onClose={() => setIsRewardDeleteOpen(false)}
        onCancel={() => setIsRewardDeleteOpen(false)}
        onConfirm={handleDeleteRewardConfirm}
        title="Hapus Catatan Reward Siswa"
        message={`Apakah Anda yakin ingin menghapus catatan reward "${selectedReward?.rewardTitle}" untuk ${selectedReward?.studentName}? Poin siswa akan otomatis dikalkulasi ulang.`}
        confirmText="Hapus Reward"
        variant="danger"
      />
    </div>
  );
};
