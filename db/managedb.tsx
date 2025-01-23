import config from '@/config/config';
import { createTable, deleteFot, getOldFot } from '@/db/database';
import { useEffect } from 'react';

const ManageDatabase = () => {
  useEffect(() => {
    // Function to handle database cleanup
    const cleanUpDatabase = async () => {
      // Create the database table if it doesn't exist
      createTable();
      // Get old footage entries based on the user configuration
      getOldFot(config.timeToLive, async (oldFootage: any[]): Promise<void> => {
        // Iterate over each old footage entry
        for (const footage of oldFootage) {
          // Delete the footage entry from the database
          await deleteFot(footage.ID);
        }
      });
    };
    // Execute the cleanup database function
    cleanUpDatabase();
  }, []);

  return null;
};

export default ManageDatabase;
