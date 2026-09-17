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
