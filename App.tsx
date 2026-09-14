import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { CameraPreviewScreen } from './src/screens/CameraPreviewScreen';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <CameraPreviewScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default App;
