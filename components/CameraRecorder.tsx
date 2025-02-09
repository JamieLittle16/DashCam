import { Button, NativeModules, View } from 'react-native';

const { DualCameraModule } = NativeModules;

export default function DualCamera() {
  // When the user presses the button, we call our native module method.
  // Our native module will launch the DualCameraActivity.
  const launchNativeDualCamera = () => {
    if (DualCameraModule && DualCameraModule.launchDualCameraActivity) {
      DualCameraModule.launchDualCameraActivity();
    } else {
      console.warn('DualCameraModule is not available.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Launch Dual Camera" onPress={launchNativeDualCamera} />
    </View>
  );
}
