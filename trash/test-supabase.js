import { supabase } from './src/services/SupabaseService';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection by getting user count (or any simple query)
    const { data, error } = await supabase
      .from('users')
      .select('count()', { count: 'exact' });
    
    if (error) {
      console.log('Connection test failed:', error.message);
      return;
    }
    
    console.log('Supabase connection successful!');
    console.log('Test query result:', data);
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
}

testSupabaseConnection();