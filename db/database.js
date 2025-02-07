import * as SQLite from 'expo-sqlite';

let dbPromise = null; // Store the promise for database initialization

/*
 * Returns a promise of the database object,
 * Creates a new db if one does not exist
 */
const initialiseDatabase = () => {
  if (dbPromise) {
    return dbPromise; // Return existing promise if available
  }

  dbPromise = new Promise(async (resolve, reject) => {
    try {
      const db = await SQLite.openDatabaseAsync('DashCamDb');
      await createTable(db);
      await insertSampleData(db);
      resolve(db); // Resolve with the database instance
    } catch (error) {
      console.error("Failed to open database:", error);
      reject(error); // Reject if there was an error
    }
  });
  return dbPromise;
};

/*
 * Function creates 'footage' table if it does not exist already.
 */
 const createTable = async (database) => {
   if (!database) {
     console.error("Database not initialised");
     return;
   }
   // Execute SQL command to create the 'footage' table if it does not exist
   await database.execAsync(
     "CREATE TABLE IF NOT EXISTS footage (" +
       "ID INTEGER PRIMARY KEY AUTOINCREMENT, " + // Unique ID for each entry
       "FrontFotPath TEXT, " + // Path to the front footage file
       "BackFotPath TEXT, " + // Path to the back footage file
       "date TEXT, " + // Date of the footage
       "Flag BOOLEAN DEFAULT 0" + // Flag to indicate if the footage is saved by the user
     ");"
   );
 };

 /*
  * Inserts sample data into the footage table
  */
 const insertSampleData = async (database) => {
   if (!database) {
     console.error("Database not initialized");
     return;
   }

   // Check if there is existing data in the table before inserting
   const count = await database.getAsync("SELECT COUNT(*) as count FROM footage");
   if (count && count.count > 0) {
     console.log('Sample data already exists.');
     return; // Skip inserting if data already exists
   }

   // Define sample data to be inserted into the footage table
   const sampleData = [
     {
       frontFotPath: '/path/to/front1.mp4',
       backFotPath: '/path/to/back1.mp4',
       date: new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(), // 2 days ago
       flag: false
     },
     {
       frontFotPath: '/path/to/front2.mp4',
       backFotPath: '/path/to/back2.mp4',
       date: new Date().toISOString(), // Current date
       flag: true
     },
     {
       frontFotPath: '/path/to/front3.mp4',
       backFotPath: '/path/to/back3.mp4',
       date: new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString(), // 1 day ago
       flag: false
     }
   ];

   // Loop through the sample data and insert each entry into the database
   for (const data of sampleData) {
     await database.runAsync(
       'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',
       [data.frontFotPath, data.backFotPath, data.date, data.flag ? 1 : 0] // Convert boolean flag to integer
     );
   }
 };

 /*
  * Function to fetch footage records older than a specified number of days
  * where the 'Flag' is false (indicating footage isn't saved by user).
  * @param {number} days - The number of days to use as the threshold for fetching old footage.
  * @returns {Promise<Array>} - A promise that resolves to an array of footage records older than the specified number of days with Flag set to false.
  */
 const getOldFot = async (days) => {
   try {
     const database = await initialiseDatabase(); // Get the database instance
     const currentDate = new Date(); // Get the current date
     const thresholdDate = new Date(currentDate);

     // Calculate the threshold date
     thresholdDate.setDate(currentDate.getDate() - days);
     const thresholdDateString = thresholdDate.toISOString();

     // Fetch footage records older than the threshold date where Flag is false
     const result = await database.allAsync(
       `SELECT * FROM footage WHERE date < ? AND Flag = ?;`,
       [thresholdDateString, 0]
     );
     return result; // Return the fetched records

   } catch (error) { // Log the error if fetching fails
     console.error("Error getting old footage", error);
     throw error;
   }
 };

 /*
  * Deletes entry from footage table by ID (Asynchronous)
  * @param {number} Id - The ID of the footage entry to delete.
  * @returns {Promise<void>} - A promise that resolves when the footage entry is deleted.
  */
 const deleteFot = async (Id) => {
   try {
     const database = await initialiseDatabase(); // Get the database instance
     return database.runAsync('delete from footage where id = ?', [Id]); // Remove the entry with the specified ID
   } catch(error) {
     console.error("Error deleting footage: ", error); // Log the error if deletion fails
     throw error;
   }
 };

/*
 * Inserts new row into footage table (Asynchronous)
 * @param {string} frontFotPath - Path to the front footage file
 * @param {string} backFotPath - Path to the back footage file
 * @param {string} date - Date of the footage
 * @param {boolean} flag - Flag to indicate if the footage is saved by the user
 */
const insertFot = async (frontFotPath, backFotPath, date, flag) => {
  try {
    // Get the database instance
    const database = await initialiseDatabase();
    return database.runAsync(  // Asynchronously execute the SQL command
      // SQL command to insert a new row into the 'footage' table with placeholders
      'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',
      [frontFotPath, backFotPath, date, flag] // Values to replace placehiolders
    );
  } catch(error) { // Throws an error if insertion fails
    console.error("Error inserting footage:", error);
    throw error;
  }
};

/*
 * Toggles the 'Flag' value for a specific footage entry by ID (Asynchronous)
 * @param {number} Id - ID of the footage entry to toggle the flag for
 * @returns {boolean} - Returns true if the flag was successfully toggled, false otherwise
 */
 const toggleFlag = async (Id) => {
  try {
    // Get the database instance
    const database = await initialiseDatabase();

    // Execute the SQL command to toggle the 'Flag' value
    // If 'Flag' is 0, set it to 1; if 'Flag' is 1, set it to 0
    await database.runAsync('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?', [Id]);

    // Return true indicating the flag was successfully toggled
    return true;
  } catch (error) {
    // Log the error if the operation fails
    console.error('Error toggling flag:', error);

    // Return false indicating the flag toggle operation failed
    return false;
  }
};

/* Helper function for testing to clear the cached dbPromise */
export const _resetDbPromise = () => {
  dbPromise = null;
};

// Export functions for use in other parts of the app
export { initialiseDatabase, insertFot, getOldFot, deleteFot, toggleFlag };
