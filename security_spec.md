# SIM Kesiswaan - Firestore Security Specification & Invariants

## Phase 0: Security Invariants & Threat Modeling

### 1. Core Data Invariants
1. **User Identity & Privilege Escalation Guard:**
   - No user can elevate their own `role` or `isCashManager` or assign themselves `super_admin` status.
   - User profile creation allows users to register their own profile, but role assignment defaults to unprivileged roles unless bootstrapped by Super Admin / Waka Kesiswaan.
2. **Counseling & Disciplinary Isolation:**
   - BK Counseling sessions, home visit records, and parent summons letters (`/counseling`, `/home_visits`, `/parent_call_letters`, `/career_guidances`) contain highly sensitive student emotional & behavioral data and are strictly restricted to authenticated staff with `guru_bk`, `waka_kesiswaan`, `super_admin`, or bootstrapped admin credentials.
3. **Audit Trail Immutability:**
   - `/audit_logs` records can be created by authenticated users to record system actions, but NEVER modified or deleted (`allow update, delete: if false;`).
4. **OSIM Work Programs Integrity:**
   - Proker can be proposed by OSIM members, but status transitions to `Disetujui` (Approved) or applying formal `Hak Veto` require supervisory authority (Pembina OSIM, Waka Kesiswaan, or Admin).
5. **Cash Ledger Protection (Financial Segregation):**
   - Financial transactions (`/cash_transactions`) and accounts (`/cash_accounts`) cannot be tampered with by arbitrary students. Writing transactions requires verified cash managers, bendahara, or admin/waka. Account creation/deletion is reserved for admin/waka.
6. **Denial-of-Wallet & ID Poisoning Guards:**
   - All document IDs and string fields must satisfy bounded size constraints (`id.size() <= 128`, strings bounded) to prevent resource exhaustion attacks.

---

### 2. The "Dirty Dozen" Malicious Payloads (Targeting Exploitation Attempts)

1. **Privilege Escalation:**
   - *Payload:* An unprivileged user attempts to write `{ "role": "super_admin" }` to their own `/users/{uid}`.
   - *Result:* `PERMISSION_DENIED`.
2. **BK Confidentiality Breach:**
   - *Payload:* A student or unauthorized member attempts to `get` or `list` private counseling notes in `/counseling/{docId}`.
   - *Result:* `PERMISSION_DENIED`.
3. **Ghost Audit Tampering:**
   - *Payload:* An attacker attempts to `delete` or `update` a log entry in `/audit_logs/{logId}` to hide an unauthorized action.
   - *Result:* `PERMISSION_DENIED`.
4. **Forged Cash Mutation:**
   - *Payload:* An unverified account submits a credit mutation of Rp 50.000.000 into `/cash_transactions/{trxId}`.
   - *Result:* `PERMISSION_DENIED`.
5. **Unauthorized Account Creation:**
   - *Payload:* A student tries to create a new bank/cash account `/cash_accounts/{accId}` with arbitrary balance.
   - *Result:* `PERMISSION_DENIED`.
6. **Bypassing Proker Veto / Approval:**
   - *Payload:* An OSIM member attempts to update proker status directly from `Draft` to `Disetujui` without supervisor approval.
   - *Result:* `PERMISSION_DENIED`.
7. **Junk ID Poisoning:**
   - *Payload:* An attacker sends a 2MB binary payload as document ID `/students/{hugeId}`.
   - *Result:* `PERMISSION_DENIED`.
8. **Impersonated Author UID:**
   - *Payload:* A user submits a leave permission with an author UID matching someone else's ID.
   - *Result:* `PERMISSION_DENIED`.
9. **Extracurricular Hijacking:**
   - *Payload:* A non-pembina user attempts to delete an extracurricular club in `/extracurriculars/{clubId}`.
   - *Result:* `PERMISSION_DENIED`.
10. **School Identity Tampering:**
    - *Payload:* A non-admin user attempts to alter school accreditation and bank accounts in `/schools/default`.
    - *Result:* `PERMISSION_DENIED`.
11. **Student Point Forgery:**
    - *Payload:* A student writes directly to `/students/{studentId}` to reset cumulative violation points to 0.
    - *Result:* `PERMISSION_DENIED`.
