# Backend vs Frontend Gap Analysis

**Analysis Date:** August 13, 2026  
**Backend Repository:** https://github.com/Obada-zaher/GovernmentComplaints  
**Frontend Project:** Expo React Native Mobile App

---

## Executive Summary

This document provides a comprehensive analysis of gaps between the backend Government Complaint Management System API and the current Expo React Native frontend implementation. The analysis identifies missing API endpoints, screens, features, data mapping issues, and security considerations.

**Key Findings:**
- **9 API endpoints** missing from frontend implementation (auth endpoints completed)
- **5 major screens** not yet built (auth screens completed)
- **Offline sync** infrastructure incomplete (placeholder only)
- **Push notification system** not integrated with backend
- **Authentication flows** password recovery features implemented

---

## 1. Backend Features with No Frontend Implementation

### 1.1 Auth Endpoints (COMPLETED ✅)

| Endpoint | Method | Purpose | Priority | Status |
|----------|--------|---------|----------|--------|
| `/auth/change-password` | POST | Change user password | High | ✅ Implemented |
| `/auth/forgot-password` | POST | Request password reset email | High | ✅ Implemented |
| `/auth/reset-password` | POST | Reset password with token | High | ✅ Implemented |
| `/auth/resend-otp` | POST | Resend OTP code | Medium | ✅ Implemented |
| `/auth/logout-all` | POST | Revoke all user tokens | Medium | ✅ Implemented |

**Current Implementation:**
- ✅ `/auth/register` - Implemented
- ✅ `/auth/login` - Implemented
- ✅ `/auth/verify-otp` - Implemented (with device_name)
- ✅ `/auth/me` - Implemented
- ✅ `/auth/logout` - Implemented
- ✅ `/auth/change-password` - Implemented
- ✅ `/auth/forgot-password` - Implemented
- ✅ `/auth/reset-password` - Implemented
- ✅ `/auth/resend-otp` - Implemented
- ✅ `/auth/logout-all` - Implemented

### 1.2 Missing Notification Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/notifications` | GET | List user notifications | High |
| `/notifications/unread-count` | GET | Get unread notification count | High |
| `/notifications/{id}/read` | PATCH | Mark notification as read | High |
| `/notifications/read-all` | PATCH | Mark all notifications as read | Medium |
| `/notifications/{id}` | DELETE | Delete notification | Low |

**Current Implementation:**
- ❌ No notification API client exists
- ❌ No notification types defined
- ⚠️ Basic expo-notifications setup only

### 1.3 Missing Offline Sync Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/citizen/offline/complaints/sync` | POST | Sync offline complaint | High |
| `/citizen/offline/submissions` | GET | List offline submissions | Medium |
| `/citizen/offline/submissions/{id}` | GET | Show offline submission | Medium |

**Current Implementation:**
- ⚠️ `offlineQueueStore.ts` exists with placeholder implementation
- ⚠️ Comment indicates "Persisted offline queue and background sync land in Phase 9"
- ❌ No actual API calls implemented

### 1.4 Missing Complaint Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/citizen/complaints/{id}/attachments` | POST | Add attachments to existing complaint | Medium |

**Current Implementation:**
- ✅ `/complaints` (GET) - List complaints
- ✅ `/complaints/{id}` (GET) - Show complaint
- ✅ `/complaints` (POST) - Create complaint

### 1.5 API Path Mismatch

**Issue:** Backend uses citizen-scoped paths while frontend uses generic paths.

| Backend Path | Frontend Path | Impact |
|--------------|---------------|--------|
| `/citizen/complaints` | `/complaints` | May not be citizen-scoped |
| `/citizen/offline/complaints/sync` | Not implemented | N/A |

**Recommendation:** Update frontend to use `/citizen/complaints` for citizen-specific operations.

---

## 2. Missing Mobile Screens/Features

### 2.1 Auth Screens (COMPLETED ✅)

| Screen | Purpose | Priority | Status |
|--------|---------|----------|--------|
| Change Password Screen | Form to update password | High | ✅ Implemented |
| Forgot Password Screen | Email input for password reset | High | ✅ Implemented |
| Reset Password Screen | New password form with token | High | ✅ Implemented |
| Resend OTP Flow | Button/functionality to resend OTP | Medium | ✅ Implemented |

### 2.2 Notification Screens

| Screen | Purpose | Priority |
|--------|---------|----------|
| Notifications Inbox Screen | List all notifications with read/unread status | High |
| Notification Detail Screen | View full notification content | Medium |

