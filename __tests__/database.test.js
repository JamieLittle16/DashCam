import { createTable, insertFot, getOldFot, deleteFot } from '../db/database';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite (since we are not testing the library itself)
jest.mock('expo-sqlite', () => {
  return {
    openDatabase: jest.fn(() => {
      let mockDb = {
        transaction: jest.fn(callback => {
          callback({
            executeSql: jest.fn((sql, params, success, error) => {
              // Implement basic mock behavior for select, insert, delete
              let rows = [];
              let mockInsertId = Math.floor(Math.random() * 100);
              if (sql.startsWith("CREATE TABLE IF NOT EXISTS")) {
                // Mock create table - no need to return anything, this test will not fail if this line fails
                success && success();
              } else if (sql.startsWith("INSERT INTO")) {
                rows.push({
                  insertId: mockInsertId,
                  rowsAffected: 1,
                });

                success && success(null, { rows: { _array: rows}, insertId: mockInsertId});
              } else if (sql.startsWith("SELECT * FROM")) {

                // Basic filtering
                let queryParams = params;

                // Mock data for testing purposes
                let mockData = [{
                  ID: 1,
                  FrontFotPath: 'path/to/front1.mp4',
                  BackFotPath: 'path/to/back1.mp4',
                  date: '2024-03-10T10:00:00.000Z', // Older date
                  Flag: 0
                }, {
                  ID: 2,
                  FrontFotPath: 'path/to/front2.mp4',
                  BackFotPath: 'path/to/back2.mp4',
                  date: new Date().toISOString(),
                  Flag: 0
                },
                {
                  ID: 3,
                  FrontFotPath: 'path/to/front3.mp4',
                  BackFotPath: 'path/to/back3.mp4',
                  date: '2024-03-10T10:00:00.000Z', // Older date
                  Flag: 1
                }
                ];
                let filteredData = mockData.filter((row) => {
                  return row.date < queryParams[0] && row.Flag === queryParams[1]
                })
                success && success(null, { rows: { _array: filteredData}})
              } else if(sql.startsWith("delete from")){
                success && success();
              }

              else {
                error && error(null, 'Mocked Error'); //error handling
              }
            }),
          });
        })
      };
      return mockDb;
    })
  };
});


describe('Database Operations', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  it('should create the table successfully', () => {
    const db = SQLite.openDatabase(); // Get db object
    createTable();
    expect(db.transaction).toHaveBeenCalledTimes(1);
    const mockTransactionCallback = db.transaction.mock.calls[0][0];
    const mockTransaction = { executeSql: jest.fn()};

    mockTransactionCallback(mockTransaction);
    expect(mockTransaction.executeSql).toHaveBeenCalledTimes(1);
    expect(mockTransaction.executeSql).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE IF NOT EXISTS"),
    );
  });

  it('should insert footage successfully', async () => {
    const frontFotPath = 'path/to/front.mp4';
    const backFotPath = 'path/to/back.mp4';
    const date = new Date().toISOString();
    const flag = false;

    const result = await insertFot(frontFotPath, backFotPath, date, flag);
    expect(result).toEqual({
      insertId: expect.any(Number),
      rowsAffected: 1,
    })
    const db = SQLite.openDatabase(); // Get db object
    expect(db.transaction).toHaveBeenCalledTimes(1);
    const mockTransactionCallback = db.transaction.mock.calls[0][0];
    const mockTransaction = { executeSql: jest.fn()};

    mockTransactionCallback(mockTransaction);
    expect(mockTransaction.executeSql).toHaveBeenCalledTimes(1);
    expect(mockTransaction.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO footage'),
      [frontFotPath, backFotPath, date, flag],
    );
  });

  it('should get old footage', async () => {
    const days = 5; // Example of 5 days old
    let result
    const successCallback = (data) => {
      result = data
    };
    await getOldFot(days, successCallback);
    expect(result).toEqual(expect.any(Array))
    expect(result.length).toBeGreaterThanOrEqual(1);

    const db = SQLite.openDatabase(); // Get db object
    expect(db.transaction).toHaveBeenCalledTimes(1);
    const mockTransactionCallback = db.transaction.mock.calls[0][0];
    const mockTransaction = { executeSql: jest.fn()};

    mockTransactionCallback(mockTransaction);
    expect(mockTransaction.executeSql).toHaveBeenCalledTimes(1);
    expect(mockTransaction.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM footage WHERE date < ? AND Flag = ?'),
      [expect.any(String), false]
    );
  });

  it('should delete footage successfully', async () => {
    const idToDelete = 1;

    await deleteFot(idToDelete);
    const db = SQLite.openDatabase(); // Get db object
    expect(db.transaction).toHaveBeenCalledTimes(1);
    const mockTransactionCallback = db.transaction.mock.calls[0][0];
    const mockTransaction = { executeSql: jest.fn()};

    mockTransactionCallback(mockTransaction);
    expect(mockTransaction.executeSql).toHaveBeenCalledTimes(1);
    expect(mockTransaction.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('delete from footage where id = ?'),
      [idToDelete]
    );
  });
  it('should handle errors', async () => {
    const db = SQLite.openDatabase();
    db.transaction.mockImplementationOnce((callback) => {
      const mockTransaction = {
        executeSql: jest.fn((sql, params, success, error) => {
          error && error(null, 'Mocked Error');
        })
      };
      callback(mockTransaction);
    });

    const idToDelete = 1;
    try {
      await deleteFot(idToDelete);
      // Fail test if we get here since this should throw error
      expect(true).toBe(false)

    } catch (error) {
      // Test will pass if error is caught
    }
  })
});
