// SupabaseSyncService.ts
// Layanan untuk sinkronisasi real-time antara SQLite dan Supabase

import { supabase } from './SupabaseService';
import { openDatabase } from './DatabaseService';
import { 
  showSyncSuccessNotification, 
  showSyncFailureNotification 
} from './NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipe data untuk perubahan database
export interface DatabaseChange {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  data: any;
  timestamp: string;
  device_id: string;
  synced: boolean;
}

class SupabaseSyncService {
  private deviceId: string;
  private syncEnabled: boolean = false;
  private lastSyncTimestamp: string = '';
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Generate device ID unik untuk perangkat ini
    this.deviceId = this.generateDeviceId();
    this.loadSyncMetadata();
  }

  // Generate device ID unik
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  // Muat metadata sinkronisasi dari storage
  private async loadSyncMetadata() {
    try {
      const metadataStr = await AsyncStorage.getItem('supabase_sync_metadata');
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        this.lastSyncTimestamp = metadata.lastSyncTimestamp;
        this.syncEnabled = metadata.syncEnabled;
      }
    } catch (error) {
      console.log('Error loading sync metadata:', error);
    }
  }

  // Simpan metadata sinkronisasi ke storage
  private async saveSyncMetadata() {
    try {
      const metadata = {
        lastSyncTimestamp: this.lastSyncTimestamp,
        deviceId: this.deviceId,
        syncEnabled: this.syncEnabled
      };
      await AsyncStorage.setItem('supabase_sync_metadata', JSON.stringify(metadata));
    } catch (error) {
      console.log('Error saving sync metadata:', error);
    }
  }

  // Aktifkan sinkronisasi
  public async enableSync() {
    this.syncEnabled = true;
    await this.saveSyncMetadata();
    this.startSyncInterval();
  }

  // Nonaktifkan sinkronisasi
  public async disableSync() {
    this.syncEnabled = false;
    await this.saveSyncMetadata();
    this.stopSyncInterval();
  }

  // Mulai interval sinkronisasi
  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sinkronisasi setiap 30 detik
    this.syncInterval = setInterval(() => {
      if (this.syncEnabled) {
        this.syncWithSupabase();
      }
    }, 30000);
  }

  // Hentikan interval sinkronisasi
  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sinkronisasi dengan Supabase
  public async syncWithSupabase() {
    if (!this.syncEnabled) {
      return;
    }

    try {
      console.log('Starting sync with Supabase...');
      
      // 1. Kirim perubahan lokal ke Supabase
      await this.pushLocalChanges();
      
      // 2. Ambil perubahan dari Supabase dan terapkan lokal
      await this.pullRemoteChanges();
      
      // 3. Update timestamp terakhir sinkronisasi
      this.lastSyncTimestamp = new Date().toISOString();
      await this.saveSyncMetadata();
      
      console.log('Sync with Supabase completed');
      
      // Tampilkan notifikasi sukses
      await showSyncSuccessNotification();
    } catch (error) {
      console.error('Error during sync with Supabase:', error);
      
      // Tampilkan notifikasi gagal
      await showSyncFailureNotification((error as Error).message);
    }
  }

  // Kirim perubahan lokal ke Supabase
  private async pushLocalChanges() {
    try {
      const db = await openDatabase();
      
      // Ambil perubahan yang belum disinkronkan
      const result = await db.executeSql(
        `SELECT * FROM sync_log WHERE synced = 0 AND device_id = ? ORDER BY timestamp ASC`,
        [this.deviceId]
      );
      
      // Perbaiki akses ke hasil query untuk menghindari null value error
      const pendingChanges = result && result.length > 0 && result[0].rows && result[0].rows._array ? result[0].rows._array : [];
      
      // Kirim setiap perubahan ke Supabase
      for (const change of pendingChanges) {
        try {
          const { error } = await supabase
            .from('sync_log')
            .insert({
              id: change.id,
              table_name: change.table_name,
              operation: change.operation,
              record_id: change.record_id,
              data: change.data,
              timestamp: change.timestamp,
              device_id: change.device_id,
              synced: true,
              user_id: null // Untuk production, gunakan user ID yang sebenarnya
            });
          
          if (error) {
            console.error('Error pushing change to Supabase:', error);
          } else {
            // Tandai perubahan sebagai sudah disinkronkan
            await db.executeSql(
              `UPDATE sync_log SET synced = 1 WHERE id = ?`,
              [change.id]
            );
          }
        } catch (error) {
          console.error('Error processing change:', error);
        }
      }
      
      console.log(`Pushed ${pendingChanges.length} changes to Supabase`);
    } catch (error) {
      console.error('Error pushing local changes:', error);
    }
  }

  // Ambil perubahan dari Supabase dan terapkan lokal
  private async pullRemoteChanges() {
    try {
      const db = await openDatabase();
      
      // Tentukan timestamp untuk query
      const since = this.lastSyncTimestamp || new Date(0).toISOString();
      
      // Ambil perubahan dari Supabase yang terjadi setelah last sync
      // dan bukan berasal dari device ini
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .gt('timestamp', since)
        .neq('device_id', this.deviceId)
        .eq('synced', true)
        .order('timestamp', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No remote changes to pull');
        return;
      }
      
      // Terapkan setiap perubahan ke database lokal
      for (const change of data) {
        try {
          await this.applyRemoteChange(change);
        } catch (error) {
          console.error('Error applying remote change:', error);
        }
      }
      
      console.log(`Pulled ${data.length} changes from Supabase`);
    } catch (error) {
      console.error('Error pulling remote changes:', error);
    }
  }

  // Terapkan perubahan remote ke database lokal
  private async applyRemoteChange(change: any) {
    try {
      const db = await openDatabase();
      
      // Periksa apakah perubahan ini sudah ada di log lokal
      const result = await db.executeSql(
        `SELECT id FROM sync_log WHERE id = ?`,
        [change.id]
      );
      
      // Jika sudah ada, abaikan
      // Perbaiki akses ke hasil query untuk menghindari null value error
      if (result && result.length > 0 && result[0].rows && result[0].rows.length > 0) {
        return;
      }
      
      // Terapkan perubahan ke tabel yang sesuai
      switch (change.operation) {
        case 'INSERT':
          await this.applyInsertOperation(db, change);
          break;
        case 'UPDATE':
          await this.applyUpdateOperation(db, change);
          break;
        case 'DELETE':
          await this.applyDeleteOperation(db, change);
          break;
      }
      
      // Tambahkan ke log lokal dengan flag synced = true
      await db.executeSql(
        `INSERT INTO sync_log (id, table_name, operation, record_id, data, timestamp, device_id, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          change.id,
          change.table_name,
          change.operation,
          change.record_id,
          JSON.stringify(change.data),
          change.timestamp,
          change.device_id,
          1 // synced = true
        ]
      );
      
      console.log(`Applied remote change: ${change.operation} on ${change.table_name}`);
    } catch (error) {
      console.error('Error applying remote change:', error);
      throw error;
    }
  }

  // Terapkan operasi INSERT
  private async applyInsertOperation(db: any, change: any) {
    try {
      const data = change.data;
      const columns = Object.keys(data);
      const values = columns.map(() => '?').join(', ');
      const columnNames = columns.join(', ');
      const params = columns.map(col => data[col]);
      
      const query = `INSERT INTO ${change.table_name} (${columnNames}) VALUES (${values})`;
      await db.executeSql(query, params);
    } catch (error) {
      console.error('Error applying INSERT operation:', error);
      throw error;
    }
  }

  // Terapkan operasi UPDATE
  private async applyUpdateOperation(db: any, change: any) {
    try {
      const data = change.data;
      const columns = Object.keys(data).filter(col => col !== 'id');
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const params = columns.map(col => data[col]);
      params.push(data.id); // Untuk WHERE clause
      
      const query = `UPDATE ${change.table_name} SET ${setClause} WHERE id = ?`;
      await db.executeSql(query, params);
    } catch (error) {
      console.error('Error applying UPDATE operation:', error);
      throw error;
    }
  }

  // Terapkan operasi DELETE
  private async applyDeleteOperation(db: any, change: any) {
    try {
      const query = `DELETE FROM ${change.table_name} WHERE id = ?`;
      await db.executeSql(query, [change.record_id]);
    } catch (error) {
      console.error('Error applying DELETE operation:', error);
      throw error;
    }
  }

  // Tambahkan perubahan ke log sinkronisasi
  public async logChange(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: any
  ) {
    if (!this.syncEnabled) {
      return;
    }

    try {
      const db = await openDatabase();
      
      const change: DatabaseChange = {
        id: Math.random().toString(36).substr(2, 9),
        table_name: tableName,
        operation,
        record_id: recordId,
        data,
        timestamp: new Date().toISOString(),
        device_id: this.deviceId,
        synced: false
      };

      // Simpan perubahan ke tabel log lokal
      await db.executeSql(
        `INSERT INTO sync_log (id, table_name, operation, record_id, data, timestamp, device_id, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          change.id,
          change.table_name,
          change.operation,
          change.record_id,
          JSON.stringify(change.data),
          change.timestamp,
          change.device_id,
          0 // synced = false
        ]
      );
      
      console.log('Logged change:', change);
    } catch (error) {
      console.error('Error logging change:', error);
    }
  }

  // Bersihkan layanan
  public cleanup() {
    this.stopSyncInterval();
  }

  // Getter untuk status sinkronisasi
  public isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  public getLastSyncTimestamp(): string {
    return this.lastSyncTimestamp;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }
}

// Export instance singleton
export default new SupabaseSyncService();