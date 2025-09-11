import * as SQLite from 'expo-sqlite';
import { User, UserRole } from '../models/User';
import { InventoryItem, InventoryTransaction } from '../models/Inventory';
import { Member } from '../models/Member';

// Open database
let db: SQLite.SQLiteDatabase | null = null;

export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('posman.db');
  }
  return db;
};

// Initialize database with all tables
export const initDatabase = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Create users table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        createdAt TEXT NOT NULL,
        lastLogin TEXT
      );
    `);
    
    // Create inventory_items table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        quantity INTEGER NOT NULL,
        sku TEXT UNIQUE,
        supplier TEXT,
        reorderLevel INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create inventory_transactions table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        reason TEXT,
        reference TEXT,
        memberId TEXT,
        createdAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY (itemId) REFERENCES inventory_items (code)
      );
    `);
    
    // Create so_history table for stock opname history
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        totalItems INTEGER NOT NULL,
        totalDifference INTEGER NOT NULL,
        totalRpDifference REAL NOT NULL,
        duration INTEGER NOT NULL, -- in seconds
        items TEXT NOT NULL, -- JSON string of items
        createdAt TEXT NOT NULL
      );
    `);
    
    // Create so_monitoring table for stock opname monitoring
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_monitoring (
        id TEXT PRIMARY KEY,
        itemCode TEXT NOT NULL,
        itemName TEXT NOT NULL,
        date TEXT NOT NULL,
        soCount INTEGER NOT NULL DEFAULT 1,
        totalDifference INTEGER NOT NULL,
        totalRpDifference REAL NOT NULL,
        consecutiveSOCount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL, -- 'normal', 'warning', 'critical'
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (itemCode) REFERENCES inventory_items (code)
      );
    `);
    
    // Create so_sessions table for stock opname sessions
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS so_sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'partial' or 'grand'
        startTime TEXT NOT NULL,
        lastView TEXT NOT NULL, -- 'partialSO', 'grandSO', or 'editSO'
        items TEXT, -- JSON string of SO items
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create members table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phoneNumber TEXT,
        email TEXT,
        birthday TEXT,
        totalPurchases REAL NOT NULL DEFAULT 0,
        totalPoints INTEGER NOT NULL DEFAULT 0,
        lastTransaction TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Create point_settings table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS point_settings (
        id TEXT PRIMARY KEY,
        amountSpentToEarnPoints REAL NOT NULL,
        pointsEarnedPerAmount INTEGER NOT NULL,
        pointsRedemptionRate REAL NOT NULL,
        minPointsForRedemption INTEGER NOT NULL,
        maxPointsRedemption REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized with all tables');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create a new user
export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        user.username,
        user.password, // In a real app, this should be hashed
        user.role,
        user.name,
        user.email || null,
        user.phone || null,
        createdAt
      ]
    );
    
    return {
      id,
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: new Date(createdAt),
      lastLogin: undefined
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by username
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?;',
      [username]
    );
    
    if (result) {
      return {
        id: result.id,
        username: result.username,
        password: result.password,
        role: result.role as UserRole,
        name: result.name,
        email: result.email || undefined,
        phone: result.phone || undefined,
        createdAt: new Date(result.createdAt),
        lastLogin: result.lastLogin ? new Date(result.lastLogin) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync('SELECT * FROM users;');
    
    return result.map((user) => ({
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role as UserRole,
      name: user.name,
      email: user.email || undefined,
      phone: user.phone || undefined,
      createdAt: new Date(user.createdAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Update user's last login time
export const updateUserLoginTime = async (userId: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const lastLogin = new Date().toISOString();
    
    await database.runAsync(
      'UPDATE users SET lastLogin = ? WHERE id = ?;',
      [lastLogin, userId]
    );
  } catch (error) {
    console.error('Error updating user login time:', error);
    throw error;
  }
};

// Create default users
export const createDefaultUsers = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Check if admin user exists
    const adminExists: any = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?;',
      ['admin']
    );
    
    if (!adminExists) {
      // Create default users
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'admin-' + Math.random().toString(36).substring(2, 15),
          'admin',
          'admin123',
          'admin',
          'Administrator',
          'admin@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'staff-' + Math.random().toString(36).substring(2, 15),
          'staff',
          'staff123',
          'staff',
          'Staff Member',
          'staff@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      await database.runAsync(
        `INSERT INTO users (id, username, password, role, name, email, phone, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'customer-' + Math.random().toString(36).substring(2, 15),
          'customer',
          'customer123',
          'customer',
          'Customer User',
          'customer@posman.com',
          '',
          new Date().toISOString()
        ]
      );
      
      console.log('Default users created successfully');
    } else {
      console.log('Default users already exist');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error;
  }
};

// Inventory CRUD Operations

// Create a new inventory item
export const createInventoryItem = async (item: Omit<InventoryItem, 'code' | 'createdAt' | 'updatedAt'> & { code: string }): Promise<InventoryItem> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO inventory_items (code, name, description, category, price, cost, quantity, sku, supplier, reorderLevel, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.code,
        item.name,
        item.description || null,
        item.category || null,
        item.price,
        item.cost,
        item.quantity,
        item.sku || null,
        item.supplier || null,
        item.reorderLevel,
        item.isActive ? 1 : 0,
        timestamp,
        timestamp
      ]
    );
    
    return {
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorderLevel,
      isActive: item.isActive,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp)
    };
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    // Handle specific SQLite errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('inventory_items.code')) {
        throw new Error(`The product code "${item.code}" is already in use. Please try again to generate a different code.`);
      } else if (error.message.includes('inventory_items.sku')) {
        throw new Error(`The barcode/SKU "${item.sku}" is already in use. Please enter a different barcode or leave it blank.`);
      } else {
        throw new Error('Duplicate entry detected. Please check that the product code and barcode are unique.');
      }
    }
    throw new Error(error.message || 'Failed to create inventory item');
  }
};

// Get all inventory items
export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync('SELECT * FROM inventory_items ORDER BY name;');
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error getting all inventory items:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventoryItems = async (query: string): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    
    // Check if query is numeric (likely a barcode)
    const isNumeric = /^\d+$/.test(query);
    
    let result: any[];
    if (isNumeric) {
      // For numeric queries (barcodes), do exact match on code or sku
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE code = ? OR sku = ?
         ORDER BY name;`,
        [query, query]
      );
    } else {
      // For text queries, do partial matching
      result = await database.getAllAsync(
        `SELECT * FROM inventory_items 
         WHERE name LIKE ? OR code LIKE ? OR category LIKE ? OR supplier LIKE ? OR sku LIKE ?
         ORDER BY name;`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
      );
    }
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error searching inventory items:', error);
    throw error;
  }
};

// Get inventory items by category
export const getInventoryItemsByCategory = async (category: string): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_items WHERE category = ? ORDER BY name;',
      [category]
    );
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error getting inventory items by category:', error);
    throw error;
  }
};

