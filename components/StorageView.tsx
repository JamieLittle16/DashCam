import { deleteFot, initialiseDatabase, toggleFlag } from '@/db/database';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface FootageItem {
  ID: number;
  FrontFotPath: string;
  BackFotPath: string;
  date: string;
  Flag: boolean;
}

const StorageView: React.FC = () => {
    const [footageList, setFootageList] = useState<FootageItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load footage data on component mount and when changes occur
  useEffect(() => {
    const loadFootage = async () => {
      setLoading(true);
      try{
        const database = await initialiseDatabase(); // Initialize database
        if (!database) {
             console.error("Database not initialized");
             return;
         }
         database.allAsync(
          `SELECT * FROM footage;`, // SQL query
        ).then((_array: any) => {
          setFootageList(_array); // Update the state variable with retrieved rows
        }).catch((error: any) => {
           console.error('Error fetching footage:', error); // Error callback (logs error to console)
           Alert.alert('Error', 'Failed to load footage.');
        });

      }catch(error){
        console.error('Error initializing database or loading footage:', error);
        Alert.alert('Error', 'Failed to initialize database or load footage.');
      } finally {
        setLoading(false);
      }
  };

    loadFootage();
  }, [footageList]); // Fetch footage data when this component mounts


    const handleFlagToggle = async (id: number) => {
        try {
            const success = await toggleFlag(id);
            if (success) {
                // Optimistically update the UI
                setFootageList(prevList =>
                  prevList.map(item =>
                    item.ID === id ? { ...item, Flag: !item.Flag } : item
                  )
                );
              } else{
                Alert.alert('Error', 'Failed to toggle flag.');
              }
         } catch (error) {
             console.error('Failed to toggle flag:', error);
             Alert.alert('Error', 'Failed to toggle flag.');
         }
     };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await deleteFot(id);
             // Optimistically update the UI
                setFootageList(prevList => prevList.filter(item => item.ID !== id));
              Alert.alert('Success', 'Recording deleted successfully.');
            } catch (error) {
              console.error('Error deleting footage:', error);
               Alert.alert('Error', 'Failed to delete recording.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading recordings...</Text>
      </View>
    );
  }
  if (!footageList || footageList.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No recordings available.</Text>
      </View>
    );
  }

    return (
        <View style={styles.container}>
           <ScrollView>
                {footageList.map((item) => (
                  <View key={item.ID} style={styles.listItem}>
                  <Text style={styles.dateText}>
                       {new Date(item.date).toLocaleString()}
                      </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={() => handleFlagToggle(item.ID)} >
                         <MaterialIcons
                            name={item.Flag ? 'bookmark' : 'bookmark-border'}
                            size={24}
                            color={item.Flag ? 'orange' : 'black'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.ID)} >
                            <MaterialIcons name="delete" size={24} color="red" />
                        </TouchableOpacity>
                    </View>
                </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
    buttonContainer: {
        flexDirection: 'row',
      },
    dateText: {
        fontSize: 14,
        marginRight: 10,
      },
});

export default StorageView;
