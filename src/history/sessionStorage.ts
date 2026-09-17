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