12. **Blanket Query Scraping:**
    - *Payload:* An unauthenticated client attempts an unfiltered `list` query across `/users` or `/counseling`.
    - *Result:* `PERMISSION_DENIED`.

---

### 3. Test Runner Design (`firestore.rules.test.ts`)
The rules are structured to guarantee zero tolerance for unauthorized writes, strictly enforcing role verification, data schemas, and preventing update gaps.

---

## Phase 0: KEBIJAKAN WAJIB: LOCALSTORAGE vs FIRESTORE

Ini adalah aturan arsitektur paling penting dalam pembangunan ulang aplikasi SIM Kesiswaan.
Mulai dari **Fase 0** sampai aplikasi selesai, seluruh arsitektur wajib membedakan dengan tegas tiga ranah data:
1. **DATA BISNIS**
2. **DATA AUTENTIKASI**
3. **DATA UI/PREFERENSI**

### A. FIRESTORE = SUMBER KEBENARAN DATA BISNIS
Semua data yang berkaitan dengan operasional sekolah **WAJIB** berasal dari Firestore.
Termasuk namun tidak terbatas pada:
- data sekolah & pengaturan sekolah (`schoolSettings`, identitas, kop madrasah)
- tahun ajaran (`academicYears`)
- guru (`teachers`)
- siswa (`students`)
- kelas (`classes`)
- akun pengguna (`users`)
- role pengguna & permission matrix (`roles`, `permissions`, `customMatrix`)
- ekstrakurikuler & Coach / Pembina Ekstrakurikuler (`extracurriculars`)
- anggota ekstrakurikuler (`extracurricularMembers`)
- jadwal (`schedules`)
- absensi (`attendance`)
- kegiatan & laporan kegiatan (`activities`, `activityReports`)
- prestasi (`achievements`)
- pelanggaran (`violations`)
- konseling, kunjungan rumah, panggilan ortu (`counseling`, `home_visits`, `parent_call_letters`, `career_guidances`)
- OSIM, pengurus, struktur, proker, sidang/rapat, aspirasi, supervisi (`osim_departments`, `osim_members`, `osim_programs`, `osim_meetings`, `osim_aspirations`)
- kas & keuangan (`cash_accounts`, `cash_transactions`)
- laporan & audit logs (`reports`, `audit_logs`)
- seluruh data operasional lainnya.

**Arsitektur Aliran Data Wajib:**
```
Firestore ↓ Service / Repository ↓ React State ↓ UI
```
**Bukan:**
`LocalStorage ↓ React ↓ Firestore` *(DILARANG)*
**Dan bukan:**
`Firestore ↓ LocalStorage ↓ React` *(DILARANG sebagai sumber data utama)*

### B. LOCALSTORAGE BUKAN DATABASE
LocalStorage **TIDAK BOLEH** digunakan sebagai database aplikasi.
Pola-pola berikut dikategorikan sebagai **LEGACY BUSINESS DATA STORAGE** dan dijadwalkan untuk dihapus:
```typescript
// DILARANG:
localStorage.setItem("sim_teachers", ...);
localStorage.setItem("sim_students", ...);
localStorage.setItem("sim_classes", ...);
localStorage.setItem("sim_extracurriculars", ...);

// DILARANG:
localStorage.getItem("sim_teachers");
localStorage.getItem("sim_students");
localStorage.getItem("sim_classes");
```

### C. LOCALSTORAGE HANYA UNTUK UI PREFERENCE
LocalStorage hanya boleh digunakan untuk data yang:
- tidak termasuk data bisnis;
- tidak memengaruhi kebenaran database;
- tidak menjadi sumber keputusan authorization / RBAC;
- aman jika hilang atau dihapus user;
- aman jika berbeda antara browser/perangkat;
- tidak perlu disinkronkan antarperangkat.

**Contoh yang DIPERBOLEHKAN (Kategori A):**
- Tema visual: `simkesiswaan_theme_mode`, `simkesiswaan_theme_palette`, `simkesiswaan_font_size`, `simkesiswaan_font_contrast`, `simkesiswaan_font_family`
- Preferensi UI lokal: `sim_app_timezone_preference`, `sim_app_timezone_mode`
- Navigasi tab lokal: `simkesiswaan_active_tab`
- Transient UI inter-page selection (sessionStorage): `pending_search_select`

