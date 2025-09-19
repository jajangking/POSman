// Script untuk migrasi data dari SQLite lokal ke Supabase
// File ini harus dijalankan sekali saja untuk migrasi awal

import { openDatabase } from 'expo-sqlite';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase - ganti dengan konfigurasi Anda
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fungsi untuk membuka database SQLite lokal
const openLocalDatabase = async () => {
  return await openDatabase('posman.db');
};

// Migrasi data users
const migrateUsers = async () => {
  try {
    const db = await openLocalDatabase();
    
    // Ambil semua users dari SQLite
    const localUsers: any[] = await db.getAllAsync('SELECT * FROM users;');
    
    // Masukkan ke Supabase
    for (const user of localUsers) {
      const { error } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email || `${user.username}@posman.com`,
          role: user.role,
          name: user.name,
          created_at: user.createdAt,
          last_login: user.lastLogin,
          updated_at: new Date().toISOString()
        }
      ]);
      
      if (error) {
        console.error('Error migrating user:', user.id, error);
      } else {
        console.log('Migrated user:', user.username);
      }
    }
    
    console.log('Users migration completed');
  } catch (error) {
    console.error('Error in migrateUsers:', error);
  }
};

// Migrasi data inventory_items
const migrateInventoryItems = async () => {
  try {
    const db = await openLocalDatabase();
    
    // Ambil semua inventory items dari SQLite
    const localItems: any[] = await db.getAllAsync('SELECT * FROM inventory_items;');
    
    // Masukkan ke Supabase
    for (const item of localItems) {
      const { error } = await supabase.from('inventory_items').insert([
        {
          code: item.code,
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          sku: item.sku,
          supplier: item.supplier,
          reorder_level: item.reorderLevel,
          min_order: item.minOrder,
          is_active: item.isActive === 1,
          created_at: item.createdAt,
          updated_at: item.updatedAt
        }
      ]);
      
      if (error) {
        console.error('Error migrating item:', item.code, error);
      } else {
        console.log('Migrated item:', item.name);
      }
    }
    
    console.log('Inventory items migration completed');
  } catch (error) {
    console.error('Error in migrateInventoryItems:', error);
  }
};

// Migrasi data inventory_transactions
const migrateInventoryTransactions = async () => {
  try {
    const db = await openLocalDatabase();
    
    // Ambil semua transactions dari SQLite
    const localTransactions: any[] = await db.getAllAsync('SELECT * FROM inventory_transactions;');
    
    // Masukkan ke Supabase
    for (const transaction of localTransactions) {
      const { error } = await supabase.from('inventory_transactions').insert([
        {
          item_id: transaction.itemId,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          reason: transaction.reason,
          reference: transaction.reference,
          created_by: transaction.createdBy,
          payment_method: transaction.paymentMethod || 'cash',
          created_at: transaction.createdAt
        }
      ]);
      
      if (error) {
        console.error('Error migrating transaction:', transaction.id, error);
      } else {
        console.log('Migrated transaction:', transaction.id);
      }
    }
    
    console.log('Inventory transactions migration completed');
  } catch (error) {
    console.error('Error in migrateInventoryTransactions:', error);
  }
};

// Migrasi data members
const migrateMembers = async () => {
  try {
    const db = await openLocalDatabase();
    
    // Ambil semua members dari SQLite
    const localMembers: any[] = await db.getAllAsync('SELECT * FROM members;');
    
    // Masukkan ke Supabase
    for (const member of localMembers) {
      const { error } = await supabase.from('members').insert([
        {
          name: member.name,
          phone_number: member.phoneNumber,
          email: member.email,
          birthday: member.birthday,
          total_purchases: member.totalPurchases,
          total_points: member.totalPoints,
          last_transaction: member.lastTransaction,
          created_at: member.createdAt,
          updated_at: member.updatedAt
        }
      ]);
      
      if (error) {
        console.error('Error migrating member:', member.id, error);
      } else {
        console.log('Migrated member:', member.name);
      }
    }
    
    console.log('Members migration completed');
  } catch (error) {
    console.error('Error in migrateMembers:', error);
  }
};

// Fungsi utama untuk menjalankan semua migrasi
const runMigration = async () => {
  console.log('Starting data migration from SQLite to Supabase...');
  
  await migrateUsers();
  await migrateInventoryItems();
  await migrateInventoryTransactions();
  await migrateMembers();
  
  console.log('Data migration completed!');
};

// Jalankan migrasi jika file dijalankan langsung
if (require.main === module) {
  runMigration().catch(console.error);
}

export default runMigration;