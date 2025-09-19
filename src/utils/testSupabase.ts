// File untuk menguji koneksi ke Supabase
import { supabase } from './src/config/supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Tes koneksi dengan mengambil info session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Supabase connection successful!');
    console.log('Session data:', data);
    
    // Tes query ke tabel users (jika ada)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('Note: Users table may not exist yet, which is expected during initial setup');
      console.log('Users table error:', usersError.message);
    } else {
      console.log('Users table query successful!');
      console.log('Sample users data:', users);
    }
  } catch (err) {
    console.error('Unexpected error during Supabase test:', err);
  }
}

// Jalankan test jika file dijalankan langsung
if (require.main === module) {
  testSupabaseConnection();
}

export default testSupabaseConnection;