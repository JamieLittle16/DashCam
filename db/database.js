import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import * as SQLite from 'expo-sqlite';

/*
 * Returns the database object,
 * Creates a new db if one does not exist
 */
const db = SQLite.openDatabaseAsync(
    'DashCamDb', // Database name
  ).then((db) => {
      createTable();
      return db;
    }).catch(error => {
      console.error("Failed to open database:", error);
      return null;
    });

/*
 * Function creates 'footage' table if it does not exist already.
 */
const createTable = async () => {
    const database = await db;
    if (!database) {
        console.error("Database not initialized");
        return;
    }
    await database.execAsync( // SQL query to create table
            "CREATE TABLE IF NOT EXISTS footage (" +
            "ID INTEGER PRIMARY KEY AUTOINCREMENT, " + // Unique identifier for each entry, auto-incremented
            "FrontFotPath TEXT, " + // File path for the front footage (as a string)
            "BackFotPath TEXT, " + // File path for the back footage (as a string)
            "date TEXT, " + // Date of the footage (as an ISO 8601 string)
            "Flag BOOLEAN DEFAULT 0" + // A flag to indicate whether user has saved footage (true/false)
        ");"
        );
};

/*
 * Function to fetch footage records older than a specified number of days
 * where the 'Flag' is false (indicating footage isn't saved by user).
 */
const getOldFot = async (days, successCallback) => {
    const currentDate = new Date(); // Create a new Date object representing the current date and time.
    const thresholdDate = new Date(currentDate);  // Create a new Date object for the threshold date (current date minus 'days').
    thresholdDate.setDate(currentDate.getDate() - days); // Subtract 'days' from the current date to get the threshold date.

    const thresholdDateString = thresholdDate.toISOString(); // Convert to string for SQL query
    const database = await db;
    if (!database) {
        console.error("Database not initialized");
        return;
    }
    database.allAsync(
          `SELECT * FROM footage WHERE date < ? AND Flag = ?;`, // SQL query with placeholders
          [thresholdDateString, false], // Replace placeholders with the threshold date and false for Flag
        ).then((_array) => {
           successCallback(_array);
           // Success callback, on success passes the retrieved rows (as an array) to the callback function.
          }).catch((error) => {
             console.error('Error fetching old footage:', error); // Error callback (logs error to console)
             return false; // Return false to indicate query failure
          });
  };

/*
 * Deletes entry from footage table by ID (Asynchronous)
 */
const deleteFot = async (Id) => {
    const database = await db;
    if (!database) {
        return Promise.reject("Database not initialized");
    }
    return database.runAsync('delete from footage where id = ?', [Id]);
   };

/*
 * Inserts new row into footage table (Asynchronous)
 */
const insertFot = async (frontFotPath, backFotPath, date, flag) => {
    const database = await db;
     if (!database) {
        return Promise.reject("Database not initialized");
    }
     return database.runAsync(
        'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',
        [frontFotPath, backFotPath, date, flag]
      );
};

// Export functions for use in other parts of the app
export { createTable, insertFot, getOldFot, deleteFot };
