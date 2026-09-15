# Atlet Expo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Expo tooling to the existing bare React Native app, so future work (the native camera plugin, OTA updates, easier RN upgrades) builds on Expo's config-driven model, while keeping the live camera preview working exactly as it does today.

**Architecture:** Use Expo's official `install-expo-modules` path for an existing bare React Native project. This adapts the current `ios/`/`android/` folders in place — it does not delete or regenerate them from scratch. Project config (bundle id, camera permission string) moves into one `app.json` file. The application code (`App.tsx`, `CameraPreviewScreen.tsx`, `hasUsableCameraDevice.ts`, and its test) is not expected to change.

**Tech Stack:** Expo SDK tooling (`expo`, `install-expo-modules`), on top of the existing React Native 0.87 + TypeScript + `react-native-vision-camera` app.

---

## Why this is a different shape of plan than the last one

Some exact details of Expo's current CLI behavior (whether `expo prebuild` changes the iOS deployment target, exactly how `react-native-vision-camera`'s Expo plugin is configured in the currently-installed version) can shift between Expo releases. Rather than hardcode commands that might be stale, a few steps below ask the implementer to read the actual installed tooling's own output or source before acting, then apply exactly what's found. This is not a placeholder — it's a concrete, checkable action with a clear deliverable each time.

**Known facts, confirmed from Expo's own docs before writing this plan:**
- The install command is `npx install-expo-modules@latest`.
- It modifies (not replaces) `Podfile` (adds `use_expo_modules!`), `ios/Atlet/AppDelegate.swift`, `babel.config.js` (switches to `babel-preset-expo`), `metro.config.js` (extends `expo/metro-config`), and may bump `ios/Atlet.xcodeproj/project.pbxproj`'s `IPHONEOS_DEPLOYMENT_TARGET` to 16.4 (our current value is 15.1 — either is above `react-native-vision-camera`'s minimum of 13.0, so this is not a blocker either way).
- It is documented as tested against React Native 0.86. Our project is on React Native 0.87.1 — one minor version ahead. Watch for version-mismatch warnings during install; don't push through a warning that looks like a real incompatibility without stopping to report it.

## Why a real device is required

Same as the project-foundation plan: the Simulator cannot show a live camera feed. Task 3 in this plan must be verified on the real iPhone already used for Task 5 of that plan (code signing and camera permission are already trusted on that device from before — this should be faster than the first time).

## File Structure

- `app.json` — new. Central Expo config: app name, bundle id, iOS camera permission string, any needed plugin config.
- `package.json` — modified. Adds `expo` and whatever `install-expo-modules` pulls in.
- `babel.config.js` — modified by `install-expo-modules` (switches to `babel-preset-expo`).
- `metro.config.js` — modified by `install-expo-modules` (extends `expo/metro-config`).
- `ios/Podfile`, `ios/Atlet/AppDelegate.swift`, `ios/Atlet.xcodeproj/project.pbxproj` — modified by `install-expo-modules` and by `npx expo prebuild` applying `app.json`.
- `jest.config.js` — possibly modified, only if the existing `react-native` Jest preset breaks under the new Babel config (checked in Task 3, not assumed up front).
- No changes expected to `App.tsx`, `src/screens/CameraPreviewScreen.tsx`, `src/camera/hasUsableCameraDevice.ts`, or its test.

---

### Task 0: Downgrade React Native to 0.86.3

**UPDATE — actual final version is 0.85.3, not 0.86.3.** After completing this task's steps against 0.86.3 and committing, Task 1's `npx install-expo-modules@latest` (v0.16.0) still failed: `Unable to find compatible Expo SDK version - reactNativeVersion[0.86.3]`. The installed tool's built-in version table tops out at Expo SDK 56, which needs React Native `~0.85.0` — it does not yet recognize SDK 57, even though SDK 57 is already published and does pin to 0.86.3 (confirmed via `npm view expo@57.0.22 devDependencies.react-native`). This is a lag in the `install-expo-modules` tool itself, not a wrong version choice. The user chose to downgrade further to 0.85.3 (latest 0.85.x patch) to match what the tool actually supports today. All of this task's steps were repeated against 0.85.3; the step-by-step log below is left as-is from the first pass for the record, but treat every "0.86.3" in it as superseded by "0.85.3" and every "was 0.87.1" context as historical.

