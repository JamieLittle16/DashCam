import { StyleSheet } from 'react-native';

import DualCamera from '@/components/CameraRecorder';
import { View } from '@/components/Themed';

export default function TabRecordScreen() {
  return (
    <View style={styles.container}>
      <DualCamera />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
