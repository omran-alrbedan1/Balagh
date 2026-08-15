# Notifications

## Architecture

Remote delivery follows this path:

`Balagh Expo app` → `ExpoPushToken` → `POST /device-tokens` → backend notification dispatcher → queued `SendPushNotificationJob` → Expo Push Service → FCM/APNs → device/app.

The REST inbox and unread count remain authoritative. TanStack Query owns inbox pages, unread count, and preferences. Runtime push listeners invalidate those queries; the unread response is also applied to the application icon badge.

Only known complaint destinations are routable. The app accepts a positive `complaint_id` with either a known complaint notification type or the backend `OPEN_COMPLAINT` action. It never navigates directly to `url_hint`.

## Mobile configuration

Copy `.env.example` and set:

- `EXPO_PUBLIC_API_BASE_URL`: complete API v1 URL reachable by the device. A physical phone cannot reach a development computer through `127.0.0.1`; use an explicit HTTPS URL or reachable LAN URL.
- `EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true`: explicitly enables permission/token registration. Use `false` when the build should not attempt remote push.
- `EXPO_PUBLIC_USE_MOCKS`: existing optional mock-data setting.

The checked-in Expo configuration contains the verified EAS project ID under `extra.eas.projectId`. Do not hardcode a different value in notification code. Android requires the checked-in Firebase configuration to match `com.balagh.app`. The `expo-notifications` plugin uses the existing monochrome branding asset and creates the runtime `default` channel before permission/token acquisition.

Cleartext HTTP is enabled only when the configured API URL explicitly begins with `http://`; production uses HTTPS and therefore generates a cleartext-disabled Android build.

Development and preview EAS profiles intentionally do not embed a loopback API URL. Supply `EXPO_PUBLIC_API_BASE_URL` through the EAS environment for the selected profile or when building locally.

## Backend prerequisites

End-to-end push delivery also requires deployment state outside this repository:

- `PUSH_NOTIFICATIONS_ENABLED=true` on the backend.
- A running Laravel queue worker, because delivery is queued.
- Expo push delivery enabled/configured by the backend deployment.
- An authenticated user's active Expo token present in `/device-tokens`.

Token acquisition, backend storage, and actual device delivery are separate verification steps. A successful token POST does not prove that a queued complaint event reached a device.

## Development and real-device smoke test

Remote push is not supported by Expo Go on current SDKs. Use a development build or release APK on a physical Android device.

1. Install fresh, log in, grant notification permission, and confirm this device appears in `GET /device-tokens`.
2. Trigger a genuine complaint notification with the app foregrounded. Confirm system presentation, inbox refresh, unread count, and badge.
3. Repeat in the background; tap the notification and confirm the matching complaint opens.
4. Terminate the app normally, trigger another event, tap it, and confirm auth hydration completes before the complaint opens exactly once.
5. Exercise pull-to-refresh, pagination, mark read, mark all read, and delete.
6. Log out and confirm best-effort deletion of this device's stored backend record and badge reset. Log in as another user and confirm a new registration.
7. Where practical, reinstall or force token rollover and confirm the new Expo token is registered.

For delivery failures, trace: complaint event → database notification → queued job → worker execution → Expo acceptance/receipt → device reception → navigation/inbox synchronization.

## Android release builds

The normal `production` profile remains the Play Store AAB build. The installable internal-test APK profile extends production and only changes distribution/build type:

```sh
npx eas build --platform android --profile production-apk
```

EAS authentication and Android signing credentials are required. Never place those credentials or Expo access tokens in public environment variables or project documentation.
