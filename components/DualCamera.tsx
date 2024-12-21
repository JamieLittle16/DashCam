import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function DualCamera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false); // State to handle permission request feedback

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button 
          onPress={async () => {
            setRequesting(true); // Set requesting to true when button is pressed
            await requestPermission();
            setRequesting(false); // Reset requesting after permission is requested
          }} 
          title={requesting ? "Requesting..." : "Grant Permission"} // Change button text based on state
        />
      </SafeAreaView>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={styles.camera}
        facing={facing}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
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
    marginBottom: 90,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