Two extra issues surfaced during the 0.85.3 pass, both fixed:
1. The npm cache had root-owned files (`EACCES` on scaffold), needing `sudo chown -R 502:20 "/Users/stevenseansurjadi/.npm"` — a one-time environment fix, not code.
2. After a clean pod install, the app crashed on launch with `dyld: Symbol not found: __ZN8facebook3jsi5Array18createWithElementsE...`. Root cause: `ios/Podfile.lock` still had `React-Core-prebuilt` pinned at `0.86.3` — `pod install` treats it as a self-versioning local podspec and won't re-resolve it unless forced, so it stayed locked at the old version while `hermes-engine` correctly moved to 0.85.3, producing a JSI ABI mismatch. Fixed by deleting `Podfile.lock` and `Pods/` and reinstalling clean. Confirmed fixed on both the real iPhone and the Simulator.

**Why this task exists:** Task 1 was first attempted against React Native 0.87.1 (what the original project-foundation plan's CLI scaffold pulled in as "latest" at the time). `npx install-expo-modules@latest` failed outright with `Unable to find compatible Expo SDK version - reactNativeVersion[0.87.1]` — confirmed against Expo's own changelog, the latest stable Expo SDK (57) ships React Native 0.86, one minor version behind our project. This task re-pins the project to React Native 0.86.3 (latest 0.86.x patch, confirmed via `npm view react-native versions`) so Task 1 can succeed, then re-verifies everything still works — including on the real iPhone, since this touches the whole native scaffold.

**Files:**
- Effectively replaces: `package.json`, `package-lock.json`, `ios/`, `android/`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `.gitignore`, `Gemfile`, `Gemfile.lock`, `app.json` (regenerated from a fresh RN 0.86.3 template, then our own settings re-applied)
- Preserved as-is: `App.tsx`, `src/`, `docs/`, `.git`

- [x] **Step 1: Scaffold a fresh RN 0.86.3 TypeScript app in a temp folder**

Run:
```bash
rm -rf /tmp/atlet-rn86-scaffold && mkdir -p /tmp/atlet-rn86-scaffold && cd /tmp/atlet-rn86-scaffold && npx @react-native-community/cli@latest init Atlet --version 0.86.3 --pm npm --skip-git-init
```
Expected: a new `/tmp/atlet-rn86-scaffold/Atlet/` folder, with `package.json` showing `"react-native": "0.86.3"`.

- [x] **Step 2: Copy the scaffold in, preserving our own app code and docs**

Note: the rsync exclude list did not exclude `__tests__/`, so the stock template test `__tests__/App.test.tsx` came back. It failed under Jest (no native camera module in the test environment), the same failure we already resolved once before. I deleted it again.

Run:
```bash
rsync -a --exclude='.git' --exclude='node_modules' --exclude='docs' --exclude='src' --exclude='App.tsx' /tmp/atlet-rn86-scaffold/Atlet/ /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet/
```
Expected: `App.tsx`, `src/`, and `docs/` are untouched (still our own code); everything else (`package.json`, `ios/`, `android/`, etc.) is now the fresh 0.86.3 scaffold.

- [x] **Step 3: Re-apply our own project settings**

Re-do the same edits as the original project-foundation plan's Tasks 2 and 3, against this fresh scaffold:
1. Bundle identifier: replace `PRODUCT_BUNDLE_IDENTIFIER` values in `ios/Atlet.xcodeproj/project.pbxproj` with `com.stsurjadi.atlet` (same `sed` approach as before — find current value with `grep`, replace with `sed -i '' 's/PRODUCT_BUNDLE_IDENTIFIER = [^;]*;/PRODUCT_BUNDLE_IDENTIFIER = com.stsurjadi.atlet;/g' ios/Atlet.xcodeproj/project.pbxproj`, confirm with `grep -c`).
2. Development team: add `DEVELOPMENT_TEAM = J233JFP2K3;` next to each `PRODUCT_BUNDLE_IDENTIFIER` line in the same file (so the app can install straight to the already-trusted iPhone without a Xcode GUI step this time). Check it's not already present before adding.
3. iOS deployment target: `grep "IPHONEOS_DEPLOYMENT_TARGET" ios/Atlet.xcodeproj/project.pbxproj` — if any value is below 13.4 (react-native-vision-camera's minimum), bump it to 13.4 with `sed`, same as before.
4. Install the camera library: `npm install react-native-vision-camera@^4.0.0`.
5. Camera permission string: add to `ios/Atlet/Info.plist`, just before the closing `</dict>`:
```xml
	<key>NSCameraUsageDescription</key>
	<string>Atlet uses the camera to track your shots live.</string>
```
6. Do NOT re-add `NSLocationWhenInUseUsageDescription` — we removed that empty, unused key on purpose in the last plan.

- [x] **Step 4: Install dependencies and pods**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npm install
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
cd ios && bundle install && bundle exec pod install
```
Expected: both complete without error; "Pod installation complete!" for the pods step.

- [x] **Step 5: Verify the Simulator build** — user ran it. Simulator opened and the app is running.

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx react-native run-ios
```
Expected: builds and launches, showing the camera-permission fallback message (same as always on the Simulator).

- [x] **Step 6: Verify tests, types, and lint** — `npx jest` 2/2 pass, `npx tsc --noEmit` clean, `npx eslint src App.tsx` clean.

Run:
```bash
npx jest
npx tsc --noEmit
npx eslint src App.tsx
```
Expected: all three pass clean, same as before this change (our test/source files didn't change, only the RN version underneath them).

- [x] **Step 7: Clean up the temp scaffold folder**

Run:
```bash
rm -rf /tmp/atlet-rn86-scaffold
```

- [x] **Step 8: Commit** — committed on branch `feature/expo-migration` (not `main`; the prior feature branch was already merged and deleted, so I cut a new one for this plan).

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Downgrade React Native to 0.86.3 for Expo compatibility

install-expo-modules could not find an Expo SDK release matching our
previous React Native version (0.87.1). I re-scaffolded on React
Native 0.86.3, the latest patch the current Expo SDK supports, and
re-applied our bundle id, signing team, deployment target, and camera
permission settings. App code did not change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y9MLKFVRZatQLK63yFWhRW
EOF
)"
```

- [x] **Step 9: Real-device verification (do not skip — report back to the controlling session for this step, do not self-certify)** — user confirmed: app launched on the real iPhone.

This step needs the project owner's phone and their visual confirmation, same as the original plan's Task 5. Report status back to the controller instead of attempting this alone if you are a subagent without a way to interact with the user directly.

---

### Task 1: Add Expo modules to the existing bare project

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `babel.config.js`, `metro.config.js`
- Modify: `ios/Podfile`, `ios/Atlet/AppDelegate.swift`

- [x] **Step 1: Run the install command** — correctly detected SDK 56 for RN 0.85.3; confirmed the iOS deployment target bump to 16.4.

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx install-expo-modules@latest
```
Expected: the command completes and reports success. It will print which files it changed.

If it reports a React Native version mismatch or refuses to proceed (our project is on RN 0.87.1; the tool is documented as tested on 0.86), STOP and report BLOCKED with the exact message — don't force past a real compatibility warning.

- [x] **Step 2: Review what changed**

Run:
```bash
git status
git diff package.json babel.config.js metro.config.js ios/Podfile ios/Atlet/AppDelegate.swift
```
Expected: `expo` appears as a new dependency in `package.json`; `babel.config.js` now uses `babel-preset-expo`; `metro.config.js` now extends `expo/metro-config`; `ios/Podfile` has a new `use_expo_modules!` line; `AppDelegate.swift` has Expo-related changes.

- [x] **Step 3: Install CocoaPods dependencies for the new native setup**

Run (Homebrew Ruby must be on PATH — this repo needs it for every `pod install`, a known environment fact from the last plan):
```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
cd ios && bundle exec pod install
```
Expected: ends with "Pod installation complete!".

- [x] **Step 4: Verify the app still builds in the Simulator** — confirmed by user, also confirmed on the real iPhone.

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx react-native run-ios
```
Expected: builds and launches, still showing the same camera-permission fallback message as before (Simulator has no camera — this is correct, same as the last plan).

- [x] **Step 5: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Add Expo modules to the existing bare app

I used Expo's own install-expo-modules command to layer Expo tooling
onto the app, without deleting or regenerating the native folders.
The app still builds the same as before this change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y9MLKFVRZatQLK63yFWhRW
EOF
)"
```

---

### Task 2: Move config into app.json and re-verify on the real iPhone

**Files:**
- Create: `app.json`
- Modify: `ios/Atlet.xcodeproj/project.pbxproj` (via `npx expo prebuild`, applying `app.json`)

- [x] **Step 1: Find the vision-camera Expo plugin's real, current options** — found `src/expo-plugin/withVisionCamera.ts`; real option keys are `cameraPermissionText`, `enableMicrophonePermission`, `microphonePermissionText`, `enableLocation`, `locationPermissionText`, `enableFrameProcessors`, `enableCodeScanner`. Used only `cameraPermissionText`.

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
find node_modules/react-native-vision-camera -iname "*plugin*"
cat node_modules/react-native-vision-camera/app.plugin.js 2>/dev/null
cat node_modules/react-native-vision-camera/README.md | grep -A 30 -i "expo"
```
Read what these show about the plugin's actual current config keys (e.g. `cameraPermissionText`, `enableMicrophonePermission`). Use exactly what you find here — not a remembered or assumed schema — in Step 2. If the installed version has no plugin file at all (some older versions rely only on manually setting `ios.infoPlist` yourself, with no dedicated plugin), that's fine — skip adding it to `plugins` and rely on `ios.infoPlist` alone, per Step 2.

- [x] **Step 2: Create `app.json`**

Create `app.json` with this base shape — adjust the `plugins` array based on what Step 1 found (omit the `react-native-vision-camera` plugin entry entirely if Step 1 found no plugin file; otherwise add it with the real option keys you found, keeping our own permission string as the value):

```json
{
  "expo": {
    "name": "Atlet",
    "slug": "atlet",
    "ios": {
      "bundleIdentifier": "com.stsurjadi.atlet",
      "infoPlist": {
        "NSCameraUsageDescription": "Atlet uses the camera to track your shots live."
      }
    },
    "plugins": []
  }
}
```

- [x] **Step 3: Apply the config to the native project** — first attempt failed: `expo prebuild` requires `ios/Atlet/Supporting/Expo.plist` to already exist when adapting a bare project in place, but `install-expo-modules` never creates it. Created a minimal empty plist; prebuild then succeeded and filled it in.

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx expo prebuild --platform ios
```
Expected: completes without deleting the `ios/` folder wholesale (it should report which files it modified). If it asks an interactive question you're unsure how to answer, stop and report NEEDS_CONTEXT rather than guessing.

- [x] **Step 4: Check the bundle identifier and camera permission string survived**

Run:
```bash
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/Atlet.xcodeproj/project.pbxproj
grep -A 1 "NSCameraUsageDescription" ios/Atlet/Info.plist
```
Expected: bundle id is still `com.stsurjadi.atlet` in all build configs; the camera permission string is still present with our exact text.

- [x] **Step 5: Re-install pods and rebuild for the Simulator** — pod install first failed with `ArgumentError - unknown keyword: quirks_mode` (json 3.x / activesupport incompatibility on Ruby 3.4, hit inside expo-modules-autolinking's sandbox script). Fixed by pinning `gem 'json', '< 3'` in the Gemfile. Simulator build confirmed working after.

Run:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
cd ios && bundle exec pod install && cd .. && npx react-native run-ios
```
Expected: builds and launches, same fallback message as before.

- [x] **Step 6: Re-verify signing and run on the real iPhone** — DEVELOPMENT_TEAM survived prebuild, no manual Xcode step needed. Live camera feed confirmed working on the real iPhone.

`npx expo prebuild` may have reset the Xcode signing Team (the same thing happened once before during the original setup). Check first:
```bash
grep "DEVELOPMENT_TEAM" ios/Atlet.xcodeproj/project.pbxproj
```
If it's missing or empty, this is a **manual step for the user** — open `ios/Atlet.xcworkspace` in Xcode, select the `Atlet` target → Signing & Capabilities, and confirm "Steven Surjadi (Personal Team)" is still selected as the Team (re-select it if not). Report back to the user and wait for confirmation before continuing, rather than guessing the team is fine.

Once signing is confirmed, run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx react-native run-ios --device
```
Expected: installs and launches on the real iPhone, showing the same live camera feed as before this migration. This is the key regression check for this whole plan — if this doesn't work, the migration is not done, regardless of what else passed.

- [x] **Step 7: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Move app config into app.json

I moved the bundle id and camera permission text into one Expo
config file. I confirmed the live camera feed still works on a real
iPhone after this change, the same as before.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y9MLKFVRZatQLK63yFWhRW
EOF
)"
```

---

### Task 3: Verify tests, types, and lint still pass

**Files:**
- Modify: `jest.config.js` (only if needed — checked, not assumed)

- [x] **Step 1: Run the existing checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx jest
npx tsc --noEmit
npx eslint src App.tsx
```

- [x] **Step 2: If Jest fails to run (not just a failing test, but a config/transform error)** — not needed; Jest ran fine on the existing `react-native` preset.

This can happen because `install-expo-modules` switched `babel.config.js` to `babel-preset-expo`, and the existing `jest.config.js` may still assume the plain `react-native` Jest preset. If so, read `node_modules/jest-expo/jest-preset.js` exists first:
```bash
ls node_modules/jest-expo 2>&1
```
If `jest-expo` is already installed (it's commonly pulled in as a dependency of Expo tooling), update `jest.config.js`'s `preset` field from `"react-native"` to `"jest-expo"`, then re-run `npx jest`. If `jest-expo` is not installed and Jest still fails, report BLOCKED with the exact error rather than installing an unplanned new dependency on your own judgment.

- [x] **Step 3: Confirm all three checks are clean** — jest 2/2, tsc clean, eslint clean.

Expected: `npx jest` — 2/2 tests pass. `npx tsc --noEmit` — no errors. `npx eslint src App.tsx` — no errors.

- [x] **Step 4: Commit (only if Step 2 required a change; otherwise skip this commit)** — skipped, no jest.config.js change needed.

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add jest.config.js
git commit -m "$(cat <<'EOF'
Switch Jest to the jest-expo preset

The Babel config changed when Expo modules were added. The Jest
preset needed to match, so tests could still run.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Y9MLKFVRZatQLK63yFWhRW
EOF
)"
```

---

## Definition of Done

- `npx install-expo-modules@latest` has been applied; `expo` is a real dependency.
- `app.json` holds the bundle id and camera permission string (no longer only hand-edited in native files).
- `npx react-native run-ios` still builds cleanly in the Simulator.
- `npx react-native run-ios --device` still shows the live camera feed on the real iPhone — confirmed by the user, not just claimed by an agent.
- `npx jest`, `npx tsc --noEmit`, and `npx eslint src App.tsx` all pass with no errors.
- All work is committed to a feature branch and merged to `main` on `git@github.com:st-surjadi/atlet.git`, following the same review process as the last plan (spec compliance + code quality review per task, final whole-branch review before merge).
