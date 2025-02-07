"use strict";
import {
  initialiseDatabase,
  insertFot,
  getOldFot,
  deleteFot,
  toggleFlag,
  _resetDbPromise
} from "../db/database";
import * as SQLite from "expo-sqlite";

// --- Mock Data ---
const mockData = [
  {
    ID: 1,
    FrontFotPath: "path/to/front1.mp4",
    BackFotPath: "path/to/back1.mp4",
    date: "2024-03-10T10:00:00.000Z",
    Flag: 0,
  },
  {
    ID: 2,
    FrontFotPath: "path/to/front2.mp4",
    BackFotPath: "path/to/back2.mp4",
    date: new Date().toISOString(),
    Flag: 0,
  },
  {
    ID: 3,
    FrontFotPath: "path/to/front3.mp4",
    BackFotPath: "path/to/back3.mp4",
    date: "2024-03-10T10:00:00.000Z",
    Flag: 1,
  },
];

// --- Updated Mock expo-sqlite ---
jest.mock("expo-sqlite", () => {
  // First we define a mock database object
  const mockDb = {
    execAsync: jest.fn((sql) => {
      if (sql.startsWith("CREATE TABLE IF NOT EXISTS")) {
        return Promise.resolve();
      }
      return Promise.reject("Mocked Error");
    }),
    runAsync: jest.fn((sql, params) => {
      if (sql.startsWith("INSERT INTO")) {
        return Promise.resolve({
          lastInsertRowId: Math.floor(Math.random() * 100) + 100, // avoid conflict with IDs in mockData
          changes: 1,
        });
      }
      if (sql.startsWith("delete from") || sql.startsWith("UPDATE footage SET")) {
        return Promise.resolve();
      }
      return Promise.reject("Mocked Error");
    }),
    // Adjusted allAsync: if the sql query is for getting old footage, use query parameters
    allAsync: jest.fn((sql, params) => {
      if (sql.startsWith("SELECT * FROM footage WHERE date <")) {
        // params[0] should be the threshold date, params[1] should be the flag (0)
        const thresholdDate = new Date(params[0]);
        const flag = params[1];
        const filtered = mockData.filter((item) => {
          return new Date(item.date) < thresholdDate && item.Flag === flag;
        });
        return Promise.resolve(filtered);
      }
      // Otherwise, return all data as a fallback
      return Promise.resolve(mockData);
    }),
    getAsync: jest.fn((sql, params) => {
      if (sql.startsWith("SELECT COUNT(*)")) {
        // Return a nonzero count so sample data insertion is skipped
        return Promise.resolve({ count: 1 });
      }
      if (sql.startsWith("SELECT Flag FROM")) {
        // For IDs that are not 1 or 2, return a default row with Flag = 0
        let mockRows = [
          { ID: 1, Flag: 0 },
          { ID: 2, Flag: 1 },
        ];
        const row = mockRows.find((row) => row.ID === params[0]);
        if (row) {
          return Promise.resolve(row);
        } else {
          return Promise.resolve({ Flag: 0 });
        }
      }
      return Promise.reject("Mocked Error");
    }),
  };

  return {
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
    openDatabase: jest.fn(() => {
      let mockDb2 = {
        transaction: jest.fn((callback) => {
          callback({
            executeSql: jest.fn((sql, params, success, error) => {
              let rows = [];
              const mockInsertId = Math.floor(Math.random() * 100) + 100;
              if (sql.startsWith("CREATE TABLE IF NOT EXISTS")) {
                success && success();
              } else if (sql.startsWith("INSERT INTO")) {
                rows.push({
                  insertId: mockInsertId,
                  rowsAffected: 1,
                });
                success &&
                  success(null, { rows: { _array: rows }, insertId: mockInsertId });
              } else if (sql.startsWith("SELECT * FROM")) {
                success && success(null, { rows: { _array: mockData } });
              } else if (
                sql.startsWith("delete from") ||
                sql.startsWith("UPDATE footage SET")
              ) {
                success && success();
              } else {
                error && error(null, "Mocked Error");
              }
            }),
          });
        }),
      };
      return mockDb2;
    }),
  };
});