### 2.3 Profile Screens

| Screen | Purpose | Priority |
|--------|---------|----------|
| Edit Profile Screen | Update name, email, phone, national_id | Medium |
| Notification Preferences Screen | Configure push notification settings | Low |
| Security Settings Screen | Password management, logout all devices | Medium |

### 2.4 Offline Sync Screens

| Screen | Purpose | Priority |
|--------|---------|----------|
| Offline Queue Screen | View pending offline submissions | Medium |
| Sync Status Screen | Show sync progress and failed items | Medium |

### 2.5 Complaint Screens

| Screen | Purpose | Priority |
|--------|---------|----------|
| Add Attachment Screen | Add attachments to existing complaints | Medium |
| Complaint History with Advanced Filters | Date range, status, department filters | Low |

---

## 3. Frontend Gaps for Backend Requirements

### 3.1 Missing Form Fields

| Field | Location | Backend Requirement | Frontend Status |
|-------|----------|---------------------|-----------------|
| `national_id` | Registration form | Optional field | Type exists, form doesn't collect |
| `device_name` | Verify OTP payload | Required for token identification | Not sent |
| `priority_id` | Complaint creation | Optional field | May not be sent |
| `source` | Complaint creation | Expected "mobile" or "offline_sync" | Not sent |
| `created_offline_at` | Offline sync | Required for offline complaints | Not sent |
| `client_uuid` | Offline sync | Required for idempotency | Not generated |

### 3.2 Missing Response Fields Displayed

| Field | Backend Response | Frontend Display |
|-------|-----------------|------------------|
| `complaint_number` | Generated by backend | Not displayed (uses client_ref) |
| `sla_status` | on_track/due_soon/breached | Not displayed in UI |
| `assigned_employee` | Employee details | Not shown in complaint detail |
| `timeline` | Status history entries | Not fully displayed |
| `meta.idempotent` | Offline sync retry flag | Not utilized |

### 3.3 Missing API Parameters

**Verify OTP Payload:**
```typescript
// Current frontend payload
{
  user_id: string;
  otp: string;
  purpose: 'register' | 'login';
}

// Missing field
device_name: string; // Backend expects this
```

**Complaint Creation:**
```typescript
// Missing fields
source: 'mobile' | 'offline_sync';
priority_id?: string; // Optional but should be sent
```

**Offline Sync:**
```typescript
// Missing fields
client_uuid: string; // Generated by mobile app
created_offline_at: string; // ISO timestamp
```

---

## 4. Offline Sync Implementation Needs

### 4.1 Current State

- ✅ `offlineQueueStore.ts` exists (Zustand store)
- ✅ `offlineQueue.ts` utility types defined
- ⚠️ Store has placeholder implementation with comment: "Persisted offline queue and background sync land in Phase 9"
- ❌ No local storage persistence
- ❌ No network state monitoring
- ❌ No background sync mechanism

### 4.2 Missing Implementation

#### Local Storage
- Persist offline complaints to AsyncStorage
- Encrypt sensitive data before storage
- Implement queue serialization/deserialization

#### Client UUID Generation
- Use `expo-crypto` for UUID generation
- Store UUID with complaint for idempotency
- Handle UUID conflicts

#### Network State Monitoring
- Use `@react-native-community/netinfo` (already installed)
- Detect connectivity changes
- Trigger sync when connection restored

#### Background Sync Queue
- Process queued items when online
- Implement exponential backoff for retries
- Handle sync conflicts

#### Sync Status Tracking
- Track sync progress (queued/uploading/synced/failed)
- Display sync status to users
- Store last sync timestamp

#### Retry Logic
- Implement exponential backoff
- Max retry limits
- User-triggered retry option

#### Conflict Resolution
- Handle server-side changes during offline period
- Version conflict detection
- User resolution UI

---

## 5. Notification Handling

### 5.1 Current State

**Installed Dependencies:**
- ✅ `expo-notifications` (~57.0.7)
- ✅ `@react-native-community/netinfo` (12.0.1)

**Existing Code:**
- ✅ `usePushRegistration.ts` - Gets Expo push token
- ✅ `notificationHandlers.ts` - Configures display behavior

**Gaps:**
- ❌ Token never sent to backend
- ❌ No notification API endpoints implemented
- ❌ No notification listener for incoming push notifications
- ❌ No notification types defined

### 5.2 Missing Implementation

#### Device Token Registration
```typescript
// Need to implement
POST /device-tokens
{
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
}
```

