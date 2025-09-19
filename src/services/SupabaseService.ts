// @ts-ignore
import { SUPABASE_CONFIG } from '../config/supabaseConfig';
import { createClient } from '@supabase/supabase-js';

// Gunakan konfigurasi dari file terpisah
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_KEY = SUPABASE_CONFIG.key;

// Buat supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Fungsi untuk menginisialisasi koneksi
export const initSupabase = () => {
  console.log('Supabase client initialized');
  return supabase;
};

// Fungsi untuk mengupload file backup ke Supabase Storage
export const uploadBackupFile = async (fileName: string, fileData: string) => {
  try {
    // Coba upload file
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(fileName, fileData, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      console.error('Upload error details:', error);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error uploading backup file:', error);
    
    // Coba alternatif: update file jika sudah ada
    try {
      const { data: updateData, error: updateError } = await supabase.storage
        .from('backups')
        .update(fileName, fileData, {
          contentType: 'application/json'
        });
      
      if (updateError) {
        throw updateError;
      }
      
      return updateData;
    } catch (updateError) {
      console.error('Error updating backup file:', updateError);
      throw error;
    }
  }
};

// Fungsi untuk mendownload file backup dari Supabase Storage
export const downloadBackupFile = async (fileName: string) => {
  try {
    // Dapatkan URL publik untuk file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('backups')
      .createSignedUrl(fileName, 60); // URL berlaku 60 detik

    if (urlError) {
      throw urlError;
    }

    // Download file menggunakan fetch
    const response = await fetch(urlData.signedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error downloading backup file:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan daftar file backup
export const listBackupFiles = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('backups')
      .list();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error listing backup files:', error);
    throw error;
  }
};

export default supabase;