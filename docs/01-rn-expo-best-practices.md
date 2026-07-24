# React Native (Expo) — Senior Engineering Playbook
### Government Complaint Management System — Mobile App

> Scope note: this playbook covers the **mobile client only** (Expo/React Native), consuming the existing Laravel/Sanctum REST API described in the Postman collection (`auth/*`, `lookups/*`, `admin/*`). Web is explicitly out of scope for this phase. Primary mobile persona is the **citizen** (register/login/OTP → submit & track complaints); the architecture below is written so employee/admin screens can be added later without refactoring.

---

## 1. Tech Stack (opinionated, production-grade)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo (SDK, Development Build / EAS)**, not Expo Go | You'll need native modules (secure storage, notifications, background tasks, image picker, location) — Expo Go can't ship all of these reliably. Use `expo-dev-client`. |
| Language | **TypeScript**, `strict: true` | The API has real contracts (roles, statuses, SLA) — untyped JS will bite you at 3am. |
| Routing | **Expo Router** (file-based, v3+) | Native deep-linking, typed routes, layout-based auth gating out of the box. |
| Server state | **TanStack Query (React Query)** | The whole app is CRUD-over-REST (complaints, lookups, admin). Query handles caching, retries, background refetch, optimistic updates — don't hand-roll this. |
| Client state | **Zustand** | Auth session, UI state, offline queue. Avoid Redux boilerplate unless the team already knows it. |
| Forms | **react-hook-form + zod** | Complaint creation has real validation (title/description length, required category, geo). Zod schemas double as API contract validators. |
| HTTP | **axios** wrapped in a typed API client (see §4) | Interceptors for auth headers, 401 refresh/redirect, error normalization. |
| Secure storage | **expo-secure-store** | Bearer tokens must never sit in AsyncStorage/plain state persistence. |
| Notifications | **expo-notifications** | FR-18 (push notifications) — register push token, handle foreground/background. |
| Location | **expo-location** | FR-19 (geo-tagged complaints). |
| Media | **expo-image-picker** + **expo-file-system** | FR-6 (attachments): camera/gallery capture, resumable multipart upload. |
| Offline | **TanStack Query persistence (AsyncStorage) + a write-queue in Zustand/MMKV** | FR-20 (offline submission) — see §9. |
| Styling | **NativeWind (Tailwind for RN)** or a themed `StyleSheet` design-system layer — pick one and enforce it everywhere | Consistency > cleverness. Avoid inline style objects scattered across screens. |
| i18n | **i18next / react-i18next** | Government apps are almost always bilingual (e.g. Arabic/English, RTL). Bake this in from day 1, not retrofitted. |
| Testing | **Jest + React Native Testing Library** (unit/component), **Detox or Maestro** (E2E) | |
| Lint/format | **ESLint (expo config) + Prettier + TypeScript strict + Husky pre-commit** | |
| CI/CD | **EAS Build + EAS Update + EAS Submit**, GitHub Actions to trigger | OTA updates for JS-only fixes; store builds for native changes. |
| Error monitoring | **Sentry (Expo integration)** | Crash + JS error reporting from day 1, not after the first incident. |
| Env config | **expo-constants + `app.config.ts` + `.env` via `EXPO_PUBLIC_*`** or `react-native-config` | Never hardcode `base_url`. Mirror the Postman `{{base_url}}` variable per environment. |

---

## 2. Project Structure (feature-first, not type-first)

Avoid the classic `components/ `, `screens/`, `redux/` split that scales badly. Use **feature folders**; each feature owns its screens, hooks, api calls, and components.

