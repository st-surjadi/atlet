# Atlet Session Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Home, Setup, Session, and History screens described in `docs/superpowers/specs/2026-09-16-atlet-session-flow-design.md`, on top of the existing camera preview, with real video recording for Track & Record mode and a local session history.

**Architecture:** Add `expo-router` for file-based navigation, replacing the single-screen `App.tsx`/`index.js` entry point. Session records persist to `AsyncStorage` through a small storage module. The existing camera permission/device logic moves from `CameraPreviewScreen` into the new Session screen.

**Tech Stack:** `expo-router`, `react-native-screens`, `expo-linking` (navigation); `@react-native-async-storage/async-storage` (history); `expo-media-library` (saving video to Photos); existing `react-native-vision-camera` for recording.

---

## Why the tasks are ordered this way

Task 1 does the entry-point migration to `expo-router` and lands a full skeleton of all four routes at once (Home is real; Setup, Session, History are minimal stubs). This is deliberate: it isolates the one genuinely risky part of this plan — re-registering the app's root component, the same area where a real bug was found and fixed just before this plan was written (`index.js` had to match `withModuleName` in `AppDelegate.swift` and `getMainComponentName` in `MainActivity.kt`). Building the full route skeleton up front, instead of adding routes one at a time, also avoids expo-router's typed-routes feature complaining about links to routes that don't exist yet.

Each later task replaces one stub with real content. Track Only sessions are fully working end-to-end after Task 5. Task 6 adds Track & Record video recording on top of that already-working flow.

## File Structure

- `app/_layout.tsx` — new. Root Stack navigator.
- `app/index.tsx` — new. Home screen (real, from Task 1).
- `app/setup.tsx` — new. Stub in Task 1, real in Task 3.
- `app/session.tsx` — new. Stub in Task 1, real (Track Only) in Task 5, adds recording in Task 6.
- `app/history.tsx` — new. Stub in Task 1, real in Task 4.
- `src/history/sessionStorage.ts` — new. AsyncStorage-backed read/write for session records.
- `src/history/__tests__/sessionStorage.test.ts` — new.
- `jest.setup.js` — new. Wires up the official AsyncStorage jest mock.
- `jest.config.js` — modified. Adds `setupFiles`.
- `index.js`, `App.tsx` — deleted. Replaced by `expo-router/entry` and `app/_layout.tsx`.
- `src/screens/CameraPreviewScreen.tsx` — deleted in Task 5. Its permission/device logic moves into `app/session.tsx`.
- `package.json` — modified. Adds `"main": "expo-router/entry"` and new dependencies.
- `app.json` — modified. Adds `"scheme"` (Task 1) and `NSPhotoLibraryAddUsageDescription` (Task 6).

---

### Task 1: Migrate to expo-router with a full route skeleton

**Files:**
- Create: `app/_layout.tsx`, `app/index.tsx`, `app/setup.tsx`, `app/session.tsx`, `app/history.tsx`
- Delete: `index.js`, `App.tsx`
- Modify: `package.json`, `app.json`

- [ ] **Step 1: Install expo-router and its dependencies**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx expo install expo-router react-native-screens expo-linking
```
Expected: completes without error; `package.json` now lists `expo-router`, `react-native-screens`, and `expo-linking` under `dependencies`, at versions `npx expo install` picked for Expo SDK 56.

- [ ] **Step 2: Set the app entry point to expo-router**

In `package.json`, add a `"main"` field (there isn't one currently). Add it right after `"private": true,`:

```json
  "main": "expo-router/entry",
