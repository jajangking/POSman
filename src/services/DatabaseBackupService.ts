import { supabase, uploadBackupFile, downloadBackupFile } from './SupabaseService';
import { openDatabase } from './DatabaseService';
import { encryptBackupFile, decryptBackupFile } from './EncryptionService';
import { compressBackupFile, decompressBackupFile } from './CompressionService';
import { 
  showBackupSuccessNotification, 
  showBackupFailureNotification,
  showRestoreSuccessNotification,
  showRestoreFailureNotification
} from './NotificationService';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

// Fungsi untuk mengekspor seluruh database ke JSON
export const exportDatabaseToJson = async () => {
  try {
    const db = await openDatabase();
    
    // Daftar tabel yang ingin kita ekspor
    const tableNames = [
      'users',
      'inventory_items',
      'inventory_transactions',
      'sales_data',
      'categories'
    ];
    
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      },
      data: {}
    };
    
    // Dapatkan daftar tabel yang benar-benar ada di database
    const existingTablesResult = await db.execAsync("SELECT name FROM sqlite_master WHERE type='table'", [], true);
    // Perbaiki akses ke hasil query untuk menghindari null value error
    const existingTablesArray = existingTablesResult && existingTablesResult.length > 0 ? existingTablesResult[0].rows?._array : [];
    const existingTables = existingTablesArray ? existingTablesArray.map((row: any) => row.name) : [];
    console.log('Existing tables in database:', existingTables);
    
    // Peringatkan jika tidak ada tabel yang ditemukan
    if (existingTables.length === 0) {
      console.warn('No tables found in database. Database may not be initialized.');
    }
    
    // Ekspor data hanya dari tabel yang ada
    for (const table of tableNames) {
      // Hanya ekspor tabel yang benar-benar ada
      if (existingTables.includes(table)) {
        try {
          console.log(`Exporting data from table: ${table}`);
          // Gunakan execAsync dan dapatkan hasilnya
          const result = await db.execAsync(`SELECT * FROM ${table}`, [], true);
          // Hasil dari execAsync dengan parameter ketiga true adalah array dari statement results
          // Perbaiki akses ke hasil query untuk menghindari null value error
          if (result && result.length > 0 && result[0].rows && result[0].rows._array) {
            exportData.data[table] = result[0].rows._array || [];
            console.log(`Successfully exported ${exportData.data[table].length} records from ${table}`);
          } else {
            exportData.data[table] = [];
            console.log(`No data found in table ${table}`);
          }
        } catch (error) {
          console.warn(`Failed to export table ${table}:`, error);
          exportData.data[table] = [];
        }
      } else {
        console.log(`Skipping table ${table} as it doesn't exist in database`);
        exportData.data[table] = [];
      }
    }
    
    return exportData;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

