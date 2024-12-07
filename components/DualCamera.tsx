import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function DualCamera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </SafeAreaView>
    );
  }

  function toggleCameraFacing() {
    // This function toggles the camera's facing direction between 'back' and 'front'
    setFacing(current => (current === 'back' ? 'front' : 'back')); 
     // The `setFacing` function updates the state based on the current value.
  }

  return (
    <View style={styles.container}>  {/* Main container view with styling applied. */}
      <StatusBar style="light" /> {/* Sets the status bar style to 'light', for visibility */}
      <CameraView
        style={styles.camera}
        facing={facing}
      >
        {/* CameraView component displays the live camera feed. */}
        <SafeAreaView style={styles.overlay}> { /* Ensures UI respects Screen notches */}
          <View style={styles.buttonContainer}> {/* Container for the button to flip the camera. */}
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}> {/* Flips camera when pressed */}
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  button: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    marginBottom: 30,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});