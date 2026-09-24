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
