# Pōtāre

Pōtāre helps people discover local venues, navigate toward a selected venue with a directional compass, and keep a local record of visits. The current demo dataset is centered on Charleston, South Carolina.

## Features

- Expo Router authentication and protected tab navigation.
- Venue discovery with native map markers on iOS and Android and a venue list fallback on web.
- Persistent venue favorites and check-ins in SQLite.
- Compass bearing and distance guidance, with optional arrival notification.
- Profile with persisted bio, discoverability and activity privacy controls, recent check-in history, and sign-out.
- Local outings with host controlled invites, venue targets, and privacy aware member activity.
- Search by venue name/address/category and filter by price tier and crowd level.
- Seeded venues for a useful first launch.

## Architecture

```text
Expo Router screens (app/)
        │
AuthContext ─ ProfileContext
        │
Services (services/)
        │
Expo SQLite database (potare.db)
```

Screens own presentation and platform interaction. `AuthContext` exposes session state. Service modules own parameterized SQL and convert database rows to domain types in `types/`. Database initialization is performed by the root layout and seed operations only insert demo data into an empty venue table. Profile privacy, favorites, check-ins, outings, and memberships are stored locally in SQLite.

## Requirements and setup

- Node.js supported by the installed Expo SDK 58 toolchain.
- iOS Simulator with Xcode on macOS, Android Studio/emulator, or a physical device.

```sh
npm install
npx expo start
```

Use the Expo CLI prompts to open iOS, Android, or web. Native map tiles and compass heading require a device or simulator with location support. Web uses a list view and does not require native map modules.

No remote API key or `.env` value is required for the local demo. Do not commit real credentials or user data.

## Local data and trade-offs

SQLite gives immediate local reads and offline check-in/favorite support. Data is device-local; accounts are a local demo flow and do not sync across devices. A production release needs a server-backed identity and synchronization layer, account recovery, and a defined privacy model before group presence can be shared.

Compass direction combines the venue's geometric bearing with the device heading. Magnetic interference and calibration can affect heading accuracy; web and devices without heading support need a manual or non-heading fallback. Location and notification permissions are optional and may be denied.

## Verification checklist

```sh
npx expo-doctor
npx tsc --noEmit
npm run lint
npx expo start --web
npm test
```

Smoke test signup, session restoration after reload, sign-out, venue search/filters, favorite persistence after restart, map-to-compass navigation, arrival check-in, and profile history. Create an outing, set its meetup target, opt into discovery from profile editing, invite that username, then toggle activity visibility and confirm the circle no longer sees check-ins. Verify denied location and notification permissions on a simulator or device.

## Resume and interview notes

- Built a cross-platform venue discovery and proximity navigation app with Expo Router, strict TypeScript, and SQLite-backed favorites and visit history.
- Separated route presentation, session context, typed services, and persistence to keep screen code independent from SQL details.
- Designed platform-specific map behavior and permission fallbacks so the web preview remains usable without native map support.

**Trade-offs to discuss:** local SQLite keeps interactions responsive and supports offline use, while server synchronization is needed for multi-device accounts and shared group presence. Compass bearing math is deterministic, while live heading remains subject to device sensor availability and calibration.

**Roadmap:** remote auth and sync; actual circle membership and presence sharing; configurable discovery filters; automated unit coverage for geographic calculations and service operations; accessibility and device smoke-test automation.
