// DatabaseSyncService.ts
// Layanan untuk sinkronisasi database real-time antar perangkat

import { Database } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './DatabaseService';

// Tipe data untuk perubahan database
export interface DatabaseChange {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  deviceId: string;
}

// Tipe data untuk metadata sinkronisasi
export interface SyncMetadata {
  lastSyncTimestamp: number;
  deviceId: string;
  syncEnabled: boolean;
}

class DatabaseSyncService {
  private db: Database | null = null;
  private deviceId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncEnabled: boolean = false;
  private lastSyncTimestamp: number = 0;

  constructor() {
    // Generate device ID unik untuk perangkat ini
    this.deviceId = this.generateDeviceId();
    this.loadSyncMetadata();
  }

  // Generate device ID unik
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  // Inisialisasi database
  private async initializeDatabase() {
    if (!this.db) {
      this.db = await getDatabase();
    }
  }

  // Muat metadata sinkronisasi dari storage
  private async loadSyncMetadata() {
    try {
      const metadataStr = await AsyncStorage.getItem('sync_metadata');
      if (metadataStr) {
        const metadata: SyncMetadata = JSON.parse(metadataStr);
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
      const metadata: SyncMetadata = {
        lastSyncTimestamp: this.lastSyncTimestamp,
        deviceId: this.deviceId,
        syncEnabled: this.syncEnabled
      };
      await AsyncStorage.setItem('sync_metadata', JSON.stringify(metadata));
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
        this.syncDatabase();
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

  // Sinkronisasi database dengan perangkat lain
  public async syncDatabase() {
    if (!this.syncEnabled || !this.db) {
      return;
    }

    try {
      console.log('Starting database sync...');
      
      // Dalam implementasi nyata, di sini kita akan:
      // 1. Mengambil perubahan terbaru dari database lokal
      // 2. Mengirim perubahan tersebut ke server sinkronisasi
      // 3. Menerima perubahan dari perangkat lain
      // 4. Menerapkan perubahan tersebut ke database lokal
      
      // Untuk demo, kita hanya akan mencatat aktivitas sinkronisasi
      const changes = await this.getPendingChanges();
      console.log(`Found ${changes.length} pending changes`);
      
      // Simulasikan proses sinkronisasi
      await this.simulateSyncProcess(changes);
      
      // Update timestamp terakhir sinkronisasi
      this.lastSyncTimestamp = Date.now();
      await this.saveSyncMetadata();
      
      console.log('Database sync completed');
    } catch (error) {
      console.error('Error during database sync:', error);
    }
  }

  // Ambil perubahan yang belum disinkronkan
  private async getPendingChanges(): Promise<DatabaseChange[]> {
    // Dalam implementasi nyata, ini akan mengambil perubahan dari tabel log
    // Untuk demo, kita kembalikan array kosong
    return [];
  }

  // Simulasikan proses sinkronisasi
  private async simulateSyncProcess(changes: DatabaseChange[]) {
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulasi pengiriman dan penerimaan data
    console.log('Sending changes to sync server...');
    console.log('Receiving changes from other devices...');
  }

  // Tambahkan perubahan ke log sinkronisasi
  public async logChange(table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    if (!this.syncEnabled) {
      return;
    }

    try {
      const change: DatabaseChange = {
        id: Math.random().toString(36).substr(2, 9),
        table,
        operation,
        data,
        timestamp: Date.now(),
        deviceId: this.deviceId
      };

      // Dalam implementasi nyata, ini akan menyimpan perubahan ke tabel log
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

  public getLastSyncTimestamp(): number {
    return this.lastSyncTimestamp;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }
}

// Export instance singleton
export default new DatabaseSyncService();