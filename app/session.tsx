import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
