import { initialiseDatabase, insertFot, getOldFot, deleteFot, toggleFlag, _resetDbPromise } from '../db/database';
import * as SQLite from 'expo-sqlite';

// --- Mock Data ---
const mockData = [
  {
    ID: 1,
    FrontFotPath: 'path/to/front1.mp4',
    BackFotPath: 'path/to/back1.mp4',
    date: '2024-03-10T10:00:00.000Z',
    Flag: 0,
  },
  {
    ID: 2,
    FrontFotPath: 'path/to/front2.mp4',
    BackFotPath: 'path/to/back2.mp4',
    date: new Date().toISOString(),
    Flag: 0,
  },
  {
    ID: 3,
    FrontFotPath: 'path/to/front3.mp4',
    BackFotPath: 'path/to/back3.mp4',
    date: '2024-03-10T10:00:00.000Z',
    Flag: 1,
  },
];

// --- Mock expo-sqlite ---
jest.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: jest.fn((sql) => {
      if (sql.startsWith('CREATE TABLE IF NOT EXISTS')) {
        return Promise.resolve();
      }
      return Promise.reject('Mocked Error');
    }),
    runAsync: jest.fn((sql, params) => {
      if (sql.startsWith('INSERT INTO')) {
        return Promise.resolve({
          lastInsertRowId: Math.floor(Math.random() * 100),
          changes: 1,
        });
      }
      if (sql.startsWith('delete from') || sql.startsWith('UPDATE footage SET')) {
        return Promise.resolve();
      }
      return Promise.reject('Mocked Error');
    }),
    allAsync: jest.fn(() => Promise.resolve(mockData)),
    getAsync: jest.fn((sql, params) => {
      if (sql.startsWith('SELECT COUNT(*)')) {
        // Return a nonzero count so sample data insertion is skipped
        return Promise.resolve({ count: 1 });
      }
      if (sql.startsWith('SELECT Flag FROM')) {
        let mockRows = [
          { ID: 1, Flag: 0 },
          { ID: 2, Flag: 1 },
        ];
        let row = mockRows.find(row => row.ID === params[0]);
        return Promise.resolve(row);
      }
      return Promise.reject('Mocked Error');
    }),
  };

  return {
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
    openDatabase: jest.fn(() => {
      let mockDb = {
        transaction: jest.fn((callback) => {
          callback({
            executeSql: jest.fn((sql, params, success, error) => {
              let rows = [];
              let mockInsertId = Math.floor(Math.random() * 100);
              if (sql.startsWith('CREATE TABLE IF NOT EXISTS')) {
                success && success();
              } else if (sql.startsWith('INSERT INTO')) {
                rows.push({
                  insertId: mockInsertId,
                  rowsAffected: 1,
                });
                success && success(null, { rows: { _array: rows }, insertId: mockInsertId });
              } else if (sql.startsWith('SELECT * FROM')) {
                success && success(null, { rows: { _array: mockData } });
              } else if (sql.startsWith('delete from') || sql.startsWith('UPDATE footage SET')) {
                success && success();
              } else {
                error && error(null, 'Mocked Error');
              }
            }),
          });
        }),
      };
      return mockDb;
    }),
  };
});

// --- Test Suite ---
describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cached dbPromise so each test has a fresh instance
    _resetDbPromise();
  });

  it('should create the table successfully', async () => {
    const db = await initialiseDatabase();
    expect(db.execAsync).toHaveBeenCalledTimes(1);
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS')
    );
  });

  it('should insert footage successfully', async () => {
    const frontFotPath = 'path/to/front.mp4';
    const backFotPath = 'path/to/back.mp4';
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
      expect.stringContaining('INSERT INTO footage'),
      [frontFotPath, backFotPath, date, flag]
    );
  });

  it('should get old footage', async () => {
    const days = 5;
    const result = await getOldFot(days);

    const expectedOldData = mockData.filter((row) => {
      const rowDate = new Date(row.date);
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);
      return rowDate < thresholdDate && row.Flag === 0;
    });
    expect(result.length).toBeGreaterThanOrEqual(1);

    const db = await initialiseDatabase();
    expect(db.allAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM footage WHERE date < ? AND Flag = ?'),
      [expect.any(String), 0]
    );
  });

  it('should delete footage successfully', async () => {
    const idToDelete = 1;
    await deleteFot(idToDelete);
    const db = await initialiseDatabase();
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('delete from footage where id = ?'),
      [idToDelete]
    );
  });

  it('should handle errors', async () => {
    const db = await initialiseDatabase();
    // Make runAsync reject for one call
    db.runAsync.mockImplementationOnce(() => Promise.reject('Mocked Error'));

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      expect(true).toBe(false); // Fail if no error is thrown
    } catch (error) {
      expect(error).toBe('Mocked Error');
    }
  });

  it('should handle errors when db is not initialized', async () => {
    // Force openDatabaseAsync to fail.
    SQLite.openDatabaseAsync.mockImplementationOnce(() => Promise.reject('Failed to open database'));

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBe('Failed to open database');
    }
  });

  it('should toggle the flag successfully', async () => {
    const idToToggle = 1;
    const db = await initialiseDatabase();
    const result1 = await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?'),
      [idToToggle]
    );
    expect(result1).toBe(true);

    const result2 = await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?'),
      [idToToggle]
    );
    expect(result2).toBe(true);
  });

  it('should handle errors in toggleFlag', async () => {
    const db = await initialiseDatabase();
    db.runAsync.mockImplementationOnce(() => Promise.reject('Mocked Error'));
    const idToToggle = 1;
    const result = await toggleFlag(idToToggle);
    expect(result).toBe(false);
  });
});
