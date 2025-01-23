import { FontAwesome } from "@expo/vector-icons";
import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import config from "../config/config";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const VideoQuality = {
  '2160p': '2160p',
  '1080p': '1080p',
  '720p': '720p',
  '480p': '480p',
  '4:3': '4:3'
} as const;

export default function DualCamera() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(config.recordAudio);
  const [frontCamera, setFrontCamera] = useState<CameraView | null>(null);
  const [rearCamera, setRearCamera] = useState<CameraView | null>(null);
  const [frontCameraReady, setFrontCameraReady] = useState(false);
  const [rearCameraReady, setRearCameraReady] = useState(false);
  const [requestingPermissions, setRequestingPermissions] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.PORTRAIT_UP);
  const isLandscape = orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(event.orientationInfo.orientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    const handlePermissions = async () => {
      try {
        setRequestingPermissions(true);
        const cameraPerm = await requestCameraPermission();
        const micPerm = await requestMicrophonePermission();

        setHasPermissions(cameraPerm?.granted === true && micPerm?.granted === true);
      } catch (error) {
        Alert.alert('Permission Error', 'Failed to request permissions');
        console.error('Permission error:', error);
      } finally {
        setRequestingPermissions(false);
      }
    };
    handlePermissions();
  }, []);

  useEffect(() => {
    if (frontCameraReady && rearCameraReady) {
        console.log('Both cameras ready');
        setCameraReady(true);
    }
  }, [frontCameraReady, rearCameraReady]);

  const onFrontCameraReady = (camera: CameraView) => {
    console.log('Front camera ready');
    setFrontCamera(camera);
    setFrontCameraReady(true);
  };

  const onRearCameraReady = (camera: CameraView) => {
    console.log('Rear camera ready');
    setRearCamera(camera);
    setRearCameraReady(true);
  };

  const checkStorageSpace = async () => {
    try {
      const freeMB = (await FileSystem.getFreeDiskStorageAsync()) / (1024 * 1024);
      return freeMB > 500; // Require at least 500MB free space
    } catch (error) {
      console.error('Storage check error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    console.log('Attempting to start recording...');
    console.log('Camera ready states:', {
        frontCamera: frontCameraReady,
        rearCamera: rearCameraReady
    });

    if (!frontCameraReady || !rearCameraReady) {
        const notReadyCameras = [];
        if (!frontCameraReady) notReadyCameras.push('Front');
        if (!rearCameraReady) notReadyCameras.push('Rear');

        const errorMessage = `${notReadyCameras.join(' and ')} camera${notReadyCameras.length > 1 ? 's are' : ' is'} not ready`;
        console.log(errorMessage);
        Alert.alert('Error', errorMessage);
        return;
    }

    const hasSpace = await checkStorageSpace();
    if (!hasSpace) {
        Alert.alert('Storage Error', 'Not enough storage space available');
        return;
    }

    try {
        setIsRecording(true);

        // Get temporary file paths for recordings
        const timestamp = Date.now();
        const frontFileName = `front_video_${timestamp}.mp4`;
        const rearFileName = `rear_video_${timestamp}.mp4`;
        const frontTempPath = `${FileSystem.cacheDirectory}${frontFileName}`;
        const rearTempPath = `${FileSystem.cacheDirectory}${rearFileName}`;

        console.log('Starting recording to temporary paths:', {
            frontPath: frontTempPath,
            rearPath: rearTempPath
        });

        // Start recording on both cameras
        if (frontCamera && rearCamera) {
            await Promise.all([
                frontCamera.startRecordingAsync({
                    outputPath: frontTempPath,
                    quality: '720p',
                    mute: !isAudioEnabled
                }),
                rearCamera.startRecordingAsync({
                    outputPath: rearTempPath,
                    quality: '720p',
                    mute: !isAudioEnabled
                })
            ]);
        }

        console.log('Recording started on both cameras');
    } catch (error) {
        console.error('Recording error:', error);
        Alert.alert('Recording Error', 'Failed to start recording');
        setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!frontCameraReady || !rearCameraReady) {
        const notReadyCameras = [];
        if (!frontCameraReady) notReadyCameras.push('Front');
        if (!rearCameraReady) notReadyCameras.push('Rear');

        const errorMessage = `Cannot stop recording: ${notReadyCameras.join(' and ')} camera${notReadyCameras.length > 1 ? 's are' : ' is'} not ready`;
        Alert.alert('Error', errorMessage);
        return;
    }

    try {
        // Stop recording on both cameras
        if (frontCamera && rearCamera) {
            const [frontResult, rearResult] = await Promise.all([
                frontCamera.stopRecording(),
                rearCamera.stopRecording()
            ]);

            // Generate final file paths
            const timestamp = Date.now();
            const frontFileName = `front_video_${timestamp}.mp4`;
            const rearFileName = `rear_video_${timestamp}.mp4`;
            const frontDest = `${FileSystem.documentDirectory}${frontFileName}`;
            const rearDest = `${FileSystem.documentDirectory}${rearFileName}`;

            console.log('Moving recordings to permanent storage:', {
                frontSource: frontResult.uri,
                frontDest,
                rearSource: rearResult.uri,
                rearDest,
                documentDirectory: FileSystem.documentDirectory
            });

            // Move files to permanent storage
            await Promise.all([
                FileSystem.moveAsync({
                    from: frontResult.uri,
                    to: frontDest
                }),
                FileSystem.moveAsync({
                    from: rearResult.uri,
                    to: rearDest
                })
            ]);

            console.log('Videos saved successfully:', {
                frontFile: frontFileName,
                rearFile: rearFileName
            });
        }

        setIsRecording(false);
    } catch (error) {
        console.error('Stop recording error:', error);
        Alert.alert('Recording Error', 'Failed to stop recording');
    }
  };

  const toggleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
      const newValue = !prev;
      config.recordAudio = newValue;
      return newValue;
    });
  };

  const checkStoragePath = () => {
      console.log('Storage paths:', {
          documentDirectory: FileSystem.documentDirectory,
          cacheDirectory: FileSystem.cacheDirectory
      });
  };

  // Call it in useEffect to see the path when component mounts
  useEffect(() => {
      checkStoragePath();
  }, []);

  if (!hasPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>
          {requestingPermissions
            ? "Requesting Permissions..."
            : "We need camera and microphone permissions"}
        </Text>
        {!requestingPermissions && (
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              setRequestingPermissions(true);
              const cameraPerm = await requestCameraPermission();
              const micPerm = await requestMicrophonePermission();
              setHasPermissions(cameraPerm?.granted === true && micPerm?.granted === true);
              setRequestingPermissions(false);
            }}
          >
            <Text style={styles.text}>Grant Permissions</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }


  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={[
          styles.camera,
          isLandscape ? styles.landscapeCamera : styles.portraitCamera,
          {
            width: isLandscape ? screenHeight : screenWidth,
            height: isLandscape ? screenWidth : screenHeight,
          }
        ]}
        facing={config.enableFrontCamera ? 'front' : 'back'}
        onCameraReady={() => {
            console.log('Front camera ready');
            setFrontCameraReady(true);
        }}
        onMountError={(error) => {
            console.error('Front camera mount error:', error);
            Alert.alert('Camera Error', 'Front camera failed to initialize');
        }}
        mode="video"
        mute={!isAudioEnabled}
        videoQuality="720p"
        active={true}
      >
        <View style={{flex: 1}} />
      </CameraView>

      <CameraView
        style={{ ...styles.camera, opacity: 0, zIndex: -1 }}
        facing={config.enableRearCamera ? 'back' : 'front'}
        onCameraReady={() => {
            console.log('Rear camera ready');
            setRearCameraReady(true);
        }}
        onMountError={(error) => {
            console.error('Rear camera mount error:', error);
            Alert.alert('Camera Error', 'Rear camera failed to initialize');
        }}
        mode="video"
        mute={!isAudioEnabled}
        videoQuality="720p"
        active={true}
      >
        <View style={{flex: 1}} />
      </CameraView>

      <SafeAreaView style={[styles.overlay, isLandscape ? styles.landscapeOverlay : styles.portraitOverlay]}>
        <View style={[styles.bottomBar, isLandscape ? styles.landscapeBottomBar : styles.portraitBottomBar]}>
          <TouchableOpacity
            style={styles.audioToggle}
            onPress={toggleAudio}
          >
            <FontAwesome
              name="microphone"
              size={40}
              color="white"
              style={isLandscape ? { transform: [{ rotate: '90deg' }] } : {}}
            />
            {!isAudioEnabled && (
              <View style={styles.disabledLine} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording ? styles.recording : null,
            ]}
            onPress={toggleRecord}
          />

          <TouchableOpacity
            style={styles.audioToggle}
            onPress={() => router.push('/')}
          >
            <FontAwesome
              name="home"
              size={40}
              color="white"
              style={isLandscape ? { transform: [{ rotate: '90deg' }] } : {}}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  camera: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  landscapeCamera: {
    transform: [{ rotate: '90deg' }, { translateX: (screenWidth - screenHeight) / 2 }, { translateY: (screenHeight - screenWidth) / 2 }],
    width: screenHeight,
    height: screenWidth,
  },
  portraitCamera: {
    transform: [{ rotate: '0deg' }],
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  landscapeOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  portraitOverlay: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 5,
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: "center",
    zIndex: 1,
  },
  landscapeBottomBar: {
    flexDirection: 'column',
    left: 5,
    right: 5,
    bottom: 20,
    top: 20,
  },
  portraitBottomBar: {
    flexDirection: 'row',
    left: 20,
    right: 20,
    bottom: 5,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
  },
  recording: {
    backgroundColor: "darkred",
    borderRadius: 15,
    transform: [{ scale: 0.9 }],
  },
  audioToggle: {
    position: 'relative',
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'red',
    transform: [{ rotate: '45deg' }],
  },
  button: {
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