#### Notification API Client
- Implement all notification endpoints
- Create notification types/interfaces
- Add to API client

#### Notification Listener
- Handle incoming push notifications
- Parse notification data
- Navigate to relevant screens

#### Notification Navigation
- Deep link to complaint details
- Handle different notification types
- Navigate to appropriate screens

#### Badge Count Management
- Update app badge with unread count
- Sync with backend unread count
- Clear badge on read

#### Notification Preferences
- Enable/disable per user preference
- Respect backend notification settings
- UI for managing preferences

---

## 6. Error Handling & Edge Cases

### 6.1 Missing Error Handling

| Scenario | Current Status | Needed |
|----------|----------------|--------|
| Offline Sync Errors | No retry UI | Error display, retry button |
| Attachment Upload Failures | No error handling | Size limits, progress, retry |
| Network Timeout | Basic timeout exists | Retry UI, exponential backoff |
| OTP Expiry | No handling | Expiry detection, resend flow |
| Token Refresh | No automatic refresh | Refresh mechanism, re-auth |

### 6.2 Missing Loading/Empty States

| Screen | Loading State | Empty State |
|--------|---------------|-------------|
| Notification Inbox | ❌ Missing | ❌ Missing |
| Offline Queue | ❌ Missing | ❌ Missing |
| Profile Edit | ❌ Missing | N/A |
| Complaint Detail | ✅ Exists | ✅ Exists |

---

## 7. Missing Pages/Views

### Priority 1 (Core User Flows)

1. **Notifications Inbox**
   - List all notifications
   - Read/unread indicators
   - Swipe to mark read/delete
   - Pull to refresh

2. **Change Password**
   - Current password input
   - New password input
   - Confirmation input
   - Validation

3. **Forgot/Reset Password**
   - Email input for forgot password
   - Token input for reset password
   - New password form
   - Validation

### Priority 2 (Enhanced Features)

1. **Edit Profile**
   - Name, email, phone fields
   - National ID field
   - Validation
   - Save/cancel actions

2. **Offline Queue Status**
   - List pending submissions
   - Sync progress indicators
   - Retry failed items
   - Delete queued items

3. **Add Attachments**
   - File picker
   - Image preview
   - Upload progress
   - Success/error feedback

### Priority 3 (Nice-to-Have)

1. **Notification Preferences**
   - Push notification toggle
   - Email notification toggle
   - Per-category preferences

2. **Advanced Complaint Filters**
   - Date range picker
   - Multi-status filter
   - Department filter
   - Priority filter

3. **Complaint Statistics**
   - Total complaints
   - Resolution rate
   - Average response time
   - Charts/graphs

---

## 8. Missing Integrations

### 8.1 Push Notifications

**Current State:**
- Expo push token obtained
- No backend registration
- No incoming notification handling

**Missing:**
- Firebase/Expo token registration endpoint
- Notification type handling (complaint updates, system messages)
- Deep linking from notifications
- Badge count management

### 8.2 File Uploads

**Current State:**
- Image picker implemented
- FormData upload for new complaints
- No post-creation attachment upload

**Missing:**
- Add attachment API endpoint implementation
- Upload progress tracking
- File validation (size, type, dimensions)
- Image compression before upload
- Multiple file support

### 8.3 Offline Sync

**Current State:**
- Placeholder store implementation
- No actual sync logic

**Missing:**
- Client UUID generation (expo-crypto)
- Queue persistence (AsyncStorage)
- Network monitoring (@react-native-community/netinfo)
- Background processing (Background Fetch / Task Manager)
- Sync conflict resolution

---

## 9. Data Mapping Issues

### 9.1 Type Mismatches

| Issue | Backend | Frontend | Impact |
|-------|---------|----------|--------|
| Complaint ID | `complaint_number` | `client_ref` | Inconsistent naming |
| Status | Full status objects | String enum | May cause parsing issues |
| Attachment fields | `file_name`, `file_size` | `fileName`, `fileSize` | Field name variations |
| User data | Nested objects | Flat structure | May miss nested data |

### 9.2 Missing Fields in Types

**AuthUser:**
- Missing `department` object structure
- Missing `reports_count` (used in profile but not in type)

**Complaint:**
- Missing `complaint_number` field
- Missing `source` field
- Timeline may have additional fields not captured

**Notification:**
- No notification types defined
- No notification interface exists

**OfflineSubmission:**
- No types defined for offline sync responses
- Missing `client_uuid`, `created_offline_at`

