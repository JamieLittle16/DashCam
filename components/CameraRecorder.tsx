import { FontAwesome } from "@expo/vector-icons";
import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions
} from "expo-camera";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import config from "../config/config";

export default function DualCamera() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(config.recordAudio);
  const [frontCameraReady, setFrontCameraReady] = useState(false);
  const [rearCameraReady, setRearCameraReady] = useState(false);
  const [requestingPermissions, setRequestingPermissions] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    const handlePermissions = async () => {
      try {
        setRequestingPermissions(true);
        const cameraPerm = await requestCameraPermission();
        const micPerm = await requestMicrophonePermission();
        setHasPermissions(cameraPerm?.granted === true && micPerm?.granted === true);
      } catch (error) {
        Alert.alert("Permission Error", "Failed to request permissions");
        console.error("Permission error:", error);
      } finally {
        setRequestingPermissions(false);
      }
    };
    handlePermissions();
  }, []);

  const checkStorageSpace = async () => {
    try {
      const freeMB = (await FileSystem.getFreeDiskStorageAsync()) / (1024 * 1024);
      return freeMB > 500;
    } catch (error) {
      console.error("Storage check error:", error);
      return false;
    }
  };

  const startRecording = async () => {
    console.log("startRecording: NOT IMPLEMENTED");
  };

  const stopRecording = async () => {
    console.log("stopRecording: NOT IMPLEMENTED");
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

  const renderCameraView = () => {
    return (
      <CameraView
        style={[
          styles.camera,
          isLandscape ? styles.cameraLandscape : null
        ]}
        facing={config.enableFrontCamera ? "front" : "back"}
        onCameraReady={() => {
          console.log("Front camera ready");
          setFrontCameraReady(true);
        }}
        onMountError={error => {
          console.error("Front camera mount error:", error);
          Alert.alert("Camera Error", "Front camera failed to initialise");
        }}
        mode="video"
        mute={!isAudioEnabled}
        videoQuality="720p"
        active={true}
      >
        <View style={{ flex: 1 }} />
      </CameraView>
    );
  };

  if (!hasPermissions) {
    return (
      <SafeAreaView style={[styles.container, { width, height }]}>
        <Text style={styles.message}>
          {requestingPermissions ? "Requesting Permissions..." : "We need camera and microphone permissions"}
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
    <View style={[styles.container, { width, height }]}>
      <StatusBar style="light" />
      {renderCameraView()}

      {/* Hidden rear CameraView for simultaneous recording */}
      <CameraView
        style={[styles.hiddenCamera]}
        facing={config.enableRearCamera ? "back" : "front"}
        onCameraReady={() => {
          console.log("Rear camera ready");
          setRearCameraReady(true);
        }}
        onMountError={error => {
          console.error("Rear camera mount error:", error);
          Alert.alert("Camera Error", "Front camera failed to initialise");
        }}
        mode="video"
        mute={!isAudioEnabled}
        videoQuality="720p"
        active={true}
      >
        <View style={{ flex: 1 }} />
      </CameraView>

      {/* Overlay controls */}
      <SafeAreaView style={[styles.overlay, { width, height }]}>
        {isLandscape ? (
          <View style={styles.landscapeControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleAudio}>
              <FontAwesome
                name="microphone"
                size={40}
                color="white"
              />
              {!isAudioEnabled && <View style={styles.disabledLine} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.recordButton, isRecording && styles.recording]} onPress={toggleRecord} />
            <TouchableOpacity style={styles.controlButton} onPress={() => router.push("/")}>
              <FontAwesome
                name="home"
                size={40}
                color="white"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.portraitControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleAudio}>
              <FontAwesome name="microphone" size={40} color="white" />
              {!isAudioEnabled && <View style={styles.disabledLine} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.recordButton, isRecording && styles.recording]} onPress={toggleRecord} />
            <TouchableOpacity style={styles.controlButton} onPress={() => router.push("/")}>
              <FontAwesome name="home" size={40} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
  },
  message: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    margin: 10,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  text: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
  },
  hiddenCamera: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    zIndex: -1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  portraitControls: {
    position: "absolute",
    bottom: -30,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  landscapeControls: {
    position: "absolute",
    top: 20,
    bottom: 20,
    right: 20,
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
  },
  recording: {
    backgroundColor: "darkred",
    transform: [{ scale: 0.95 }],
  },
  disabledLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "red",
    transform: [{ rotate: "45deg" }],
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  cameraLandscape: {
    width: '100%',
    height: '100%'
  },
});