```
app/                          # Expo Router — ROUTES ONLY (thin wrappers)
  _layout.tsx                 # Root layout: providers, fonts, splash
  (auth)/
    _layout.tsx                # Redirect-if-authenticated guard
    register.tsx
    login.tsx
    verify-otp.tsx
  (app)/
    _layout.tsx                # Auth guard + role-based tab layout
    (tabs)/
      index.tsx                 # Home / dashboard
      complaints/
        index.tsx                # My complaints list
        [id].tsx                 # Complaint detail + timeline
        new.tsx                  # Create complaint wizard
      profile.tsx
  +not-found.tsx

src/
  api/
    client.ts                  # axios instance, interceptors (see §4)
    endpoints/                 # one file per Postman folder
      auth.api.ts               # register, login, verify-otp, me, logout
      lookups.api.ts            # departments, categories, priorities, statuses
      complaints.api.ts         # (future, once backend ships it)
      admin.api.ts              # departments/categories/priorities/sla CRUD (future mobile-admin)
    types/
      auth.types.ts
      lookups.types.ts
      complaint.types.ts
      api-envelope.types.ts     # shared { success, data, message, meta } shape

  features/
    auth/
      hooks/
        useRegister.ts
        useLogin.ts
        useVerifyOtp.ts
        useLogout.ts
        useMe.ts
      components/
        OtpInput.tsx
        PasswordField.tsx
      store/
        authStore.ts             # Zustand: token, user, hydration state
      utils/
        validation.ts            # zod schemas mirroring FR-1..FR-4

    complaints/
      hooks/
        useComplaints.ts
        useCreateComplaint.ts
        useComplaintDetail.ts
      components/
        ComplaintCard.tsx
        StatusBadge.tsx
        Timeline.tsx
        AttachmentPicker.tsx
        LocationPicker.tsx
      store/
        draftComplaintStore.ts   # in-progress multi-step form + offline queue
      utils/
        offlineQueue.ts

    lookups/
      hooks/
        useDepartments.ts
        useCategories.ts
        usePriorities.ts
        useComplaintStatuses.ts

    notifications/
      hooks/
        usePushRegistration.ts
      utils/
        notificationHandlers.ts

  components/                  # Dumb, reusable, no business logic
    ui/
      Button.tsx
      Input.tsx
      Card.tsx
      EmptyState.tsx
      ErrorState.tsx
      LoadingSpinner.tsx
    layout/
      Screen.tsx                # SafeArea + KeyboardAvoiding wrapper
      Header.tsx

  hooks/                        # Cross-cutting hooks, not feature-specific
    useNetworkStatus.ts
    useAppState.ts

  lib/
    queryClient.ts               # React Query client + persistence config
    secureStorage.ts             # SecureStore wrapper
    logger.ts
    sentry.ts

  constants/
    roles.ts                     # 'citizen' | 'employee' | 'admin'
    config.ts                    # base_url per env, timeouts

  theme/
    colors.ts
    typography.ts
    spacing.ts

  locales/
    en.json
    ar.json

assets/
  fonts/, images/, lottie/

app.config.ts
eas.json
.env.development / .env.staging / .env.production
```

**Rules of thumb:**
- `app/` files should almost never contain business logic — they import a screen component/hook from `src/features/...` and render it. This keeps routing decoupled from logic and makes screens testable without the router.
- A feature folder never imports from another feature folder directly. Shared logic goes in `src/hooks`, `src/lib`, or `src/components`.
- One API file per backend resource, matching the Postman collection folders 1:1 (`auth`, `lookups`, `admin/departments`, `admin/categories`, `admin/priorities`, `admin/sla-rules`) so any endpoint change has one obvious place to update.

---

## 3. Response Envelope & Typing Discipline

Every response in the collection follows the same envelope: `{ success, data, message }` (list endpoints add `meta` for pagination). Model this **once**, generically:

```ts
// src/api/types/api-envelope.types.ts
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T> {
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
```

Then every endpoint function returns a fully-typed shape, e.g.:

```ts
// src/api/endpoints/auth.api.ts
export const login = (payload: LoginPayload) =>
  apiClient.post<ApiEnvelope<{ user_id: string; requires_otp: true; otp?: string }>>(
    '/auth/login',
    payload
  );
```

Never let `any`/`unknown` leak past the API layer. If the backend response shape changes, TypeScript should fail the build, not fail silently at runtime.

---

## 4. Networking Layer (axios + interceptors)

```ts
// src/api/client.ts
import axios from 'axios';
import { getToken, clearSession } from '@/lib/secureStorage';
import { router } from 'expo-router';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL, // mirrors Postman {{base_url}}
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken(); // citizen_token / employee_token / admin_token equivalent
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      await clearSession();
      router.replace('/(auth)/login');
    }
    if (status === 403) {
      // RBAC violation — surface a toast, never a silent failure
    }
    return Promise.reject(normalizeApiError(error));
  }
);
```

**Key senior-level details:**
- **Normalize errors once**, at the interceptor level, into a single `ApiError { status, message, fieldErrors? }` shape. Screens should never touch raw axios errors.
- **Never store the raw axios error in Zustand/React Query cache** — only the normalized version, or React Query's DevTools become unreadable.
- **Single Sanctum token per session** (as the collection implies — `citizen_token`, `employee_token`, `admin_token` are really "the current bearer token"). Store it once in SecureStore under one key (`auth_token`) plus the user object; don't over-engineer multi-role sessions unless the product genuinely supports switching roles in one login.
- **Retry policy:** GET requests idempotent → let React Query retry (default 3, exponential backoff). POST/PUT/DELETE → do **not** auto-retry (OTP verify, complaint creation) unless you build idempotency keys.

---

## 5. Auth Flow — matching the Postman collection exactly

The collection defines a strict two-step flow: `register`/`login` → returns `user_id` (+ `otp` only in local env) → `verify-otp` → returns Bearer `token`. Model this as a **state machine**, not ad-hoc booleans:

