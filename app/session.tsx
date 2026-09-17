import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { hasUsableCameraDevice } from '../src/camera/hasUsableCameraDevice';
import { saveSessionRecord } from '../src/history/sessionStorage';

export default function SessionScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    mode?: string;
    record?: string;
    targetCount?: string;
  }>();
  const mode = params.mode === 'target' ? 'target' : 'free';
  const targetCount = params.targetCount
    ? Number(params.targetCount)
    : undefined;

  const navigation = useNavigation();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [ending, setEnding] = React.useState(false);

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (ending) {
        return;
      }
      event.preventDefault();
      Alert.alert('Discard this session?', undefined, [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, ending]);

  const handleEndSession = async () => {
    setEnding(true);
    await saveSessionRecord({ mode, targetCount, hasVideo: false });
    router.replace('/history');
  };

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
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {mode === 'target' ? `Target: ${targetCount}` : 'Free Shooting'}
        </Text>
        <Text style={styles.headerSubtext}>Shot tracking coming soon</Text>
      </View>
      <Pressable
        style={styles.endButton}
        onPress={handleEndSession}
        disabled={ending}>
        <Text style={styles.buttonText}>
          {ending ? 'Saving…' : 'End Session'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'black',
  },
  text: { color: 'white', textAlign: 'center' },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerSubtext: { color: '#aaa', fontSize: 14, marginTop: 4 },
  endButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#e5484d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
