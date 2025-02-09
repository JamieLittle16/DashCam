import DualCamera from '@/components/CameraRecorder';
import { View } from '@/components/Themed';
import { StyleSheet } from 'react-native';

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
  },
});
