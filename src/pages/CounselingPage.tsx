import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  Filter,
  UserCheck,
  Home,
  Mail,
  Compass,
  FileText,
  Printer,
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronRight,
  Send,
  Building,
  GraduationCap
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import {
  StudentCounseling,
  HomeVisitRecord,
  ParentCallLetter,
  CareerGuidanceRecord,
  CallLetterStatus
} from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

type ActiveBkTab = 'counseling' | 'home_visit' | 'parent_call' | 'career' | 'analytics';

export const CounselingPage: React.FC = () => {
  const { isWakaOrAdmin, isGuruBK, currentUser } = useAuth();
  const {
    counseling,
    homeVisits,
    parentCallLetters,
    careerGuidances,
    students,
    classes,
    violations,
    schoolSetting,
    addCounseling,
    updateCounseling,
    deleteCounselingSession,
    addHomeVisit,
    updateHomeVisit,
    deleteHomeVisit,
    addParentCallLetter,
    updateParentCallLetter,
    deleteParentCallLetter,
    addCareerGuidance,
    updateCareerGuidance,
    deleteCareerGuidance,
    activeAcademicYear,
    activeSemester
  } = useSchool();

  const [activeTab, setActiveTab] = useState<ActiveBkTab>('counseling');

  // Filter states
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [counselingStatusFilter, setCounselingStatusFilter] = useState<string>('all');
  const [counselingFieldFilter, setCounselingFieldFilter] = useState<string>('all');
  const [homeVisitStatusFilter, setHomeVisitStatusFilter] = useState<string>('all');
  const [parentCallStatusFilter, setParentCallStatusFilter] = useState<string>('all');

  // Class counts for counseling
  const counselingCountsByClassId = useMemo(() => {
    return calculateRecordCountsByClass(counseling, classes, students);
  }, [counseling, classes, students]);

  // Modals
  const [isCounselingModalOpen, setIsCounselingModalOpen] = useState(false);
  const [isHomeVisitModalOpen, setIsHomeVisitModalOpen] = useState(false);
  const [isParentCallModalOpen, setIsParentCallModalOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);

  // Detail / Print Modals
  const [detailCounseling, setDetailCounseling] = useState<StudentCounseling | null>(null);
  const [detailHomeVisit, setDetailHomeVisit] = useState<HomeVisitRecord | null>(null);
  const [detailParentCall, setDetailParentCall] = useState<ParentCallLetter | null>(null);
  const [detailCareer, setDetailCareer] = useState<CareerGuidanceRecord | null>(null);
  const [printParentCallLetter, setPrintParentCallLetter] = useState<ParentCallLetter | null>(null);
  const [printHomeVisitLetter, setPrintHomeVisitLetter] = useState<HomeVisitRecord | null>(null);

  // Deletions
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'counseling' | 'home_visit' | 'parent_call' | 'career';
    id: string;
    name: string;
  } | null>(null);

  // Selected item for edit
  const [editingCounseling, setEditingCounseling] = useState<StudentCounseling | null>(null);
  const [editingHomeVisit, setEditingHomeVisit] = useState<HomeVisitRecord | null>(null);
  const [editingParentCall, setEditingParentCall] = useState<ParentCallLetter | null>(null);
  const [editingCareer, setEditingCareer] = useState<CareerGuidanceRecord | null>(null);

  // Form States
  const [counselingForm, setCounselingForm] = useState<Partial<StudentCounseling>>({
    studentId: '',
    studentName: '',
    studentClass: '',
    studentNis: '',
    date: new Date().toISOString().split('T')[0],
    counselorName: currentUser?.displayName || 'Guru BK',
    serviceField: 'Belajar',
    counselingType: 'Individu',
    urgencyLevel: 'Sedang',
    topic: '',
    notes: '',
    solution: '',
    parentInvolved: false,
    followUpPlan: '',
    status: 'Selesai'
  });

  const [homeVisitForm, setHomeVisitForm] = useState<Partial<HomeVisitRecord>>({
    studentId: '',
    studentName: '',
    studentClass: '',
    studentNis: '',
    date: new Date().toISOString().split('T')[0],
    address: '',
    counselorName: currentUser?.displayName || 'Guru BK',
    companionName: 'Wali Kelas',
    visitedPerson: '',
    relationship: 'Ayah',
    phone: '',
    purpose: '',
    familyConditions: '',
    studentStudyEnvironment: '',
    findings: '',
    agreements: '',
    followUpPlan: '',
    status: 'Terlaksana'
  });

  const [parentCallForm, setParentCallForm] = useState<Partial<ParentCallLetter>>({
    studentId: '',
    studentName: '',
    studentClass: '',
    studentNis: '',
    parentName: '',
    letterNumber: `421.3/BK-SP1/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    callNumber: 1,
    callDate: new Date().toISOString().split('T')[0],
    callTime: '08:30 WIB',
    location: 'Ruang Bimbingan & Konseling (BK)',
    reason: '',
    counselorName: currentUser?.displayName || 'Guru BK',
    counselorNip: currentUser?.nip || '198509122010012008',
    wakaName: schoolSetting?.wakaName || 'Waka Kesiswaan',
    status: 'Diterbitkan',
    notes: ''
  });

  const [careerForm, setCareerForm] = useState<Partial<CareerGuidanceRecord>>({
    studentId: '',
    studentName: '',
    studentClass: '',
    studentNis: '',
    careerInterest: 'Perguruan Tinggi Negeri (PTN)',
    targetPath: 'PTN (SNBP/SNBT)',
    targetInstitution: 'Institut Teknologi Bandung (ITB)',
    targetMajor: 'Teknik Informatika',
    psychologicalTestScore: 'Skor Potensi Akademik: 640 (Sangat Baik)',
    strengths: 'Kemampuan analisis kuantitatif dan logika matematika tinggi',
    obstacles: 'Perlu bimbingan pemilihan prioritas prodi dan strategi portofolio SNBP',
    counselorRecommendation: 'Direkomendasikan fokus SNBP pada rumpun Saintek dan intensif tryout SNBT',
    counselorName: currentUser?.displayName || 'Guru BK',
    status: 'Sudah Terarah'
  });

  // Print trigger
  const handlePrintDocument = () => {
    window.print();
  };

  // ==========================================
  // COUNSELING HANDLERS
  // ==========================================
  const handleOpenAddCounseling = () => {
    setEditingCounseling(null);
    const def = students[0];
    setCounselingForm({
      studentId: def?.id || '',
      studentName: def?.fullName || '',
      studentClass: def?.className || '',
      studentNis: def?.nis || '',
      date: new Date().toISOString().split('T')[0],
      counselorName: currentUser?.displayName || 'Guru BK',
      serviceField: 'Belajar',
      counselingType: 'Individu',
      urgencyLevel: 'Sedang',
      topic: '',
      notes: '',
      solution: '',
      parentInvolved: false,
      followUpPlan: '',
      status: 'Selesai'
    });
    setIsCounselingModalOpen(true);
  };

  const handleOpenEditCounseling = (item: StudentCounseling, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCounseling(item);
    setCounselingForm(item);
    setIsCounselingModalOpen(true);
  };

  const handleSaveCounseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselingForm.studentId || !counselingForm.topic || !counselingForm.notes) {
      alert('Mohon lengkapi siswa, topik, dan catatan pembinaan.');
      return;
    }
    try {
      const student = students.find(s => s.id === counselingForm.studentId);
      if (editingCounseling) {
        await updateCounseling(editingCounseling.id, {
          ...counselingForm,
          studentName: student?.fullName || counselingForm.studentName,
          studentClass: student?.className || counselingForm.studentClass,
          studentNis: student?.nis || counselingForm.studentNis
        });
      } else {
        await addCounseling({
          studentId: counselingForm.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentClass: student?.className || '',
          studentNis: student?.nis || '',
          date: counselingForm.date!,
          counselorName: counselingForm.counselorName || currentUser?.displayName || 'Guru BK',
          serviceField: counselingForm.serviceField || 'Belajar',
          counselingType: counselingForm.counselingType || 'Individu',
          urgencyLevel: counselingForm.urgencyLevel || 'Sedang',
          topic: counselingForm.topic!,
          notes: counselingForm.notes!,
          solution: counselingForm.solution || '',
          parentInvolved: Boolean(counselingForm.parentInvolved),
          followUpPlan: counselingForm.followUpPlan || '',
          status: (counselingForm.status as any) || 'Selesai',
          academicYear: activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving counseling:', err);
    } finally {
      setIsCounselingModalOpen(false);
      setEditingCounseling(null);
    }
  };

  // ==========================================
  // HOME VISIT HANDLERS
  // ==========================================
  const handleOpenAddHomeVisit = () => {
    setEditingHomeVisit(null);
    const def = students[0];
    setHomeVisitForm({
      studentId: def?.id || '',
      studentName: def?.fullName || '',
      studentClass: def?.className || '',
      studentNis: def?.nis || '',
      date: new Date().toISOString().split('T')[0],
      address: def?.address || 'Jl. Melati No. 12',
      counselorName: currentUser?.displayName || 'Guru BK',
      companionName: 'Wali Kelas & Tim Kesiswaan',
      visitedPerson: def?.parentName || 'Bapak/Ibu Orang Tua Siswa',
      relationship: 'Ayah',
      phone: def?.parentPhone || def?.phone || '',
      purpose: 'Klarifikasi ketidakhadiran lebih dari 3 hari berturut-turut & motivasi belajar',
      familyConditions: 'Keluarga mendukung, orang tua bekerja wiraswasta',
      studentStudyEnvironment: 'Ruang belajar cukup tenang, fasilitas memadai',
      findings: 'Siswa mengalami demam dan kendala komunikasi sehingga belum mengirimkan surat keterangan',
      agreements: 'Orang tua berkomitmen memantau kedisiplinan dan mengabari sekolah setiap pagi',
      followUpPlan: 'Monitoring absensi dan presensi belajar harian',
      status: 'Terlaksana'
    });
    setIsHomeVisitModalOpen(true);
  };

  const handleOpenEditHomeVisit = (item: HomeVisitRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingHomeVisit(item);
    setHomeVisitForm(item);
    setIsHomeVisitModalOpen(true);
  };

  const handleSaveHomeVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeVisitForm.studentId || !homeVisitForm.purpose || !homeVisitForm.findings) {
      alert('Mohon lengkapi siswa, alasan kunjungan, dan hasil temuan kunjungan.');
      return;
    }
    try {
      const student = students.find(s => s.id === homeVisitForm.studentId);
      if (editingHomeVisit) {
        await updateHomeVisit(editingHomeVisit.id, {
          ...homeVisitForm,
          studentName: student?.fullName || homeVisitForm.studentName,
          studentClass: student?.className || homeVisitForm.studentClass,
          studentNis: student?.nis || homeVisitForm.studentNis
        });
      } else {
        await addHomeVisit({
          studentId: homeVisitForm.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentClass: student?.className || '',
          studentNis: student?.nis || '',
          date: homeVisitForm.date || new Date().toISOString().split('T')[0],
          address: homeVisitForm.address || student?.address || 'Alamat Siswa',
          counselorName: homeVisitForm.counselorName || currentUser?.displayName || 'Guru BK',
          companionName: homeVisitForm.companionName || 'Wali Kelas',
          visitedPerson: homeVisitForm.visitedPerson || student?.parentName || 'Orang Tua Siswa',
          relationship: homeVisitForm.relationship || 'Ayah',
          phone: homeVisitForm.phone || student?.parentPhone || '',
          purpose: homeVisitForm.purpose!,
          familyConditions: homeVisitForm.familyConditions || 'Baik',
          studentStudyEnvironment: homeVisitForm.studentStudyEnvironment || 'Cukup Memadai',
          findings: homeVisitForm.findings!,
          agreements: homeVisitForm.agreements || '',
          followUpPlan: homeVisitForm.followUpPlan || '',
          status: homeVisitForm.status || 'Terlaksana',
          academicYear: activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving home visit:', err);
    } finally {
      setIsHomeVisitModalOpen(false);
      setEditingHomeVisit(null);
    }
  };

  // ==========================================
  // PARENT CALL LETTER HANDLERS
  // ==========================================
  const handleOpenAddParentCall = () => {
    setEditingParentCall(null);
    const def = students[0];
    setParentCallForm({
      studentId: def?.id || '',
      studentName: def?.fullName || '',
      studentClass: def?.className || '',
      studentNis: def?.nis || '',
      parentName: def?.parentName || 'Bapak/Ibu Orang Tua Siswa',
      letterNumber: `421.3/BK-SP1/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      callNumber: 1,
      callDate: new Date().toISOString().split('T')[0],
      callTime: '08:30 WIB',
      location: 'Ruang Bimbingan & Konseling (BK)',
      reason: 'Koordinasi pembinaan disiplin dan pemantauan perkembangan belajar ananda.',
      counselorName: currentUser?.displayName || 'Guru BK',
      counselorNip: currentUser?.nip || '198509122010012008',
      wakaName: schoolSetting?.wakaName || 'Waka Kesiswaan',
      status: 'Diterbitkan',
      notes: ''
    });
    setIsParentCallModalOpen(true);
  };

  const handleOpenEditParentCall = (item: ParentCallLetter, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingParentCall(item);
    setParentCallForm(item);
    setIsParentCallModalOpen(true);
  };

  const handleSaveParentCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentCallForm.studentId || !parentCallForm.letterNumber || !parentCallForm.reason) {
      alert('Mohon lengkapi data siswa, nomor surat, dan perihal pemanggilan.');
      return;
    }
    try {
      const student = students.find(s => s.id === parentCallForm.studentId);
      if (editingParentCall) {
        await updateParentCallLetter(editingParentCall.id, {
          ...parentCallForm,
          studentName: student?.fullName || parentCallForm.studentName,
          studentClass: student?.className || parentCallForm.studentClass,
          studentNis: student?.nis || parentCallForm.studentNis,
          parentName: student?.parentName || parentCallForm.parentName
        });
      } else {
        await addParentCallLetter({
          studentId: parentCallForm.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentClass: student?.className || '',
          studentNis: student?.nis || '',
          parentName: parentCallForm.parentName || student?.parentName || 'Orang Tua Siswa',
          letterNumber: parentCallForm.letterNumber!,
          callNumber: (parentCallForm.callNumber as any) || 1,
          callDate: parentCallForm.callDate!,
          callTime: parentCallForm.callTime || '08:30 WIB',
          location: parentCallForm.location || 'Ruang BK',
          reason: parentCallForm.reason!,
          counselorName: parentCallForm.counselorName || currentUser?.displayName || 'Guru BK',
          counselorNip: parentCallForm.counselorNip,
          wakaName: parentCallForm.wakaName || schoolSetting?.wakaName || 'Waka Kesiswaan',
          status: parentCallForm.status || 'Diterbitkan',
          notes: parentCallForm.notes || '',
          academicYear: activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving parent call:', err);
    } finally {
      setIsParentCallModalOpen(false);
      setEditingParentCall(null);
    }
  };

  // ==========================================
  // CAREER GUIDANCE HANDLERS
  // ==========================================
  const handleOpenAddCareer = () => {
    setEditingCareer(null);
    const def = students[0];
    setCareerForm({
      studentId: def?.id || '',
      studentName: def?.fullName || '',
      studentClass: def?.className || '',
      studentNis: def?.nis || '',
      careerInterest: 'Perguruan Tinggi Negeri (PTN)',
      targetPath: 'PTN (SNBP/SNBT)',
      targetInstitution: 'Institut Teknologi Bandung (ITB)',
      targetMajor: 'Teknik Informatika',
      psychologicalTestScore: 'Skor Potensi Akademik: 640 (Sangat Baik)',
      strengths: 'Kemampuan analisis kuantitatif dan logika matematika tinggi',
      obstacles: 'Perlu bimbingan pemilihan prioritas prodi dan strategi portofolio SNBP',
      counselorRecommendation: 'Direkomendasikan fokus SNBP pada rumpun Saintek dan intensif tryout SNBT',
      counselorName: currentUser?.displayName || 'Guru BK',
      status: 'Sudah Terarah'
    });
    setIsCareerModalOpen(true);
  };

  const handleOpenEditCareer = (item: CareerGuidanceRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCareer(item);
    setCareerForm(item);
    setIsCareerModalOpen(true);
  };

  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerForm.studentId || !careerForm.careerInterest || !careerForm.counselorRecommendation) {
      alert('Mohon lengkapi data siswa, minat karir, dan rekomendasi BK.');
      return;
    }
    try {
      const student = students.find(s => s.id === careerForm.studentId);
      if (editingCareer) {
        await updateCareerGuidance(editingCareer.id, {
          ...careerForm,
          studentName: student?.fullName || careerForm.studentName,
          studentClass: student?.className || careerForm.studentClass,
          studentNis: student?.nis || careerForm.studentNis
        });
      } else {
        await addCareerGuidance({
          studentId: careerForm.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentClass: student?.className || '',
          studentNis: student?.nis || '',
          careerInterest: careerForm.careerInterest!,
          targetPath: careerForm.targetPath || 'PTN (SNBP/SNBT)',
          targetInstitution: careerForm.targetInstitution || '',
          targetMajor: careerForm.targetMajor || '',
          psychologicalTestScore: careerForm.psychologicalTestScore || '',
          strengths: careerForm.strengths || '',
          obstacles: careerForm.obstacles || '',
          counselorRecommendation: careerForm.counselorRecommendation!,
          counselorName: careerForm.counselorName || currentUser?.displayName || 'Guru BK',
          status: careerForm.status || 'Sudah Terarah',
          academicYear: activeAcademicYear
        });
      }
    } catch (err) {
      console.error('Error saving career:', err);
    } finally {
      setIsCareerModalOpen(false);
      setEditingCareer(null);
    }
  };

  // ==========================================
  // CONFIRM DELETION
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'counseling') {
        await deleteCounselingSession(deleteTarget.id);
      } else if (deleteTarget.type === 'home_visit') {
        await deleteHomeVisit(deleteTarget.id);
      } else if (deleteTarget.type === 'parent_call') {
        await deleteParentCallLetter(deleteTarget.id);
      } else if (deleteTarget.type === 'career') {
        await deleteCareerGuidance(deleteTarget.id);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Filtered Datasets
  const filteredCounseling = useMemo(() => {
    return counseling.filter(c => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === c.studentId);
        const match = isStudentInClass(c, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (counselingStatusFilter !== 'all' && c.status !== counselingStatusFilter) return false;
      if (counselingFieldFilter !== 'all' && c.serviceField !== counselingFieldFilter) return false;
      return true;
    });
  }, [counseling, selectedClass, counselingStatusFilter, counselingFieldFilter, classes, students]);

  const filteredHomeVisits = useMemo(() => {
    return homeVisits.filter(h => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === h.studentId);
        const match = isStudentInClass(h, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (homeVisitStatusFilter !== 'all' && h.status !== homeVisitStatusFilter) return false;
      return true;
    });
  }, [homeVisits, selectedClass, homeVisitStatusFilter, classes, students]);

  const filteredParentCalls = useMemo(() => {
    return parentCallLetters.filter(p => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === p.studentId);
        const match = isStudentInClass(p, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      if (parentCallStatusFilter !== 'all' && p.status !== parentCallStatusFilter) return false;
      return true;
    });
  }, [parentCallLetters, selectedClass, parentCallStatusFilter, classes, students]);

  const filteredCareerGuidances = useMemo(() => {
    return careerGuidances.filter(cg => {
      if (selectedClass !== 'all') {
        const student = students.find(s => s.id === cg.studentId);
        const match = isStudentInClass(cg, selectedClass, classes) || (student && isStudentInClass(student, selectedClass, classes));
        if (!match) return false;
      }
      return true;
    });
  }, [careerGuidances, selectedClass, classes, students]);

  // ==========================================
  // COLUMNS DEFINITIONS
  // ==========================================
  const counselingColumns: Column<StudentCounseling>[] = [
    {
      header: 'Nama Siswa & Kelas',
      accessorKey: 'studentName',
      sortable: true,
      cell: c => (
        <div>
          <p className="font-bold text-zinc-100">{c.studentName}</p>
          <p className="text-[11px] text-zinc-400">Kelas: {c.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Bidang Layanan & Topik',
      accessorKey: 'topic',
      sortable: true,
      cell: c => (
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {c.serviceField || 'Belajar'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {c.counselingType || 'Individu'}
            </span>
          </div>
          <span className="font-semibold text-xs text-zinc-200">{c.topic}</span>
        </div>
      )
    },
    {
      header: 'Tanggal & Konselor',
      accessorKey: 'date',
      sortable: true,
      cell: c => (
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">📅 {c.date}</span>
          <p className="text-[11px] text-zinc-400">Oleh: {c.counselorName}</p>
        </div>
      )
    },
    {
      header: 'Urgensi',
      accessorKey: 'urgencyLevel',
      cell: c => {
        const u = c.urgencyLevel || 'Sedang';
        const color =
          u === 'Tinggi'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : u === 'Sedang'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${color}`}>
            {u}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: c => <StatusBadge status={c.status} />
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: c => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setDetailCounseling(c)}
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-[#161618]"
            title="Lihat Detail Rekam"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => handleOpenEditCounseling(c, e)}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#161618]"
            title="Edit Rekam"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setDeleteTarget({ type: 'counseling', id: c.id, name: c.studentName });
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#161618]"
            title="Hapus Rekam"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const homeVisitColumns: Column<HomeVisitRecord>[] = [
    {
      header: 'Nama Siswa & Alamat',
      accessorKey: 'studentName',
      sortable: true,
      cell: h => (
        <div>
          <p className="font-bold text-zinc-100">{h.studentName}</p>
          <p className="text-[11px] text-zinc-400">Kelas: {h.studentClass}</p>
          <p className="text-[10px] text-zinc-500 truncate max-w-xs">{h.address}</p>
        </div>
      )
    },
    {
      header: 'Tanggal & Konselor',
      accessorKey: 'date',
      sortable: true,
      cell: h => (
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">📅 {h.date}</span>
          <p className="text-[11px] text-zinc-400">Konselor: {h.counselorName}</p>
        </div>
      )
    },
    {
      header: 'Alasan Kunjungan & Hasil',
      accessorKey: 'purpose',
      cell: h => (
        <div>
          <p className="font-medium text-amber-400 text-xs">{h.purpose}</p>
          <p className="text-[11px] text-zinc-400 line-clamp-1">{h.findings}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: h => <StatusBadge status={h.status} />
    },
    {
      header: 'Aksi & Berita Acara',
      className: 'text-right',
      cell: h => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setPrintHomeVisitLetter(h)}
            className="px-2 py-1 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-[10px] font-mono flex items-center gap-1"
            title="Cetak Berita Acara Home Visit"
          >
            <Printer className="w-3 h-3" />
            <span>CETAK</span>
          </button>
          <button
            onClick={() => setDetailHomeVisit(h)}
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-[#161618]"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => handleOpenEditHomeVisit(h, e)}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#161618]"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setDeleteTarget({ type: 'home_visit', id: h.id, name: h.studentName });
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#161618]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const parentCallColumns: Column<ParentCallLetter>[] = [
    {
      header: 'No. Surat & Panggilan Ke',
      accessorKey: 'letterNumber',
      sortable: true,
      cell: p => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-400">{p.letterNumber}</span>
          <p className="text-[10px] font-mono text-amber-400">Surat Panggilan Ke-{p.callNumber}</p>
        </div>
      )
    },
    {
      header: 'Siswa & Wali Murid',
      accessorKey: 'studentName',
      sortable: true,
      cell: p => (
        <div>
          <p className="font-bold text-zinc-100">{p.studentName} ({p.studentClass})</p>
          <p className="text-[11px] text-zinc-400">Yth. {p.parentName || 'Orang Tua'}</p>
        </div>
      )
    },
    {
      header: 'Jadwal Panggilan',
      accessorKey: 'callDate',
      sortable: true,
      cell: p => (
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">📅 {p.callDate} - {p.callTime}</span>
          <p className="text-[10px] text-zinc-500">📍 {p.location}</p>
        </div>
      )
    },
    {
      header: 'Perihal Panggilan',
      accessorKey: 'reason',
      cell: p => (
        <p className="text-xs text-zinc-300 line-clamp-1">{p.reason}</p>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: p => <StatusBadge status={p.status} />
    },
    {
      header: 'Cetak Surat & Aksi',
      className: 'text-right',
      cell: p => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setPrintParentCallLetter(p)}
            className="px-2 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-[10px] font-mono flex items-center gap-1"
            title="Cetak Surat Panggilan Resmi"
          >
            <Printer className="w-3 h-3" />
            <span>CETAK_SP</span>
          </button>
          <button
            onClick={() => setDetailParentCall(p)}
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-[#161618]"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => handleOpenEditParentCall(p, e)}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#161618]"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setDeleteTarget({ type: 'parent_call', id: p.id, name: p.studentName });
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#161618]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const careerColumns: Column<CareerGuidanceRecord>[] = [
    {
      header: 'Nama Siswa & Kelas',
      accessorKey: 'studentName',
      sortable: true,
      cell: c => (
        <div>
          <p className="font-bold text-zinc-100">{c.studentName}</p>
          <p className="text-[11px] text-zinc-400">Kelas: {c.studentClass}</p>
        </div>
      )
    },
    {
      header: 'Minat Karir & Jalur Target',
      accessorKey: 'careerInterest',
      sortable: true,
      cell: c => (
        <div>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {c.careerInterest}
          </span>
          <p className="text-xs font-semibold text-zinc-200 mt-1">
            {c.targetInstitution ? `${c.targetInstitution} - ${c.targetMajor || ''}` : c.targetPath}
          </p>
        </div>
      )
    },
    {
      header: 'Potensi & Keunggulan',
      accessorKey: 'strengths',
      cell: c => (
        <p className="text-xs text-zinc-400 line-clamp-1">{c.strengths || c.psychologicalTestScore || '-'}</p>
      )
    },
    {
      header: 'Rekomendasi Pembina BK',
      accessorKey: 'counselorRecommendation',
      cell: c => (
        <p className="text-xs text-indigo-400 line-clamp-1">{c.counselorRecommendation}</p>
      )
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: c => (
        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setDetailCareer(c)}
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-[#161618]"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => handleOpenEditCareer(c, e)}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#161618]"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setDeleteTarget({ type: 'career', id: c.id, name: c.studentName });
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#161618]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-3 font-sans text-xs select-none">
      {/* 1. Header Banner */}
      <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-pink-600/20 border border-pink-500/40 rounded flex items-center justify-center text-pink-400 font-mono font-bold text-sm shrink-0">
            BK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                PUSAT_LAYANAN_BK / BIMBINGAN_KONSELING
              </span>
              <span className="bg-pink-500/10 text-pink-400 text-[9px] px-1.5 py-0.2 rounded border border-pink-500/20 font-mono">
                TA {activeAcademicYear}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
              Layanan Bimbingan Konseling, Kunjungan Rumah & Advokasi Siswa
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <button
            onClick={handleOpenAddCounseling}
            className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white font-medium text-[11px] flex items-center space-x-1.5 shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ SESI_KONSELING</span>
          </button>
          <button
            onClick={handleOpenAddHomeVisit}
            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>+ HOME_VISIT</span>
          </button>
          <button
            onClick={handleOpenAddParentCall}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>+ SURAT_PANGGILAN</span>
          </button>
          <button
            onClick={handleOpenAddCareer}
            className="px-2.5 py-1 rounded bg-[#161618] border border-[#27272a] hover:border-pink-500/40 text-pink-400 font-medium text-[11px] flex items-center space-x-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>+ BIMBINGAN_KARIR</span>
          </button>
        </div>
      </div>

      {/* 2. Top Nav Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#27272a] pb-1 overflow-x-auto font-mono text-[11px]">
        <button
          onClick={() => setActiveTab('counseling')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'counseling'
              ? 'bg-pink-600/20 text-pink-400 border border-pink-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>SESI_KONSELING ({counseling.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('home_visit')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'home_visit'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>KUNJUNGAN_RUMAH ({homeVisits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parent_call')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'parent_call'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>PANGGILAN_ORTU ({parentCallLetters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('career')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'career'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>KARIR_&_PEMINATAN ({careerGuidances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>REKAP_&_LAPORAN_BK</span>
        </button>
      </div>

      {/* Class Grid Filter */}
      {activeTab !== 'analytics' && (
        <ClassGridFilter
          classes={classes}
          selectedClassId={selectedClass}
          onSelectClass={setSelectedClass}
          countsByClassId={counselingCountsByClassId}
          totalCount={counseling.length}
          label="Filter Layanan BK Berdasarkan Rombel Kelas"
          itemUnit="Kasus"
          colorScheme="rose"
        />
      )}

      {/* ========================================================= */}
      {/* TAB 1: SESI KONSELING */}
      {/* ========================================================= */}
      {activeTab === 'counseling' && (
        <div className="space-y-3">
          {/* Quick Filter Bar */}
          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-500">FILTER_BIDANG:</span>
              {['all', 'Belajar', 'Pribadi', 'Sosial', 'Karir'].map(field => (
                <button
                  key={field}
                  onClick={() => setCounselingFieldFilter(field)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    counselingFieldFilter === field
                      ? 'bg-pink-600/20 border-pink-500/40 text-pink-400 font-bold'
                      : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {field.toUpperCase()}
                </button>
              ))}

              <span className="text-zinc-500 ml-2">STATUS:</span>
              {['all', 'Selesai', 'Perlu Tindak Lanjut', 'Dijadwalkan'].map(st => (
                <button
                  key={st}
                  onClick={() => setCounselingStatusFilter(st)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    counselingStatusFilter === st
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 font-bold'
                      : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>

            <ExportActions
              filename="laporan_bimbingan_konseling"
              title="Laporan Bimbingan Konseling Siswa"
              data={filteredCounseling}
              headers={[
                { header: 'Nama Siswa', key: 'studentName' },
                { header: 'Kelas', key: 'studentClass' },
                { header: 'Bidang Layanan', key: 'serviceField' },
                { header: 'Topik', key: 'topic' },
                { header: 'Tanggal', key: 'date' },
                { header: 'Konselor', key: 'counselorName' },
                { header: 'Solusi/Kesepakatan', key: 'solution' },
                { header: 'Rencana Lanjut', key: 'followUpPlan' },
                { header: 'Status', key: 'status' }
              ]}
            />
          </div>

          <DataTable
            id="counseling-table"
            data={filteredCounseling}
            columns={counselingColumns}
            searchPlaceholder="Cari siswa, topik konseling, atau nama guru konselor..."
            searchableKeys={['studentName', 'topic', 'counselorName', 'solution', 'serviceField']}
            onRowClick={c => setDetailCounseling(c)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KUNJUNGAN RUMAH (HOME VISIT) */}
      {/* ========================================================= */}
      {activeTab === 'home_visit' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-500">STATUS_KUNJUNGAN:</span>
              {['all', 'Terlaksana', 'Terjadwal', 'Perlu Kunjungan Lanjut', 'Dibatalkan'].map(st => (
                <button
                  key={st}
                  onClick={() => setHomeVisitStatusFilter(st)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    homeVisitStatusFilter === st
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-400 font-bold'
                      : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>

            <ExportActions
              filename="laporan_kunjungan_rumah_bk"
              title="Laporan Home Visit Bimbingan Konseling"
              data={filteredHomeVisits}
              headers={[
                { header: 'Nama Siswa', key: 'studentName' },
                { header: 'Kelas', key: 'studentClass' },
                { header: 'Tanggal Kunjungan', key: 'date' },
                { header: 'Alamat', key: 'address' },
                { header: 'Orang Tua Ditemui', key: 'visitedPerson' },
                { header: 'Alasan Kunjungan', key: 'purpose' },
                { header: 'Hasil Temuan', key: 'findings' },
                { header: 'Kesepakatan Solusi', key: 'agreements' },
                { header: 'Status', key: 'status' }
              ]}
            />
          </div>

          <DataTable
            id="home-visit-table"
            data={filteredHomeVisits}
            columns={homeVisitColumns}
            searchPlaceholder="Cari siswa, alamat, alasan kunjungan, atau konselor..."
            searchableKeys={['studentName', 'purpose', 'address', 'findings', 'visitedPerson']}
            onRowClick={h => setDetailHomeVisit(h)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SURAT PANGGILAN ORANG TUA (SP) */}
      {/* ========================================================= */}
      {activeTab === 'parent_call' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-500">STATUS_PANGGILAN:</span>
              {['all', 'Diterbitkan', 'Hadir', 'Tidak Hadir', 'Selesai'].map(st => (
                <button
                  key={st}
                  onClick={() => setParentCallStatusFilter(st)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    parentCallStatusFilter === st
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 font-bold'
                      : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>

            <ExportActions
              filename="rekap_surat_panggilan_ortu"
              title="Rekapitulasi Surat Panggilan Orang Tua Siswa"
              data={filteredParentCalls}
              headers={[
                { header: 'No Surat', key: 'letterNumber' },
                { header: 'Panggilan Ke', key: 'callNumber' },
                { header: 'Nama Siswa', key: 'studentName' },
                { header: 'Kelas', key: 'studentClass' },
                { header: 'Orang Tua', key: 'parentName' },
                { header: 'Tanggal Panggilan', key: 'callDate' },
                { header: 'Waktu & Ruang', key: 'callTime' },
                { header: 'Perihal', key: 'reason' },
                { header: 'Status', key: 'status' }
              ]}
            />
          </div>

          <DataTable
            id="parent-call-table"
            data={filteredParentCalls}
            columns={parentCallColumns}
            searchPlaceholder="Cari no surat, nama siswa, orang tua, atau perihal..."
            searchableKeys={['letterNumber', 'studentName', 'parentName', 'reason']}
            onRowClick={p => setDetailParentCall(p)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: KARIR & PEMINATAN */}
      {/* ========================================================= */}
      {activeTab === 'career' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-wrap items-center justify-between gap-2">
            <div className="text-zinc-400 text-xs flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Database Peminatan Jurusan, Minat Karir, dan Rekomendasi Seleksi PTN/Kedinasan/Dunia Kerja</span>
            </div>

            <ExportActions
              filename="asesmen_peminatan_karir_siswa"
              title="Data Peminatan Karir dan Studi Lanjut Siswa"
              data={careerGuidances}
              headers={[
                { header: 'Nama Siswa', key: 'studentName' },
                { header: 'Kelas', key: 'studentClass' },
                { header: 'Minat Karir', key: 'careerInterest' },
                { header: 'Target Jalur', key: 'targetPath' },
                { header: 'Target Kampus/Prodi', key: 'targetInstitution' },
                { header: 'Potensi Akademik', key: 'strengths' },
                { header: 'Rekomendasi BK', key: 'counselorRecommendation' }
              ]}
            />
          </div>

          <DataTable
            id="career-table"
            data={careerGuidances}
            columns={careerColumns}
            searchPlaceholder="Cari siswa, peminatan, target jurusan, atau rekomendasi..."
            searchableKeys={['studentName', 'careerInterest', 'targetInstitution', 'counselorRecommendation']}
            onRowClick={c => setDetailCareer(c)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REKAPITULASI & LAPORAN BK */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          {/* Summary Matrix Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">TOTAL_SESI_KONSELING</div>
              <div className="text-2xl font-bold font-mono text-pink-400 mt-1">{counseling.length}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {counseling.filter(c => c.status === 'Selesai').length} Selesai • {counseling.filter(c => c.status === 'Perlu Tindak Lanjut').length} Pantauan
              </div>
            </div>

            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">KUNJUNGAN_RUMAH</div>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{homeVisits.length}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {homeVisits.filter(h => h.status === 'Terlaksana').length} Berita Acara Ditandatangani
              </div>
            </div>

            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SURAT_PANGGILAN_ORTU</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{parentCallLetters.length}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {parentCallLetters.filter(p => p.status === 'Hadir').length} Orang Tua Hadir Sesuai Jadwal
              </div>
            </div>

            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">ASESMEN_KARIR</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{careerGuidances.length}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Target Studi Lanjut & Peminatan Kerja
              </div>
            </div>
          </div>

          {/* Breakdown Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Bidang Layanan Breakdown */}
            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                DISTRIBUSI_BIDANG_LAYANAN_BK
              </h4>
              <div className="space-y-2 text-xs">
                {['Belajar', 'Pribadi', 'Sosial', 'Karir'].map(field => {
                  const count = counseling.filter(c => c.serviceField === field).length;
                  const pct = counseling.length > 0 ? Math.round((count / counseling.length) * 100) : 0;
                  return (
                    <div key={field} className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-300">Bidang {field}</span>
                        <span className="text-pink-400 font-bold">{count} kasus ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#161618] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Siswa Prioritas BK */}
            <div className="p-3 rounded bg-[#0d0d0f] border border-[#27272a]">
              <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                SISWA_DENGAN_ATENSI_BK_TERTINGGI
              </h4>
              <div className="space-y-1.5">
                {students
                  .filter(s => (s.violationPoints || 0) > 0)
                  .sort((a, b) => (b.violationPoints || 0) - (a.violationPoints || 0))
                  .slice(0, 4)
                  .map(st => (
                    <div
                      key={st.id}
                      className="p-2 bg-[#161618] border border-[#27272a] rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-zinc-200">{st.fullName}</div>
                        <div className="text-[10px] text-zinc-500">Kelas: {st.className} • NISN: {st.nisn}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          {st.violationPoints} POIN
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FORM SESI KONSELING */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCounselingModalOpen}
        onClose={() => setIsCounselingModalOpen(false)}
        title={editingCounseling ? 'Edit Rekam Konseling Siswa' : 'Catat Sesi Bimbingan Konseling Baru'}
        subtitle="Dokumentasi layanan BK dan rencana tindak lanjut pembinaan"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCounselingModalOpen(false)}
              className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleSaveCounseling}
              className="px-4 py-1.5 rounded bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold shadow-[0_0_10px_rgba(236,72,153,0.3)]"
            >
              SIMPAN_REKAM_BK
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCounseling} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              PILIH SISWA TERBIMBING *
            </label>
            <select
              value={counselingForm.studentId}
              onChange={e => {
                const st = students.find(s => s.id === e.target.value);
                setCounselingForm({
                  ...counselingForm,
                  studentId: e.target.value,
                  studentName: st?.fullName || '',
                  studentClass: st?.className || '',
                  studentNis: st?.nis || ''
                });
              }}
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200 focus:border-pink-500"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.className}) - NIS: {s.nis}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                BIDANG LAYANAN
              </label>
              <select
                value={counselingForm.serviceField}
                onChange={e => setCounselingForm({ ...counselingForm, serviceField: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="Belajar">Bimbingan Belajar</option>
                <option value="Pribadi">Bimbingan Pribadi</option>
                <option value="Sosial">Bimbingan Sosial</option>
                <option value="Karir">Bimbingan Karir</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                JENIS KONSELING
              </label>
              <select
                value={counselingForm.counselingType}
                onChange={e => setCounselingForm({ ...counselingForm, counselingType: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="Individu">Konseling Individual</option>
                <option value="Kelompok">Konseling Kelompok</option>
                <option value="Klasikal">Bimbingan Klasikal</option>
                <option value="Mediasi">Mediasi / Konferensi Kasus</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TINGKAT URGENSI
              </label>
              <select
                value={counselingForm.urgencyLevel}
                onChange={e => setCounselingForm({ ...counselingForm, urgencyLevel: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi (Atensi Khusus)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              TOPIK PEMBAHASAN / MASALAH *
            </label>
            <input
              type="text"
              required
              value={counselingForm.topic}
              onChange={e => setCounselingForm({ ...counselingForm, topic: e.target.value })}
              placeholder="Contoh: Hambatan Konsentrasi Belajar & Manajemen Waktu di Rumah"
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TANGGAL SESI
              </label>
              <input
                type="date"
                required
                value={counselingForm.date}
                onChange={e => setCounselingForm({ ...counselingForm, date: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                GURU BK / KONSELOR
              </label>
              <input
                type="text"
                value={counselingForm.counselorName}
                onChange={e => setCounselingForm({ ...counselingForm, counselorName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                STATUS SESI
              </label>
              <select
                value={counselingForm.status}
                onChange={e => setCounselingForm({ ...counselingForm, status: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="Selesai">Selesai</option>
                <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                <option value="Dijadwalkan">Dijadwalkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              CATATAN DINAMIKA KONSELING & PENJELASAN SISWA *
            </label>
            <textarea
              rows={3}
              required
              value={counselingForm.notes}
              onChange={e => setCounselingForm({ ...counselingForm, notes: e.target.value })}
              placeholder="Catatan hasil wawancara, respon emosional, dan kendala yang dihadapi siswa..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                SOLUSI / KESEPAKATAN PEMBINAAN
              </label>
              <textarea
                rows={2}
                value={counselingForm.solution}
                onChange={e => setCounselingForm({ ...counselingForm, solution: e.target.value })}
                placeholder="Langkah perbaikan yang disepakati bersama siswa..."
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                RENCANA TINDAK LANJUT (FOLLOW UP)
              </label>
              <textarea
                rows={2}
                value={counselingForm.followUpPlan}
                onChange={e => setCounselingForm({ ...counselingForm, followUpPlan: e.target.value })}
                placeholder="Rencana evaluasi mingguan dengan wali kelas..."
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="parentInvolvedCheck"
              checked={counselingForm.parentInvolved}
              onChange={e => setCounselingForm({ ...counselingForm, parentInvolved: e.target.checked })}
              className="rounded bg-[#161618] border-[#27272a] text-pink-600 focus:ring-pink-500"
            />
            <label htmlFor="parentInvolvedCheck" className="text-zinc-300 font-medium cursor-pointer">
              Menghadirkan Orang Tua / Wali Murid dalam Sesi Ini
            </label>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: FORM HOME VISIT */}
      {/* ========================================================= */}
      <Modal
        isOpen={isHomeVisitModalOpen}
        onClose={() => setIsHomeVisitModalOpen(false)}
        title={editingHomeVisit ? 'Edit Berita Acara Home Visit' : 'Catat Kunjungan Rumah (Home Visit) Baru'}
        subtitle="Dokumentasi kunjungan langsung ke tempat tinggal peserta didik"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsHomeVisitModalOpen(false)}
              className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleSaveHomeVisit}
              className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              SIMPAN_BERITA_ACARA
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveHomeVisit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              PILIH SISWA *
            </label>
            <select
              value={homeVisitForm.studentId}
              onChange={e => {
                const st = students.find(s => s.id === e.target.value);
                setHomeVisitForm({
                  ...homeVisitForm,
                  studentId: e.target.value,
                  studentName: st?.fullName || '',
                  studentClass: st?.className || '',
                  studentNis: st?.nis || '',
                  address: st?.address || '',
                  visitedPerson: st?.parentName || 'Orang Tua Siswa',
                  phone: st?.parentPhone || st?.phone || ''
                });
              }}
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.className})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TANGGAL KUNJUNGAN
              </label>
              <input
                type="date"
                required
                value={homeVisitForm.date}
                onChange={e => setHomeVisitForm({ ...homeVisitForm, date: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                STATUS KUNJUNGAN
              </label>
              <select
                value={homeVisitForm.status}
                onChange={e => setHomeVisitForm({ ...homeVisitForm, status: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="Terlaksana">Terlaksana</option>
                <option value="Terjadwal">Terjadwal</option>
                <option value="Perlu Kunjungan Lanjut">Perlu Kunjungan Lanjut</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                ALAMAT RUMAH SISWA
              </label>
              <input
                type="text"
                value={homeVisitForm.address}
                onChange={e => setHomeVisitForm({ ...homeVisitForm, address: e.target.value })}
                placeholder="Jl. Mawar No. 12, Kelurahan..."
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                ANGGOTA KELUARGA / ORANG TUA DITEMUI
              </label>
              <input
                type="text"
                value={homeVisitForm.visitedPerson}
                onChange={e => setHomeVisitForm({ ...homeVisitForm, visitedPerson: e.target.value })}
                placeholder="Bpk. Hendra (Ayah Kandung)"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              LATAR BELAKANG & TUJUAN KUNJUNGAN RUMAH *
            </label>
            <input
              type="text"
              required
              value={homeVisitForm.purpose}
              onChange={e => setHomeVisitForm({ ...homeVisitForm, purpose: e.target.value })}
              placeholder="Contoh: Ketidakhadiran tanpa keterangan 4 hari & klarifikasi kondisi keluarga"
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              HASIL OBSERVASI & TEMUAN DI RUMAH *
            </label>
            <textarea
              rows={2}
              required
              value={homeVisitForm.findings}
              onChange={e => setHomeVisitForm({ ...homeVisitForm, findings: e.target.value })}
              placeholder="Gambaran kondisi siswa, situasi keluarga, fasilitas belajar di rumah..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              KESEPAKATAN BERSAMA ORANG TUA
            </label>
            <textarea
              rows={2}
              value={homeVisitForm.agreements}
              onChange={e => setHomeVisitForm({ ...homeVisitForm, agreements: e.target.value })}
              placeholder="Komitmen wali murid dan solusi yang disepakati..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: FORM SURAT PANGGILAN ORTU */}
      {/* ========================================================= */}
      <Modal
        isOpen={isParentCallModalOpen}
        onClose={() => setIsParentCallModalOpen(false)}
        title={editingParentCall ? 'Edit Surat Panggilan Orang Tua' : 'Terbitkan Surat Panggilan Orang Tua (SP)'}
        subtitle="Penerbitan surat resmi pemanggilan orang tua/wali murid ke sekolah"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsParentCallModalOpen(false)}
              className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleSaveParentCall}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              TERBITKAN_SURAT_PANGGILAN
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveParentCall} className="space-y-3 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                NOMOR SURAT RESMI *
              </label>
              <input
                type="text"
                required
                value={parentCallForm.letterNumber}
                onChange={e => setParentCallForm({ ...parentCallForm, letterNumber: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                PANGGILAN KE
              </label>
              <select
                value={parentCallForm.callNumber}
                onChange={e => setParentCallForm({ ...parentCallForm, callNumber: Number(e.target.value) as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value={1}>Surat Panggilan Ke-1 (SP 1)</option>
                <option value={2}>Surat Panggilan Ke-2 (SP 2)</option>
                <option value={3}>Surat Panggilan Ke-3 (SP 3 / Peringatan Terakhir)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                PILIH SISWA *
              </label>
              <select
                value={parentCallForm.studentId}
                onChange={e => {
                  const st = students.find(s => s.id === e.target.value);
                  setParentCallForm({
                    ...parentCallForm,
                    studentId: e.target.value,
                    studentName: st?.fullName || '',
                    studentClass: st?.className || '',
                    studentNis: st?.nis || '',
                    parentName: st?.parentName || 'Orang Tua Siswa'
                  });
                }}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.className})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                NAMA ORANG TUA / WALI
              </label>
              <input
                type="text"
                value={parentCallForm.parentName}
                onChange={e => setParentCallForm({ ...parentCallForm, parentName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TANGGAL PANGGILAN
              </label>
              <input
                type="date"
                required
                value={parentCallForm.callDate}
                onChange={e => setParentCallForm({ ...parentCallForm, callDate: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                WAKTU / PUKUL
              </label>
              <input
                type="text"
                value={parentCallForm.callTime}
                onChange={e => setParentCallForm({ ...parentCallForm, callTime: e.target.value })}
                placeholder="08:30 WIB"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                RUANG PERTEMUAN
              </label>
              <input
                type="text"
                value={parentCallForm.location}
                onChange={e => setParentCallForm({ ...parentCallForm, location: e.target.value })}
                placeholder="Ruang BK"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              PERIHAL / ALASAN PEMANGGILAN *
            </label>
            <textarea
              rows={2}
              required
              value={parentCallForm.reason}
              onChange={e => setParentCallForm({ ...parentCallForm, reason: e.target.value })}
              placeholder="Contoh: Membicarakan perkembangan kedisiplinan dan absensi ananda di sekolah..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              STATUS SURAT PANGGILAN
            </label>
            <select
              value={parentCallForm.status}
              onChange={e => setParentCallForm({ ...parentCallForm, status: e.target.value as CallLetterStatus })}
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            >
              <option value="Diterbitkan">Diterbitkan (Menunggu Kehadiran)</option>
              <option value="Hadir">Orang Tua Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: FORM CAREER GUIDANCE */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCareerModalOpen}
        onClose={() => setIsCareerModalOpen(false)}
        title={editingCareer ? 'Edit Asesmen Karir & Peminatan' : 'Catat Bimbingan Karir & Studi Lanjut'}
        subtitle="Eksplorasi minat karir, pemetaan potensi, dan rekomendasi perguruan tinggi"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCareerModalOpen(false)}
              className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleSaveCareer}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              SIMPAN_ASESMEN_KARIR
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCareer} className="space-y-3 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                PILIH SISWA *
              </label>
              <select
                value={careerForm.studentId}
                onChange={e => {
                  const st = students.find(s => s.id === e.target.value);
                  setCareerForm({
                    ...careerForm,
                    studentId: e.target.value,
                    studentName: st?.fullName || '',
                    studentClass: st?.className || '',
                    studentNis: st?.nis || ''
                  });
                }}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.className})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                JALUR MINAT TARGET
              </label>
              <select
                value={careerForm.targetPath}
                onChange={e => setCareerForm({ ...careerForm, targetPath: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                <option value="PTN (SNBP/SNBT)">PTN (SNBP / SNBT)</option>
                <option value="Kedinasan / Militer">Kedinasan / Militer (STAN, Akmil, dsb)</option>
                <option value="Politeknik / Vokasi">Politeknik / Pendidikan Vokasi</option>
                <option value="PTS">Perguruan Tinggi Swasta (PTS)</option>
                <option value="Wirausaha">Kewirausahaan / Bisnis Mandiri</option>
                <option value="Kerja / Industri">Dunia Kerja / Industri</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TARGET INSTITUSI / KAMPUS IMPIAN
              </label>
              <input
                type="text"
                value={careerForm.targetInstitution}
                onChange={e => setCareerForm({ ...careerForm, targetInstitution: e.target.value })}
                placeholder="Contoh: Institut Teknologi Bandung (ITB) / STAN"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                TARGET PROGRAM STUDI / JURUSAN
              </label>
              <input
                type="text"
                value={careerForm.targetMajor}
                onChange={e => setCareerForm({ ...careerForm, targetMajor: e.target.value })}
                placeholder="Contoh: Teknik Informatika / Kedokteran"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              POTENSI, BAKAT & KEUNGGULAN AKADEMIK
            </label>
            <textarea
              rows={2}
              value={careerForm.strengths}
              onChange={e => setCareerForm({ ...careerForm, strengths: e.target.value })}
              placeholder="Analisis nilai rapor, mata pelajaran unggulan, dan tes bakat..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
              REKOMENDASI & STRATEGI PEMBINA BK *
            </label>
            <textarea
              rows={2}
              required
              value={careerForm.counselorRecommendation}
              onChange={e => setCareerForm({ ...careerForm, counselorRecommendation: e.target.value })}
              placeholder="Saran jalur pendaftaran (SNBP, SNBT, Mandiri) dan pendampingan try out..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL PRINT RESMI: SURAT PANGGILAN ORANG TUA */}
      {/* ========================================================= */}
      {printParentCallLetter && (
        <Modal
          isOpen={Boolean(printParentCallLetter)}
          onClose={() => setPrintParentCallLetter(null)}
          title="Format Cetak Resmi: Surat Panggilan Orang Tua"
          subtitle="Standar dokumen resmi bimbingan konseling dan kesiswaan"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-zinc-500">SIAP DICETAK PADA KERTAS A4</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintParentCallLetter(null)}
                  className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
                >
                  TUTUP
                </button>
                <button
                  onClick={handlePrintDocument}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>CETAK_DOKUMEN</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-black p-6 rounded font-serif text-[11px] leading-relaxed shadow-lg select-text border border-zinc-300">
            {/* Kop Surat */}
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <p className="font-bold text-xs uppercase tracking-wider">{schoolSetting?.centralInstitution || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}</p>
              <h3 className="font-extrabold text-sm uppercase tracking-wide">{schoolSetting?.name}</h3>
              <p className="text-[10px] font-sans text-gray-700">{schoolSetting?.address} • Telp: {schoolSetting?.phone || '(021) 7890123'}</p>
              <p className="text-[9px] font-mono text-gray-600">NPSN: {schoolSetting?.npsn} • Website: {schoolSetting?.website || 'sekolah.sch.id'}</p>
            </div>

            {/* Nomor & Perihal */}
            <div className="flex justify-between mb-4 font-sans text-[11px]">
              <div>
                <p><strong>Nomor</strong> : {printParentCallLetter.letterNumber}</p>
                <p><strong>Lampiran</strong> : -</p>
                <p><strong>Perihal</strong> : <u>Surat Panggilan Orang Tua Ke-{printParentCallLetter.callNumber}</u></p>
              </div>
              <div className="text-right">
                <p>{printParentCallLetter.callDate}</p>
                <p className="mt-1">Kepada Yth:</p>
                <p className="font-bold">Bapak/Ibu Orang Tua/Wali dari:</p>
                <p><strong>{printParentCallLetter.studentName}</strong> (Kelas {printParentCallLetter.studentClass})</p>
                <p>Di Tempat</p>
              </div>
            </div>

            {/* Isi Surat */}
            <div className="space-y-2 mb-6 text-justify">
              <p><i>Assalamu’alaikum Warahmatullahi Wabarakatuh / Dengan hormat,</i></p>
              <p>
                Sehubungan dengan program pembinaan kedisiplinan dan monitoring perkembangan belajar peserta didik di lingkungan {schoolSetting?.name}, bersama surat ini kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid pada:
              </p>

              <div className="pl-6 space-y-1 font-sans my-2">
                <p><strong>Hari / Tanggal</strong> : {printParentCallLetter.callDate}</p>
                <p><strong>Waktu</strong> : {printParentCallLetter.callTime}</p>
                <p><strong>Tempat</strong> : {printParentCallLetter.location}</p>
                <p><strong>Bertemu dengan</strong> : {printParentCallLetter.counselorName} (Guru BK) & Tim Kesiswaan</p>
                <p><strong>Keperluan</strong> : {printParentCallLetter.reason}</p>
              </div>

              <p>
                Mengingat pentingnya hal tersebut demi kebaikan dan masa depan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu yang telah ditentukan.
              </p>
              <p>
                Demikian surat panggilan ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
              </p>
              <p><i>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</i></p>
            </div>

            {/* Tanda Tangan */}
            <div className="flex justify-between items-end pt-4 font-sans text-center">
              <div>
                <p>Mengetahui,</p>
                <p>Waka Kesiswaan</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{schoolSetting?.wakaName || 'Drs. H. Ahmad Fauzi, M.Pd'}</p>
                <p className="text-[9px] text-gray-600">NIP. {schoolSetting?.wakaNip || '197804152003121002'}</p>
              </div>

              <div>
                <p>Guru Bimbingan Konseling (BK)</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{printParentCallLetter.counselorName}</p>
                <p className="text-[9px] text-gray-600">NIP. {printParentCallLetter.counselorNip || '198509122010012008'}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL PRINT RESMI: BERITA ACARA HOME VISIT */}
      {/* ========================================================= */}
      {printHomeVisitLetter && (
        <Modal
          isOpen={Boolean(printHomeVisitLetter)}
          onClose={() => setPrintHomeVisitLetter(null)}
          title="Berita Acara Kunjungan Rumah (Home Visit)"
          subtitle="Format resmi dokumentasi dan komitmen pembinaan siswa"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-zinc-500">FORMAT BERITA ACARA RESMI</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintHomeVisitLetter(null)}
                  className="px-3 py-1.5 rounded border border-[#27272a] text-zinc-300 font-mono text-xs hover:bg-[#161618]"
                >
                  TUTUP
                </button>
                <button
                  onClick={handlePrintDocument}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>CETAK_BERITA_ACARA</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-white text-black p-6 rounded font-serif text-[11px] leading-relaxed shadow-lg select-text border border-zinc-300">
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h3 className="font-extrabold text-sm uppercase">{schoolSetting?.name}</h3>
              <p className="font-bold text-xs uppercase tracking-wide">BERITA ACARA KUNJUNGAN RUMAH (HOME VISIT)</p>
              <p className="text-[9px] font-sans text-gray-600">TAHUN PELAJARAN {activeAcademicYear}</p>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <p>
                Pada hari ini, tanggal <strong>{printHomeVisitLetter.date}</strong>, telah dilaksanakan kunjungan rumah (home visit) terhadap peserta didik:
              </p>

              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                <p><strong>Nama Siswa</strong> : {printHomeVisitLetter.studentName}</p>
                <p><strong>Kelas</strong> : {printHomeVisitLetter.studentClass}</p>
                <p><strong>Alamat Rumah</strong> : {printHomeVisitLetter.address}</p>
                <p><strong>Orang Tua / Wali Ditemui</strong> : {printHomeVisitLetter.visitedPerson} ({printHomeVisitLetter.relationship})</p>
                <p><strong>Petugas Home Visit</strong> : {printHomeVisitLetter.counselorName} & {printHomeVisitLetter.companionName || 'Wali Kelas'}</p>
              </div>

              <div>
                <p className="font-bold">A. Alasan & Tujuan Kunjungan:</p>
                <p className="text-gray-800 italic pl-3">{printHomeVisitLetter.purpose}</p>
              </div>

              <div>
                <p className="font-bold">B. Hasil Wawancara & Observasi Lingkungan Rumah:</p>
                <p className="text-gray-800 pl-3">{printHomeVisitLetter.findings}</p>
              </div>

              <div>
                <p className="font-bold">C. Kesepakatan & Komitmen Pembinaan:</p>
                <p className="text-gray-800 pl-3">{printHomeVisitLetter.agreements || '-'}</p>
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 font-sans text-center text-xs">
              <div>
                <p>Orang Tua / Wali Murid</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{printHomeVisitLetter.visitedPerson || 'Orang Tua Siswa'}</p>
              </div>

              <div>
                <p>Petugas Guru BK / Konselor</p>
                <div className="h-14"></div>
                <p className="font-bold underline">{printHomeVisitLetter.counselorName || currentUser?.displayName || 'Guru BK'}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL DETAIL KONSULTASI */}
      {/* ========================================================= */}
      {detailCounseling && (
        <Modal
          isOpen={Boolean(detailCounseling)}
          onClose={() => setDetailCounseling(null)}
          title={`Rekam Bimbingan: ${detailCounseling.studentName}`}
          subtitle={`Kelas ${detailCounseling.studentClass} • Tanggal: ${detailCounseling.date}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setDetailCounseling(null)}
              className="px-3 py-1.5 rounded bg-zinc-800 text-white font-mono text-xs"
            >
              TUTUP
            </button>
          }
        >
          <div className="space-y-2.5 font-sans text-xs">
            <div className="p-3 rounded bg-[#161618] border border-[#27272a] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-400 text-sm">{detailCounseling.topic}</span>
                <StatusBadge status={detailCounseling.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div>Bidang: <strong className="text-zinc-200">{detailCounseling.serviceField || 'Belajar'}</strong></div>
                <div>Konselor: <strong className="text-zinc-200">{detailCounseling.counselorName}</strong></div>
                <div>Jenis: <strong className="text-zinc-200">{detailCounseling.counselingType || 'Individu'}</strong></div>
                <div>Urgensi: <strong className="text-zinc-200">{detailCounseling.urgencyLevel || 'Sedang'}</strong></div>
              </div>
              <div className="border-t border-[#27272a] pt-2">
                <p className="font-mono text-[10px] text-zinc-500 uppercase">CATATAN KONSELING:</p>
                <p className="text-zinc-200 mt-0.5">{detailCounseling.notes}</p>
              </div>
              <div className="border-t border-[#27272a] pt-2">
                <p className="font-mono text-[10px] text-zinc-500 uppercase">SOLUSI & KESEPAKATAN:</p>
                <p className="text-emerald-400 mt-0.5">{detailCounseling.solution || '-'}</p>
              </div>
              <div className="border-t border-[#27272a] pt-2">
                <p className="font-mono text-[10px] text-zinc-500 uppercase">RENCANA TINDAK LANJUT:</p>
                <p className="text-amber-400 mt-0.5">{detailCounseling.followUpPlan || '-'}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* CONFIRM DIALOG DELETE */}
      {/* ========================================================= */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Penghapusan Rekam BK"
        message={`Apakah Anda yakin ingin menghapus data rekam bimbingan untuk siswa "${deleteTarget?.name}"?`}
        confirmText="Hapus Data"
      />
    </div>
  );
};
