// File untuk membuat user default di Supabase Auth
import { supabase } from './src/config/supabase';

async function createDefaultUsers() {
  console.log('Creating default users in Supabase Auth...');
  
  const defaultUsers = [
    {
      email: 'admin@posman.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrator'
    },
    {
      email: 'staff@posman.com',
      password: 'staff123',
      role: 'staff',
      name: 'Staff Member'
    },
    {
      email: 'customer@posman.com',
      password: 'customer123',
      role: 'customer',
      name: 'Customer User'
    }
  ];
  
  try {
    for (const user of defaultUsers) {
      // Cek apakah user sudah ada
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`Error checking existing users:`, listError);
        continue;
      }
      
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      if (existingUser) {
        console.log(`User ${user.email} already exists`);
        continue;
      }
      
      // Buat user baru
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      
      if (error) {
        console.error(`Error creating user ${user.email}:`, error);
        continue;
      }
      
      console.log(`User ${user.email} created successfully with ID: ${data.user.id}`);
    }
    
    console.log('Default users creation process completed');
  } catch (err) {
    console.error('Unexpected error during user creation:', err);
  }
}

// Jalankan jika file dijalankan langsung
if (require.main === module) {
  createDefaultUsers();
}

export default createDefaultUsers;