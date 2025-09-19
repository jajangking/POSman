// File untuk mengecek user di Supabase Auth
import { supabase } from './src/config/supabase';

async function checkUsers() {
  console.log('Checking users in Supabase Auth...');
  
  try {
    // Cek apakah ada user dengan email admin@posman.com
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users in Supabase Auth`);
    
    // Cari user admin
    const adminUser = users?.find(user => user.email === 'admin@posman.com');
    if (adminUser) {
      console.log('Admin user found:', adminUser);
    } else {
      console.log('Admin user not found');
    }
    
    // Tampilkan semua user
    users?.forEach(user => {
      console.log(`- ${user.email} (${user.id})`);
    });
  } catch (err) {
    console.error('Unexpected error during user check:', err);
  }
}

// Jalankan test jika file dijalankan langsung
if (require.main === module) {
  checkUsers();
}

export default checkUsers;