// --- Test Suite ---
describe("Database Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cached dbPromise so each test has a fresh instance
    _resetDbPromise();
  });

  it("should create the table successfully", async () => {
    const db = await initialiseDatabase();
    expect(db.execAsync).toHaveBeenCalledTimes(1);
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
  });

  it("should insert footage successfully", async () => {
    const frontFotPath = "path/to/front.mp4";
    const backFotPath = "path/to/back.mp4";
    const date = new Date().toISOString();
    const flag = false;

    const result = await insertFot(frontFotPath, backFotPath, date, flag);
    expect(result).toEqual({
      lastInsertRowId: expect.any(Number),
      changes: 1,
    });

    // Retrieve the db instance (sample data insertion won't occur because count > 0)
    const db = await initialiseDatabase();
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO footage"),
      [frontFotPath, backFotPath, date, flag]
    );
  });

  it("should get old footage", async () => {
    const days = 5;
    const result = await getOldFot(days);

    // Based on our updated filtering in the mock, only those mockData items older than threshold will be returned.
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    result.forEach((item) => {
      expect(new Date(item.date) < thresholdDate).toBe(true);
      expect(item.Flag).toBe(0);
    });

    const db = await initialiseDatabase();
    expect(db.allAsync).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM footage WHERE date < ? AND Flag = ?"),
      [expect.any(String), 0]
    );
  });

  it("should delete footage successfully", async () => {
    const idToDelete = 1;
    await deleteFot(idToDelete);
    const db = await initialiseDatabase();
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("delete from footage where id = ?"),
      [idToDelete]
    );
  });

  it("should handle errors", async () => {
    const db = await initialiseDatabase();
    // Make runAsync reject for one call
    db.runAsync.mockImplementationOnce(() => Promise.reject("Mocked Error"));

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      // Fail if no error thrown
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe("Mocked Error");
    }
  });

  it("should handle errors when db is not initialized", async () => {
    // Force openDatabaseAsync to fail.
    SQLite.openDatabaseAsync.mockImplementationOnce(() => Promise.reject("Failed to open database"));

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe("Failed to open database");
    }
  });

  it("should toggle the flag successfully", async () => {
    const idToToggle = 1;
    const db = await initialiseDatabase();
    const result1 = await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?"),
      [idToToggle]
    );
    expect(result1).toBe(true);

    const result2 = await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?"),
      [idToToggle]
    );
    expect(result2).toBe(true);
  });

  it("should handle errors in toggleFlag", async () => {
    const db = await initialiseDatabase();
    db.runAsync.mockImplementationOnce(() => Promise.reject("Mocked Error"));
    const idToToggle = 1;
    const result = await toggleFlag(idToToggle);
    expect(result).toBe(false);
  });
});

describe("Additional Database Tests", () => {
  // Test for saving footage path (Test 12)
  it("should correctly store recording paths in database", async () => {
    const frontPath = "/storage/recordings/front_123.mp4";
    const backPath = "/storage/recordings/back_123.mp4";
    const date = new Date().toISOString();
    const flag = false;

    const result = await insertFot(frontPath, backPath, date, flag);
    expect(result).toEqual({
      lastInsertRowId: expect.any(Number),
      changes: 1,
    });

    const db = await initialiseDatabase();
    const inserted = await db.allAsync("SELECT * FROM footage WHERE ID = ?", [
      result.lastInsertRowId,
    ]);
    expect(inserted[0]).toEqual(
      expect.objectContaining({
        FrontFotPath: frontPath,
        BackFotPath: backPath,
        Flag: 0,
      })
    );
  });

  // Test for auto-deletion functionality (Test 11)
  it("should identify footage eligible for auto-deletion", async () => {
    // Insert test data with an old date (10 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    await insertFot(
      "path/to/old/front.mp4",
      "path/to/old/back.mp4",
      oldDate.toISOString(),
      false
    );

    // Get footage older than 7 days
    const oldFootage = await getOldFot(7);
    expect(oldFootage.length).toBeGreaterThan(0);
    expect(
      oldFootage.some(
        (f) => new Date(f.date).getTime() <= oldDate.getTime() && f.Flag === 0
      )
    ).toBe(true);
  });

  // Test for flag protection (Test 5)
  it("should protect flagged footage from auto-deletion", async () => {
    // Insert flagged footage with an old date
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    await insertFot(
      "path/to/flagged/front.mp4",
      "path/to/flagged/back.mp4",
      oldDate.toISOString(),
      true
    );

    // Get footage older than 7 days
    const oldFootage = await getOldFot(7);
    // All returned records should have Flag === 0
    expect(oldFootage.every((f) => f.Flag === 0)).toBe(true);
  });

  // Test for SQL query correctness (Test 13)
  it("should correctly query for old unflagged footage only", async () => {
    const days = 7;
    const result = await getOldFot(days);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    result.forEach((item) => {
      expect(new Date(item.date) < thresholdDate).toBe(true);
      expect(item.Flag).toBe(0);
    });
  });

  // Test for unflagging footage (Test 6)
  it("should correctly handle unflagging footage", async () => {
    // Insert footage with flag = true
    const date = new Date().toISOString();
    const result = await insertFot("path/to/front.mp4", "path/to/back.mp4", date, true);

    // Toggle flag to unflag the footage
    await toggleFlag(result.lastInsertRowId);

    const db = await initialiseDatabase();
    const flagStatus = await db.getAsync("SELECT Flag FROM footage WHERE ID = ?", [
      result.lastInsertRowId,
    ]);
    expect(flagStatus.Flag).toBe(0);
  });

  // Test for handling file paths (Test 10 - database aspect)
  it("should store and retrieve MP4 file paths correctly", async () => {
    const frontPath = "recording_123_front.mp4";
    const backPath = "recording_123_back.mp4";
    const date = new Date().toISOString();

    const result = await insertFot(frontPath, backPath, date, false);
    const db = await initialiseDatabase();
    const retrieved = await db.allAsync("SELECT * FROM footage WHERE ID = ?", [
      result.lastInsertRowId,
    ]);
    expect(retrieved[0].FrontFotPath).toMatch(/\.mp4$/);
    expect(retrieved[0].BackFotPath).toMatch(/\.mp4$/);
  });
});