```
IDLE → SUBMITTING_CREDENTIALS → AWAITING_OTP → VERIFYING_OTP → AUTHENTICATED
                                      ↓ (resend)
                                AWAITING_OTP (reset timer)
```

- `useLogin`/`useRegister` mutation saves `user_id` in navigation params or a short-lived Zustand slice — **never** in SecureStore (it's not a credential).
- `useVerifyOtp` mutation, on success, writes `token` + `user` to SecureStore and Zustand, then `router.replace('/(app)/(tabs)')`.
- Build a **shared `<OtpScreen purpose="register"|"login">`** — the collection uses the same endpoint (`/auth/verify-otp`) with a `purpose` field for both; don't duplicate the screen.
- Resend-OTP UX: disable button + countdown (60s), matching typical government OTP throttling.
- `auth/me` should back a `useMe()` query with a long `staleTime` (session doesn't change often), invalidated only on login/logout — this is your single source of truth for `user.role` used in role-gated navigation.
- `auth/logout` mutation should **always** clear local session (SecureStore + Zustand + React Query cache via `queryClient.clear()`) even if the network call fails — a government app must let users log out offline.

### Root layout auth gating (Expo Router)

```tsx
// app/_layout.tsx (simplified)
export default function RootLayout() {
  const { isHydrated, token } = useAuthStore();
  if (!isHydrated) return <SplashScreen />;
  return (
    <Stack>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
```

Persist auth via a **rehydration step on app boot** (read SecureStore → validate token isn't expired client-side → call `auth/me` to confirm server-side validity → then render). Never render the tab navigator before hydration finishes, or you'll get a login-screen flash.

---

## 6. Role-Based Access (RBAC) on the client

The API enforces RBAC server-side (403 on cross-role access, per the collection's negative test). The client must **mirror, never replace**, that enforcement:

- Store `user.role` from `auth/me`.
- Gate navigation/tabs/menu items by role — a citizen build of the tab bar should never render an "Admin" tab, even hidden.
- Still handle 403 gracefully everywhere (defense in depth) — a role check that only lives in the UI is not security.
- If the mobile app is citizen-only for this phase, hardcode the guard to `role === 'citizen'` at the root and treat any other role logging in as an error state ("please use the web portal") rather than half-building admin screens now.

---

## 7. Complaint Domain Modeling (ahead of backend delivery)

The SRS defines the complaint lifecycle (FR-5–FR-13) even though the current Postman collection only ships auth/lookups/admin-taxonomy. Build the **types and API layer now** against the SRS so the UI isn't blocked later:

```ts
export interface Complaint {
  id: string;
  title: string;
  description: string;
  department_id: string;
  category_id: string;
  priority_id: string;
  status: 'submitted' | 'in_review' | 'assigned' | 'in_progress' | 'resolved' | 'rejected' | 'closed'; // from /lookups/complaint-statuses
  location?: { lat: number; lng: number; address?: string };
  attachments: Attachment[];
  created_at: string;
  sla_due_at?: string;
  timeline: ComplaintTimelineEntry[];
}
```

Wrap all not-yet-implemented endpoints behind the same `src/api/endpoints/complaints.api.ts` module so swapping a mock for the real endpoint is a one-file change (see §11, mock strategy).

---

## 8. Forms & Validation

- Every form (register, login, create-complaint) gets a **zod schema** colocated in the feature's `utils/validation.ts`, shared between `react-hook-form`'s resolver and any client-side pre-check before hitting the API.
- Surface **server-side field errors** (Laravel 422 validation responses) by mapping them onto `setError(fieldName, ...)` in a shared helper — don't just toast "Something went wrong."
- Password fields: mirror backend rules exactly (the collection sends `password_confirmation` — match Laravel's confirmed rule) to avoid confusing "passwords don't match" server errors after client-side already said "OK".

---

## 9. Offline Support (FR-20)

Government users may file complaints in low-connectivity areas. Design for it explicitly:

1. **Detect connectivity** with `@react-native-community/netinfo` via a `useNetworkStatus()` hook.
2. **Queue, don't block**: if `POST /complaints` fails due to no network, save the payload (including local URIs for attachments) into a persisted **offline queue** (MMKV or AsyncStorage-backed Zustand store), and show it in the complaints list with a "Pending sync" badge.
3. **Background sync**: on reconnect (NetInfo listener) or `expo-background-fetch`, flush the queue in order, uploading attachments first, then the complaint payload.
4. **Idempotency**: attach a client-generated UUID (`client_ref`) to each queued complaint so a retried request doesn't create duplicates server-side (requires backend support — flag this as an API contract requirement, not just a client concern).
5. **User feedback**: never let a "failed" submission look identical to a "succeeded" one — distinct visual states: `queued → uploading → synced → failed (tap to retry)`.

---

## 10. Notifications, Location, Attachments

- **Push (FR-17/18):** register the Expo push token in `auth/me`-adjacent profile update once the backend exposes it; handle foreground notifications with `expo-notifications` listeners; deep-link notification taps to `complaints/[id]`.
- **Geo (FR-19):** request permission lazily (at the point of complaint creation, not on app boot), fall back gracefully to manual address entry if denied — never hard-block submission on location permission.
- **Attachments (FR-6):** compress images client-side (`expo-image-manipulator`) before upload; cap file size/type client-side to match backend validation; use resumable/multipart upload with progress UI, not a blocking spinner.

---

## 11. Mocking Strategy Before Backend Endpoints Exist

Since complaint CRUD isn't in the Postman collection yet, don't block frontend work:

- Use **MSW (Mock Service Worker) for React Native** or a simple `if (__DEV__ && Config.USE_MOCKS)` branch inside each `*.api.ts` file returning fixture data shaped exactly like `ApiEnvelope<T>`.
- Keep fixtures in `src/api/__mocks__/`, one per resource, so removing mocks later is deleting a folder, not hunting through components.

---

## 12. Testing Strategy

| Layer | Tool | What to cover |
|---|---|---|
| Utils/validation | Jest | zod schemas, offline queue reducer, SLA countdown math |
| Hooks | RNTL + `renderHook` | `useLogin`, `useVerifyOtp` state transitions, error mapping |
| Components | RNTL | `OtpInput`, `StatusBadge`, `Timeline` render logic |
| API layer | Jest + `msw` | Auth flow against mocked `/auth/*` matching the Postman contract exactly (reuse the collection's example bodies as fixtures) |
| E2E | Maestro (lighter, YAML-based, faster to maintain than Detox for small teams) | Register → OTP → login → create complaint → logout, on a real/simulator device |

Treat the Postman collection as a **contract test source of truth** — consider exporting it to run via `newman` in CI against a staging backend, independent of the mobile app, so API regressions are caught before they break the app.

---

## 13. Performance

- `FlashList` (Shopify) instead of `FlatList` for complaint lists — critical once users have dozens/hundreds of complaints.
- Memoize list item components (`ComplaintCard`) with `React.memo` + stable callbacks (`useCallback`).
- Image thumbnails: request resized/optimized images from backend if possible, or downsample client-side before rendering in lists.
- Lazy-load heavy screens (map view for location picker) via `React.lazy`/dynamic import where Expo Router supports it.
- Avoid re-renders from Zustand by selecting narrow slices (`useAuthStore((s) => s.user)`), never the whole store.

---

## 14. Security Checklist

- [ ] Tokens only in `expo-secure-store`, never AsyncStorage, never Redux-persisted to disk unencrypted.
- [ ] Certificate pinning for production API calls (optional but recommended for a government app) via `expo-dev-client` + a networking library that supports it, or a bare workflow module.
- [ ] No sensitive data (OTP, tokens, PII) in `console.log` in production builds — strip logs via Babel plugin (`babel-plugin-transform-remove-console`) for release builds.
- [ ] Screenshots/screen-recording blocked on sensitive screens if required by compliance (`expo-screen-capture`).
- [ ] Deep link validation — verify any `expo-router` deep link params before trusting them (e.g. don't navigate straight to a complaint ID from a push notification without checking ownership server-side).
- [ ] Biometric app-lock option (`expo-local-authentication`) for re-entering the app after backgrounding, given this handles government/PII data.

---

## 15. Environments & CI/CD

- `.env.development`, `.env.staging`, `.env.production` → `EXPO_PUBLIC_API_BASE_URL` mirrors the Postman `base_url` environment variable per environment.
- `eas.json` build profiles: `development` (dev client, internal), `preview` (internal testers, staging API), `production` (store, prod API).
- GitHub Actions: lint + typecheck + unit tests on every PR; `eas build` triggered on merge to `release/*`; `eas update` for OTA JS-only patches between store releases.
- Semantic versioning tied to `app.config.ts` `version`/`runtimeVersion` — bump `runtimeVersion` on any native dependency change so OTA updates don't get served to incompatible native builds.

---

## 16. Code Review / Definition of Done (per PR)

- [ ] TypeScript strict, zero `any`
- [ ] No business logic inside `app/` route files
- [ ] New endpoint added to the matching `*.api.ts` file with full types
- [ ] Loading / empty / error states handled for every screen (use `<ErrorState>`/`<EmptyState>` — don't ship blank screens)
- [ ] Works offline or fails gracefully (no crash on no-network)
- [ ] Strings pulled from `locales/*.json`, not hardcoded
- [ ] Accessibility: labels on touchables, sufficient contrast, dynamic font scaling not broken
- [ ] Tested on both iOS and Android simulators at minimum
