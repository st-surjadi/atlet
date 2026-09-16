# Atlet: Session Flow & History — Design

Date: 2026-09-16
Status: Approved

## 1. Overview

This adds the app shell around the shot-tracking core described in
`2026-09-14-atlet-shot-tracking-design.md`: a Home screen, a session Setup
screen (mode + recording choice), a Session screen (camera, with optional
video recording), and a History screen (past sessions).

The actual shot-tracking engine (ball detection, attempt/make counting) is
**not** part of this design. It is a separate, larger piece of work,
described in the shot-tracking design doc, not yet started. This design
builds the surrounding app so it's ready to receive real counts once that
engine exists. Until then, session records show placeholder tallies.

## 2. Goals

- Let the user pick Target (with a shot count) or Free Shooting mode.
- Let the user pick Track Only or Track & Record.
- Record video (no audio) for Track & Record sessions, saved to the
  device's Photos library.
- Keep a local history of sessions: date, time, mode, and tally (tally is
  a placeholder until the tracking engine exists).
- Navigate between Home, Setup, Session, and History.

## 3. Non-Goals (Out of Scope)

- Any real shot counting. Session records always store a placeholder
  tally until the tracking engine (separate design) is built.
- In-app video playback. Tapping a session with a video opens the Photos
  app generally; it does not deep-link to the specific clip (see Section
  8 for why).
- Deleting history entries, editing past sessions, or any stats beyond
  the raw tally.
- Auto-ending a session at the target count. Ending is always manual.

## 4. Navigation

Adds `expo-router` for navigation. This replaces the current single-screen
`App.tsx` with a file-based route structure:

```
app/
  _layout.tsx    — root Stack navigator
  index.tsx      — Home screen
  setup.tsx      — mode + record picker
  session.tsx    — camera + session in progress
  history.tsx    — past sessions table
```

`index.js` and `App.tsx` are removed. `expo-router/entry` becomes the
app's entry point instead (set via `package.json`'s `main` field).

**Regression risk:** this touches the same area where an app-registration
bug was just found and fixed (`index.js`'s `AppRegistry.registerComponent`
call had to match `withModuleName` in `AppDelegate.swift` and
`getMainComponentName` in `MainActivity.kt`). After wiring up `expo-router`,
the Simulator and real-device launch must both be re-verified before any
other work continues, the same way that bug was caught.

The existing `CameraPreviewScreen` permission/device-check logic moves
into `app/session.tsx`, since that's the only screen needing the camera.

Flow: `Home` → `Setup` → `Session` → (End Session) → `History`. `History`
is also reachable directly from `Home`.

## 5. Screens

### Home (`app/index.tsx`)

- Title: "Atlet".
- "Start Session" button → Setup.
- "History" button → History.

### Setup (`app/setup.tsx`)

- Mode toggle: **Target** / **Free Shooting**.
  - If Target is selected: preset buttons for shot count — 10 / 25 / 50 /
    100. One must be selected to continue.
- Record toggle: **Track Only** / **Track & Record**.
- "Start" button, disabled until mode (and count, if Target) is chosen.
  Navigates to Session, passing the picked mode, count, and record choice
  as route params.

### Session (`app/session.tsx`)

- Camera preview, reusing the existing permission/device-check fallback
  states from `CameraPreviewScreen`.
- Header banner shows the picked mode: "Free Shooting" or "Target: 25".
- Below the camera: "Shot tracking coming soon" — no fake live count is
  shown, since there's no real tracking yet.
- If Track & Record was picked: recording starts as soon as the camera is
  ready (no audio track).
- "End Session" button:
  1. Stops recording, if any.
  2. Saves the video to the Photos library (see Section 6).
  3. Saves a session record to history (see Section 6).
  4. Navigates to History.
- Leaving the screen any other way (back button/gesture) prompts "Discard
  this session?". Confirming stops any in-progress recording and skips
  the save-to-Photos step — the temp file is left for iOS to clean up
  from its own cache, rather than adding a file-deletion dependency for
  this one low-stakes edge case. No history record is created. Canceling
  the prompt keeps the session running.

### History (`app/history.tsx`)

- List of past sessions, newest first: date, time, mode, attempts, makes.
  Attempts and makes both show as "—" for now (placeholder, no tracking
  engine yet).
- Rows for sessions with a saved video are tappable. Tapping calls
  `Linking.openURL('photos-redirect://')` to open the Photos app. This is
  undocumented and could change in a future iOS release; if the call
  fails, nothing happens (no crash, no error shown) — see Section 8.
- Rows without a video are not tappable.

## 6. Data Model & Storage

Session records are stored as a JSON array in `AsyncStorage`, one entry
per session:

```ts
type SessionRecord = {
  id: string; // uuid
  date: string; // e.g. "2026-09-16"
  time: string; // e.g. "14:32"
  mode: 'target' | 'free';
  targetCount?: number; // present only when mode === 'target'
  hasVideo: boolean;
};
```

Video files save to the device's Photos library via `expo-media-library`.
The app does not keep its own copy and does not track a specific asset
identifier — `hasVideo` is only used to decide whether a History row is
tappable.

## 7. Permissions

- `NSCameraUsageDescription` — already present, unchanged.
- `NSPhotoLibraryAddUsageDescription` — new. Add-only access, needed by
  `expo-media-library` to save recorded video. No read access is
  requested.
- No microphone permission — video records without audio.

## 8. Why Not Deep-Link to the Specific Video

iOS does not offer a public, documented way for a third-party app to open
the Photos app directly on one specific asset. The only known mechanism
(`photos-redirect://`, opening the Photos app generally, not a specific
item) is itself an undocumented private URL scheme. Building real
per-clip deep-linking would require the app to keep its own playable copy
of the video and a custom in-app player — explicitly out of scope for
this pass (see Section 3). If this is wanted later, it's a separate,
self-contained piece of work.

## 9. Error Handling

- Camera/permission fallback states: unchanged from the current
  `CameraPreviewScreen` behavior.
- If saving to Photos fails (permission denied, storage full), the
  session record still saves, with `hasVideo: false`. The user sees a
  one-time alert. A failed video save must never lose the session's tally
  data.
- The "open Photos" call is best-effort. A failure to open is silent —
  no error shown, since there is nothing actionable for the user to do
  about an iOS-level URL scheme failing.

## 10. New Dependencies

- `expo-router` (navigation)
- `react-native-screens`, `expo-linking` (expo-router dependencies)
- `@react-native-async-storage/async-storage` (session history storage)
- `expo-media-library` (saving video to Photos)

## 11. Testing Approach

- Unit tests: the `AsyncStorage` read/write helpers for session records,
  and the preset shot-count logic on the Setup screen.
- Manual verification, in this order, after the `expo-router` migration:
  1. App launches cleanly on the Simulator (re-checking the registration
     area first, before testing anything else).
  2. App launches cleanly on the real iPhone.
  3. Full flow: Home → Setup (both modes, both record choices) → Session
     → End Session → History shows the new record.
  4. Track & Record: confirm the video actually appears in Photos.
  5. Discard flow: start a session, back out, confirm the prompt, confirm
     no history record and no saved video result.
