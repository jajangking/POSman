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
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
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
    const result: any[] = await database.getAllAsync('SELECT * FROM so_history ORDER BY date DESC;');
    
    return result.map((history) => ({
      id: history.id,
      date: history.date,
      userId: history.userId,
      userName: history.userName,
      totalItems: parseInt(history.totalItems),
      totalDifference: parseInt(history.totalDifference),
      totalRpDifference: parseFloat(history.totalRpDifference),
      duration: parseInt(history.duration),
      items: history.items,
      createdAt: history.createdAt
    }));
  } catch (error) {
    console.error('Error getting all SO history:', error);
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