import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { hasUsableCameraDevice } from '../camera/hasUsableCameraDevice';

export function CameraPreviewScreen(): React.JSX.Element {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

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
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});