// Fungsi untuk membuat backup database (hanya upload ke Supabase)
export const backupDatabase = async (userId?: string) => {
  try {
    // Ekspor database ke JSON
    const exportData = await exportDatabaseToJson();
    
    // Buat nama file dengan timestamp dan user ID jika tersedia
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = userId 
      ? `posman-backup-${userId}-${timestamp}.json`
      : `posman-backup-${timestamp}.json`;
    
    // Konversi ke string JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Kompresi data sebelum enkripsi
    const compressedData = compressBackupFile(jsonString);
    
    // Enkripsi data setelah dikompresi
    const encryptedData = encryptBackupFile(compressedData);
    
    // Upload langsung ke Supabase Storage (terkompresi & terenkripsi)
    await uploadBackupFile(fileName, encryptedData);
    
    console.log(`Database backup created and uploaded: ${fileName}`);
    
    // Tampilkan notifikasi sukses
    await showBackupSuccessNotification(fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error creating database backup:', error);
    
    // Tampilkan notifikasi gagal
    await showBackupFailureNotification((error as Error).message);
    
    throw error;
  }
};

// Fungsi untuk mendapatkan file backup terakhir dari Supabase
export const getLatestBackupFromSupabase = async (userId?: string) => {
  try {
    // Dapatkan daftar file dari Supabase Storage
    const { data, error } = await supabase.storage.from('backups').list('', {
      sortBy: { column: 'name', order: 'desc' }
    });
    
    if (error) {
      throw new Error(`Failed to list backup files: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      // Throw a more specific error that can be handled differently
      throw new Error('NO_BACKUP_FILES');
    }
    
    // Filter backups by user ID if provided
    let filteredData = data;
    if (userId) {
      // Filter to only include backups for this specific user
      filteredData = data.filter(file => 
        file.name.startsWith(`posman-backup-${userId}-`)
      );
      
      // If no user-specific backups found, try generic ones
      if (filteredData.length === 0) {
        filteredData = data.filter(file => 
          file.name.startsWith('posman-backup-') && !file.name.includes('-') // Generic backups
        );
      }
    }
    
    if (filteredData.length === 0) {
      throw new Error('NO_BACKUP_FILES');
    }
    
    // Ambil file terakhir (berdasarkan nama yang diurutkan descending)
    const latestBackup = filteredData[0];
    if (!latestBackup.name) {
      throw new Error('Invalid backup file found');
    }
    
    return latestBackup.name;
  } catch (error) {
    console.error('Error getting latest backup from Supabase:', error);
    throw error;
  }
};

// Fungsi untuk merestore database dari backup terakhir di Supabase
export const restoreDatabase = async (userId?: string) => {
  try {
    // Dapatkan nama file backup terakhir dari Supabase
    const fileName = await getLatestBackupFromSupabase(userId);
    
    // Download file dari Supabase menggunakan fungsi yang sudah ada
    const response = await downloadBackupFile(fileName);
    if (!response) {
      throw new Error('Backup file not found');
    }
    
    // Baca data sebagai teks menggunakan response.text()
    const fileText = await response.text();
    
    // Periksa apakah fileText adalah JSON yang valid
    if (!fileText || fileText.trim() === '') {
      throw new Error('Backup file is empty');
    }
    
    let processedData;
    
    // Coba parse sebagai JSON terlebih dahulu (untuk backup yang tidak terenkripsi)
    try {
      processedData = JSON.parse(fileText);
      console.log('Successfully parsed backup as plain JSON');
    } catch (jsonError) {
      console.log('File is not plain JSON, attempting to decrypt and decompress');
      
      // Jika bukan JSON, coba dekripsi dan dekompresi dengan pendekatan bertahap
      let decryptedText = fileText;
      let decompressedText = fileText;
      
      // Coba dekripsi
      try {
        decryptedText = decryptBackupFile(fileText);
        console.log('Decryption successful');
      } catch (decryptError) {
        console.log('Decryption failed or not needed');
      }
      
      // Coba dekompresi
      try {
        decompressedText = decompressBackupFile(decryptedText);
        console.log('Decompression successful');
      } catch (decompressError) {
        console.log('Decompression failed or not needed');
        decompressedText = decryptedText;
      }
      
      // Coba parse JSON dari data yang sudah diproses
      try {
        processedData = JSON.parse(decompressedText);
        console.log('Successfully parsed processed backup data');
      } catch (finalParseError) {
        // Jika masih gagal, coba bersihkan karakter yang tidak valid
        console.log('Final JSON parse failed, attempting to clean data');
        try {
          // Bersihkan karakter yang tidak valid
          let cleanedText = decompressedText;
          
          // Hapus karakter null atau kontrol yang tidak valid
          cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          
          // Hapus karakter quote berlebih yang tampaknya menyebabkan masalah
          cleanedText = cleanedText.replace(/"{3,}/g, '"');
          
          // Coba parse lagi
          processedData = JSON.parse(cleanedText);
          console.log('Successfully parsed cleaned backup data');
        } catch (cleanParseError) {
          console.error('Cleaned JSON parse failed. Data preview:', decompressedText.substring(0, 200));
          throw new Error('Backup file is not valid JSON and cannot be processed');
        }
      }
    }
    
    // Validasi struktur data yang diproses
    if (!processedData || typeof processedData !== 'object') {
      throw new Error('Invalid backup data structure: processedData is not an object');
    }
    
    if (!processedData.data || typeof processedData.data !== 'object') {
      throw new Error('Invalid backup data structure: processedData.data is missing or not an object');
    }
    
    const db = await openDatabase();
    
    // Dapatkan daftar tabel yang ada di database
    const existingTablesResult = await db.execAsync("SELECT name FROM sqlite_master WHERE type='table'", [], true);
    // Perbaiki akses ke hasil query untuk menghindari null value error
    const existingTablesArray = existingTablesResult && existingTablesResult.length > 0 ? existingTablesResult[0].rows?._array : [];
    const existingTables = existingTablesArray ? existingTablesArray.map((row: any) => row.name) : [];
    console.log('Existing tables:', existingTables);
    
    // Mulai transaksi
    await db.execAsync('BEGIN TRANSACTION;');
    
    try {
      // Bersihkan tabel yang ada datanya (hanya tabel yang benar-benar ada)
      const tables = Object.keys(processedData.data);
      console.log('Tables in backup data:', tables);
      
      for (const table of tables) {
        try {
          // Hanya proses tabel yang benar-benar ada di database
          if (existingTables.includes(table)) {
            console.log(`Processing table: ${table}`);
            
            // Hapus semua data dari tabel
            await db.execAsync(`DELETE FROM ${table};`);
            
            // Reset auto-increment jika perlu
            try {
              await db.execAsync(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
            } catch (error) {
              // Abaikan error jika tabel tidak memiliki auto-increment
              console.log(`No sqlite_sequence for table ${table}, continuing...`);
            }
            
            // Masukkan data dari backup
            const records = processedData.data[table];
            console.log(`Records for table ${table}:`, Array.isArray(records) ? records.length : 'Not an array');
            
            // Periksa apakah records adalah array yang valid
            if (records && Array.isArray(records) && records.length > 0) {
              console.log(`Inserting ${records.length} records into ${table}`);
              for (let i = 0; i < records.length; i++) {
                const record = records[i];
                console.log(`Processing record ${i} in table ${table}:`, typeof record, record);
                
                // Pastikan record adalah objek yang valid
                if (record && typeof record === 'object' && !Array.isArray(record)) {
                  try {
                    // Filter out null/undefined values and handle them properly
                    const columns = [];
                    const params = [];
                    
                    for (const [key, value] of Object.entries(record)) {
                      // Hanya tambahkan kolom dengan nilai yang tidak null/undefined
                      if (value !== null && value !== undefined) {
                        columns.push(key);
                        params.push(value);
                      } else {
                        // Untuk nilai null/undefined, tetap tambahkan ke kolom tapi dengan nilai null
                        columns.push(key);
                        params.push(null);
                      }
                    }
                    
                    // Buat query INSERT dengan parameter
                    if (columns.length > 0) {
                      const values = columns.map(() => '?').join(', ');
                      const columnNames = columns.join(', ');
                      
                      const query = `INSERT INTO ${table} (${columnNames}) VALUES (${values})`;
                      console.log(`Executing query for table ${table}:`, query, params);
                      
                      await db.execAsync(query, params);
                    }
                  } catch (recordError) {
                    console.error(`Error processing record ${i} in table ${table}:`, recordError);
                    console.error(`Record content:`, record);
                  }
                } else {
                  console.log(`Skipping invalid record ${i} in table ${table}:`, typeof record, record);
                }
              }
            } else {
              console.log(`No valid records to insert into ${table}`);
            }
          } else {
            console.log(`Skipping table ${table} as it doesn't exist in current database`);
          }
        } catch (tableError) {
          console.error(`Error processing table ${table}:`, tableError);
        }
      }
      
      // Commit transaksi
      await db.execAsync('COMMIT;');
      
      console.log(`Database restored from: ${fileName}`);
      
      // Tampilkan notifikasi sukses
      await showRestoreSuccessNotification();
      
      return true;
    } catch (error) {
      // Rollback jika ada error
      try {
        await db.execAsync('ROLLBACK;');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error restoring database:', error);
    
    // Tangani error khusus untuk kasus tidak ada file backup
    if (error.message === 'NO_BACKUP_FILES') {
      // Tampilkan notifikasi yang lebih ramah pengguna
      await showRestoreFailureNotification('Tidak ada file backup yang ditemukan di penyimpanan cloud. Silakan buat backup terlebih dahulu.');
      throw new Error('Tidak ada file backup yang ditemukan di penyimpanan cloud. Silakan buat backup terlebih dahulu.');
    }
    
    // Tampilkan notifikasi gagal untuk error lainnya
    await showRestoreFailureNotification((error as Error).message);
    
    throw error;
  }
};

// Fungsi untuk mengekspor database ke file lokal
export const exportDatabaseToFile = async () => {
  try {
    // Ekspor database ke JSON
    const exportData = await exportDatabaseToJson();
    
    // Buat nama file dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `posman-export-${timestamp}.json`;
    
    // Konversi ke string JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Kompresi data sebelum enkripsi
    const compressedData = compressBackupFile(jsonString);
    
    // Enkripsi data setelah dikompresi
    const encryptedData = encryptBackupFile(compressedData);
    
    // Tentukan path file
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    // Tulis file ke sistem file
    await FileSystem.writeAsStringAsync(fileUri, encryptedData);
    
    // Bagikan file
    await shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Database',
    });
    
    console.log(`Database exported to file: ${fileName}`);
    
    return fileName;
  } catch (error) {
    console.error('Error exporting database to file:', error);
    throw error;
  }
};

