import { hasUsableCameraDevice } from '../hasUsableCameraDevice';
import type { CameraDevice } from 'react-native-vision-camera';

describe('hasUsableCameraDevice', () => {
  it('returns false when no device is found', () => {
    expect(hasUsableCameraDevice(undefined)).toBe(false);
  });

  it('returns true when a device is found', () => {
    const fakeDevice = { id: 'back-camera' } as CameraDevice;
    expect(hasUsableCameraDevice(fakeDevice)).toBe(true);
  });
});
