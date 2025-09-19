import { supabase } from './src/services/SupabaseService';

async function testStorageAccess() {
  try {
    console.log('Testing Supabase Storage access...');
    
    // Test upload a simple file
    const testFileName = 'test-access.txt';
    const testContent = 'Test access to storage';
    
    console.log('Uploading test file...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.log('Upload failed:', uploadError.message);
      // Try update instead
      console.log('Trying update...');
      const { data: updateData, error: updateError } = await supabase.storage
        .from('backups')
        .update(testFileName, testContent, {
          contentType: 'text/plain'
        });
      
      if (updateError) {
        console.log('Update also failed:', updateError.message);
        return;
      }
      console.log('Update successful:', updateData);
    } else {
      console.log('Upload successful:', uploadData);
    }
    
    // Test list files
    console.log('Listing files...');
    const { data: listData, error: listError } = await supabase.storage
      .from('backups')
      .list();
    
    if (listError) {
      console.log('List failed:', listError.message);
    } else {
      console.log('List successful. Files found:', listData?.length || 0);
      if (listData && listData.length > 0) {
        console.log('First file:', listData[0]);
      }
    }
    
    // Clean up - delete test file
    console.log('Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('backups')
      .remove([testFileName]);
    
    if (deleteError) {
      console.log('Delete failed:', deleteError.message);
    } else {
      console.log('Test file deleted successfully');
    }
    
    console.log('Storage access test completed successfully!');
  } catch (error) {
    console.error('Error testing storage access:', error);
  }
}

testStorageAccess();