// Get inventory items below reorder level
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_items WHERE quantity <= reorderLevel AND isActive = 1 ORDER BY quantity ASC;'
    );
    
    return result.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: parseInt(item.reorderLevel),
      isActive: item.isActive === 1,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  } catch (error) {
    console.error('Error getting low stock items:', error);
    throw error;
  }
};

// Get inventory item by code
export const getInventoryItemByCode = async (code: string): Promise<InventoryItem | null> => {
  try {
    const database = await openDatabase();
    console.log('Mencari item di database dengan code/SKU:', code);
    // Cari berdasarkan code (barcode) atau SKU
    const result: any = await database.getFirstAsync(
      'SELECT * FROM inventory_items WHERE code = ? OR sku = ?;',
      [code, code]
    );
    console.log('Hasil pencarian di database:', result);
    
    if (result) {
      return {
        code: result.code,
        name: result.name,
        description: result.description || '',
        category: result.category || '',
        price: parseFloat(result.price),
        cost: parseFloat(result.cost),
        quantity: parseInt(result.quantity),
        sku: result.sku || '',
        supplier: result.supplier || '',
        reorderLevel: parseInt(result.reorderLevel),
        isActive: result.isActive === 1,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting inventory item by code:', error);
    throw error;
  }
};

// Update inventory item
export const updateInventoryItem = async (code: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (item.name !== undefined) {
      fields.push('name = ?');
      values.push(item.name);
    }
    if (item.description !== undefined) {
      fields.push('description = ?');
      values.push(item.description);
    }
    if (item.category !== undefined) {
      fields.push('category = ?');
      values.push(item.category);
    }
    if (item.price !== undefined) {
      fields.push('price = ?');
      values.push(item.price);
    }
    if (item.cost !== undefined) {
      fields.push('cost = ?');
      values.push(item.cost);
    }
    if (item.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(item.quantity);
    }
    if (item.sku !== undefined) {
      fields.push('sku = ?');
      values.push(item.sku);
    }
    if (item.supplier !== undefined) {
      fields.push('supplier = ?');
      values.push(item.supplier);
    }
    if (item.reorderLevel !== undefined) {
      fields.push('reorderLevel = ?');
      values.push(item.reorderLevel);
    }
    if (item.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(item.isActive ? 1 : 0);
    }
    
    fields.push('updatedAt = ?');
    values.push(timestamp);
    
    values.push(code);
    
    const query = `UPDATE inventory_items SET ${fields.join(', ')} WHERE code = ?;`;
    
    await database.runAsync(query, values);
    
    // Return updated item
    return await getInventoryItemByCode(code) as InventoryItem;
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    throw new Error(error.message || 'Failed to update inventory item');
  }
};

// Delete inventory item
export const deleteInventoryItem = async (code: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM inventory_items WHERE code = ?;', [code]);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Create inventory transaction
export const createInventoryTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO inventory_transactions (id, itemId, type, quantity, price, reason, reference, createdAt, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        transaction.itemCode,
        transaction.type,
        transaction.quantity,
        transaction.price,
        transaction.reason || null,
        transaction.reference || null,
        timestamp,
        transaction.createdBy
      ]
    );
    
    return {
      id,
      itemCode: transaction.itemCode,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(timestamp),
      createdBy: transaction.createdBy
    };
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    throw error;
  }
};

