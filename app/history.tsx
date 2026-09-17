import React from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