// Fungsi untuk mengimpor database dari konten string
export const importDatabaseFromContent = async (content: string) => {
  try {
    // Periksa apakah content adalah JSON yang valid
    if (!content || content.trim() === '') {
      throw new Error('Backup content is empty');
    }
    
    let processedData;
    
    // Coba dekripsi dan dekompresi dengan pendekatan bertahap
    let decryptedText = content;
    let decompressedText = content;
    
    // Coba dekripsi
    try {
      decryptedText = decryptBackupFile(content);
      console.log('Decryption successful');
    } catch (decryptError) {
      console.log('Decryption failed or not needed');
    }
    
    // Coba dekompresi
    try {
      decompressedText = decompressBackupFile(decryptedText);
      console.log('Decompression successful');
    } catch (decompressError) {
      console.log('Decompression failed or not needed');
      decompressedText = decryptedText;
    }
    
    // Coba parse JSON dari data yang sudah diproses
    try {
      processedData = JSON.parse(decompressedText);
      console.log('Successfully parsed processed backup data');
    } catch (finalParseError) {
      // Jika masih gagal, coba bersihkan karakter yang tidak valid
      console.log('Final JSON parse failed, attempting to clean data');
      try {
        // Bersihkan karakter yang tidak valid
        let cleanedText = decompressedText;
        
        // Hapus karakter null atau kontrol yang tidak valid
        cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Hapus karakter quote berlebih yang tampaknya menyebabkan masalah
        cleanedText = cleanedText.replace(/"{3,}/g, '"');
        
        // Coba parse lagi
        processedData = JSON.parse(cleanedText);
        console.log('Successfully parsed cleaned backup data');
      } catch (cleanParseError) {
        console.error('Cleaned JSON parse failed. Data preview:', decompressedText.substring(0, 200));
        throw new Error('Backup content is not valid JSON and cannot be processed');
      }
    }
    
    // Validasi struktur data yang diproses
    if (!processedData || typeof processedData !== 'object') {
      throw new Error('Invalid backup data structure: processedData is not an object');
    }
    
    if (!processedData.data || typeof processedData.data !== 'object') {
      throw new Error('Invalid backup data structure: processedData.data is missing or not an object');
    }
    
    const db = await openDatabase();
    
    // Dapatkan daftar tabel yang ada di database
    const existingTablesResult = await db.execAsync("SELECT name FROM sqlite_master WHERE type='table'", [], true);
    // Perbaiki akses ke hasil query untuk menghindari null value error
    const existingTablesArray = existingTablesResult && existingTablesResult.length > 0 ? existingTablesResult[0].rows?._array : [];
    const existingTables = existingTablesArray ? existingTablesArray.map((row: any) => row.name) : [];
    console.log('Existing tables:', existingTables);
    
    // Mulai transaksi
    await db.execAsync('BEGIN TRANSACTION;');
    
    try {
      // Bersihkan tabel yang ada datanya (hanya tabel yang benar-benar ada)
      const tables = Object.keys(processedData.data);
      console.log('Tables in backup data:', tables);
      
      for (const table of tables) {
        try {
          // Hanya proses tabel yang benar-benar ada di database
          if (existingTables.includes(table)) {
            console.log(`Processing table: ${table}`);
            
            // Hapus semua data dari tabel
            await db.execAsync(`DELETE FROM ${table};`);
            
            // Reset auto-increment jika perlu
            try {
              await db.execAsync(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
            } catch (error) {
              // Abaikan error jika tabel tidak memiliki auto-increment
              console.log(`No sqlite_sequence for table ${table}, continuing...`);
            }
            
            // Masukkan data dari backup
            const records = processedData.data[table];
            console.log(`Records for table ${table}:`, Array.isArray(records) ? records.length : 'Not an array');
            
            // Periksa apakah records adalah array yang valid
            if (records && Array.isArray(records) && records.length > 0) {
              console.log(`Inserting ${records.length} records into ${table}`);
              for (let i = 0; i < records.length; i++) {
                const record = records[i];
                console.log(`Processing record ${i} in table ${table}:`, typeof record, record);
                
                // Pastikan record adalah objek yang valid
                if (record && typeof record === 'object' && !Array.isArray(record)) {
                  try {
                    // Filter out null/undefined values and handle them properly
                    const columns = [];
                    const params = [];
                    
                    for (const [key, value] of Object.entries(record)) {
                      // Hanya tambahkan kolom dengan nilai yang tidak null/undefined
                      if (value !== null && value !== undefined) {
                        columns.push(key);
                        params.push(value);
                      } else {
                        // Untuk nilai null/undefined, tetap tambahkan ke kolom tapi dengan nilai null
                        columns.push(key);
                        params.push(null);
                      }
                    }
                    
                    // Buat query INSERT dengan parameter
                    if (columns.length > 0) {
                      const values = columns.map(() => '?').join(', ');
                      const columnNames = columns.join(', ');
                      
                      const query = `INSERT INTO ${table} (${columnNames}) VALUES (${values})`;
                      console.log(`Executing query for table ${table}:`, query, params);
                      
                      await db.execAsync(query, params);
                    }
                  } catch (recordError) {
                    console.error(`Error processing record ${i} in table ${table}:`, recordError);
                    console.error(`Record content:`, record);
                  }
                } else {
                  console.log(`Skipping invalid record ${i} in table ${table}:`, typeof record, record);
                }
              }
            } else {
              console.log(`No valid records to insert into ${table}`);
            }
          } else {
            console.log(`Skipping table ${table} as it doesn't exist in current database`);
          }
        } catch (tableError) {
          console.error(`Error processing table ${table}:`, tableError);
        }
      }
      
      // Commit transaksi
      await db.execAsync('COMMIT;');
      
      console.log(`Database imported from content successfully`);
      
      // Tampilkan notifikasi sukses
      await showRestoreSuccessNotification();
      
      return true;
    } catch (error) {
      // Rollback jika ada error
      try {
        await db.execAsync('ROLLBACK;');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error importing database from content:', error);
    
    // Tampilkan notifikasi gagal
    await showRestoreFailureNotification((error as Error).message);
    
    throw error;
  }
};

export default {
  backupDatabase,
  exportDatabaseToJson,
  restoreDatabase,
  exportDatabaseToFile,
  importDatabaseFromContent
};