// Get inventory transactions by item code
export const getInventoryTransactionsByItemCode = async (itemCode: string): Promise<InventoryTransaction[]> => {
  try {
    const database = await openDatabase();
    
    // Gunakan itemId sesuai dengan definisi tabel yang sebenarnya
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM inventory_transactions WHERE itemId = ? ORDER BY createdAt DESC',
      [itemCode]
    );
    
    return result.map((transaction) => ({
      id: transaction.id,
      itemCode: transaction.itemId,
      type: transaction.type,
      quantity: parseInt(transaction.quantity),
      price: parseFloat(transaction.price),
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(transaction.createdAt),
      createdBy: transaction.createdBy
    }));
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    throw error;
  }
};

// SO Monitoring functions

// Add SO monitoring record
export const addSOMonitoringRecord = async (record: {
  itemCode: string;
  itemName: string;
  date: string;
  soCount?: number;
  totalDifference: number;
  totalRpDifference: number;
  consecutiveSOCount?: number;
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
}): Promise<void> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO so_monitoring (
        id, itemCode, itemName, date, soCount, totalDifference, totalRpDifference, 
        consecutiveSOCount, status, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        record.itemCode,
        record.itemName,
        record.date,
        record.soCount || 1,
        record.totalDifference,
        record.totalRpDifference,
        record.consecutiveSOCount || 0,
        record.status,
        record.notes || null,
        createdAt
      ]
    );
  } catch (error) {
    console.error('Error adding SO monitoring record:', error);
    throw error;
  }
};

