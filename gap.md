# Mobile Application Gaps Analysis

Based on the comprehensive audit report, here are the **Mobile application-specific gaps** extracted:

---

## 🔴 CRITICAL GAPS (Blocking Production Readiness)

### 1. **Offline Submission is Non-Functional**
- **Issue:** `offlineQueueStore.enqueue()` is effectively empty/NO-OP
- **Impact:** User gets "queued" feedback but complaint isn't actually saved
- **Location:** `useCreateComplaint` hook
- **Status:** ❌ FR-20 completely broken E2E

### 2. **Offline Payload Contract Mismatch**
- **Mobile sends:** `complaint.title`, `complaint.description`, `location[lat]`, `location[lng]`
- **Backend expects:** `title`, `description`, `latitude`, `longitude` (flat structure)
- **Impact:** Even if queue worked, sync would fail with 422 validation errors
- **Status:** ❌ Will break when sync is implemented

### 3. **Geolocation Contract Mismatch**
- **Mobile sends:** `location[lat]`, `location[lng]`, `location[address]`
- **Backend expects:** `latitude`, `longitude`, `address`
- **Impact:** User selects location in UI, but backend doesn't save it; location also won't display in detail
- **Status:** ❌ FR-19 completely broken E2E

### 4. **Push Notifications - Token/Provider Mismatch**
- **Mobile uses:** `ExpoPushToken` from `getExpoPushTokenAsync()`
- **Backend sends:** Direct to FCM (expects native device token)
- **Root issue:** Mobile doesn't register push token in app lifecycle; no listener/deep-link handling
- **Status:** ❌ FR-18 Push not integrated

### 5. **OTP Unverified Account Edge Case**
- **Mobile always sends:** `purpose: "login"` for OTP verification
- **Backend may require:** `purpose: "verify_email"` for unverified users
- **Impact:** Existing user with unverified email cannot complete login
- **Status:** ⚠️ Broken for specific but important scenario

---

## 🟠 HIGH PRIORITY GAPS

### 6. **SLA Field Contract Mismatch**
- **Mobile expects:** `sla_due_at`, `sla_status`
- **Backend returns:** `due_at`, `is_sla_breached`
- **Impact:** SLA card/countdown won't display data
- **Status:** ⚠️ FR-15 display broken

### 7. **Unread Notifications Count Mismatch**
- **Mobile expects:** `unread_count`
- **Backend returns:** `count`
- **Impact:** Notification badge always shows 0
- **Status:** ⚠️ FR-17 partially broken

### 8. **Attachments Limited to Images Only**
- **Mobile supports:** Images only (camera/gallery, max 5, resize to 1280)
- **Backend supports:** Images + PDF + DOC/DOCX
- **Impact:** Users can't attach documents as specified in FR-6
- **Status:** ⚠️ FR-6 only partial implementation

### 9. **Automatic Classification Not Utilized**
- **Mobile flow:** Forces user to select department + category BEFORE entering title/description
- **Backend:** Has working classifier that can predict from title+description
- **Impact:** FR-21 exists in backend but user flow bypasses it
- **Status:** ⚠️ Feature exists but UX doesn't leverage it

### 10. **Edit Profile - Fake Implementation**
- **Issue:** Submit only does `console.log(...)` with TODO comment
- **Status:** ✅ Visual complete, ❌ Functionality non-existent

---

## 🟡 MEDIUM PRIORITY GAPS

### 11. **Complaint Detail - Field Mismatches**
- **Legacy field:** `client_ref` expected in Type but not returned by backend
- **Current:** Works because detail screen uses `complaint_number` instead
- **Status:** ⚠️ Indicates API model drift

### 12. **Timeline Duration Calculation**
- **Mobile expects:** `duration_hours`
- **Backend returns:** `duration_minutes`
- **Impact:** Component has fallback so works, but doesn't use official value
- **Status:** ⚠️ FR-13 works but with client-side calculation

### 13. **Missing Test/CI Infrastructure**
- **Status:** No test script in `package.json`, no GitHub Actions runs
- **Issues:** Lint, typecheck, Husky exist but no automated regression testing
- **Impact:** Contract mismatches could have been caught earlier

---

## 📊 Summary Table

| Gap | Severity | Affected FR | Status |
|-----|----------|-------------|--------|
| Offline queue NO-OP | CRITICAL | FR-20 | ❌ |
| Offline payload mismatch | CRITICAL | FR-20 | ❌ |
| Geolocation contract | CRITICAL | FR-19 | ❌ |
| Push token mismatch | CRITICAL | FR-18 | ❌ |
| OTP unverified flow | HIGH | FR-2, FR-3 | ⚠️ |
| SLA field mismatch | HIGH | FR-15 | ⚠️ |
| Unread count mismatch | HIGH | FR-17 | ⚠️ |
| Images-only attachments | HIGH | FR-6 | ⚠️ |
| Classification UX bypass | HIGH | FR-21 | ⚠️ |
| Edit Profile TODO | HIGH | (Profile) | ⚠️ |
| Timeline duration fallback | MEDIUM | FR-13 | ⚠️ |
| client_ref legacy field | MEDIUM | (DTO) | ⚠️ |
| No automated tests | MEDIUM | Quality | ⚠️ |

---

## 🎯 Recommended Mobile Fix Order

### Phase 1: Contract Alignment
1. Fix Geolocation shape (nested → flat)
2. Fix SLA field names
3. Fix Unread count field name
4. Fix OTP purpose handling (or backend returns purpose)
5. Update TypeScript DTOs to match backend

### Phase 2: Offline Support (Major Feature)
1. Implement persisted queue via AsyncStorage
2. Fix payload to flat structure
3. Add connectivity listener
4. Implement automatic sync on reconnect
5. Add retry logic and failed state UI
6. Add `client_uuid` for deduplication

### Phase 3: Push Notifications
1. Choose: Expo Push Service (Option A) OR Native FCM (Option B)
2. Register token in app lifecycle
3. Add listener/deep-link handling
4. Test E2E

### Phase 4: UX Improvements
1. Add document support (PDF/DOC/DOCX)
2. Reorder classification flow (title first → auto-classify → confirm)
3. Implement Edit Profile
4. Add missing statuses (`waiting_citizen`, `escalated`)

### Phase 5: Quality Gate
1. Add test script
2. Setup GitHub Actions
3. Add API contract/integration tests

---

## 📈 Current Mobile Status

- **Architecture Quality:** ✅ Good (React Query, Zustand, SecureStore, Sentry, Zod, NetInfo)
- **UI/UX:** ✅ Good (structured screens, i18n, validation)
- **Feature Completion:** ⚠️ ~80% (many features visually complete but integration broken)
- **Integration Readiness:** ❌ ~58% (multiple contract mismatches)
- **Production Readiness:** ❌ ~57% (critical blockers)

**Overall Mobile Score: 68%** (Down from 80% due to integration/contract issues)