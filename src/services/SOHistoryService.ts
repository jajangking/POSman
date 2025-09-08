import * as SQLite from 'expo-sqlite';
import { openDatabase } from './DatabaseService';

// Interface for SO History item
export interface SOHistoryItem {
  id: string;
  date: string;
  userId: string;
  userName: string;
  totalItems: number;
  totalDifference: number;
  totalRpDifference: number;
  duration: number; // in seconds
  items: string; // JSON string of items
  createdAt: string;
}

// Create a new SO history entry
export const createSOHistory = async (history: Omit<SOHistoryItem, 'id' | 'createdAt'>): Promise<SOHistoryItem> => {
  try {
    const database = await openDatabase();
    // Buat ID dengan format SO-TANGGALJAMMENIT
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Buat ID dasar
    let id = `SO-${year}${month}${day}${hours}${minutes}${seconds}`;
    const createdAt = new Date().toISOString();
    
    // Periksa apakah ID sudah ada, jika ya tambahkan suffix
    let existingRecord: any = await database.getFirstAsync(
      'SELECT id FROM so_history WHERE id = ?;', 
      [id]
    );
    
    let suffix = 1;
    while (existingRecord) {
      id = `SO-${year}${month}${day}${hours}${minutes}${seconds}-${suffix}`;
      existingRecord = await database.getFirstAsync(
        'SELECT id FROM so_history WHERE id = ?;', 
        [id]
      );
      suffix++;
    }
    
    await database.runAsync(
      `INSERT INTO so_history (id, date, userId, userName, totalItems, totalDifference, totalRpDifference, duration, items, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        history.date,
        history.userId,
        history.userName,
        history.totalItems,
        history.totalDifference,
        history.totalRpDifference,
        history.duration,
        history.items,
        createdAt
      ]
    );
    
    return {
      id,
      date: history.date,
      userId: history.userId,
      userName: history.userName,
      totalItems: history.totalItems,
      totalDifference: history.totalDifference,
      totalRpDifference: history.totalRpDifference,
      duration: history.duration,
      items: history.items,
      createdAt
    };
  } catch (error) {
    console.error('Error creating SO history:', error);
    throw error;
  }
};

// Get all SO history entries
export const getAllSOHistory = async (): Promise<SOHistoryItem[]> => {
  try {
    const database = await openDatabase();
    // Ambil semua data dan urutkan berdasarkan tanggal secara descending
    const result: any[] = await database.getAllAsync('SELECT * FROM so_history ORDER BY date DESC;');
    
    return result.map((history) => ({
      id: history.id,
      date: history.date,
      userId: history.userId,
      userName: history.userName,
      totalItems: typeof history.totalItems === 'number' ? history.totalItems : parseInt(history.totalItems),
      totalDifference: typeof history.totalDifference === 'number' ? history.totalDifference : parseInt(history.totalDifference),
      totalRpDifference: typeof history.totalRpDifference === 'number' ? history.totalRpDifference : parseFloat(history.totalRpDifference),
      duration: typeof history.duration === 'number' ? history.duration : parseInt(history.duration),
      items: history.items,
      createdAt: history.createdAt
    }));
  } catch (error) {
    console.error('Error getting all SO history:', error);
    throw error;
  }
};

// Get SO history entry by ID
export const getSOHistoryById = async (id: string): Promise<SOHistoryItem | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM so_history WHERE id = ?;',
      [id]
    );
    
    if (result) {
      return {
        id: result.id,
        date: result.date,
        userId: result.userId,
        userName: result.userName,
        totalItems: typeof result.totalItems === 'number' ? result.totalItems : parseInt(result.totalItems),
        totalDifference: typeof result.totalDifference === 'number' ? result.totalDifference : parseInt(result.totalDifference),
        totalRpDifference: typeof result.totalRpDifference === 'number' ? result.totalRpDifference : parseFloat(result.totalRpDifference),
        duration: typeof result.duration === 'number' ? result.duration : parseInt(result.duration),
        items: result.items,
        createdAt: result.createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting SO history by ID:', error);
    throw error;
  }
};

// Delete SO history entries by IDs
export const deleteSOHistory = async (ids: string[]): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Create placeholders for the IN clause
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM so_history WHERE id IN (${placeholders});`;
    
    await database.runAsync(query, ids);
  } catch (error) {
    console.error('Error deleting SO history:', error);
    throw error;
  }
};