// Get SO monitoring records by item code
export const getSOMonitoringRecordsByItemCode = async (itemCode: string): Promise<any[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM so_monitoring WHERE itemCode = ? ORDER BY date DESC',
      [itemCode]
    );
    
    return result.map(record => ({
      id: record.id,
      itemCode: record.itemCode,
      itemName: record.itemName,
      date: record.date,
      soCount: record.soCount,
      totalDifference: record.totalDifference,
      totalRpDifference: record.totalRpDifference,
      consecutiveSOCount: record.consecutiveSOCount,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.createdAt)
    }));
  } catch (error) {
    console.error('Error getting SO monitoring records:', error);
    throw error;
  }
};

// Get all SO monitoring records
export const getAllSOMonitoringRecords = async (): Promise<any[]> => {
  try {
    const database = await openDatabase();
    const result: any[] = await database.getAllAsync(
      'SELECT * FROM so_monitoring ORDER BY date DESC'
    );
    
    return result.map(record => ({
      id: record.id,
      itemCode: record.itemCode,
      itemName: record.itemName,
      date: record.date,
      soCount: record.soCount,
      totalDifference: record.totalDifference,
      totalRpDifference: record.totalRpDifference,
      consecutiveSOCount: record.consecutiveSOCount,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.createdAt)
    }));
  } catch (error) {
    console.error('Error getting all SO monitoring records:', error);
    throw error;
  }
};

// Update SO monitoring record
export const updateSOMonitoringRecord = async (id: string, updates: Partial<any>): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (updates.soCount !== undefined) {
      fields.push('soCount = ?');
      values.push(updates.soCount);
    }
    if (updates.totalDifference !== undefined) {
      fields.push('totalDifference = ?');
      values.push(updates.totalDifference);
    }
    if (updates.totalRpDifference !== undefined) {
      fields.push('totalRpDifference = ?');
      values.push(updates.totalRpDifference);
    }
    if (updates.consecutiveSOCount !== undefined) {
      fields.push('consecutiveSOCount = ?');
      values.push(updates.consecutiveSOCount);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    fields.push('createdAt = ?');
    values.push(timestamp);
    
    values.push(id);
    
    const query = `UPDATE so_monitoring SET ${fields.join(', ')} WHERE id = ?;`;
    
    await database.runAsync(query, values);
  } catch (error) {
    console.error('Error updating SO monitoring record:', error);
    throw error;
  }
};

// Delete SO monitoring record
export const deleteSOMonitoringRecord = async (id: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM so_monitoring WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting SO monitoring record:', error);
    throw error;
  }
};

// SO Session functions

// Interface for SO Session
export interface SOSession {
  id: string;
  type: 'partial' | 'grand';
  startTime: string;
  lastView: 'partialSO' | 'grandSO' | 'editSO';
  items: string; // JSON string of SO items
  createdAt: string;
  updatedAt: string;
}

