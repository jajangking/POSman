import { supabase } from './src/services/SupabaseService';

async function setupBackupsBucket() {
  try {
    console.log('Setting up backups bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('Error listing buckets:', listError.message);
      return;
    }
    
    const backupsBucket = buckets?.find(bucket => bucket.name === 'backups');
    
    if (backupsBucket) {
      console.log('Backups bucket already exists');
    } else {
      console.log('Creating backups bucket...');
      const { data, error } = await supabase.storage.createBucket('backups', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 100, // 100MB
      });
      
      if (error) {
        console.log('Failed to create bucket:', error.message);
        return;
      }
      
      console.log('Bucket created successfully:', data);
    }
    
    // Setup policies
    console.log('Setting up policies...');
    // Note: Policies need to be set up in the Supabase dashboard or via SQL
    
  } catch (error) {
    console.error('Error setting up backups bucket:', error);
  }
}

setupBackupsBucket();