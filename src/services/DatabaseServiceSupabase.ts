import { User, CreateUserParams } from '../models/User';
import { InventoryItem, InventoryTransaction } from '../models/Inventory';
import { Member } from '../models/Member';
import { supabase } from '../config/supabase';

// USER FUNCTIONS

// Create a new user in Supabase
export const createUser = async (userData: CreateUserParams): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          created_by: userData.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      // Jika tabel belum ada, lempar error yang lebih informatif
      if (error.code === 'PGRST205') {
        console.error('Users table may not be created yet. Please create the table first.');
        throw new Error('Users table not found. Please run the database setup first.');
      }
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
      createdAt: new Date(data.created_at),
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdBy: data.created_by
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Jika tabel belum ada, lempar error yang lebih informatif
    if (error.code === 'PGRST205') {
      console.error('Users table may not be created yet. Please create the table first.');
      throw new Error('Users table not found. Please run the database setup first.');
    }
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Jika tabel belum ada, kembalikan null
      if (error.code === 'PGRST205') {
        console.log('Users table may not be created yet. Returning null for getUserById.');
        return null;
      }
      
      // Jika user tidak ditemukan, kembalikan null
      if (error.code === 'PGRST116') {
        return null;
      }
      
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
      createdAt: new Date(data.created_at),
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdBy: data.created_by
    };
  } catch (error: any) {
    console.error('Error getting user by ID:', error);
    // Jika tabel belum ada, kembalikan null
    if (error.code === 'PGRST205') {
      console.log('Users table may not be created yet. Returning null for getUserById.');
      return null;
    }
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      // Jika tabel belum ada, kembalikan array kosong
      if (error.code === 'PGRST205') {
        console.log('Users table may not be created yet. Returning empty array for getAllUsers.');
        return [];
      }
      throw error;
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: new Date(user.created_at),
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdBy: user.created_by
    }));
  } catch (error: any) {
    console.error('Error getting all users:', error);
    // Jika tabel belum ada, kembalikan array kosong
    if (error.code === 'PGRST205') {
      console.log('Users table may not be created yet. Returning empty array for getAllUsers.');
      return [];
    }
    throw error;
  }
};

// Update user's last login time
export const updateUserLoginTime = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      // Jika tabel belum ada, log dan lanjutkan
      if (error.code === 'PGRST205') {
        console.log('Users table may not be created yet. Skipping update of last login time.');
        return;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating user login time:', error);
    // Jika tabel belum ada, log dan lanjutkan
    if (error.code === 'PGRST205') {
      console.log('Users table may not be created yet. Skipping update of last login time.');
      return;
    }
    throw error;
  }
};

// Create default users
export const createDefaultUsers = async (): Promise<void> => {
  try {
    console.log('Setting up default users...');
    
    // Check if admin user exists
    const { data: adminExists, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) {
      // Jika error karena tabel belum ada, log dan lanjutkan
      if (adminCheckError.code === 'PGRST205') {
        console.log('Users table may not be created yet. Skipping default users setup.');
        return;
      }
      console.error('Error checking for existing admin user:', adminCheckError);
      return;
    }

    if (adminExists && adminExists.length === 0) {
      // Create default admin user (this would typically be done manually or via Supabase Auth)
      console.log('Default users available for quick login:');
      console.log('Admin: email "admin@posman.com", password "admin123"');
      console.log('Staff: email "staff@posman.com", password "staff123"');
      console.log('Customer: email "customer@posman.com", password "customer123"');
    } else {
      console.log('Default users already exist or table is not yet created');
    }
  } catch (error: any) {
    console.error('Error creating default users:', error);
    // Jika error karena tabel belum ada, log dan lanjutkan
    if (error.code === 'PGRST205') {
      console.log('Users table may not be created yet. Skipping default users setup.');
      return;
    }
    // Jangan throw error karena ini hanya untuk setup awal
    console.log('Continuing without default users setup');
  }
};

// INVENTORY FUNCTIONS

