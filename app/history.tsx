import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