### 9.3 API Envelope Handling

**Issue:** Backend returns nested data structures

```typescript
// Backend variations
{ data: { complaint: {...} } }
{ data: {...} }
{ data: { complaints: [...] } }
{ data: [...] }
```

**Current:** Frontend has extractors but may miss all variations

**Missing:**
- Meta fields (idempotent, pagination) not fully utilized
- Error field handling may be incomplete
- Success field validation

---

## 10. Security Gaps in Frontend

### 10.1 Token Storage

**Current:**
- ✅ Using `expo-secure-store` (good practice)

**Gaps:**
- ❌ No token refresh mechanism
- ❌ No token expiry handling
- ❌ No token rotation strategy

### 10.2 Sensitive Data

**Current:**
- ✅ OTP codes not logged (good)
- ✅ Passwords not stored in plain text

**Gaps:**
- ⚠️ national_id may be displayed in profile (should be masked)
- ❌ No biometric authentication for sensitive actions
- ❌ No screen capture prevention for sensitive screens

### 10.3 API Security

**Current:**
- ✅ HTTPS in production (assumed)
- ✅ Bearer token authentication

**Gaps:**
- ❌ No certificate pinning
- ❌ No request signing
- ❌ device_name not sent in verify-otp (security tracking)
- ❌ No request rate limiting

### 10.4 Logging

**Current:**
- ✅ Sentry integration exists

**Gaps:**
- ⚠️ May log sensitive data (needs audit)
- ❌ No request/response sanitization in logs
- ❌ No PII filtering in logs

---

## 11. Priority Recommendations

### Immediate (Week 1-2)

1. **Implement Notification API endpoints**
   - Create `notifications.api.ts`
   - Implement list, unread count, mark read
   - Add notification types

2. **Build Notifications Inbox Screen**
   - List view with read/unread status
   - Pull to refresh
   - Mark as read functionality

3. **Add Change Password Screen**
   - Form with current/new/confirm fields
   - Validation
   - Success/error handling

4. **Fix API path mismatch**
   - Update complaint endpoints to use `/citizen/complaints`
   - Test citizen-scoped access

5. **Add device_name to verify-otp payload**
   - Include device identifier
   - Use Expo Device module

### Short-term (Week 3-4)

1. **Implement Forgot/Reset Password flow**
   - Forgot password screen
   - Reset password screen with token
   - Email validation

2. **Add device token registration**
   - Implement token registration endpoint
   - Send Expo push token to backend
   - Handle token updates

3. **Build Offline Sync foundation**
   - Implement queue persistence (AsyncStorage)
   - Add client UUID generation
   - Basic sync when online

4. **Add national_id to registration form**
   - Add field to registration screen
   - Update form validation
   - Update type definitions

5. **Implement Add Attachment endpoint**
   - POST to `/citizen/complaints/{id}/attachments`
   - File upload with progress
   - Success/error handling

### Medium-term (Month 2)

1. **Complete Offline Sync**
   - Background sync mechanism
   - Retry logic with exponential backoff
   - Sync status UI
   - Conflict resolution

2. **Build Edit Profile Screen**
   - Update name, email, phone
   - Update national_id
   - Validation and error handling

3. **Add Notification Preferences**
   - Push notification toggle
   - Per-category preferences
   - Sync with backend

4. **Implement token refresh**
   - Automatic token refresh
   - Refresh on 401 errors
   - Silent refresh in background

5. **Add advanced complaint filters**
   - Date range picker
   - Multi-status filter
   - Department filter
   - Save filter preferences

### Long-term (Month 3+)

1. **Add certificate pinning**
   - Implement SSL pinning
   - Protect against MITM attacks
   - Fallback handling

2. **Implement biometric auth**
   - Face ID / Touch ID
   - For sensitive actions (password change, profile edit)
   - Fallback to password

3. **Build complaint analytics**
   - Personal statistics dashboard
   - Resolution rate charts
   - Response time metrics
   - Export functionality

4. **Add offline-first architecture**
   - Full offline capability
   - Local database (SQLite/WatermelonDB)
   - Sync conflict resolution
   - Offline data caching

---

## 12. Implementation Checklist

### Auth
- [x] Change password endpoint
- [x] Change password screen
- [x] Forgot password endpoint
- [x] Forgot password screen
- [x] Reset password endpoint
- [x] Reset password screen
- [x] Resend OTP endpoint
- [x] Resend OTP UI
- [x] Logout all endpoint
- [x] Logout all UI
- [x] Add device_name to verify-otp

