import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  GraduationCap,
  Lock,
  Shield,
  Scale
} from 'lucide-react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import {
  StudentCounseling,
  HomeVisitRecord,
  ParentCallLetter,
  CareerGuidanceRecord,
  CallLetterStatus,
  SanctionStageType,
  SpLetterType,
  Violation
} from '../types';
import { OFFICIAL_DISCIPLINE_TIERS, getDisciplineTier } from '../services/officialRulesData';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExportActions } from '../components/common/ExportActions';
import { ClassGridFilter } from '../components/common/ClassGridFilter';
import { SchoolLetterhead } from '../components/common/SchoolLetterhead';
import { calculateRecordCountsByClass, isStudentInClass } from '../utils/classResolver';

type ActiveBkTab = 'counseling' | 'home_visit' | 'parent_call' | 'career' | 'analytics';

interface CounselingPageProps {
  initialReferral?: Violation | null;
  onClearReferral?: () => void;
}

export const CounselingPage: React.FC<CounselingPageProps> = ({ initialReferral, onClearReferral }) => {
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
    handbookMeta,
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
  const [parentCallStageFilter, setParentCallStageFilter] = useState<string>('all');

  // Helpers for SK B-380 Disciplinary Point & Tier Calculation
  const getStudentViolationPoints = (studentId: string) => {
    return violations
      .filter(v => v.studentId === studentId && !v.isDeleted)
      .reduce((sum, v) => sum + (Number(v.points) || 0), 0);
  };

  const getStudentViolationsList = (studentId: string) => {
    return violations.filter(v => v.studentId === studentId && !v.isDeleted);
  };

  const generateLetterNumber = (stage: SanctionStageType) => {
    const code = stage === 1 ? 'PL-01' : stage === 2 ? 'SP-1' : stage === 3 ? 'SP-2' : stage === 4 ? 'SP-3' : 'SK-MUT';
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    return `B-380/Ma.26.02/PP.00.6/${code}/${year}/${rand}`;
  };

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
    isConfidential: false,
    confidentialNotes: '',
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
    letterNumber: generateLetterNumber(2),
    callNumber: 1,
    sanctionStage: 2,
    spType: 'SP 1',
    suspensionDays: 3,
    pointsAtIssuance: 0,
    studentViolationSummary: '',
    homeroomTeacherName: '',
    homeroomTeacherNip: '',
    principalName: handbookMeta?.signedBy || 'Zakaria, S. Pd.I., M. Pd',
    principalNip: handbookMeta?.signedNip || '197808042003121008',
    callDate: new Date().toISOString().split('T')[0],
    callTime: '08:30 WIT',
    location: 'Ruang Bimbingan & Konseling (BK)',
    reason: '',
    counselorName: currentUser?.displayName || 'Guru BK',
    counselorNip: currentUser?.nip || '198509122010012008',
    wakaName: handbookMeta?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
    wakaNip: handbookMeta?.wakaNip || '198810052020121003',
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
      isConfidential: false,
      confidentialNotes: '',
      status: 'Selesai'
    });
    setIsCounselingModalOpen(true);
  };

  const handleOpenEditCounseling = (item: StudentCounseling, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCounseling(item);
    setCounselingForm({
      ...item,
      isConfidential: Boolean(item.isConfidential),
      confidentialNotes: item.confidentialNotes || ''
    });
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
          studentNis: student?.nis || counselingForm.studentNis,
          isConfidential: Boolean(counselingForm.isConfidential),
          confidentialNotes: counselingForm.confidentialNotes || ''
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
          isConfidential: Boolean(counselingForm.isConfidential),
          confidentialNotes: counselingForm.confidentialNotes || '',
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
  // PARENT CALL LETTER & SP HANDLERS (SK B-380)
  // ==========================================
  const handleOpenAddParentCall = (targetStudentId?: string, forceStage?: SanctionStageType) => {
    setEditingParentCall(null);
    const def = targetStudentId ? (students.find(s => s.id === targetStudentId) || students[0]) : students[0];
    const pts = def ? getStudentViolationPoints(def.id) : 0;
    const tier = getDisciplineTier(pts);
    const stg = forceStage || (tier ? (tier.tier as SanctionStageType) : (pts >= 10 ? 1 : 2));
    const cClass = classes.find(c => c.name === def?.className);
    const viols = def ? getStudentViolationsList(def.id) : [];
    const violSummary = viols.map(v => `${v.violationType} (+${v.points}p)`).slice(0, 3).join(', ');

    const defaultCallNum = stg === 1 ? 1 : stg === 2 ? 1 : stg === 3 ? 2 : 3;
    const defaultSpType: SpLetterType =
      stg === 1 ? 'Peringatan Lisan' :
      stg === 2 ? 'SP 1' :
      stg === 3 ? 'SP 2' :
      stg === 4 ? 'SP 3' : 'Pengembalian Siswa';

    const defaultReason =
      stg === 1 ? `Peringatan lisan dan pembinaan sikap atas akumulasi ${pts} poin pelanggaran tata tertib.` :
      stg === 2 ? `Panggilan Orang Tua I dan penerbitan Surat Peringatan I (SP 1) atas akumulasi ${pts} poin pelanggaran.` :
      stg === 3 ? `Panggilan Orang Tua II, penyampaian SP 2, dan penetapan Skorsing Edukatif 3 hari kerja (Akumulasi ${pts} poin).` :
      stg === 4 ? `Panggilan Orang Tua III dan Sidang Kasus Kedisiplinan SP 3 (Peringatan Terakhir) atas akumulasi ${pts} poin.` :
      `Pemberitahuan Keputusan Pengembalian Pembinaan Siswa kepada Orang Tua/Wali (Akumulasi ${pts} poin).`;

    const defaultLocation =
      stg === 1 ? 'Ruang Kelas / Ruang Wali Kelas' :
      stg === 4 || stg === 5 ? 'Ruang Kepala Madrasah' : 'Ruang Bimbingan & Konseling (BK)';

    setParentCallForm({
      studentId: def?.id || '',
      studentName: def?.fullName || '',
      studentClass: def?.className || '',
      studentNis: def?.nis || '',
      parentName: def?.parentName || 'Bapak/Ibu Orang Tua Siswa',
      letterNumber: generateLetterNumber(stg),
      callNumber: defaultCallNum as 1 | 2 | 3,
      sanctionStage: stg,
      spType: defaultSpType,
      suspensionDays: stg === 3 ? 3 : undefined,
      pointsAtIssuance: pts,
      studentViolationSummary: violSummary,
      homeroomTeacherName: cClass?.homeroomTeacher || '',
      homeroomTeacherNip: '',
      principalName: handbookMeta?.signedBy || 'Zakaria, S. Pd.I., M. Pd',
      principalNip: handbookMeta?.signedNip || '197808042003121008',
      callDate: new Date().toISOString().split('T')[0],
      callTime: '08:30 WIT',
      location: defaultLocation,
      reason: defaultReason,
      counselorName: currentUser?.displayName || 'Guru BK',
      counselorNip: currentUser?.nip || '198509122010012008',
      wakaName: handbookMeta?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
      wakaNip: handbookMeta?.wakaNip || '198810052020121003',
      status: 'Diterbitkan',
      notes: ''
    });
    setIsParentCallModalOpen(true);
  };

  // Handle incoming referral from ViolationsPage
  useEffect(() => {
    if (initialReferral?.studentId) {
      setActiveTab('parent_call');
      handleOpenAddParentCall(initialReferral.studentId);
      if (onClearReferral) {
        onClearReferral();
      }
    }
  }, [initialReferral]);

  const handleOpenEditParentCall = (item: ParentCallLetter, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingParentCall(item);
    setParentCallForm({
      ...item,
      sanctionStage: item.sanctionStage || (item.callNumber === 1 ? 2 : item.callNumber === 2 ? 3 : 4),
      spType: item.spType || (item.callNumber === 1 ? 'SP 1' : item.callNumber === 2 ? 'SP 2' : 'SP 3'),
      suspensionDays: item.suspensionDays || (item.callNumber === 2 ? 3 : undefined),
      pointsAtIssuance: item.pointsAtIssuance ?? (item.studentId ? getStudentViolationPoints(item.studentId) : 0),
      wakaName: item.wakaName || handbookMeta?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
      wakaNip: item.wakaNip || handbookMeta?.wakaNip || '198810052020121003',
      principalName: item.principalName || handbookMeta?.signedBy || 'Zakaria, S. Pd.I., M. Pd',
      principalNip: item.principalNip || handbookMeta?.signedNip || '197808042003121008'
    });
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
      const studentPts = student ? getStudentViolationPoints(student.id) : (parentCallForm.pointsAtIssuance || 0);
      const payload: Partial<ParentCallLetter> = {
        ...parentCallForm,
        studentName: student?.fullName || parentCallForm.studentName,
        studentClass: student?.className || parentCallForm.studentClass,
        studentNis: student?.nis || parentCallForm.studentNis,
        parentName: student?.parentName || parentCallForm.parentName,
        pointsAtIssuance: parentCallForm.pointsAtIssuance ?? studentPts,
        sanctionStage: parentCallForm.sanctionStage || 2,
        spType: parentCallForm.spType || 'SP 1',
        suspensionDays: parentCallForm.sanctionStage === 3 ? (parentCallForm.suspensionDays || 3) : undefined,
        wakaName: parentCallForm.wakaName || handbookMeta?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or',
        wakaNip: parentCallForm.wakaNip || handbookMeta?.wakaNip || '198810052020121003',
        principalName: parentCallForm.principalName || handbookMeta?.signedBy || 'Zakaria, S. Pd.I., M. Pd',
        principalNip: parentCallForm.principalNip || handbookMeta?.signedNip || '197808042003121008'
      };

      if (editingParentCall) {
        await updateParentCallLetter(editingParentCall.id, payload);
      } else {
        await addParentCallLetter({
          studentId: parentCallForm.studentId!,
          studentName: student?.fullName || 'Siswa',
          studentClass: student?.className || '',
          studentNis: student?.nis || '',
          parentName: parentCallForm.parentName || student?.parentName || 'Orang Tua Siswa',
          letterNumber: parentCallForm.letterNumber!,
          callNumber: (parentCallForm.callNumber as any) || 1,
          sanctionStage: payload.sanctionStage || 2,
          spType: payload.spType || 'SP 1',
          suspensionDays: payload.suspensionDays,
          pointsAtIssuance: payload.pointsAtIssuance || 0,
          studentViolationSummary: parentCallForm.studentViolationSummary || '',
          homeroomTeacherName: parentCallForm.homeroomTeacherName || '',
          homeroomTeacherNip: parentCallForm.homeroomTeacherNip || '',
          principalName: payload.principalName,
          principalNip: payload.principalNip,
          callDate: parentCallForm.callDate!,
          callTime: parentCallForm.callTime || '08:30 WIT',
          location: parentCallForm.location || 'Ruang BK',
          reason: parentCallForm.reason!,
          counselorName: parentCallForm.counselorName || currentUser?.displayName || 'Guru BK',
          counselorNip: parentCallForm.counselorNip,
          wakaName: payload.wakaName,
          wakaNip: payload.wakaNip,
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
      if (parentCallStageFilter !== 'all') {
        const stage = p.sanctionStage || (p.callNumber === 1 ? 2 : p.callNumber === 2 ? 3 : 4);
        if (String(stage) !== parentCallStageFilter) return false;
      }
      return true;
    });
  }, [parentCallLetters, selectedClass, parentCallStatusFilter, parentCallStageFilter, classes, students]);

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
          <div className="flex items-center gap-1.5">
            {c.studentCode && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {c.studentCode}
              </span>
            )}
            <p className="font-bold text-zinc-100">{c.studentName}</p>
          </div>
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
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {c.serviceField || 'Belajar'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {c.counselingType || 'Individu'}
            </span>
            {c.isConfidential && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-purple-400" /> Rahasia (BK & Waka)
              </span>
            )}
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
          <div className="flex items-center gap-1 mt-0.5">
            {c.counselorCode && (
              <span className="font-mono text-[9px] font-bold px-1 rounded bg-zinc-800 text-amber-300 border border-amber-500/30">
                {c.counselorCode}
              </span>
            )}
            <p className="text-[11px] text-zinc-400">Oleh: {c.counselorName}</p>
          </div>
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
      header: 'No. Surat & Tahapan Sanksi',
      accessorKey: 'letterNumber',
      sortable: true,
      cell: p => {
        const stage = p.sanctionStage || (p.callNumber === 1 ? 2 : p.callNumber === 2 ? 3 : 4);
        const stageTier = OFFICIAL_DISCIPLINE_TIERS.find(t => t.tier === stage);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-blue-400">{p.letterNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {stage === 1 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tahap 1: Lisan (10-20 Poin)
                </span>
              )}
              {stage === 2 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Tahap 2: SP 1 (21-40 Poin)
                </span>
              )}
              {stage === 3 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Tahap 3: SP 2 • Skorsing {p.suspensionDays || 3} Hari (41-75 Poin)
                </span>
              )}
              {stage === 4 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600/25 text-red-300 border border-red-500/40">
                  Tahap 4: SP 3 Terakhir (76-99 Poin)
                </span>
              )}
              {stage === 5 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-600/25 text-purple-300 border border-purple-500/40">
                  Tahap 5: Pengembalian (≥100 Poin)
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Siswa & Akumulasi Poin',
      accessorKey: 'studentName',
      sortable: true,
      cell: p => {
        const studentPts = p.pointsAtIssuance ?? (p.studentId ? getStudentViolationPoints(p.studentId) : 0);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-zinc-100">{p.studentName}</p>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {p.studentClass}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {studentPts} Poin
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Yth. {p.parentName || 'Orang Tua / Wali'}</p>
          </div>
        );
      }
    },
    {
      header: 'Jadwal & Tempat',
      accessorKey: 'callDate',
      sortable: true,
      cell: p => (
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">📅 {p.callDate} • {p.callTime}</span>
          <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">📍 {p.location}</p>
        </div>
      )
    },
    {
      header: 'Penandatangan Dokumen',
      accessorKey: 'wakaName',
      cell: p => {
        const stage = p.sanctionStage || (p.callNumber === 1 ? 2 : p.callNumber === 2 ? 3 : 4);
        return (
          <div className="text-[10px] font-mono text-zinc-400">
            {stage === 1 && <span>Wali Kelas & Siswa</span>}
            {stage === 2 && <span>Wali Kelas & Guru BK</span>}
            {stage === 3 && <span className="text-rose-400 font-semibold">Waka Kesiswaan & BK</span>}
            {stage === 4 && <span className="text-red-400 font-bold">Kepala Madrasah & Waka</span>}
            {stage === 5 && <span className="text-purple-400 font-bold">Kepala MAN 2 SBT & Komite</span>}
          </div>
        );
      }
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
            title="Cetak Surat Resmi Sesuai SK B-380"
          >
            <Printer className="w-3 h-3" />
            <span>CETAK_SURAT</span>
          </button>
          <button
            onClick={() => setPrintParentCallLetter(p)}
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-[#161618]"
            title="Lihat Pratinjau Dokumen"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => handleOpenEditParentCall(p, e)}
            className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-[#161618]"
            title="Edit Dokumen"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setDeleteTarget({ type: 'parent_call', id: p.id, name: p.studentName });
            }}
            className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#161618]"
            title="Hapus Surat"
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
          className={`relative px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'counseling'
              ? 'text-pink-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          {activeTab === 'counseling' && (
            <motion.div
              layoutId="activeCounselingTabIndicator"
              className="absolute inset-0 bg-pink-600/20 border border-pink-500/40 rounded z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>SESI_KONSELING ({counseling.length})</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('home_visit')}
          className={`relative px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'home_visit'
              ? 'text-purple-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          {activeTab === 'home_visit' && (
            <motion.div
              layoutId="activeCounselingTabIndicator"
              className="absolute inset-0 bg-purple-600/20 border border-purple-500/40 rounded z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <Home className="w-3.5 h-3.5" />
            <span>KUNJUNGAN_RUMAH ({homeVisits.length})</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('parent_call')}
          className={`relative px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'parent_call'
              ? 'text-blue-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          {activeTab === 'parent_call' && (
            <motion.div
              layoutId="activeCounselingTabIndicator"
              className="absolute inset-0 bg-blue-600/20 border border-blue-500/40 rounded z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <Mail className="w-3.5 h-3.5" />
            <span>PANGGILAN_ORTU ({parentCallLetters.length})</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('career')}
          className={`relative px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'career'
              ? 'text-emerald-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          {activeTab === 'career' && (
            <motion.div
              layoutId="activeCounselingTabIndicator"
              className="absolute inset-0 bg-emerald-600/20 border border-emerald-500/40 rounded z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5" />
            <span>KARIR_&_PEMINATAN ({careerGuidances.length})</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`relative px-3 py-1.5 rounded flex items-center space-x-2 transition-all ${
            activeTab === 'analytics'
              ? 'text-amber-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161618]'
          }`}
        >
          {activeTab === 'analytics' && (
            <motion.div
              layoutId="activeCounselingTabIndicator"
              className="absolute inset-0 bg-amber-600/20 border border-amber-500/40 rounded z-0"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>REKAP_&_LAPORAN_BK</span>
          </span>
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
      <AnimatePresence mode="wait">
      {activeTab === 'counseling' && (
        <motion.div
          key="counseling"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-3"
        >
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
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KUNJUNGAN RUMAH (HOME VISIT) */}
      {/* ========================================================= */}
      {activeTab === 'home_visit' && (
        <motion.div
          key="home_visit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-3"
        >
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
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SURAT PANGGILAN ORANG TUA (SP) */}
      {/* ========================================================= */}
      {activeTab === 'parent_call' && (
        <motion.div
          key="parent_call"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-3"
        >
          {/* Disciplinary Summary Banner SK B-380 */}
          <div className="p-3 bg-[#0d0d0f] border border-[#27272a] rounded space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-zinc-200">
                  5 TAHAPAN SANKSI & PEMANGGILAN RESMI (SK KEPALA MADRASAH B-380)
                </span>
              </div>
              <button
                onClick={() => handleOpenAddParentCall()}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>TERBITKAN_SURAT_SP_BARU</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-amber-950/20 border border-amber-800/40 text-amber-300">
                <div className="font-bold text-amber-200">Tahap 1 (10-20 Poin)</div>
                <div className="text-[10px] text-amber-400/80">Peringatan Lisan 1 & 2</div>
                <div className="text-[9px] text-zinc-400 mt-1">Penandatangan: Wali Kelas</div>
              </div>
              <div className="p-2 rounded bg-blue-950/20 border border-blue-800/40 text-blue-300">
                <div className="font-bold text-blue-200">Tahap 2 (21-40 Poin)</div>
                <div className="text-[10px] text-blue-400/80">SP 1 & Panggilan I</div>
                <div className="text-[9px] text-zinc-400 mt-1">Penandatangan: Wali Kelas & BK</div>
              </div>
              <div className="p-2 rounded bg-rose-950/20 border border-rose-800/40 text-rose-300">
                <div className="font-bold text-rose-200">Tahap 3 (41-75 Poin)</div>
                <div className="text-[10px] text-rose-400/80">SP 2 & Skorsing 3 Hari</div>
                <div className="text-[9px] text-zinc-400 mt-1">Penandatangan: Waka Kesiswaan & BK</div>
              </div>
              <div className="p-2 rounded bg-red-950/20 border border-red-800/40 text-red-300">
                <div className="font-bold text-red-200">Tahap 4 (76-99 Poin)</div>
                <div className="text-[10px] text-red-400/80">SP 3 (Peringatan Terakhir)</div>
                <div className="text-[9px] text-zinc-400 mt-1">Penandatangan: Kepala Madrasah & Waka</div>
              </div>
              <div className="p-2 rounded bg-purple-950/20 border border-purple-800/40 text-purple-300">
                <div className="font-bold text-purple-200">Tahap 5 (≥100 Poin)</div>
                <div className="text-[10px] text-purple-400/80">Pengembalian ke Ortu</div>
                <div className="text-[9px] text-zinc-400 mt-1">SK Kepala MAN 2 SBT</div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#0d0d0f] border border-[#27272a] rounded flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-500">FILTER_TAHAP:</span>
              {[
                { id: 'all', label: 'SEMUA' },
                { id: '1', label: 'TAHAP 1 (LISAN)' },
                { id: '2', label: 'TAHAP 2 (SP 1)' },
                { id: '3', label: 'TAHAP 3 (SP 2)' },
                { id: '4', label: 'TAHAP 4 (SP 3)' },
                { id: '5', label: 'TAHAP 5 (KELUAR)' }
              ].map(stg => (
                <button
                  key={stg.id}
                  onClick={() => setParentCallStageFilter(stg.id)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    parentCallStageFilter === stg.id
                      ? 'bg-amber-600/25 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {stg.label}
                </button>
              ))}

              <span className="text-zinc-500 ml-2">STATUS:</span>
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
                { header: 'Tahap', key: 'sanctionStage' },
                { header: 'Jenis SP', key: 'spType' },
                { header: 'Poin Saat Terbit', key: 'pointsAtIssuance' },
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
            searchableKeys={['letterNumber', 'studentName', 'parentName', 'reason', 'spType']}
            onRowClick={p => setPrintParentCallLetter(p)}
          />
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: KARIR & PEMINATAN */}
      {/* ========================================================= */}
      {activeTab === 'career' && (
        <motion.div
          key="career"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-3"
        >
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
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REKAPITULASI & LAPORAN BK */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <motion.div
          key="analytics"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="space-y-3"
        >
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
        </motion.div>
      )}
      </AnimatePresence>

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

          {/* Privilege Khusus Guru BK & Waka Kesiswaan: Catatan Konseling Rahasia */}
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200">Catatan Konseling Rahasia (Confidential)</span>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-purple-300">
                <input
                  type="checkbox"
                  checked={counselingForm.isConfidential || false}
                  onChange={e => setCounselingForm({ ...counselingForm, isConfidential: e.target.checked })}
                  className="rounded bg-[#161618] border-purple-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Aktifkan Catatan Rahasia</span>
              </label>
            </div>
            <p className="text-[10px] text-zinc-400">
              Sesuai kode etik BK & kebijakan RBAC SIM-Kesiswaan: Catatan rahasia hanya dapat dibaca dan diakses oleh sesama Guru BK dan Waka Kesiswaan.
            </p>
            {counselingForm.isConfidential && (
              <div className="pt-1">
                <textarea
                  rows={3}
                  value={counselingForm.confidentialNotes || ''}
                  onChange={e => setCounselingForm({ ...counselingForm, confidentialNotes: e.target.value })}
                  placeholder="Ketik catatan medis / psikologis / latar belakang keluarga yang bersifat rahasia di sini..."
                  className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-purple-800/50 text-purple-200 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            )}
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
        title={editingParentCall ? 'Edit Surat Panggilan Orang Tua & SP' : 'Terbitkan Surat Panggilan / SP Resmi (SK B-380)'}
        subtitle="Penerbitan surat keputusan pembinaan, peringatan (SP 1-3), dan pemanggilan orang tua"
        maxWidth="2xl"
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
              SIMPAN_&_TERBITKAN_DOKUMEN
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveParentCall} className="space-y-3 font-sans text-xs">
          {/* Pilih Siswa & Analisis Poin Otomatis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                PILIH SISWA TERPANGGIL *
              </label>
              <select
                value={parentCallForm.studentId}
                onChange={e => {
                  const st = students.find(s => s.id === e.target.value);
                  if (!st) return;
                  const pts = getStudentViolationPoints(st.id);
                  const tier = getDisciplineTier(pts);
                  const suggestedStage = (tier ? tier.tier : (pts >= 10 ? 1 : 2)) as SanctionStageType;
                  const cClass = classes.find(c => c.name === st.className);
                  const viols = getStudentViolationsList(st.id);
                  const violSummary = viols.map(v => `${v.violationType} (+${v.points}p)`).slice(0, 3).join(', ');

                  const callNum = suggestedStage === 1 ? 1 : suggestedStage === 2 ? 1 : suggestedStage === 3 ? 2 : 3;
                  const spT: SpLetterType =
                    suggestedStage === 1 ? 'Peringatan Lisan' :
                    suggestedStage === 2 ? 'SP 1' :
                    suggestedStage === 3 ? 'SP 2' :
                    suggestedStage === 4 ? 'SP 3' : 'Pengembalian Siswa';

                  const loc = suggestedStage === 1 ? 'Ruang Kelas / Ruang Wali Kelas' : suggestedStage === 4 || suggestedStage === 5 ? 'Ruang Kepala Madrasah' : 'Ruang Bimbingan & Konseling (BK)';
                  const rsn =
                    suggestedStage === 1 ? `Peringatan lisan dan pembinaan sikap atas akumulasi ${pts} poin pelanggaran tata tertib.` :
                    suggestedStage === 2 ? `Panggilan Orang Tua I dan penerbitan Surat Peringatan I (SP 1) atas akumulasi ${pts} poin pelanggaran.` :
                    suggestedStage === 3 ? `Panggilan Orang Tua II, penyampaian SP 2, dan penetapan Skorsing Edukatif 3 hari kerja (Akumulasi ${pts} poin).` :
                    suggestedStage === 4 ? `Panggilan Orang Tua III dan Sidang Kasus Kedisiplinan SP 3 (Peringatan Terakhir) atas akumulasi ${pts} poin.` :
                    `Pemberitahuan Keputusan Pengembalian Pembinaan Siswa kepada Orang Tua/Wali (Akumulasi ${pts} poin).`;

                  setParentCallForm({
                    ...parentCallForm,
                    studentId: st.id,
                    studentName: st.fullName || '',
                    studentClass: st.className || '',
                    studentNis: st.nis || '',
                    parentName: st.parentName || parentCallForm.parentName || 'Orang Tua Siswa',
                    pointsAtIssuance: pts,
                    sanctionStage: suggestedStage,
                    spType: spT,
                    callNumber: callNum as 1 | 2 | 3,
                    suspensionDays: suggestedStage === 3 ? 3 : undefined,
                    letterNumber: generateLetterNumber(suggestedStage),
                    homeroomTeacherName: cClass?.homeroomTeacher || parentCallForm.homeroomTeacherName || '',
                    location: loc,
                    reason: rsn,
                    studentViolationSummary: violSummary
                  });
                }}
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              >
                {students.map(s => {
                  const pts = getStudentViolationPoints(s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className}) — {pts} Poin
                    </option>
                  );
                })}
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
                placeholder="Bapak/Ibu Orang Tua Siswa"
                className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
              />
            </div>
          </div>

          {/* Status Akumulasi Poin Real-time & Rekomendasi SK B-380 */}
          {parentCallForm.studentId && (() => {
            const pts = parentCallForm.pointsAtIssuance ?? getStudentViolationPoints(parentCallForm.studentId);
            const tier = getDisciplineTier(pts);
            return (
              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-800/50 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span className="font-mono text-[11px] font-bold text-blue-200">
                      STATUS KEDISIPLINAN: AKUMULASI {pts} POIN
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    {tier ? tier.name : (pts < 10 ? 'Di Bawah Ambang Peringatan (<10 Poin)' : 'Tahap Pembinaan')}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {tier ? tier.actionRequired : 'Siswa belum melampaui batas minimum sanksi (10 poin), namun bimbingan preventif tetap dapat dilaksanakan.'}
                </p>
                {parentCallForm.studentViolationSummary && (
                  <div className="text-[10px] font-mono text-zinc-400 truncate">
                    Pelanggaran tercatat: <span className="text-zinc-300">{parentCallForm.studentViolationSummary}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pilihan Tahapan Sanksi (1 s.d 5) */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
              KLASIFIKASI TAHAPAN SANKSI RESMI (SK B-380) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 font-mono text-[10px]">
              {[
                { stage: 1, label: 'Tahap 1: Lisan', range: '10-20 Poin', sp: 'Peringatan Lisan', call: 1, loc: 'Ruang Kelas / Wali Kelas' },
                { stage: 2, label: 'Tahap 2: SP 1', range: '21-40 Poin', sp: 'SP 1', call: 1, loc: 'Ruang BK' },
                { stage: 3, label: 'Tahap 3: SP 2', range: '41-75 Poin (Skorsing)', sp: 'SP 2', call: 2, loc: 'Ruang Waka Kesiswaan & BK' },
                { stage: 4, label: 'Tahap 4: SP 3', range: '76-99 Poin (Terakhir)', sp: 'SP 3', call: 3, loc: 'Ruang Kepala Madrasah' },
                { stage: 5, label: 'Tahap 5: Pengembalian', range: '≥100 Poin (DO/Mutasi)', sp: 'Pengembalian Siswa', call: 3, loc: 'Ruang Kepala Madrasah' }
              ].map(opt => {
                const isSelected = parentCallForm.sanctionStage === opt.stage;
                return (
                  <button
                    key={opt.stage}
                    type="button"
                    onClick={() => {
                      const pts = parentCallForm.pointsAtIssuance || 0;
                      const rsn =
                        opt.stage === 1 ? `Peringatan lisan dan pembinaan sikap atas akumulasi ${pts} poin pelanggaran tata tertib.` :
                        opt.stage === 2 ? `Panggilan Orang Tua I dan penerbitan Surat Peringatan I (SP 1) atas akumulasi ${pts} poin pelanggaran.` :
                        opt.stage === 3 ? `Panggilan Orang Tua II, penyampaian SP 2, dan penetapan Skorsing Edukatif 3 hari kerja (Akumulasi ${pts} poin).` :
                        opt.stage === 4 ? `Panggilan Orang Tua III dan Sidang Kasus Kedisiplinan SP 3 (Peringatan Terakhir) atas akumulasi ${pts} poin.` :
                        `Pemberitahuan Keputusan Pengembalian Pembinaan Siswa kepada Orang Tua/Wali (Akumulasi ${pts} poin).`;

                      setParentCallForm({
                        ...parentCallForm,
                        sanctionStage: opt.stage as SanctionStageType,
                        spType: opt.sp as SpLetterType,
                        callNumber: opt.call as 1 | 2 | 3,
                        suspensionDays: opt.stage === 3 ? (parentCallForm.suspensionDays || 3) : undefined,
                        letterNumber: generateLetterNumber(opt.stage as SanctionStageType),
                        location: opt.loc,
                        reason: rsn
                      });
                    }}
                    className={`p-2 rounded text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 text-blue-300 font-bold shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                        : 'bg-[#161618] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[9px] text-zinc-500">{opt.range}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sanksi Khusus Skorsing jika Tahap 3 */}
          {parentCallForm.sanctionStage === 3 && (
            <div className="p-2.5 rounded bg-rose-950/25 border border-rose-800/40 space-y-1">
              <label className="block font-mono text-[10px] text-rose-300 uppercase tracking-widest font-bold">
                DURASI SKORSING EDUKATIF (HARI KERJA) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={parentCallForm.suspensionDays || 3}
                  onChange={e => setParentCallForm({ ...parentCallForm, suspensionDays: Number(e.target.value) })}
                  className="w-24 px-2.5 py-1.5 rounded bg-[#161618] border border-rose-700/60 text-rose-200 font-mono font-bold text-center"
                />
                <span className="text-zinc-300 text-xs">
                  Hari Kerja (Standar SK B-380: <strong>3 Hari Kerja</strong> belajar mandiri di rumah di bawah pengawasan orang tua)
                </span>
              </div>
            </div>
          )}

          {/* Nomor Surat & Jadwal Pertemuan */}
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
                STATUS SURAT
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
                placeholder="08:30 WIT"
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
              placeholder="Perihal pemanggilan dan tindak lanjut pembinaan..."
              className="w-full px-2.5 py-1.5 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
            />
          </div>

          {/* Pejabat Penandatangan Resmi Sesuai SK B-380 */}
          <div className="pt-2 border-t border-[#27272a] space-y-2">
            <h4 className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              PEJABAT PENANDATANGAN RESMI (SK KEPALA MADRASAH B-380)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-zinc-500 mb-0.5">Wali Kelas</label>
                <input
                  type="text"
                  value={parentCallForm.homeroomTeacherName || ''}
                  onChange={e => setParentCallForm({ ...parentCallForm, homeroomTeacherName: e.target.value })}
                  placeholder="Nama Wali Kelas"
                  className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-zinc-500 mb-0.5">Guru Bimbingan Konseling (BK)</label>
                <input
                  type="text"
                  value={parentCallForm.counselorName || ''}
                  onChange={e => setParentCallForm({ ...parentCallForm, counselorName: e.target.value })}
                  placeholder="Nama Guru BK"
                  className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-zinc-500 mb-0.5">Waka Kesiswaan</label>
                <input
                  type="text"
                  value={parentCallForm.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or'}
                  onChange={e => setParentCallForm({ ...parentCallForm, wakaName: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-zinc-500 mb-0.5">Kepala MAN 2 Seram Bagian Timur</label>
                <input
                  type="text"
                  value={parentCallForm.principalName || 'Zakaria, S. Pd.I., M. Pd'}
                  onChange={e => setParentCallForm({ ...parentCallForm, principalName: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-zinc-200"
                />
              </div>
            </div>
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
          title={`Format Cetak Resmi: ${
            printParentCallLetter.sanctionStage === 1 ? 'Surat Peringatan Lisan (Tahap 1)' :
            printParentCallLetter.sanctionStage === 2 ? 'Surat Panggilan Orang Tua I & SP 1 (Tahap 2)' :
            printParentCallLetter.sanctionStage === 3 ? 'Surat Panggilan II, SP 2 & Skorsing (Tahap 3)' :
            printParentCallLetter.sanctionStage === 4 ? 'Surat Panggilan III & SP 3 Terakhir (Tahap 4)' :
            'SK Pengembalian Pembinaan Siswa (Tahap 5)'
          }`}
          subtitle="Dokumen resmi kesiswaan sesuai Keputusan Kepala Madrasah SK Nomor B-380"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-zinc-500">FORMAT RESMI A4 • MAN 2 SERAM BAGIAN TIMUR</span>
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
                  <span>CETAK_DOKUMEN_RESMI</span>
                </button>
              </div>
            </div>
          }
        >
          {(() => {
            const stage = printParentCallLetter.sanctionStage || (printParentCallLetter.callNumber === 1 ? 2 : printParentCallLetter.callNumber === 2 ? 3 : 4);
            const suspensionDays = printParentCallLetter.suspensionDays || 3;
            const studentPts = printParentCallLetter.pointsAtIssuance ?? (printParentCallLetter.studentId ? getStudentViolationPoints(printParentCallLetter.studentId) : 0);
            const wakaName = printParentCallLetter.wakaName || handbookMeta?.wakaName || 'Puput Eka Bajuri, S. Pd., M. Or';
            const wakaNip = printParentCallLetter.wakaNip || handbookMeta?.wakaNip || '198810052020121003';
            const principalName = printParentCallLetter.principalName || handbookMeta?.signedBy || 'Zakaria, S. Pd.I., M. Pd';
            const principalNip = printParentCallLetter.principalNip || handbookMeta?.signedNip || '197808042003121008';
            const homeroomTeacher = printParentCallLetter.homeroomTeacherName || 'Wali Kelas';
            const counselor = printParentCallLetter.counselorName || 'Guru BK';
            const counselorNip = printParentCallLetter.counselorNip || '198509122010012008';

            return (
              <div className="bg-white text-black p-6 rounded font-serif text-[11px] leading-relaxed shadow-lg select-text border border-zinc-300 space-y-4">
                {/* Kop Surat Resmi */}
                <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />

                {/* TAHAP 1: PERINGATAN LISAN & BUKU KASUS */}
                {stage === 1 && (
                  <>
                    <div className="text-center font-sans border-b border-black pb-2">
                      <h3 className="font-bold text-sm tracking-wide uppercase">
                        SURAT PERINGATAN LISAN & PERNYATAAN PEMBINAAN SISWA
                      </h3>
                      <p className="text-[10px] text-gray-700">Nomor: {printParentCallLetter.letterNumber}</p>
                    </div>

                    <div className="space-y-2 text-justify">
                      <p>
                        Berdasarkan Buku Pedoman Tata Tertib Kesiswaan MAN 2 Seram Bagian Timur (Keputusan Kepala Madrasah Nomor B-380/Ma.26.02/PP.00.6/09/2026), pada hari ini telah dilakukan pembinaan dan pemberian <strong>Peringatan Lisan (Tahap 1)</strong> kepada:
                      </p>
                      <div className="pl-6 space-y-0.5 font-sans">
                        <p><strong>Nama Siswa</strong> : {printParentCallLetter.studentName}</p>
                        <p><strong>Kelas / NIS</strong> : {printParentCallLetter.studentClass} / {printParentCallLetter.studentNis || '-'}</p>
                        <p><strong>Akumulasi Poin</strong> : <span className="font-bold text-red-700">{studentPts} Poin</span> (Ambang Batas Tahap 1: 10 - 20 Poin)</p>
                        <p><strong>Bentuk Pelanggaran</strong> : {printParentCallLetter.studentViolationSummary || printParentCallLetter.reason}</p>
                      </div>

                      <p>
                        Peserta didik telah diberikan bimbingan persuasif oleh Wali Kelas, dicatat dalam Buku Kasus Siswa, dan berjanji dengan sungguh-sungguh untuk mentaati seluruh tata tertib madrasah serta tidak mengulangi perbuatan pelanggaran di kemudian hari.
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-6 font-sans text-center">
                      <div className="w-56">
                        <p>Siswa Yang Bersangkutan,</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{printParentCallLetter.studentName}</p>
                        <p className="text-[9px] text-gray-600">NIS: {printParentCallLetter.studentNis || '-'}</p>
                      </div>
                      <div className="w-56">
                        <p>Wali Kelas {printParentCallLetter.studentClass},</p>
                        <div className="h-16"></div>
                        <p className="font-bold underline">{homeroomTeacher}</p>
                        <p className="text-[9px] text-gray-600">NIP. {printParentCallLetter.homeroomTeacherNip || '....................................'}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* TAHAP 2: SP 1 & SURAT PANGGILAN ORTU I */}
                {stage === 2 && (
                  <>
                    <div className="flex justify-between mb-2 font-sans text-[11px]">
                      <div>
                        <p><strong>Nomor</strong> : {printParentCallLetter.letterNumber}</p>
                        <p><strong>Lampiran</strong> : 1 (Satu) Berkas Rekapitulasi Poin Disiplin</p>
                        <p><strong>Perihal</strong> : <u><strong>Surat Panggilan Orang Tua I & Surat Peringatan Pertama (SP 1)</strong></u></p>
                      </div>
                      <div className="text-right">
                        <p>Geser, {printParentCallLetter.callDate}</p>
                        <p className="mt-1">Kepada Yth:</p>
                        <p className="font-bold">Bapak/Ibu Orang Tua/Wali dari:</p>
                        <p><strong>{printParentCallLetter.studentName}</strong> (Kelas {printParentCallLetter.studentClass})</p>
                        <p>Di Tempat</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-justify">
                      <p><i>Assalamu’alaikum Warahmatullahi Wabarakatuh,</i></p>
                      <p>
                        Sehubungan dengan catatan monitoring kedisiplinan peserta didik pada SIM Kesiswaan MAN 2 Seram Bagian Timur, bahwa ananda telah mencapai akumulasi <strong>{studentPts} Poin Pelanggaran</strong> (Ambang Batas Tahap 2: 21 - 40 Poin), dengan ini madrasah menerbitkan <strong>Surat Peringatan Pertama (SP 1)</strong> dan mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali pada:
                      </p>

                      <div className="pl-6 space-y-1 font-sans my-2">
                        <p><strong>Hari / Tanggal</strong> : {printParentCallLetter.callDate}</p>
                        <p><strong>Waktu</strong> : {printParentCallLetter.callTime}</p>
                        <p><strong>Tempat</strong> : {printParentCallLetter.location}</p>
                        <p><strong>Menghadap</strong> : Wali Kelas & Guru Bimbingan Konseling (BK)</p>
                        <p><strong>Keperluan</strong> : {printParentCallLetter.reason}</p>
                      </div>

                      <p>
                        Mengingat pentingnya pembinaan karakter dan masa depan belajar ananda, kehadiran Bapak/Ibu tepat waktu sangat kami harapkan.
                      </p>
                      <p><i>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</i></p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-6 font-sans text-center text-[10px]">
                      <div>
                        <p>Wali Kelas,</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline">{homeroomTeacher}</p>
                        <p className="text-[9px] text-gray-600">NIP. {printParentCallLetter.homeroomTeacherNip || '........................'}</p>
                      </div>
                      <div>
                        <p>Mengetahui,</p>
                        <p>Orang Tua / Wali Siswa</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">({printParentCallLetter.parentName || '...................................'})</p>
                      </div>
                      <div>
                        <p>Guru BK,</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline">{counselor}</p>
                        <p className="text-[9px] text-gray-600">NIP. {counselorNip}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* TAHAP 3: SP 2, PANGGILAN II & SKORSING 3 HARI KERJA */}
                {stage === 3 && (
                  <>
                    <div className="flex justify-between mb-2 font-sans text-[11px]">
                      <div>
                        <p><strong>Nomor</strong> : {printParentCallLetter.letterNumber}</p>
                        <p><strong>Lampiran</strong> : Berita Acara Pelanggaran & Lembar Skorsing</p>
                        <p><strong>Perihal</strong> : <u><strong>Panggilan Orang Tua II, SP 2 & Penetapan Skorsing {suspensionDays} Hari</strong></u></p>
                      </div>
                      <div className="text-right">
                        <p>Geser, {printParentCallLetter.callDate}</p>
                        <p className="mt-1">Kepada Yth:</p>
                        <p className="font-bold">Bapak/Ibu Orang Tua/Wali dari:</p>
                        <p><strong>{printParentCallLetter.studentName}</strong> (Kelas {printParentCallLetter.studentClass})</p>
                        <p>Di Tempat</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-justify">
                      <p><i>Assalamu’alaikum Warahmatullahi Wabarakatuh,</i></p>
                      <p>
                        Berdasarkan Pasal 10 Bab IV dan Matriks Sanksi SK Kepala Madrasah Nomor B-380/Ma.26.02/PP.00.6/09/2026, akumulasi pelanggaran ananda telah mencapai <strong>{studentPts} Poin</strong> (Ambang Batas Tahap 3: 41 - 75 Poin). Dengan ini disampaikan bahwa ananda dijatuhi:
                      </p>

                      <div className="p-2.5 bg-zinc-100 border border-zinc-300 font-sans my-1 space-y-1">
                        <p className="font-bold text-red-700 uppercase">1. SURAT PERINGATAN KEDUA (SP 2)</p>
                        <p className="font-bold text-red-700 uppercase">
                          2. SANKSI SKORSING EDUKATIF BELAJAR MANDIRI DI RUMAH SELAMA {suspensionDays} (TIGA) HARI KERJA
                        </p>
                        <p className="text-[10px] text-zinc-700">
                          Pelaksanaan belajar mandiri di rumah wajib di bawah pengawasan langsung Orang Tua/Wali, disertai penugasan terbimbing dari para guru mata pelajaran.
                        </p>
                      </div>

                      <p>
                        Sehubungan dengan hal tersebut, Bapak/Ibu Orang Tua/Wali Murid diwajibkan hadir pada:
                      </p>

                      <div className="pl-6 space-y-0.5 font-sans">
                        <p><strong>Hari / Tanggal</strong> : {printParentCallLetter.callDate}</p>
                        <p><strong>Waktu</strong> : {printParentCallLetter.callTime}</p>
                        <p><strong>Tempat</strong> : {printParentCallLetter.location}</p>
                        <p><strong>Menghadap</strong> : Waka Kesiswaan & Guru Bimbingan Konseling (BK)</p>
                        <p><strong>Agenda</strong> : {printParentCallLetter.reason} dan Penandatanganan Pakta Integritas</p>
                      </div>

                      <p><i>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</i></p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-6 font-sans text-center text-[10px]">
                      <div>
                        <p>Menyetujui,</p>
                        <p className="font-semibold">Waka Kesiswaan</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">{wakaName}</p>
                        <p className="text-[9px] text-gray-600">NIP. {wakaNip}</p>
                      </div>
                      <div>
                        <p>Orang Tua / Wali Siswa,</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline">({printParentCallLetter.parentName || '...................................'})</p>
                      </div>
                      <div>
                        <p>Guru Bimbingan Konseling,</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline">{counselor}</p>
                        <p className="text-[9px] text-gray-600">NIP. {counselorNip}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* TAHAP 4: SP 3 - PERINGATAN TERAKHIR */}
                {stage === 4 && (
                  <>
                    <div className="flex justify-between mb-2 font-sans text-[11px]">
                      <div>
                        <p><strong>Nomor</strong> : {printParentCallLetter.letterNumber}</p>
                        <p><strong>Lampiran</strong> : Berkas Kasus Sidang Pleno Kesiswaan</p>
                        <p><strong>Perihal</strong> : <u><strong>Peringatan Terakhir (SP 3) & Panggilan Sidang Kasus Disiplin</strong></u></p>
                      </div>
                      <div className="text-right">
                        <p>Geser, {printParentCallLetter.callDate}</p>
                        <p className="mt-1">Kepada Yth:</p>
                        <p className="font-bold">Bapak/Ibu Orang Tua/Wali dari:</p>
                        <p><strong>{printParentCallLetter.studentName}</strong> (Kelas {printParentCallLetter.studentClass})</p>
                        <p>Di Tempat</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-justify">
                      <p><i>Assalamu’alaikum Warahmatullahi Wabarakatuh,</i></p>
                      <p>
                        Berdasarkan evaluasi kedisiplinan dan rekapitulasi poin pelanggaran yang telah mencapai <strong>{studentPts} Poin</strong> (Ambang Batas Tahap 4: 76 - 99 Poin), dengan ini Kepala MAN 2 Seram Bagian Timur menerbitkan:
                      </p>

                      <div className="p-2.5 bg-red-50 border-2 border-red-600 text-center font-sans my-1">
                        <h4 className="font-bold text-red-800 text-xs tracking-wider">
                          SURAT PERINGATAN KETIGA (SP 3) — PERINGATAN TERAKHIR
                        </h4>
                        <p className="text-[10px] text-red-900 mt-1">
                          <strong>PERINGATAN MUTLAK:</strong> Apabila peserta didik kembali melakukan pelanggaran hingga mencapai batas <strong>100 Poin</strong>, maka hak pembinaannya secara otomatis akan <strong>DIKEMBALIKAN KEPADA ORANG TUA / DIKELUARKAN DARI MADRASAH</strong>.
                        </p>
                      </div>

                      <p>
                        Sehubungan dengan status darurat kedisiplinan ini, Orang Tua/Wali <strong>WAJIB HADIR</strong> dalam Sidang Kasus Pleno bersama Pimpinan Madrasah pada:
                      </p>

                      <div className="pl-6 space-y-0.5 font-sans">
                        <p><strong>Hari / Tanggal</strong> : {printParentCallLetter.callDate}</p>
                        <p><strong>Waktu</strong> : {printParentCallLetter.callTime}</p>
                        <p><strong>Tempat</strong> : {printParentCallLetter.location}</p>
                        <p><strong>Pimpinan Sidang</strong> : Kepala Madrasah, Waka Kesiswaan, Tim BK & Wali Kelas</p>
                        <p><strong>Keperluan</strong> : Sidang Pleno Terakhir Penentuan Hak Status Kesiswaan</p>
                      </div>
                    </div>

                    <div className="pt-4 font-sans text-center text-[10px]">
                      <p>Mengetahui & Menyetujui,</p>
                      <p className="font-bold text-xs">Kepala MAN 2 Seram Bagian Timur</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline text-xs">{principalName}</p>
                      <p className="text-[9px] text-gray-600">NIP. {principalNip}</p>

                      <div className="grid grid-cols-3 gap-2 pt-4">
                        <div>
                          <p>Waka Kesiswaan,</p>
                          <div className="h-10"></div>
                          <p className="font-bold underline">{wakaName}</p>
                          <p className="text-[9px] text-gray-600">NIP. {wakaNip}</p>
                        </div>
                        <div>
                          <p>Orang Tua / Wali Siswa,</p>
                          <div className="h-10"></div>
                          <p className="font-bold underline">({printParentCallLetter.parentName || '..............................'})</p>
                        </div>
                        <div>
                          <p>Guru BK,</p>
                          <div className="h-10"></div>
                          <p className="font-bold underline">{counselor}</p>
                          <p className="text-[9px] text-gray-600">NIP. {counselorNip}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAHAP 5: SK PENGEMBALIAN PEMBINAAN KEPADA ORANG TUA (≥100 POIN) */}
                {stage === 5 && (
                  <>
                    <div className="text-center font-sans border-b-2 border-black pb-2">
                      <h3 className="font-bold text-xs tracking-wide uppercase">
                        KEPUTUSAN KEPALA MADRASAH ALIYAH NEGERI 2 SERAM BAGIAN TIMUR
                      </h3>
                      <p className="text-[10px] font-mono">Nomor: {printParentCallLetter.letterNumber}</p>
                      <p className="text-[11px] font-bold uppercase mt-1">TENTANG</p>
                      <p className="font-bold text-xs uppercase text-red-800">
                        PENGEMBALIAN PEMBINAAN PESERTA DIDIK KEPADA ORANG TUA / WALI
                      </p>
                    </div>

                    <div className="space-y-2 text-justify text-[10px]">
                      <p>
                        <strong>Menimbang:</strong> Bahwa peserta didik atas nama <strong>{printParentCallLetter.studentName}</strong> (Kelas {printParentCallLetter.studentClass} / NIS {printParentCallLetter.studentNis || '-'}) telah mencapai akumulasi <strong>{studentPts} Poin Pelanggaran (≥100 Poin)</strong> dan telah melampaui tahapan pembinaan SP 1, SP 2, serta SP 3 Peringatan Terakhir.
                      </p>
                      <p>
                        <strong>Mengingat:</strong> Keputusan Kepala MAN 2 Seram Bagian Timur Nomor B-380/Ma.26.02/PP.00.6/09/2026 tentang Buku Pedoman Tata Tertib & Kode Etik Peserta Didik Bab V Pasal 11 tentang Sanksi Maksimal Pengembalian Siswa.
                      </p>
                      <p>
                        <strong>Memutuskan:</strong> Mengembalikan sepenuhnya hak pembinaan peserta didik tersebut kepada Orang Tua / Wali serta merekomendasikan mutasi/pemindahan sekolah demi kelanjutan pendidikan yang bersangkutan.
                      </p>
                    </div>

                    <div className="pt-4 font-sans text-center text-[10px]">
                      <div className="inline-block text-left mb-3">
                        <p>Ditetapkan di : Geser</p>
                        <p>Pada Tanggal : {printParentCallLetter.callDate}</p>
                      </div>

                      <p className="font-bold">Kepala MAN 2 Seram Bagian Timur,</p>
                      <div className="h-14"></div>
                      <p className="font-bold underline text-xs">{principalName}</p>
                      <p className="text-[9px] text-gray-600">NIP. {principalNip}</p>

                      <div className="pt-4 border-t border-zinc-300 mt-4 text-left">
                        <p className="font-bold text-[9px] uppercase tracking-wider mb-2">Saksi-saksi Musyawarah Dewan:</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
                          <div>
                            <p>Komite Madrasah</p>
                            <div className="h-8"></div>
                            <p className="font-bold underline">(...................................)</p>
                          </div>
                          <div>
                            <p>Waka Kesiswaan</p>
                            <div className="h-8"></div>
                            <p className="font-bold underline">{wakaName}</p>
                          </div>
                          <div>
                            <p>Orang Tua / Wali Siswa</p>
                            <div className="h-8"></div>
                            <p className="font-bold underline">({printParentCallLetter.parentName || '...................................'})</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
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
            {/* Kop Surat Resmi */}
            <div className="mb-4">
              <SchoolLetterhead schoolInfo={schoolSetting} compact={true} />
              <div className="text-center mt-2">
                <p className="font-bold text-xs uppercase tracking-wide underline">BERITA ACARA KUNJUNGAN RUMAH (HOME VISIT)</p>
                <p className="text-[9px] font-sans text-gray-600">TAHUN PELAJARAN {activeAcademicYear}</p>
              </div>
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

              {detailCounseling.isConfidential && (
                <div className="border-t border-purple-800/40 bg-purple-950/20 p-2.5 rounded mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Catatan Konseling Rahasia (Hak Akses Khusus: Guru BK & Waka Kesiswaan)</span>
                  </div>
                  {isGuruBK || isWakaOrAdmin ? (
                    <div className="bg-[#161618] p-2.5 rounded border border-purple-900/50 mt-1">
                      <p className="text-purple-200 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                        {detailCounseling.confidentialNotes || '(Belum ada catatan khusus rahasia yang diisi)'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs italic">
                      [Terkunci: Informasi ini dirahasiakan dan dilindungi kode etik BK. Hanya dapat diakses oleh Guru BK dan Waka Kesiswaan.]
                    </p>
                  )}
                </div>
              )}
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
