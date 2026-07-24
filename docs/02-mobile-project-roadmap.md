# Mobile App Roadmap — Government Complaint Management System
### Expo / React Native — step-by-step build plan (mobile only);

> Built from: the SRS (functional/non-functional requirements) and the current Postman collection, which today implements **auth (register/login/OTP/me/logout)**, **public lookups (departments/categories/priorities/statuses)**, and **admin CRUD (departments/categories/priorities/SLA rules)**. Complaint CRUD endpoints (create/list/detail/timeline) are **not yet in the collection** — Phase 5 onward assumes those land in parallel on the backend, and shows how to keep building against mocks if they're late.
>
> Primary user for this phase: **citizen**.

---

## Phase 0 — Environment & Project Bootstrap
   development` once so the team stops relying on Expo Go.
- [ ] Set up EAS project (`eas init`), `eas.json` with `development`/`preview`/`production` profiles.
- [ ] Configure `app.config.ts` (name, bundle id/package name, icons, splash, permissions descriptions for camera/location/notifications).
- [ ] Set up ESLint + Prettier + TypeScript `strict` + Husky pre-commit (lint-staged).
- [ ] Initialize git repo, branch strategy (`main`, `develop`, `feature/*`), PR template.
- [ ] Create `.env.development` / `.env.staging` / `.env.production` with `EXPO_PUBLIC_API_BASE_URL` matching each Postman environment's `base_url`.

**Exit criteria:** app builds and runs on a physical/simulated device via a dev client, CI runs lint+typecheck on PR.

---

   ## Phase 1 — Architecture Scaffolding
   **Goal:** the folder structure and core plumbing from the best-practices playbook exist before any real screen is built.

   - [ ] Create `src/api`, `src/features`, `src/components`, `src/lib`, `src/theme`, `src/constants`, `src/locales` per the architecture doc.
   - [ ] Set up Expo Router file structure: `(auth)` and `(app)` route groups, root `_layout.tsx` with an (initially fake) auth gate.
   - [ ] Install & configure: React Query (`queryClient.ts` + `QueryClientProvider`), Zustand, react-hook-form + zod, axios, i18next, NativeWind/theme system, Sentry.
   - [ ] Build the shared UI kit: `Button`, `Input`, `Card`, `Screen` (SafeArea + KeyboardAvoiding), `LoadingSpinner`, `EmptyState`, `ErrorState`.
   - [ ] Build `apiClient` (axios instance + request/response interceptors) and the generic `ApiEnvelope<T>` / `PaginatedEnvelope<T>` types.
   - [ ] Build `secureStorage.ts` wrapper around `expo-secure-store`.

   **Exit criteria:** a "Hello world" screen renders inside the real navigation shell, theme, and providers — no business logic yet.

---

## Phase 2 — Authentication (maps directly to Postman: "Auth - Citizen Register/Login Flow")
**Goal:** a citizen can register, verify OTP, log in, see their profile, and log out — exactly matching the collection's request/response contracts.

1. **Register screen** (`app/(auth)/register.tsx`)
   - Form: name, email, phone, password, password_confirmation (zod schema mirrors `POST /auth/register`).
   - `useRegister()` mutation → on success, navigate to OTP screen with `user_id` + `purpose: 'register'`.
   - Handle 422 validation errors → map to field errors.
2. **OTP screen** (`app/(auth)/verify-otp.tsx`, shared for register + login via `purpose` param)
   - 6-digit `OtpInput` component, resend button with 60s countdown.
   - `useVerifyOtp()` mutation → `POST /auth/verify-otp` → on success store `token` (SecureStore) + call `auth/me` → route to `(app)`.
3. **Login screen** (`app/(auth)/login.tsx`)
   - Form: login (email/phone), password → `POST /auth/login` → same OTP screen with `purpose: 'login'`.
4. **Session bootstrap** (`app/_layout.tsx`)
   - On app launch: read token from SecureStore → if present, call `auth/me` to validate → hydrate Zustand `authStore` → render real navigator; else render `(auth)` stack.
5. **Logout**
   - `useLogout()` → `POST /auth/logout`, then always clear SecureStore + Zustand + `queryClient.clear()` regardless of network result.
6. **RBAC guard**
   - After `auth/me`, confirm `user.role === 'citizen'`; if not, show a clear "use the web/admin portal" message rather than rendering broken screens.

**Exit criteria:** full register→OTP→home and login→OTP→home flows work against the real API; logout returns to login; app reopen keeps the session (or logs out cleanly if token invalid) — this should pass the same assertions as the Postman "Citizen Register/Login Flow" folders.

---

## Phase 3 — Lookups Integration (maps to Postman: "Lookups")
**Goal:** all dropdown/reference data used by complaint creation is wired up and cached.

- [ ] `useDepartments()`, `useCategories(departmentId?)`, `usePriorities()`, `useComplaintStatuses()` — each a thin React Query hook over `GET /lookups/*`.
- [ ] Cache these aggressively (`staleTime` long, e.g. 30–60 min) — they change rarely; add pull-to-refresh only on admin-facing screens if/when built.
- [ ] Build reusable `<SelectField>` / `<Picker>` component consuming these hooks, used later in the complaint form.
- [ ] Handle the department→category dependency (`GET /lookups/categories?department_id=`) as a cascading select.

**Exit criteria:** a debug screen (or Storybook-style dev screen) can list live departments, categories filtered by department, priorities, and statuses fetched from the real API.

---

## Phase 4 — Home / Navigation Shell
**Goal:** the authenticated app's real navigation structure, ready to host complaint features.

- [ ] Tab layout: **Home**, **My Complaints**, **New Complaint**, **Profile** (icons via `lucide-react-native` or `@expo/vector-icons`).
- [ ] Home screen: quick stats (open complaints, pending SLA), "New Complaint" CTA, recent activity.
- [ ] Profile screen: user info from `auth/me`, language switcher (i18n), logout button, app version.
- [ ] Empty/loading/error states scaffolded for every screen before real data flows in.

**Exit criteria:** navigating the whole app feels complete even before complaint data exists (all screens render sensible empty states).

---

## Phase 5 — Complaint Creation (FR-5, FR-6, FR-7, FR-19)
**Goal:** citizens can file a new complaint end-to-end.

> Backend note: if `POST /complaints` isn't live yet, build against a mock in `src/api/__mocks__/complaints.mock.ts` returning an `ApiEnvelope<Complaint>` shaped exactly like the rest of the collection, and swap it out once the real endpoint ships — no component changes needed if the API layer is respected.

1. **Multi-step form** (`app/(app)/(tabs)/complaints/new.tsx`), state held in a `draftComplaintStore` (Zustand) so it survives navigation between steps:
   - Step 1: Department → Category (cascading, from Phase 3 hooks).
   - Step 2: Title, description (zod: min/max length).
   - Step 3: Attachments — `expo-image-picker` (camera + gallery), compress via `expo-image-manipulator`, preview thumbnails, remove option.
   - Step 4: Location — `expo-location` current position + manual address fallback if permission denied; map pin preview.
   - Step 5: Review & submit.
2. **Submission**
   - `useCreateComplaint()` mutation: multipart upload (attachments) + JSON payload; attach a client-generated `client_ref` UUID for idempotency.
   - On network failure → push into the **offline queue** (Phase 9) instead of showing a hard error.
   - On success → invalidate the complaints list query, navigate to the new complaint's detail screen.

**Exit criteria:** a complaint with title, description, category/department, at least one photo, and a location can be created and appears immediately in "My Complaints."

---

## Phase 6 — Complaint List & Detail / Timeline (FR-8–FR-13)
   **Goal:** citizens can track everything they've submitted.

   - [ ] **List screen**: `FlashList` of `ComplaintCard` (title, status badge, priority, created date, SLA countdown if applicable). Filter/sort by status.
   - [ ] **Detail screen** (`complaints/[id].tsx`): full description, attachments gallery, department/category/priority, current status, assigned employee (if exposed to citizens), and a **Timeline** component rendering status-transition history (FR-11/FR-12) with duration-per-status (FR-13).
   - [ ] **Pull-to-refresh** + React Query background refetch on screen focus (`useFocusEffect` + `refetch`).
   - [ ] Deep link support: `complaints/[id]` reachable from push notifications.

   **Exit criteria:** tapping a complaint shows its full history in chronological order with clear current-status emphasis.

   ---

## Phase 7 — Priority & SLA Visibility (FR-14–FR-16)
**Goal:** citizens understand urgency and expected resolution time without needing the admin tools.

- [ ] Show priority as a colored badge (color comes from `admin/priorities` data if exposed via a public lookup, else a fixed local mapping).
- [ ] Show SLA due date/countdown on complaint detail (`sla_due_at` from the complaint payload once available).
- [ ] Visually flag SLA-breached complaints (red state) — read-only for citizens; breach notification itself is a backend job (FR-16) surfaced to the client via push (Phase 8).

**Exit criteria:** a complaint nearing/over its SLA is visually distinct in both list and detail views.

---

## Phase 8 — Notifications (FR-17, FR-18)
**Goal:** citizens are notified of status changes without opening the app.

- [ ] `usePushRegistration()`: request permission, get Expo push token, send to backend (new profile-update endpoint — flag as a backend dependency if not yet available).
- [ ] Foreground notification handling (`expo-notifications` listener) → show in-app toast + refresh relevant query.
- [ ] Background/killed-state tap → deep link to `complaints/[id]`.
- [ ] Notification preferences screen (optional): toggle push categories if backend supports it.

**Exit criteria:** a status change made via the backend/admin results in a push notification that deep-links to the correct complaint.

---

## Phase 9 — Offline Support (FR-20)
**Goal:** complaint submission never silently fails due to connectivity.

- [ ] `useNetworkStatus()` via NetInfo; global offline banner.
- [ ] Persisted offline queue (Zustand + AsyncStorage/MMKV) storing pending complaint payloads + local attachment URIs.
- [ ] Background/foreground sync: flush queue on reconnect, attachments first, then complaint payload, using the `client_ref` for idempotency.
- [ ] Queue item states in "My Complaints": `Queued → Uploading → Synced → Failed (retry)`.

**Exit criteria:** submitting a complaint in airplane mode queues it locally, and it auto-syncs (with the correct final data) once connectivity returns, with zero duplicates.

---

## Phase 10 — AI Classification & Reporting (FR-21, FR-22)
**Goal:** these are primarily backend/admin features — mobile's job is just to **not fight them**.

- [ ] Ensure the complaint create payload includes enough raw text (title/description) for backend auto-classification; if the backend returns a *suggested* category, surface it as a pre-filled (editable) field rather than a locked value.
- [ ] Reporting/analytics (FR-22) is out of scope for the citizen mobile app — it's an admin/web concern; no mobile work required unless a "my activity summary" citizen-facing screen is explicitly requested later.

**Exit criteria:** none blocking — this phase is a placeholder/contract-alignment check, not new UI.

---

## Phase 11 — Non-Functional Hardening (NFR-1–NFR-5)
**Goal:** the app is fast, secure, resilient, and usable — not just feature-complete.

- [ ] **Performance (NFR-1/3):** FlashList everywhere, image optimization, React Query cache tuning, bundle size audit (`npx expo-doctor`, `source-map-explorer`).
- [ ] **Security (NFR-2):** SecureStore-only tokens, console log stripping in release builds, optional certificate pinning, optional biometric app-lock (`expo-local-authentication`).
- [ ] **Availability (NFR-4):** graceful degradation on API 5xx (retry banners, cached last-known data shown with a "stale" indicator instead of a blank error screen).
- [ ] **Usability (NFR-5):** accessibility pass (labels, contrast, dynamic type), full i18n coverage (no hardcoded strings left), empty/error states audited on every screen.
- [ ] Full regression pass of RBAC negative cases (a citizen token must never reach admin-only data — mirror the collection's "should be forbidden" test client-side too).

**Exit criteria:** a full manual QA pass + automated test suite green; app store review checklist complete (privacy manifest, permission usage strings, data-safety form).

---

## Phase 12 — Testing & QA
- [ ] Unit tests: validation schemas, offline queue reducer, SLA date math.
- [ ] Hook tests: auth mutations' state transitions and error mapping.
- [ ] Component tests: `OtpInput`, `StatusBadge`, `Timeline`.
- [ ] Contract tests: run the actual Postman collection via `newman` in CI against staging to catch backend drift before it breaks the app.
- [ ] E2E (Maestro): register→OTP→login→create complaint→see it in list→logout, on both iOS and Android.

**Exit criteria:** CI pipeline is green end-to-end (lint, typecheck, unit, contract, E2E smoke) on every merge to `develop`.

---

## Phase 13 — Release
- [ ] `eas build --profile production` for iOS + Android.
- [ ] App Store Connect + Google Play Console listings: screenshots, privacy policy, data-safety declarations (location, PII, notifications).
- [ ] `eas submit`.
- [ ] Set up `eas update` channel for OTA patches post-launch (JS-only fixes without a store resubmission).
- [ ] Post-launch monitoring: Sentry alerts, crash-free-session dashboard, API error-rate dashboard shared with backend team.

**Exit criteria:** app live in both stores; OTA update channel verified with a trivial no-op update before relying on it for a real hotfix.

---

## Suggested Timeline (indicative, adjust to team size)

| Phase | Focus | Rough effort |
|---|---|---|
| 0–1 | Bootstrap + architecture | 3–5 days |
| 2 | Auth/OTP | 4–6 days |
| 3–4 | Lookups + navigation shell | 3–4 days |
| 5–6 | Complaint create + list/detail/timeline | 8–12 days (depends on backend readiness) |
| 7–8 | SLA/priority + notifications | 4–6 days |
| 9 | Offline support | 4–6 days |
| 10 | AI/reporting alignment | 1–2 days |
| 11 | NFR hardening | 5–7 days |
| 12 | Testing/QA | ongoing + 3–4 dedicated days |
| 13 | Release | 2–3 days + store review wait time |

## Open Dependencies to Flag to the Backend Team Now
- [ ] Complaint CRUD endpoints (create/list/detail) with `client_ref` idempotency support for offline sync.
- [ ] Complaint timeline/history endpoint (FR-11/12/13).
- [ ] Push-token registration endpoint (FR-18).
- [ ] Whether priority colors/SLA due dates are returned directly on the complaint payload or must be joined client-side from `/lookups/priorities` + `/admin/sla-rules`.
- [ ] AI classification (FR-21): does it run synchronously on create (returned in the create response) or async (requires a follow-up fetch/notification)?
