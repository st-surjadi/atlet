import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type VideoFile,
} from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library/legacy';
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
  const shouldRecord = params.record === 'trackAndRecord';

  const navigation = useNavigation();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = React.useRef<Camera>(null);
  const isRecording = React.useRef(false);
  const stopResolveRef = React.useRef<((path: string | null) => void) | null>(
    null,
  );
  const [ending, setEnding] = React.useState(false);

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  const handleCameraReady = () => {
    if (shouldRecord && camera.current && !isRecording.current) {
      isRecording.current = true;
      camera.current.startRecording({
        onRecordingFinished: (video: VideoFile) => {
          isRecording.current = false;
          stopResolveRef.current?.(video.path);
          stopResolveRef.current = null;
        },
        onRecordingError: () => {
          isRecording.current = false;
          stopResolveRef.current?.(null);
          stopResolveRef.current = null;
        },
      });
    }
  };

  const stopRecordingIfNeeded = React.useCallback((): Promise<
    string | null
  > => {
    if (!shouldRecord || !isRecording.current || !camera.current) {
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      stopResolveRef.current = resolve;
      camera.current!.stopRecording();
    });
  }, [shouldRecord]);

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
          onPress: () => {
            // Don't wait for the recording to stop: the video is being
            // discarded either way, and awaiting here can let the native
            // screen finish removing itself (especially on a fast swipe
            // gesture) before this dispatch runs, desyncing JS navigation
            // state from what's already gone natively.
            if (shouldRecord && isRecording.current) {
              camera.current?.stopRecording();
            }
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, ending, shouldRecord]);

  const handleEndSession = async () => {
    setEnding(true);
    const videoPath = await stopRecordingIfNeeded();

    let hasVideo = false;
    if (videoPath) {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        try {
          await MediaLibrary.saveToLibraryAsync(videoPath);
          hasVideo = true;
        } catch {
          Alert.alert(
            'Could not save video',
            'The session was still saved to History.',
          );
        }
      } else {
        Alert.alert(
          'Could not save video',
          'Photo library permission was not granted. The session was still saved to History.',
        );
      }
    }

    await saveSessionRecord({ mode, targetCount, hasVideo });
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
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={shouldRecord}
        onInitialized={handleCameraReady}
      />
      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
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
  cancelButton: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  cancelButtonText: { color: 'white', fontSize: 16 },
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
