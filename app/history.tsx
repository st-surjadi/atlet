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