```

- [ ] **Step 3: Add a URL scheme to app.json**

expo-router needs a scheme for its internal linking, even without deep links from outside the app. Add `"scheme": "atlet"` to `app.json`, right after `"slug": "atlet",`:

```json
{
  "expo": {
    "name": "Atlet",
    "slug": "atlet",
    "scheme": "atlet",
    "ios": {
```

- [ ] **Step 4: Create the root layout**

Create `app/_layout.tsx`:

```tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 5: Create the real Home screen**

Create `app/index.tsx`:

```tsx
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Atlet</Text>
      <Pressable style={styles.button} onPress={() => router.push('/setup')}>
        <Text style={styles.buttonText}>Start Session</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/history')}>
        <Text style={styles.buttonText}>History</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

- [ ] **Step 6: Create stub Setup, Session, and History screens**

Create `app/setup.tsx`:

```tsx
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SetupScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>Setup</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/session')}>
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: { color: 'white', fontSize: 24 },
  button: {
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
```

Create `app/session.tsx`:

```tsx
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SessionScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>Session</Text>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>End Session</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: { color: 'white', fontSize: 24 },
  button: {
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
```

Create `app/history.tsx`:

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function HistoryScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.text}>History</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: 'white', fontSize: 24 },
});
```

- [ ] **Step 7: Delete the old entry point**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && rm index.js App.tsx
```

- [ ] **Step 8: Reinstall pods**

Run:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet/ios && bundle exec pod install
```
Expected: ends with "Pod installation complete!". If it fails with `ArgumentError - unknown keyword: quirks_mode`, that's the known `json` gem 3.x incompatibility fixed previously (Gemfile already pins `json < 3` — check `Gemfile` still has that line before investigating further).

- [ ] **Step 9: Run the existing checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all three pass clean. (`eslint .` now covers the new `app/` directory, replacing the old `eslint src App.tsx` invocation used before `App.tsx` existed.)

- [ ] **Step 10: Verify the Simulator build — regression check for the registration bug**

Report back to the controlling session for this step; do not self-certify. Ask the user to run:
```bash
npx expo run:ios
```
Expected: the app launches cleanly showing the Home screen ("Atlet" title, two buttons). If "has not been registered" reappears, stop and re-check `package.json`'s `"main"` field and that `app/_layout.tsx` exists — don't guess further without re-reading the exact error.

- [ ] **Step 11: Verify the real device build**

Report back to the controlling session for this step; do not self-certify. Ask the user to run:
```bash
npx expo run:ios --device
```
Expected: same as Step 10, on the real iPhone.

- [ ] **Step 12: Verify basic navigation**

Ask the user to tap through: Home → "Start Session" → Setup stub → "Start" → Session stub → "End Session" (back to Home) → "History" → History stub → back to Home.
Expected: all navigation works, no crashes.

- [ ] **Step 13: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Migrate to expo-router with a full route skeleton

Added expo-router, react-native-screens, and expo-linking. The app's
entry point is now expo-router/entry instead of the old index.js. All
four routes exist now (Home is real; Setup, Session, and History are
stubs) to avoid expo-router's typed routes complaining about links to
routes that don't exist yet, and to get the regression-critical
re-verification (this touches the same spot where an app-registration
bug was fixed just before this plan) done once, up front.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Session history storage module

**Files:**
- Create: `src/history/sessionStorage.ts`
- Test: `src/history/__tests__/sessionStorage.test.ts`
- Create: `jest.setup.js`
- Modify: `jest.config.js`

- [ ] **Step 1: Install AsyncStorage**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 2: Wire up the official AsyncStorage jest mock**

Create `jest.setup.js`:

```js
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
```

Modify `jest.config.js` to this:

```js
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
};
```

- [ ] **Step 3: Write the failing test**

Create `src/history/__tests__/sessionStorage.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionRecords, saveSessionRecord } from '../sessionStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('sessionStorage', () => {
  it('returns an empty array when nothing has been saved', async () => {
    expect(await getSessionRecords()).toEqual([]);
  });

  it('saves a record with a generated date and time', async () => {
    const now = new Date('2026-09-16T14:32:00');
    const record = await saveSessionRecord(
      { mode: 'target', targetCount: 25, hasVideo: false },
      now,
    );

    expect(record).toMatchObject({
      date: '2026-09-16',
      time: '14:32',
      mode: 'target',
      targetCount: 25,
      hasVideo: false,
    });
    expect(record.id).toEqual(expect.any(String));
  });

  it('adds new records to the front of the list', async () => {
    await saveSessionRecord(
      { mode: 'free', hasVideo: false },
      new Date('2026-09-16T09:00:00'),
    );
    await saveSessionRecord(
      { mode: 'target', targetCount: 10, hasVideo: true },
      new Date('2026-09-16T10:00:00'),
    );

    const records = await getSessionRecords();
    expect(records).toHaveLength(2);
    expect(records[0].time).toBe('10:00');
    expect(records[1].time).toBe('09:00');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/history`
Expected: FAIL with "Cannot find module '../sessionStorage'".

- [ ] **Step 5: Implement the storage module**

Create `src/history/sessionStorage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'atlet.sessionRecords';

export type SessionRecord = {
  id: string;
  date: string;
  time: string;
  mode: 'target' | 'free';
  targetCount?: number;
  hasVideo: boolean;
};

type NewSessionRecord = {
  mode: 'target' | 'free';
  targetCount?: number;
  hasVideo: boolean;
};

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getSessionRecords(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as SessionRecord[];
}

export async function saveSessionRecord(
  record: NewSessionRecord,
  now: Date = new Date(),
): Promise<SessionRecord> {
  const records = await getSessionRecords();
  const newRecord: SessionRecord = {
    id: generateId(),
    date: formatDate(now),
    time: formatTime(now),
    ...record,
  };
  records.unshift(newRecord);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/history`
Expected: PASS, 3/3 tests.

- [ ] **Step 7: Run the full check suite**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean (now 5/5 tests total, across both test files).

- [ ] **Step 8: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Add session history storage module

AsyncStorage-backed read/write for session records (date, time, mode,
target count, whether video was saved). Wired up the official
AsyncStorage jest mock so this is unit-testable without a device.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Real Setup screen

**Files:**
- Modify: `app/setup.tsx`

- [ ] **Step 1: Replace the stub with the real Setup screen**

Replace all of `app/setup.tsx` with:

```tsx
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const TARGET_PRESETS = [10, 25, 50, 100] as const;

type Mode = 'target' | 'free';
type RecordChoice = 'trackOnly' | 'trackAndRecord';

export default function SetupScreen(): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [targetCount, setTargetCount] = React.useState<number | null>(null);
  const [record, setRecord] = React.useState<RecordChoice | null>(null);

  const canStart =
    record !== null &&
    (mode === 'free' || (mode === 'target' && targetCount !== null));

  const handleStart = () => {
    if (!canStart || mode === null || record === null) {
      return;
    }
    router.push({
      pathname: '/session',
      params: {
        mode,
        record,
        ...(mode === 'target' && targetCount !== null
          ? { targetCount: String(targetCount) }
          : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.sectionTitle}>Mode</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.choice, mode === 'target' && styles.choiceSelected]}
          onPress={() => setMode('target')}>
          <Text style={styles.choiceText}>Target</Text>
        </Pressable>
        <Pressable
          style={[styles.choice, mode === 'free' && styles.choiceSelected]}
          onPress={() => {
            setMode('free');
            setTargetCount(null);
          }}>
          <Text style={styles.choiceText}>Free Shooting</Text>
        </Pressable>
      </View>

      {mode === 'target' && (
        <>
          <Text style={styles.sectionTitle}>Shot Count</Text>
          <View style={styles.row}>
            {TARGET_PRESETS.map(count => (
              <Pressable
                key={count}
                style={[
                  styles.choice,
                  targetCount === count && styles.choiceSelected,
                ]}
                onPress={() => setTargetCount(count)}>
                <Text style={styles.choiceText}>{count}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Recording</Text>
      <View style={styles.row}>
        <Pressable
          style={[
            styles.choice,
            record === 'trackOnly' && styles.choiceSelected,
          ]}
          onPress={() => setRecord('trackOnly')}>
          <Text style={styles.choiceText}>Track Only</Text>
        </Pressable>
        <Pressable
          style={[
            styles.choice,
            record === 'trackAndRecord' && styles.choiceSelected,
          ]}
          onPress={() => setRecord('trackAndRecord')}>
          <Text style={styles.choiceText}>Track & Record</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        disabled={!canStart}
        onPress={handleStart}>
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black', padding: 24 },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  choice: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  choiceSelected: { borderColor: '#1f6feb', backgroundColor: '#1f6feb33' },
  choiceText: { color: 'white', fontSize: 16 },
  startButton: {
    marginTop: 40,
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: { backgroundColor: '#333' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
```

- [ ] **Step 2: Run the checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean.

- [ ] **Step 3: Verify on the Simulator**

Report back to the controlling session; do not self-certify. Ask the user to run `npx expo run:ios` and check: Setup screen shows Mode, Shot Count (only after picking Target), and Recording choices; Start is disabled until a valid combination is picked; tapping Start navigates to the Session stub.

- [ ] **Step 4: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Build the real Setup screen

Mode (Target/Free Shooting), shot count presets (10/25/50/100, shown
only for Target), and recording choice (Track Only/Track & Record).
Start is disabled until a valid combination is picked, then navigates
to Session with the choices as route params.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Real History screen

**Files:**
- Modify: `app/history.tsx`

- [ ] **Step 1: Replace the stub with the real History screen**

Replace all of `app/history.tsx` with:

```tsx
import React from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
} from 'react-native';
import {
  getSessionRecords,
  type SessionRecord,
} from '../src/history/sessionStorage';

export default function HistoryScreen(): React.JSX.Element {
  const [records, setRecords] = React.useState<SessionRecord[]>([]);

  React.useEffect(() => {
    getSessionRecords().then(setRecords);
  }, []);

  const openPhotos = () => {
    Linking.openURL('photos-redirect://').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={records}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No sessions yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={openPhotos}
            disabled={!item.hasVideo}>
            <Text style={styles.cell}>{item.date}</Text>
            <Text style={styles.cell}>{item.time}</Text>
            <Text style={styles.cell}>
              {item.mode === 'target' ? `Target ${item.targetCount}` : 'Free'}
            </Text>
            <Text style={styles.cell}>—</Text>
            <Text style={styles.cell}>—</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black' },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    gap: 8,
  },
  cell: { color: 'white', flex: 1, fontSize: 14 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});
```

- [ ] **Step 2: Run the checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean.

- [ ] **Step 3: Verify on the Simulator**

Report back to the controlling session; do not self-certify. Since no sessions exist yet, ask the user to confirm the History screen shows "No sessions yet." without crashing.

- [ ] **Step 4: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Build the real History screen

Lists saved session records newest first: date, time, mode, and a
placeholder tally (no shot-tracking engine yet). Rows with a saved
video are tappable and open the Photos app.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Real Session screen (Track Only)

This makes the Track Only flow fully work end-to-end: camera preview, End Session saves a history record, and backing out asks to discard. Track & Record video capture is added in Task 6.

**Files:**
- Modify: `app/session.tsx`
- Delete: `src/screens/CameraPreviewScreen.tsx`

- [ ] **Step 1: Replace the stub with the real Session screen**

Replace all of `app/session.tsx` with:

```tsx
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { hasUsableCameraDevice } from '../src/camera/hasUsableCameraDevice';
import { saveSessionRecord } from '../src/history/sessionStorage';

export default function SessionScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    mode?: string;
    record?: string;
    targetCount?: string;
  }>();
  const mode = params.mode === 'target' ? 'target' : 'free';
  const targetCount = params.targetCount
    ? Number(params.targetCount)
    : undefined;

  const navigation = useNavigation();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [ending, setEnding] = React.useState(false);

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (ending) {
        return;
      }
      event.preventDefault();
      Alert.alert('Discard this session?', undefined, [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, ending]);

  const handleEndSession = async () => {
    setEnding(true);
    await saveSessionRecord({ mode, targetCount, hasVideo: false });
    router.replace('/history');
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Atlet needs camera access to track your shots.
        </Text>
      </View>
    );
  }

  if (!hasUsableCameraDevice(device)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No back camera found on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {mode === 'target' ? `Target: ${targetCount}` : 'Free Shooting'}
        </Text>
        <Text style={styles.headerSubtext}>Shot tracking coming soon</Text>
      </View>
      <Pressable
        style={styles.endButton}
        onPress={handleEndSession}
        disabled={ending}>
        <Text style={styles.buttonText}>
          {ending ? 'Saving…' : 'End Session'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'black',
  },
  text: { color: 'white', textAlign: 'center' },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerSubtext: { color: '#aaa', fontSize: 14, marginTop: 4 },
  endButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#e5484d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
```

- [ ] **Step 2: Delete the now-unused CameraPreviewScreen**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && rm src/screens/CameraPreviewScreen.tsx
rmdir src/screens 2>/dev/null || true
```

- [ ] **Step 3: Run the checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean.

- [ ] **Step 4: Verify the full Track Only flow on the real device**

Report back to the controlling session; do not self-certify. Ask the user to run `npx expo run:ios --device` and walk through: Home → Start Session → Setup (pick Free Shooting, Track Only) → Start → Session shows the live camera feed and "Free Shooting" header → End Session → lands on History with one new row (today's date/time, "Free", placeholder tally). Then repeat starting a session and backing out without ending — confirm the "Discard this session?" prompt appears, and confirm no new History row was created after discarding.

- [ ] **Step 5: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Build the real Session screen for Track Only mode

Camera preview logic moved here from the now-deleted
CameraPreviewScreen. End Session saves a history record (placeholder
tally, since the shot-tracking engine doesn't exist yet) and
navigates to History. Leaving without ending prompts to discard.

Track & Record video capture is not implemented yet (next task) —
picking it right now behaves the same as Track Only.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Track & Record video capture

**Files:**
- Modify: `app/session.tsx`
- Modify: `app.json`

- [ ] **Step 1: Install expo-media-library**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet && npx expo install expo-media-library
```

- [ ] **Step 2: Add the photo library permission string**

In `app.json`, add `NSPhotoLibraryAddUsageDescription` to `ios.infoPlist`, alongside the existing camera permission:

```json
      "infoPlist": {
        "NSCameraUsageDescription": "Atlet uses the camera to track your shots live.",
        "NSPhotoLibraryAddUsageDescription": "Atlet saves your session recordings to your Photos."
      }
```

- [ ] **Step 3: Add recording to the Session screen**

Replace all of `app/session.tsx` with:

```tsx
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type VideoFile,
} from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import { hasUsableCameraDevice } from '../src/camera/hasUsableCameraDevice';
import { saveSessionRecord } from '../src/history/sessionStorage';

export default function SessionScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    mode?: string;
    record?: string;
    targetCount?: string;
  }>();
  const mode = params.mode === 'target' ? 'target' : 'free';
  const targetCount = params.targetCount
    ? Number(params.targetCount)
    : undefined;
  const shouldRecord = params.record === 'trackAndRecord';

  const navigation = useNavigation();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = React.useRef<Camera>(null);
  const isRecording = React.useRef(false);
  const stopResolveRef = React.useRef<((path: string | null) => void) | null>(
    null,
  );
  const [ending, setEnding] = React.useState(false);

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  const handleCameraReady = () => {
    if (shouldRecord && camera.current && !isRecording.current) {
      isRecording.current = true;
      camera.current.startRecording({
        onRecordingFinished: (video: VideoFile) => {
          isRecording.current = false;
          stopResolveRef.current?.(video.path);
          stopResolveRef.current = null;
        },
        onRecordingError: () => {
          isRecording.current = false;
          stopResolveRef.current?.(null);
          stopResolveRef.current = null;
        },
      });
    }
  };

  const stopRecordingIfNeeded = React.useCallback((): Promise<
    string | null
  > => {
    if (!shouldRecord || !isRecording.current || !camera.current) {
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      stopResolveRef.current = resolve;
      camera.current!.stopRecording();
    });
  }, [shouldRecord]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (ending) {
        return;
      }
      event.preventDefault();
      Alert.alert('Discard this session?', undefined, [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            stopRecordingIfNeeded().then(() => {
              navigation.dispatch(event.data.action);
            });
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, ending, stopRecordingIfNeeded]);

  const handleEndSession = async () => {
    setEnding(true);
    const videoPath = await stopRecordingIfNeeded();

    let hasVideo = false;
    if (videoPath) {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        try {
          await MediaLibrary.saveToLibraryAsync(videoPath);
          hasVideo = true;
        } catch {
          Alert.alert(
            'Could not save video',
            'The session was still saved to History.',
          );
        }
      } else {
        Alert.alert(
          'Could not save video',
          'Photo library permission was not granted. The session was still saved to History.',
        );
      }
    }

    await saveSessionRecord({ mode, targetCount, hasVideo });
    router.replace('/history');
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Atlet needs camera access to track your shots.
        </Text>
      </View>
    );
  }

  if (!hasUsableCameraDevice(device)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No back camera found on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={shouldRecord}
        onInitialized={handleCameraReady}
      />
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {mode === 'target' ? `Target: ${targetCount}` : 'Free Shooting'}
        </Text>
        <Text style={styles.headerSubtext}>Shot tracking coming soon</Text>
      </View>
      <Pressable
        style={styles.endButton}
        onPress={handleEndSession}
        disabled={ending}>
        <Text style={styles.buttonText}>
          {ending ? 'Saving…' : 'End Session'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'black',
  },
  text: { color: 'white', textAlign: 'center' },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerSubtext: { color: '#aaa', fontSize: 14, marginTop: 4 },
  endButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#e5484d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
```

- [ ] **Step 4: Reinstall pods**

Run:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet/ios && bundle exec pod install
```
Expected: ends with "Pod installation complete!".

- [ ] **Step 5: Run the checks**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean.

- [ ] **Step 6: Verify Track & Record on the real device**

Report back to the controlling session; do not self-certify. Video recording needs a real camera, so this cannot be checked on the Simulator. Ask the user to run `npx expo run:ios --device` and: Home → Start Session → Setup (pick either mode, Track & Record) → Start → confirm the camera preview appears (recording starts silently, no visible indicator by design) → End Session → confirm a "Save to Photos" or similar permission prompt appears the first time → confirm the video appears in the Photos app → confirm History shows the new row and tapping it opens Photos.

- [ ] **Step 7: Verify the discard path stops recording**

Ask the user to start a Track & Record session, then back out and confirm "Discard." Expected: no crash, no new video appears in Photos, no new History row.

- [ ] **Step 8: Commit**

```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
git add -A
git commit -m "$(cat <<'EOF'
Add Track & Record video capture

Recording starts once the camera initializes and stops on End
Session (or on discard, without saving). Video-only, no audio.
Saved to the Photos library via expo-media-library, using add-only
permission (NSPhotoLibraryAddUsageDescription) — no read access is
requested. A failed video save still keeps the session's tally data;
only the video itself is dropped.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Final whole-flow review

- [ ] **Step 1: Run the full check suite one more time**

Run:
```bash
cd /Users/stevenseansurjadi/Documents/Code/Personal/Project/atlet
npx tsc --noEmit
npx eslint .
npx jest
```
Expected: all pass clean.

- [ ] **Step 2: Walk the whole flow once more, end to end**

Report back to the controlling session; do not self-certify. Ask the user to run `npx expo run:ios --device` and go through, in order: Home → History (empty or existing state) → back to Home → Start Session → Setup with Target mode + a preset count + Track Only → Session → End Session → History shows the new row → Start Session again with Free Shooting + Track & Record → Session → End Session → confirm video in Photos and the new History row → tap that row → confirm Photos opens.

- [ ] **Step 3: Use the finishing-a-development-branch skill**

This plan's work should be reviewed and merged the same way the Expo migration plan was: verify tests, then present merge/PR/keep/discard options, per `superpowers:finishing-a-development-branch`.