// Create or update SO session
export const upsertSOSession = async (session: Omit<SOSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<SOSession> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    const id = 'current_so_session'; // Use a fixed ID for the current session
    
    // Check if session already exists
    const existingSession: any = await database.getFirstAsync(
      'SELECT * FROM so_sessions WHERE id = ?;', 
      [id]
    );
    
    if (existingSession) {
      // Update existing session
      await database.runAsync(
        `UPDATE so_sessions SET type = ?, startTime = ?, lastView = ?, items = ?, updatedAt = ? WHERE id = ?;`,
        [
          session.type,
          session.startTime,
          session.lastView,
          session.items || null,
          timestamp,
          id
        ]
      );
    } else {
      // Create new session
      await database.runAsync(
        `INSERT INTO so_sessions (id, type, startTime, lastView, items, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          session.type,
          session.startTime,
          session.lastView,
          session.items || null,
          timestamp,
          timestamp
        ]
      );
    }
    
    return {
      id,
      type: session.type,
      startTime: session.startTime,
      lastView: session.lastView,
      items: session.items || '',
      createdAt: existingSession ? existingSession.createdAt : timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    console.error('Error upserting SO session:', error);
    throw error;
  }
};

// Get current SO session
export const getCurrentSOSession = async (): Promise<SOSession | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync(
      'SELECT * FROM so_sessions WHERE id = ?;',
      ['current_so_session']
    );
    
    if (result) {
      return {
        id: result.id,
        type: result.type as 'partial' | 'grand',
        startTime: result.startTime,
        lastView: result.lastView as 'partialSO' | 'grandSO' | 'editSO',
        items: result.items || '',
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current SO session:', error);
    throw error;
  }
};

// Delete SO session
export const deleteSOSession = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM so_sessions WHERE id = ?;', ['current_so_session']);
  } catch (error) {
    console.error('Error deleting SO session:', error);
    throw error;
  }
};

// Update SO session items
export const updateSOSessionItems = async (items: string): Promise<void> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `UPDATE so_sessions SET items = ?, updatedAt = ? WHERE id = ?;`,
      [
        items,
        timestamp,
        'current_so_session'
      ]
    );
  } catch (error) {
    console.error('Error updating SO session items:', error);
    throw error;
  }
};

// Member functions

// Create a new member
export const createMember = async (member: Omit<Member, 'id' | 'totalPurchases' | 'totalPoints' | 'createdAt' | 'updatedAt'>): Promise<Member> => {
  try {
    const database = await openDatabase();
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO members (id, name, phoneNumber, email, birthday, totalPurchases, totalPoints, lastTransaction, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        member.name,
        member.phoneNumber || null,
        member.email || null,
        member.birthday || null,
        0, // totalPurchases default to 0
        0, // totalPoints default to 0
        null, // lastTransaction default to null
        timestamp,
        timestamp
      ]
    );
    
    return {
      id,
      name: member.name,
      phoneNumber: member.phoneNumber || '',
      email: member.email || undefined,
      birthday: member.birthday || undefined,
      totalPurchases: 0,
      totalPoints: 0,
      lastTransaction: undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

// Get all members
export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const database = await openDatabase();
    const members = await database.getAllAsync<Member>('SELECT * FROM members ORDER BY name');
    return members;
  } catch (error) {
    console.error('Error getting all members:', error);
    throw error;
  }
};

// Point Settings interface
export interface PointSettings {
  id: string;
  amountSpentToEarnPoints: number;
  pointsEarnedPerAmount: number;
  pointsRedemptionRate: number;
  minPointsForRedemption: number;
  maxPointsRedemption: number;
  createdAt: string;
  updatedAt: string;
}

// Save point settings
export const savePointSettings = async (settings: Omit<PointSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<PointSettings> => {
  try {
    const database = await openDatabase();
    const id = 'default'; // Using a fixed ID for simplicity
    const now = new Date().toISOString();
    
    // Check if settings already exist
    const existing = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', [id]);
    
    if (existing) {
      // Update existing settings
      await database.runAsync(
        `UPDATE point_settings SET 
          amountSpentToEarnPoints = ?, 
          pointsEarnedPerAmount = ?, 
          pointsRedemptionRate = ?, 
          minPointsForRedemption = ?, 
          maxPointsRedemption = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          settings.amountSpentToEarnPoints,
          settings.pointsEarnedPerAmount,
          settings.pointsRedemptionRate,
          settings.minPointsForRedemption,
          settings.maxPointsRedemption,
          now,
          id
        ]
      );
    } else {
      // Insert new settings
      await database.runAsync(
        `INSERT INTO point_settings (
          id, 
          amountSpentToEarnPoints, 
          pointsEarnedPerAmount, 
          pointsRedemptionRate, 
          minPointsForRedemption, 
          maxPointsRedemption, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          settings.amountSpentToEarnPoints,
          settings.pointsEarnedPerAmount,
          settings.pointsRedemptionRate,
          settings.minPointsForRedemption,
          settings.maxPointsRedemption,
          now,
          now
        ]
      );
    }
    
    // Return the saved settings
    const savedSettings = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', [id]);
    if (!savedSettings) {
      throw new Error('Failed to save point settings');
    }
    
    return savedSettings;
  } catch (error) {
    console.error('Error saving point settings:', error);
    throw error;
  }
};

// Get point settings
export const getPointSettings = async (): Promise<PointSettings | null> => {
  try {
    const database = await openDatabase();
    const settings = await database.getFirstAsync<PointSettings>('SELECT * FROM point_settings WHERE id = ?', ['default']);
    return settings || null;
  } catch (error) {
    console.error('Error getting point settings:', error);
    return null;
  }
};

// Update member
export const updateMember = async (id: string, member: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member> => {
  try {
    const database = await openDatabase();
    const timestamp = new Date().toISOString();
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    if (member.name !== undefined) {
      fields.push('name = ?');
      values.push(member.name);
    }
    if (member.phoneNumber !== undefined) {
      fields.push('phoneNumber = ?');
      values.push(member.phoneNumber);
    }
    if (member.email !== undefined) {
      fields.push('email = ?');
      values.push(member.email);
    }
    if (member.birthday !== undefined) {
      fields.push('birthday = ?');
      values.push(member.birthday);
    }
    if (member.totalPurchases !== undefined) {
      fields.push('totalPurchases = ?');
      values.push(member.totalPurchases);
    }
    if (member.totalPoints !== undefined) {
      fields.push('totalPoints = ?');
      values.push(member.totalPoints);
    }
    if (member.lastTransaction !== undefined) {
      fields.push('lastTransaction = ?');
      values.push(member.lastTransaction);
    }
    
    fields.push('updatedAt = ?');
    values.push(timestamp);
    
    values.push(id);
    
    const query = `UPDATE members SET ${fields.join(', ')} WHERE id = ?;`;
    
    await database.runAsync(query, values);
    
    // Return updated member
    const updatedMember: any = await database.getFirstAsync('SELECT * FROM members WHERE id = ?;', [id]);
    
    if (!updatedMember) {
      throw new Error('Member not found');
    }
    
    return {
      id: updatedMember.id,
      name: updatedMember.name,
      phoneNumber: updatedMember.phoneNumber || '',
      email: updatedMember.email || undefined,
      birthday: updatedMember.birthday || undefined,
      totalPurchases: parseFloat(updatedMember.totalPurchases),
      totalPoints: parseInt(updatedMember.totalPoints),
      lastTransaction: updatedMember.lastTransaction || undefined,
      createdAt: updatedMember.createdAt,
      updatedAt: updatedMember.updatedAt
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Delete member
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const database = await openDatabase();
    await database.runAsync('DELETE FROM members WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Get member by ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync('SELECT * FROM members WHERE id = ?;', [id]);
    
    if (result) {
      return {
        id: result.id,
        name: result.name,
        phoneNumber: result.phoneNumber || '',
        email: result.email || undefined,
        birthday: result.birthday || undefined,
        totalPurchases: parseFloat(result.totalPurchases),
        totalPoints: parseInt(result.totalPoints),
        lastTransaction: result.lastTransaction || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting member by ID:', error);
    throw error;
  }
};

// Get member by phone number
export const getMemberByPhoneNumber = async (phoneNumber: string): Promise<Member | null> => {
  try {
    const database = await openDatabase();
    const result: any = await database.getFirstAsync('SELECT * FROM members WHERE phoneNumber = ?;', [phoneNumber]);
    
    if (result) {
      return {
        id: result.id,
        name: result.name,
        phoneNumber: result.phoneNumber || '',
        email: result.email || undefined,
        birthday: result.birthday || undefined,
        totalPurchases: parseFloat(result.totalPurchases),
        totalPoints: parseInt(result.totalPoints),
        lastTransaction: result.lastTransaction || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting member by phone number:', error);
    throw error;
  }
};