import { supabase } from './src/services/SupabaseService';

async function createBackupsBucket() {
  try {
    console.log('Creating backups bucket...');
    
    // Create a new bucket
    const { data, error } = await supabase
      .storage
      .createBucket('backups', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 100, // 100MB limit
      });
    
    if (error) {
      console.log('Failed to create bucket:', error.message);
      return;
    }
    
    console.log('Bucket created successfully:', data);
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
}

createBackupsBucket();