### D. DATA YANG DILARANG DI LOCALSTORAGE
**DILARANG** menyimpan:
`teachers`, `students`, `classes`, `users`, `roles`, `permissions`, `academicYears`, `schoolSettings`, `extracurriculars`, `extracurricularMembers`, `attendance`, `violations`, `counseling`, `OSIM`, `financialData`, `reports`, `auditLogs`.

Juga **DILARANG KERAS** menyimpan:
- Password / hash password
- Credential autentikasi mentah
- Authorization state lokal
- Firebase user dummy sebagai database lokal

*Firebase Authentication* tetap menjadi sumber kebenaran sesi autentikasi. Role dan permission harus berasal dari sumber authoritative di Firestore dan Security Rules.

### E. TIDAK BOLEH ADA LOCALSTORAGE → FIRESTORE SYNC
DILARANG membuat mekanisme:
`LocalStorage ↓ compare ↓ Firestore` secara otomatis.
- **DILARANG:** startup → baca LocalStorage → anggap data valid → upload ke Firestore
- **DILARANG:** login → restore data lokal → sync ke cloud
- **DILARANG:** offline cache lama → otomatis overwrite Firestore
- **DILARANG:** menggunakan data LocalStorage lama untuk "memulihkan" Firestore yang kosong atau berbeda.

### F. FIRESTORE → REACT, BUKAN FIRESTORE → LOCAL DATABASE
Data bisnis mengalir langsung:
```typescript
onSnapshot(query, (snapshot) => {
  const data = snapshot.docs.map(...);
  setData(data);
});
```
Jika snapshot Firestore kosong (`[]`), maka React State = `[]`. Tidak boleh mengambil data lama dari LocalStorage atau mempertahankan data dummy hanya karena Firestore kosong.

### G. REFRESH BROWSER & MULTI-BROWSER/DEVICE
- Setelah browser di-refresh, data bisnis wajib diambil langsung dari Firestore.
- Browser A dan Browser B, serta Device A dan Device B, harus selalu melihat data Firestore yang sama secara realtime. Perbedaan LocalStorage tidak boleh menyebabkan inkonsistensi data antar-perangkat.

### H. SINGLE SOURCE OF TRUTH (TIDAK ADA DUAL SOURCE)
Satu jenis data hanya boleh memiliki satu sumber kebenaran:
- **GURU:** Firestore = TRUE, LocalStorage = FALSE
- **SISWA:** Firestore = TRUE, LocalStorage = FALSE
- **KELAS:** Firestore = TRUE, LocalStorage = FALSE
- **EKSTRAKURIKULER:** Firestore = TRUE, LocalStorage = FALSE
- **AKUN & ROLE:** Firebase Auth + Firestore = TRUE, LocalStorage = FALSE

### I. ACCEPTANCE CRITERIA LOCALSTORAGE
- [ ] Data guru berasal dari Firestore
- [ ] Data siswa berasal dari Firestore
- [ ] Data kelas berasal dari Firestore
- [ ] Data akun berasal dari Firebase Auth + Firestore
- [ ] Data role berasal dari sumber authoritative Firestore & Security Rules
- [ ] Data ekstrakurikuler & anggota berasal dari Firestore
- [ ] Data absensi & pelanggaran berasal dari Firestore
- [ ] Data sekolah berasal dari Firestore
- [ ] Tidak ada password / kredensial di LocalStorage
- [ ] Tidak ada local login fallback ke storage
- [ ] Tidak ada LocalStorage → Firestore automatic sync
- [ ] Tidak ada business data sebagai source dari LocalStorage
- [ ] Refresh tidak menghidupkan kembali data lama
- [ ] Delete di Firestore tidak dibatalkan oleh LocalStorage
- [ ] Browser berbeda tetap menggunakan database Firestore yang sama
- [ ] Device berbeda tetap menggunakan database Firestore yang sama
- [ ] LocalStorage hanya menyimpan UI preference yang aman
- [ ] Tidak ada dual source of truth
