import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
