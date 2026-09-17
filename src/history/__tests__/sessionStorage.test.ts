import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteSessionRecord,
  getSessionRecords,
  saveSessionRecord,
} from '../sessionStorage';

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

  it('removes a record by id', async () => {
    const first = await saveSessionRecord(
      { mode: 'free', hasVideo: false },
      new Date('2026-09-16T09:00:00'),
    );
    const second = await saveSessionRecord(
      { mode: 'target', targetCount: 10, hasVideo: true },
      new Date('2026-09-16T10:00:00'),
    );

    await deleteSessionRecord(first.id);

    const records = await getSessionRecords();
    expect(records).toEqual([second]);
  });
});