// Create a new inventory item
export const createInventoryItem = async (item: Omit<InventoryItem, 'createdAt' | 'updatedAt'> & { code: string }): Promise<InventoryItem> => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([
        {
          code: item.code,
          name: item.name,
          description: item.description || null,
          category: item.category || null,
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          sku: item.sku || null,
          supplier: item.supplier || null,
          reorder_level: item.reorderLevel,
          min_order: item.minOrder || 1,
          is_active: item.isActive,
          created_at: timestamp,
          updated_at: timestamp
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      code: data.code,
      name: data.name,
      description: data.description || '',
      category: data.category || '',
      price: data.price,
      cost: data.cost,
      quantity: data.quantity,
      sku: data.sku || '',
      supplier: data.supplier || '',
      reorderLevel: data.reorder_level,
      minOrder: data.min_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    // Handle specific Supabase errors
    if (error.code === '23505') {
      if (error.message.includes('inventory_items_code_key')) {
        throw new Error(`The product code "${item.code}" is already in use. Please try again to generate a different code.`);
      } else if (error.message.includes('inventory_items_sku_key')) {
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
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(item => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorder_level,
      minOrder: item.min_order,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error getting all inventory items:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventoryItems = async (query: string): Promise<InventoryItem[]> => {
  try {
    // Check if query is numeric (likely a barcode)
    const isNumeric = /^\d+$/.test(query);
    
    let data: any[] = [];
    let error: any = null;
    
    if (isNumeric) {
      // For numeric queries (barcodes), do exact match on code or sku
      const result = await supabase
        .from('inventory_items')
        .select('*')
        .or(`code.eq.${query},sku.eq.${query}`)
        .order('name');
      
      data = result.data || [];
      error = result.error;
    } else {
      // For text queries, do partial matching
      const result = await supabase
        .from('inventory_items')
        .select('*')
        .or(`name.ilike.%${query}%,code.ilike.%${query}%,category.ilike.%${query}%,supplier.ilike.%${query}%,sku.ilike.%${query}%`)
        .order('name');
      
      data = result.data || [];
      error = result.error;
    }

    if (error) throw error;

    return data.map(item => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorder_level,
      minOrder: item.min_order,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error searching inventory items:', error);
    throw error;
  }
};

// Get inventory items by category
export const getInventoryItemsByCategory = async (category: string): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) throw error;

    return data.map(item => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorder_level,
      minOrder: item.min_order,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error getting inventory items by category:', error);
    throw error;
  }
};

// Get inventory items below reorder level
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .lte('quantity', supabase.rpc('reorder_level'))
      .eq('is_active', true)
      .order('quantity', { ascending: true });

    if (error) throw error;

    return data.map(item => ({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      sku: item.sku || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorder_level,
      minOrder: item.min_order,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error getting low stock items:', error);
    throw error;
  }
};

// Get inventory item by code
export const getInventoryItemByCode = async (code: string): Promise<InventoryItem | null> => {
  try {
    console.log('Mencari item di database dengan code/SKU:', code);
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .or(`code.eq.${code},sku.eq.${code}`)
      .single();

    console.log('Hasil pencarian di database:', data);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      code: data.code,
      name: data.name,
      description: data.description || '',
      category: data.category || '',
      price: data.price,
      cost: data.cost,
      quantity: data.quantity,
      sku: data.sku || '',
      supplier: data.supplier || '',
      reorderLevel: data.reorder_level,
      minOrder: data.min_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error getting inventory item by code:', error);
    throw error;
  }
};

// Update inventory item
export const updateInventoryItem = async (code: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const timestamp = new Date().toISOString();
    
    // Build update object
    const updateData: any = {
      updated_at: timestamp
    };
    
    if (item.name !== undefined) updateData.name = item.name;
    if (item.description !== undefined) updateData.description = item.description;
    if (item.category !== undefined) updateData.category = item.category;
    if (item.price !== undefined) updateData.price = item.price;
    if (item.cost !== undefined) updateData.cost = item.cost;
    if (item.quantity !== undefined) updateData.quantity = item.quantity;
    if (item.sku !== undefined) updateData.sku = item.sku;
    if (item.supplier !== undefined) updateData.supplier = item.supplier;
    if (item.reorderLevel !== undefined) updateData.reorder_level = item.reorderLevel;
    if (item.minOrder !== undefined) updateData.min_order = item.minOrder;
    if (item.isActive !== undefined) updateData.is_active = item.isActive;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) throw error;

    // Return updated item
    return {
      code: data.code,
      name: data.name,
      description: data.description || '',
      category: data.category || '',
      price: data.price,
      cost: data.cost,
      quantity: data.quantity,
      sku: data.sku || '',
      supplier: data.supplier || '',
      reorderLevel: data.reorder_level,
      minOrder: data.min_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    throw new Error(error.message || 'Failed to update inventory item');
  }
};

// Delete inventory item
export const deleteInventoryItem = async (code: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('code', code);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// INVENTORY TRANSACTION FUNCTIONS

// Create inventory transaction
export const createInventoryTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction> => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([
        {
          item_id: transaction.itemCode,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          reason: transaction.reason || null,
          reference: transaction.reference || null,
          created_by: transaction.createdBy,
          payment_method: transaction.paymentMethod || 'cash',
          created_at: timestamp
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      itemCode: data.item_id,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      reason: data.reason || '',
      reference: data.reference || '',
      createdAt: new Date(data.created_at),
      createdBy: data.created_by,
      paymentMethod: data.payment_method
    };
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    throw error;
  }
};

// Get inventory transactions by item code
export const getInventoryTransactionsByItemCode = async (itemCode: string): Promise<InventoryTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('item_id', itemCode)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(transaction => ({
      id: transaction.id,
      itemCode: transaction.item_id,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      reason: transaction.reason || '',
      reference: transaction.reference || '',
      createdAt: new Date(transaction.created_at),
      createdBy: transaction.created_by,
      paymentMethod: transaction.payment_method
    }));
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    throw error;
  }
};

// MEMBER FUNCTIONS

// Create a new member
export const createMember = async (member: Omit<Member, 'id' | 'totalPurchases' | 'totalPoints' | 'createdAt' | 'updatedAt'>): Promise<Member> => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('members')
      .insert([
        {
          name: member.name,
          phone_number: member.phoneNumber || null,
          email: member.email || null,
          birthday: member.birthday || null,
          total_purchases: 0,
          total_points: 0,
          last_transaction: null,
          created_at: timestamp,
          updated_at: timestamp
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      phoneNumber: data.phone_number || '',
      email: data.email || undefined,
      birthday: data.birthday || undefined,
      totalPurchases: data.total_purchases,
      totalPoints: data.total_points,
      lastTransaction: data.last_transaction || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

// Get all members
export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(member => ({
      id: member.id,
      name: member.name,
      phoneNumber: member.phone_number || '',
      email: member.email || undefined,
      birthday: member.birthday || undefined,
      totalPurchases: member.total_purchases,
      totalPoints: member.total_points,
      lastTransaction: member.last_transaction || undefined,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    }));
  } catch (error) {
    console.error('Error getting all members:', error);
    throw error;
  }
};

// Update member
export const updateMember = async (id: string, member: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member> => {
  try {
    const timestamp = new Date().toISOString();
    
    // Build update object
    const updateData: any = {
      updated_at: timestamp
    };
    
    if (member.name !== undefined) updateData.name = member.name;
    if (member.phoneNumber !== undefined) updateData.phone_number = member.phoneNumber;
    if (member.email !== undefined) updateData.email = member.email;
    if (member.birthday !== undefined) updateData.birthday = member.birthday;
    if (member.totalPurchases !== undefined) updateData.total_purchases = member.totalPurchases;
    if (member.totalPoints !== undefined) updateData.total_points = member.totalPoints;
    if (member.lastTransaction !== undefined) updateData.last_transaction = member.lastTransaction;

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Return updated member
    return {
      id: data.id,
      name: data.name,
      phoneNumber: data.phone_number || '',
      email: data.email || undefined,
      birthday: data.birthday || undefined,
      totalPurchases: data.total_purchases,
      totalPoints: data.total_points,
      lastTransaction: data.last_transaction || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Delete member
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Get member by ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      phoneNumber: data.phone_number || '',
      email: data.email || undefined,
      birthday: data.birthday || undefined,
      totalPurchases: data.total_purchases,
      totalPoints: data.total_points,
      lastTransaction: data.last_transaction || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting member by ID:', error);
    throw error;
  }
};

// Get member by phone number
export const getMemberByPhoneNumber = async (phoneNumber: string): Promise<Member | null> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      phoneNumber: data.phone_number || '',
      email: data.email || undefined,
      birthday: data.birthday || undefined,
      totalPurchases: data.total_purchases,
      totalPoints: data.total_points,
      lastTransaction: data.last_transaction || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting member by phone number:', error);
    throw error;
  }
};

// STORE SETTINGS FUNCTIONS

// Get store settings
export const getStoreSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'store_settings')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name || 'TOKO POSman',
      address: data.address || '',
      phone: data.phone || '',
      paperSize: data.paper_size || '80mm',
      printAuto: data.print_auto,
      discountEnabled: data.discount_enabled,
      taxEnabled: data.tax_enabled,
      taxPercentage: data.tax_percentage,
      footerMessage: data.footer_message || 'Terima kasih telah berbelanja di toko kami!',
      bluetoothDevice: data.bluetooth_device || '',
      syncEnabled: data.sync_enabled,
      lastSync: data.last_sync,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting store settings:', error);
    throw error;
  }
};

// Update store settings
export const updateStoreSettings = async (
  name: string,
  address: string,
  phone: string,
  paperSize: string,
  printAuto: boolean,
  discountEnabled: boolean,
  taxEnabled: boolean,
  taxPercentage: number,
  footerMessage: string,
  bluetoothDevice: string,
  syncEnabled: boolean,
  lastSync: number
) => {
  try {
    // Ensure name is not empty
    if (!name || name.trim() === '') {
      throw new Error('Store name cannot be empty');
    }
    
    const timestamp = new Date().toISOString();
    
    // Check if settings already exist
    const { data: existing } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'store_settings')
      .single();
    
    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('store_settings')
        .update({
          name,
          address: address || '',
          phone: phone || '',
          paper_size: paperSize || '80mm',
          print_auto: printAuto,
          discount_enabled: discountEnabled,
          tax_enabled: taxEnabled,
          tax_percentage: taxPercentage,
          footer_message: footerMessage || '',
          bluetooth_device: bluetoothDevice || '',
          sync_enabled: syncEnabled,
          last_sync: lastSync,
          updated_at: timestamp
        })
        .eq('id', 'store_settings');
      
      if (error) throw error;
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('store_settings')
        .insert([
          {
            id: 'store_settings',
            name,
            address: address || '',
            phone: phone || '',
            paper_size: paperSize || '80mm',
            print_auto: printAuto,
            discount_enabled: discountEnabled,
            tax_enabled: taxEnabled,
            tax_percentage: taxPercentage,
            footer_message: footerMessage || '',
            bluetooth_device: bluetoothDevice || '',
            sync_enabled: syncEnabled,
            last_sync: lastSync,
            created_at: timestamp,
            updated_at: timestamp
          }
        ]);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};

export default {
  createUser,
  getUserById,
  getAllUsers,
  updateUserLoginTime,
  createDefaultUsers,
  createInventoryItem,
  getAllInventoryItems,
  searchInventoryItems,
  getInventoryItemsByCategory,
  getLowStockItems,
  getInventoryItemByCode,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryTransaction,
  getInventoryTransactionsByItemCode,
  createMember,
  getAllMembers,
  updateMember,
  deleteMember,
  getMemberById,
  getMemberByPhoneNumber,
  getStoreSettings,
  updateStoreSettings
};