### Notifications
- [ ] Notification API client
- [ ] Notification types/interfaces
- [ ] List notifications endpoint
- [ ] Unread count endpoint
- [ ] Mark read endpoint
- [ ] Mark all read endpoint
- [ ] Delete notification endpoint
- [ ] Device token registration
- [ ] Notifications inbox screen
- [ ] Notification detail screen
- [ ] Notification listener
- [ ] Notification navigation
- [ ] Badge count management
- [ ] Notification preferences

### Complaints
- [ ] Fix API path to `/citizen/complaints`
- [ ] Add attachment endpoint
- [ ] Add attachment screen
- [ ] Add priority_id to creation
- [ ] Add source field to creation
- [ ] Display complaint_number
- [ ] Display sla_status
- [ ] Display assigned_employee
- [ ] Full timeline display
- [ ] Advanced filters

### Offline Sync
- [ ] Client UUID generation
- [ ] Queue persistence
- [ ] Network monitoring
- [ ] Sync endpoint implementation
- [ ] Background sync
- [ ] Retry logic
- [ ] Sync status UI
- [ ] Offline queue screen
- [ ] Conflict resolution

### Profile
- [ ] Edit profile screen
- [ ] Update name/email/phone
- [ ] Update national_id
- [ ] Notification preferences screen
- [ ] Security settings screen

### Security
- [ ] Token refresh mechanism
- [ ] Certificate pinning
- [ ] Biometric authentication
- [ ] Screen capture prevention
- [ ] Log sanitization
- [ ] Request signing

---

## 13. Testing Recommendations

### API Testing
- Test all new endpoints with Postman collections
- Verify error handling for edge cases
- Test authentication flows end-to-end
- Test offline sync scenarios

### UI Testing
- Test notification inbox with various states
- Test password change with validation
- Test forgot/reset password flows
- Test offline queue UI
- Test attachment uploads

### Integration Testing
- Test push notification end-to-end
- Test offline sync with network changes
- Test token refresh on expiry
- Test deep linking from notifications

### Security Testing
- Test token storage and retrieval
- Test sensitive data handling
- Test certificate pinning
- Test biometric authentication
- Audit logs for sensitive data

---

## 14. References

- **Backend Repository:** https://github.com/Obada-zaher/GovernmentComplaints
- **Backend API Docs:** docs/api/README.md
- **Postman Collections:** docs/postman/
- **OpenAPI Spec:** docs/openapi/gcms-api.openapi.yaml
- **Frontend Project:** Current Expo React Native app

---

## Appendix A: Backend Endpoint Summary

### Auth Endpoints
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/verify-otp`
- POST `/auth/resend-otp`
- GET `/auth/me`
- POST `/auth/logout`
- POST `/auth/logout-all`
- POST `/auth/change-password`
- POST `/auth/forgot-password`
- POST `/auth/reset-password`

### Citizen Complaint Endpoints
- GET `/citizen/complaints`
- POST `/citizen/complaints`
- GET `/citizen/complaints/{id}`
- POST `/citizen/complaints/{id}/attachments`

### Offline Sync Endpoints
- POST `/citizen/offline/complaints/sync`
- GET `/citizen/offline/submissions`
- GET `/citizen/offline/submissions/{id}`

### Notification Endpoints
- GET `/notifications`
- GET `/notifications/unread-count`
- PATCH `/notifications/{id}/read`
- PATCH `/notifications/read-all`
- DELETE `/notifications/{id}`

### Lookup Endpoints
- GET `/lookups/departments`
- GET `/lookups/categories`
- GET `/lookups/priorities`
- GET `/lookups/complaint-statuses`

### Health
- GET `/health`

---

## Appendix B: Frontend File Structure

```
src/
├── api/
│   ├── client.ts
│   ├── endpoints/
│   │   ├── auth.api.ts
│   │   ├── complaints.api.ts
│   │   └── lookups.api.ts
│   └── types/
│       ├── api-envelope.types.ts
│       ├── auth.types.ts
│       ├── complaint.types.ts
│       └── lookups.types.ts
├── features/
│   ├── auth/
│   ├── complaints/
│   ├── home/
│   ├── lookups/
│   ├── notifications/
│   └── settings/
└── lib/
    ├── secureStorage.ts
    └── ...
```

---

**Document Version:** 1.0  
**Last Updated:** August 13, 2026  
**Maintained By:** Frontend Development Team
