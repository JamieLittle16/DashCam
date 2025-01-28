import { initialiseDatabase, insertFot, getOldFot, deleteFot, toggleFlag } from '../db/database';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite (since we are not testing the library itself)
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
    allAsync: jest.fn((sql, params) => {
      let queryParams = params;

      // Mock data for testing purposes
      let mockData = [
        {
          ID: 1,
          FrontFotPath: 'path/to/front1.mp4',
          BackFotPath: 'path/to/back1.mp4',
          date: '2024-03-10T10:00:00.000Z', // Older date
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
          date: '2024-03-10T10:00:00.000Z', // Older date
          Flag: 1,
        },
      ];
      let filteredData = mockData.filter((row) => {
        const rowDate = new Date(row.date);
        const thresholdDate = new Date(queryParams[0]);
        return rowDate < thresholdDate && row.Flag === queryParams[1];
      });
      return Promise.resolve(filteredData);
    }),
     getAsync: jest.fn((sql, params) => {
         if (sql.startsWith('SELECT Flag FROM')) {
           // Mock data for testing purposes
           let mockData = [{
             ID: 1,
             Flag: 0,
           },
           {
            ID: 2,
             Flag: 1,
           },
          ];
            let row = mockData.find((row)=> row.ID === params[0] )
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
              // Implement basic mock behavior for select, insert, delete
              let rows = [];
              let mockInsertId = Math.floor(Math.random() * 100);
              if (sql.startsWith('CREATE TABLE IF NOT EXISTS')) {
                // Mock create table - no need to return anything, this test will not fail if this line fails
                success && success();
              } else if (sql.startsWith('INSERT INTO')) {
                rows.push({
                  insertId: mockInsertId,
                  rowsAffected: 1,
                });

                success &&
                  success(null, { rows: { _array: rows }, insertId: mockInsertId });
              } else if (sql.startsWith('SELECT * FROM')) {
                // Basic filtering
                let queryParams = params;

                // Mock data for testing purposes
                let mockData = [
                  {
                    ID: 1,
                    FrontFotPath: 'path/to/front1.mp4',
                    BackFotPath: 'path/to/back1.mp4',
                    date: '2024-03-10T10:00:00.000Z', // Older date
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
                    date: '2024-03-10T10:00:00.000Z', // Older date
                    Flag: 1,
                  },
                ];
                let filteredData = mockData.filter((row) => {
                  const rowDate = new Date(row.date);
                  const thresholdDate = new Date(queryParams[0]);
                  return rowDate < thresholdDate && row.Flag === queryParams[1];
                });
                success && success(null, { rows: { _array: filteredData } });
              } else if (sql.startsWith('delete from') || sql.startsWith('UPDATE footage SET')) {
                success && success();
              }
               else {
                error && error(null, 'Mocked Error'); //error handling
              }
            }),
          });
        }),
      };
      return mockDb;
    }),
  };
});

describe('Database Operations', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
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
    const db = await initialiseDatabase();
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO footage'),
      [frontFotPath, backFotPath, date, flag]
    );
  });

  it('should get old footage', async () => {
    const days = 5; // Example of 5 days old
    let result;
    const successCallback = (data) => {
      result = data;
    };
    await getOldFot(days, successCallback);
    expect(result).toEqual(expect.any(Array));
    // expect at least 1 result or more, since mock data contains old record
    expect(result.length).toBeGreaterThanOrEqual(1);

    const db = await initialiseDatabase();
    expect(db.allAsync).toHaveBeenCalledTimes(1);
    expect(db.allAsync).toHaveBeenCalledWith(
      expect.stringContaining(
        'SELECT * FROM footage WHERE date < ? AND Flag = ?'
      ),
      [expect.any(String), false]
    );
  });

  it('should delete footage successfully', async () => {
    const idToDelete = 1;

    await deleteFot(idToDelete);
    const db = await initialiseDatabase();
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('delete from footage where id = ?'),
      [idToDelete]
    );
  });
  it('should handle errors', async () => {
    const db = await initialiseDatabase();
    db.runAsync.mockImplementationOnce(() => {
      return Promise.reject('Mocked Error');
    });

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      // Fail test if we get here since this should throw error
      expect(true).toBe(false);
    } catch (error) {
      // Test will pass if error is caught
    }
  });
  it('should handle errors when db is not initialized', async () => {
    // Mock database to simulate initialization failure
    SQLite.openDatabaseAsync.mockImplementationOnce(() =>
      Promise.reject('Failed to open database')
    );

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      // Fail test if we get here since this should throw error
      expect(true).toBe(false);
    } catch (error) {
      // Test will pass if error is caught
      expect(error).toEqual('Database not initialized');
    }
  });
  it('should toggle the flag successfully', async () => {
    const idToToggle = 1;
    const db = await initialiseDatabase();
    const result1 =  await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?'),
        [idToToggle]
    );
    expect(result1).toBe(true);
    const result2 =  await toggleFlag(idToToggle);
    expect(db.runAsync).toHaveBeenCalledTimes(2);
     expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE footage SET Flag = CASE WHEN Flag = 0 THEN 1 ELSE 0 END WHERE ID = ?'),
      [idToToggle]
    );
      expect(result2).toBe(true);
  });
   it('should handle errors in toggleFlag', async () => {
       const db = await initialiseDatabase();
        db.runAsync.mockImplementationOnce(() => {
            return Promise.reject('Mocked Error');
        });
        const idToToggle = 1;
       const result = await toggleFlag(idToToggle);
       expect(result).toBe(false);

   });
});
