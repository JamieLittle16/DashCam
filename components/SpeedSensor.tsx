import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const SpeedTracker = () => {
  const [speed, setSpeed] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { remove: any; };

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0.1,
          timeInterval: 2000,
        },
        (location) => {
          if (location.coords.speed) {
            setSpeed(location.coords.speed);
          }
        }
      );
    };

    if (isTracking) {
      startTracking();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking]);

  const toggleTracking = () => {
    setIsTracking((prev) => !prev);
  };

  const speedInMph = speed ? (speed * 2.23694).toFixed(2) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.speedContainer}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Text style={styles.speedText}>
              {speedInMph} mph
            </Text>
          </View>
        </View>
      </View>
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      <Button title={isTracking ? "Stop Tracking" : "Start Tracking"} onPress={toggleTracking} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedContainer: {
    marginBottom: 20,
  },
  outerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75, // Half of width/height for a perfect circle
    borderWidth: 35,
    borderColor: '#bd002d',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  innerCircle: {
    width: 115,
    height: 115,
    borderRadius: 70, // Half of width/height for a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  speedText: {
    fontSize: 24,
    color: 'black',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
});

export default SpeedTracker;
