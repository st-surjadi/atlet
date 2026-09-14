import type { CameraDevice } from 'react-native-vision-camera';

export function hasUsableCameraDevice(
  device: CameraDevice | undefined,
): device is CameraDevice {
  return device !== undefined;
}
