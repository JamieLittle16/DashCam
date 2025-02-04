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
  await database.execAsync(
    "CREATE TABLE IF NOT EXISTS footage (" +
      "ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "FrontFotPath TEXT, " +
      "BackFotPath TEXT, " +
      "date TEXT, " +
      "Flag BOOLEAN DEFAULT 0" +
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

  const sampleData = [
    {
      frontFotPath: '/path/to/front1.mp4',
      backFotPath: '/path/to/back1.mp4',
      date: new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      flag: false
    },
    {
      frontFotPath: '/path/to/front2.mp4',
      backFotPath: '/path/to/back2.mp4',
      date: new Date().toISOString(),
      flag: true
    },
    {
      frontFotPath: '/path/to/front3.mp4',
      backFotPath: '/path/to/back3.mp4',
      date: new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
      flag: false
    }
  ];

  // Loop through the sample data and insert each entry into the database
  for (const data of sampleData) {
    await database.runAsync(
      'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',
      [data.frontFotPath, data.backFotPath, data.date, data.flag ? 1 : 0]
    );
  }
};

/*
 * Function to fetch footage records older than a specified number of days
 * where the 'Flag' is false (indicating footage isn't saved by user).
 */
const getOldFot = async (days) => {
  try {
    const database = await initialiseDatabase();
    const currentDate = new Date();
    const thresholdDate = new Date(currentDate);
    thresholdDate.setDate(currentDate.getDate() - days);
    const thresholdDateString = thresholdDate.toISOString();
    const result = await database.allAsync(
      `SELECT * FROM footage WHERE date < ? AND Flag = ?;`,
      [thresholdDateString, 0]
    );
    return result;
  } catch (error) {
    console.error("Error getting old footage", error);
    throw error;
  }
};

/*
 * Deletes entry from footage table by ID (Asynchronous)
 */
const deleteFot = async (Id) => {
  try {
    const database = await initialiseDatabase();
    return database.runAsync('delete from footage where id = ?', [Id]);
  } catch(error) {
    console.error("Error deleting footage: ", error);
    throw error;
  }
};

/*
 * Inserts new row into footage table (Asynchronous)
 */
const insertFot = async (frontFotPath, backFotPath, date, flag) => {
  try {
    const database = await initialiseDatabase();
    return database.runAsync(
      'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',
      [frontFotPath, backFotPath, date, flag]
    );
  } catch(error) {
    console.error("Error inserting footage:", error);
    throw error;
  }
};

const toggleFlag = async (Id) => {
  try {
    const database = await initialiseDatabase();
    await database.runAsync('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?', [Id]);
    return true;
  } catch (error) {
    console.error('Error toggling flag:', error);
    return false;
  }
};

/* Helper function for testing to clear the cached dbPromise */
export const _resetDbPromise = () => {
  dbPromise = null;
};

// Export functions for use in other parts of the app
export { initialiseDatabase, insertFot, getOldFot, deleteFot, toggleFlag };
