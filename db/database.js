<<<<<<< HEAD
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import * as SQLite from 'expo-sqlite' // Imports SQL


/* 
 * Returns the database object,
 * Creates a new db if one does not exist 
 */
const db = SQLite.openDatabase(
    {
        name: 'DashCamDb', // Database name
        location: "default", // Default storage location
    },
    () => { }, // Success callback (no action taken)
    error => { console.error(error); } // Error callback (logs error to console)
);

/*
 * Function creates 'footage' table if it does not exist already.
 */
const createTable = () => {
    db.transaction((tx) => {
        tx.executeSql( // SQL query to create table
            "CREATE TABLE IF NOT EXISTS footage (" + 
            "ID INTEGER PRIMARY KEY AUTOINCREMENT, " + // Unique identifier for each entry, auto-incremented
            "FrontFotPath TEXT, " + // File path for the front footage (as a string)
            "BackFotPath TEXT, " + // File path for the back footage (as a string)
            "date TEXT, " + // Date of the footage (as an ISO 8601 string)
            "Flag BOOLEAN DEFAULT 0" + // A flag to indicate whether user has saved footage (true/false)
        ");"
        );
    });
};

/* 
 * Function to fetch footage records older than a specified number of days
 * where the 'Flag' is false (indicating footage isn't saved by user).
 */
const getOldFot = (days, successCallback) => {
    const currentDate = new Date(); // Create a new Date object representing the current date and time.
    const thresholdDate = new Date(currentDate);  // Create a new Date object for the threshold date (current date minus 'days').
    thresholdDate.setDate(currentDate.getDate() - days); // Subtract 'days' from the current date to get the threshold date.
  
    const thresholdDateString = thresholdDate.toISOString(); // Convert to string for SQL query
  
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM footage WHERE date < ? AND Flag = ?;`, // SQL query with placeholders
          [thresholdDateString, false], // Replace placeholders with the threshold date and false for Flag
          (_, { rows: { _array } }) => {
            successCallback(_array);
            // Success callback, on success passes the retrieved rows (as an array) to the callback function.
          },
          (_, error) => {
            console.error('Error fetching old footage:', error); // Error callback (logs error to console)
            return false; // Return false to indicate query failure
          }
        );
      }
    );
  };


/* 
 * Deletes entry from footage table by ID (Asynchronous)
 */
const deleteFot = async (Id) => {
    return new Promise((resolve, reject) => { // Returns a promise which will be resolved after deletion
        // Use of a promise allows for the function to be used asynchronously
      db.transaction(
        tx => { // Execute the SQL query to delete the footage entry with the given 'id'.
          tx.executeSql('delete from footage where id = ?', // SQL query to delete row with matching ID
            [Id]); // Replaces placeholder in query with ID
        },
        // If an error occurs during the transaction, the promise is rejected
        reject,

        // If the transaction is successful, the promise is resolved
        resolve
      );
    });
   };

/*
 * Inserts new row into footage table (Asynchronous)
 */
const insertFot = async (frontFotPath, backFotPath, date, flag) => {
    return new Promise((resolve, reject) => { // Returns a promise which will be resolved after deletion
        // Use of a promise allows for the function to be used asynchronously
      db.transaction(
        (tx) => {
            // Executes a SQL query to insert values into the footage table
          tx.executeSql(
            'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',  
            // SQL statement with placeholders for dynamic values
            [frontFotPath, backFotPath, date, flag], // Values to replace the placeholders

            (_, result) => { // Callback for a successful query execution
              resolve(result); // Resolve promise with the result
            },

            (_, error) => { // Callback for query execution failure
              console.error('Error inserting footage:', error);
              reject(error); // Reject promise with the error
            }
          );
        }
      );
    });
};

// Export functions for use in other parts of the app
=======
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import * as SQLite from 'expo-sqlite' // Imports SQL


/* 
 * Returns the database object,
 * Creates a new db if one does not exist 
 */
const db = SQLite.openDatabase(
    {
        name: 'DashCamDb', // Database name
        location: "default", // Default storage location
    },
    () => { }, // Success callback (no action taken)
    error => { console.error(error); } // Error callback (logs error to console)
);

/*
 * Function creates 'footage' table if it does not exist already.
 */
const createTable = () => {
    db.transaction((tx) => {
        tx.executeSql( // SQL query to create table
            "CREATE TABLE IF NOT EXISTS footage (" + 
            "ID INTEGER PRIMARY KEY AUTOINCREMENT, " + // Unique identifier for each entry, auto-incremented
            "FrontFotPath TEXT, " + // File path for the front footage (as a string)
            "BackFotPath TEXT, " + // File path for the back footage (as a string)
            "date TEXT, " + // Date of the footage (as an ISO 8601 string)
            "Flag BOOLEAN DEFAULT 0" + // A flag to indicate whether user has saved footage (true/false)
        ");"
        );
    });
};

/* 
 * Function to fetch footage records older than a specified number of days
 * where the 'Flag' is false (indicating footage isn't saved by user).
 */
const getOldFot = (days, successCallback) => {
    const currentDate = new Date(); // Create a new Date object representing the current date and time.
    const thresholdDate = new Date(currentDate);  // Create a new Date object for the threshold date (current date minus 'days').
    thresholdDate.setDate(currentDate.getDate() - days); // Subtract 'days' from the current date to get the threshold date.
  
    const thresholdDateString = thresholdDate.toISOString(); // Convert to string for SQL query
  
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM footage WHERE date < ? AND Flag = ?;`, // SQL query with placeholders
          [thresholdDateString, false], // Replace placeholders with the threshold date and false for Flag
          (_, { rows: { _array } }) => {
            successCallback(_array);
            // Success callback, on success passes the retrieved rows (as an array) to the callback function.
          },
          (_, error) => {
            console.error('Error fetching old footage:', error); // Error callback (logs error to console)
            return false; // Return false to indicate query failure
          }
        );
      }
    );
  };


/* 
 * Deletes entry from footage table by ID (Asynchronous)
 */
const deleteFot = async (Id) => {
    return new Promise((resolve, reject) => { // Returns a promise which will be resolved after deletion
        // Use of a promise allows for the function to be used asynchronously
      db.transaction(
        tx => { // Execute the SQL query to delete the footage entry with the given 'id'.
          tx.executeSql('delete from footage where id = ?', // SQL query to delete row with matching ID
            [Id]); // Replaces placeholder in query with ID
        },
        // If an error occurs during the transaction, the promise is rejected
        reject,

        // If the transaction is successful, the promise is resolved
        resolve
      );
    });
   };

/*
 * Inserts new row into footage table (Asynchronous)
 */
const insertFot = async (frontFotPath, backFotPath, date, flag) => {
    return new Promise((resolve, reject) => { // Returns a promise which will be resolved after deletion
        // Use of a promise allows for the function to be used asynchronously
      db.transaction(
        (tx) => {
            // Executes a SQL query to insert values into the footage table
          tx.executeSql(
            'INSERT INTO footage (FrontFotPath, BackFotPath, date, Flag) VALUES (?, ?, ?, ?);',  
            // SQL statement with placeholders for dynamic values
            [frontFotPath, backFotPath, date, flag], // Values to replace the placeholders

            (_, result) => { // Callback for a successful query execution
              resolve(result); // Resolve promise with the result
            },

            (_, error) => { // Callback for query execution failure
              console.error('Error inserting footage:', error);
              reject(error); // Reject promise with the error
            }
          );
        }
      );
    });
};

// Export functions for use in other parts of the app
>>>>>>> origin/experimental
export { createTable, insertFot, getOldFot, deleteFot };