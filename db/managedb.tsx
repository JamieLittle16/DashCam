import config from '@/config/config';
import { deleteFot, getOldFot, initialiseDatabase } from '@/db/database';
import { useEffect } from 'react';

const ManageDatabase = () => {
  useEffect(() => {
    const cleanUpDatabase = async () => {
      try {
          // Initialise the database
          await initialiseDatabase();

          // Get old footage entries based on the user configuration
          getOldFot(config.timeToLive, async (oldFootage: any[]): Promise<void> => {
            // Iterate over each old footage entry
            for (const footage of oldFootage) {
              // Delete the footage entry from the database
              await deleteFot(footage.ID);
            }
        });
    } catch(error){
      console.error("Error during database cleanup: ", error);
    }

    };

    cleanUpDatabase();
  }, []);

  return null;
};

export default ManageDatabase;
