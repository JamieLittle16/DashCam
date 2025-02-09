import config from "@/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    useColorScheme,
} from "react-native";

const SettingsModal = () => {
  const [settings, setSettings] = useState(config);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("settings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        updateConfig(parsedSettings); // Apply loaded settings to config
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const saveSettings = async (newSettings: typeof config) => {
    try {
      await AsyncStorage.setItem("settings", JSON.stringify(newSettings));
      setSettings(newSettings);
      updateConfig(newSettings); // Apply saved settings to config
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  const updateConfig = (newSettings: typeof config) => {
    // Update config with the new settings
    (Object.keys(newSettings) as Array<keyof typeof config>).forEach((key) => {
      (config as any)[key] = newSettings[key];
    });
  };


  const handleToggle = (key: keyof typeof config) => (value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleInputChange = (key: keyof typeof config) => (value: string | number) => {
    let parsedValue: any = value;
    if (typeof config[key] === 'number') {
      parsedValue = Number(value);
      if (isNaN(parsedValue)) {
        // Don't update if the input is not a valid number.
        return;
      }
    }

    const newSettings = { ...settings, [key]: parsedValue };
    saveSettings(newSettings);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    text: {
      color: isDarkMode ? "#fff" : "#000",
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#555" : "#ccc",
      padding: 8,
      width: 100,
      color: isDarkMode ? "#fff" : "#000",
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
    picker: {
      height: 50,
      width: 100,
      color: isDarkMode ? "#fff" : "#000",
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <Text style={styles.text}>Record Audio</Text>
        <Switch
          value={settings.recordAudio}
          onValueChange={handleToggle("recordAudio")}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}>Display Speed</Text>
        <Switch
          value={settings.displaySpeed}
          onValueChange={handleToggle("displaySpeed")}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}>Recording Duration (ms) </Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(settings.recordingDuration)}
          onChangeText={handleInputChange("recordingDuration")}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}>Enable Front Camera</Text>
        <Switch
          value={settings.enableFrontCamera}
          onValueChange={handleToggle("enableFrontCamera")}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}>Enable Rear Camera</Text>
        <Switch
          value={settings.enableRearCamera}
          onValueChange={handleToggle("enableRearCamera")}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}>Time to Preserve Recordings (Days)</Text>
        <Picker
          selectedValue={settings.timeToLive}
          style={styles.picker}
          onValueChange={handleInputChange("timeToLive")}
        >
          {[...Array(60).keys()].map((day) => (
            <Picker.Item key={day} label={`${day + 1}`} value={day + 1} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default SettingsModal;
