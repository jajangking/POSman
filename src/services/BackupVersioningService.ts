// BackupVersioningService.ts
// Layanan untuk versioning backup dan rollback

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backupDatabase, restoreDatabase } from './DatabaseBackupService';

// Tipe data untuk versi backup
export interface BackupVersion {
  id: string;
  fileName: string;
  timestamp: string;
  version: number;
  description?: string;
  size?: number; // Ukuran file dalam bytes
  checksum?: string; // Checksum untuk verifikasi integritas
}

// Tipe data untuk log rollback
export interface RollbackLog {
  id: string;
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

class BackupVersioningService {
  private static instance: BackupVersioningService;
  private versions: BackupVersion[] = [];
  private rollbackLogs: RollbackLog[] = [];
  private currentVersion: number = 0;
  private readonly VERSIONS_KEY = 'backup_versions';
  private readonly LOGS_KEY = 'rollback_logs';
  private readonly CURRENT_VERSION_KEY = 'current_backup_version';

  private constructor() {
    this.loadVersions();
    this.loadRollbackLogs();
    this.loadCurrentVersion();
  }

  // Singleton pattern
  public static getInstance(): BackupVersioningService {
    if (!BackupVersioningService.instance) {
      BackupVersioningService.instance = new BackupVersioningService();
    }
    return BackupVersioningService.instance;
  }

  // Muat versi dari storage
  private async loadVersions() {
    try {
      const versionsStr = await AsyncStorage.getItem(this.VERSIONS_KEY);
      if (versionsStr) {
        this.versions = JSON.parse(versionsStr);
      }
    } catch (error) {
      console.error('Error loading backup versions:', error);
    }
  }

  // Simpan versi ke storage
  private async saveVersions() {
    try {
      await AsyncStorage.setItem(this.VERSIONS_KEY, JSON.stringify(this.versions));
    } catch (error) {
      console.error('Error saving backup versions:', error);
    }
  }

  // Muat log rollback dari storage
  private async loadRollbackLogs() {
    try {
      const logsStr = await AsyncStorage.getItem(this.LOGS_KEY);
      if (logsStr) {
        this.rollbackLogs = JSON.parse(logsStr);
      }
    } catch (error) {
      console.error('Error loading rollback logs:', error);
    }
  }

  // Simpan log rollback ke storage
  private async saveRollbackLogs() {
    try {
      await AsyncStorage.setItem(this.LOGS_KEY, JSON.stringify(this.rollbackLogs));
    } catch (error) {
      console.error('Error saving rollback logs:', error);
    }
  }

  // Muat versi saat ini dari storage
  private async loadCurrentVersion() {
    try {
      const versionStr = await AsyncStorage.getItem(this.CURRENT_VERSION_KEY);
      if (versionStr) {
        this.currentVersion = parseInt(versionStr, 10);
      }
    } catch (error) {
      console.error('Error loading current version:', error);
    }
  }

  // Simpan versi saat ini ke storage
  private async saveCurrentVersion() {
    try {
      await AsyncStorage.setItem(this.CURRENT_VERSION_KEY, this.currentVersion.toString());
    } catch (error) {
      console.error('Error saving current version:', error);
    }
  }

  // Buat backup baru dengan versioning
  public async createVersionedBackup(description?: string): Promise<BackupVersion> {
    try {
      // Buat backup biasa terlebih dahulu
      const fileName = await backupDatabase();
      
      // Naikkan nomor versi
      this.currentVersion++;
      await this.saveCurrentVersion();
      
      // Buat entri versi baru
      const newVersion: BackupVersion = {
        id: Math.random().toString(36).substr(2, 9),
        fileName,
        timestamp: new Date().toISOString(),
        version: this.currentVersion,
        description,
        // Ukuran dan checksum akan ditambahkan dalam implementasi penuh
      };
      
      // Tambahkan ke daftar versi
      this.versions.push(newVersion);
      
      // Urutkan berdasarkan versi (terbaru dulu)
      this.versions.sort((a, b) => b.version - a.version);
      
      // Simpan ke storage
      await this.saveVersions();
      
      console.log(`Created backup version ${this.currentVersion}: ${fileName}`);
      return newVersion;
    } catch (error) {
      console.error('Error creating versioned backup:', error);
      throw error;
    }
  }

  // Dapatkan semua versi backup
  public getVersions(): BackupVersion[] {
    return [...this.versions].sort((a, b) => b.version - a.version);
  }

  // Dapatkan versi berdasarkan nomor versi
  public getVersionByVersionNumber(version: number): BackupVersion | undefined {
    return this.versions.find(v => v.version === version);
  }

  // Dapatkan versi berdasarkan ID
  public getVersionById(id: string): BackupVersion | undefined {
    return this.versions.find(v => v.id === id);
  }

  // Dapatkan versi terbaru
  public getLatestVersion(): BackupVersion | undefined {
    if (this.versions.length === 0) return undefined;
    return this.versions.reduce((latest, current) => 
      current.version > latest.version ? current : latest
    );
  }

  // Dapatkan versi saat ini
  public getCurrentVersion(): number {
    return this.currentVersion;
  }

  // Rollback ke versi tertentu
  public async rollbackToVersion(version: number): Promise<boolean> {
    try {
      // Cari versi yang diminta
      const targetVersion = this.getVersionByVersionNumber(version);
      if (!targetVersion) {
        throw new Error(`Version ${version} not found`);
      }
      
      // Catat log rollback dimulai
      const rollbackLog: RollbackLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        fromVersion: this.currentVersion,
        toVersion: version,
        status: 'started'
      };
      
      this.rollbackLogs.push(rollbackLog);
      await this.saveRollbackLogs();
      
      // Lakukan restore dari versi target
      await restoreDatabase(targetVersion.fileName);
      
      // Update versi saat ini
      const previousVersion = this.currentVersion;
      this.currentVersion = version;
      await this.saveCurrentVersion();
      
      // Update log rollback
      const logIndex = this.rollbackLogs.findIndex(log => log.id === rollbackLog.id);
      if (logIndex !== -1) {
        this.rollbackLogs[logIndex] = {
          ...rollbackLog,
          status: 'success'
        };
        await this.saveRollbackLogs();
      }
      
      console.log(`Successfully rolled back from version ${previousVersion} to ${version}`);
      return true;
    } catch (error) {
      console.error('Error during rollback:', error);
      
      // Catat error di log rollback
      const lastLog = this.rollbackLogs[this.rollbackLogs.length - 1];
      if (lastLog && lastLog.status === 'started') {
        const logIndex = this.rollbackLogs.findIndex(log => log.id === lastLog.id);
        if (logIndex !== -1) {
          this.rollbackLogs[logIndex] = {
            ...lastLog,
            status: 'failed',
            errorMessage: (error as Error).message
          };
          await this.saveRollbackLogs();
        }
      }
      
      throw error;
    }
  }

  // Hapus versi backup lama (keep only N latest versions)
  public async cleanupOldVersions(keepCount: number = 10): Promise<void> {
    try {
      if (this.versions.length <= keepCount) return;
      
      // Urutkan versi berdasarkan nomor versi (terbaru dulu)
      const sortedVersions = [...this.versions].sort((a, b) => b.version - a.version);
      
      // Tentukan versi yang akan dihapus
      const versionsToDelete = sortedVersions.slice(keepCount);
      
      // Hapus file backup dari storage untuk versi yang dihapus
      for (const version of versionsToDelete) {
        try {
          await AsyncStorage.removeItem(`backup_${version.fileName}`);
          console.log(`Deleted backup file for version ${version.version}: ${version.fileName}`);
        } catch (deleteError) {
          console.error(`Error deleting backup file for version ${version.version}:`, deleteError);
        }
      }
      
      // Simpan versi yang dipertahankan
      this.versions = sortedVersions.slice(0, keepCount);
      await this.saveVersions();
      
      console.log(`Cleaned up old versions. Kept ${this.versions.length} latest versions.`);
    } catch (error) {
      console.error('Error cleaning up old versions:', error);
    }
  }

  // Dapatkan log rollback
  public async getRollbackLogs(limit: number = 50): Promise<RollbackLog[]> {
    try {
      // Urutkan berdasarkan timestamp terbaru
      return [...this.rollbackLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting rollback logs:', error);
      return [];
    }
  }

  // Hapus semua log rollback lama
  public async clearOldRollbackLogs(): Promise<void> {
    try {
      // Hapus log yang lebih dari 30 hari
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      this.rollbackLogs = this.rollbackLogs.filter(log => 
        new Date(log.timestamp) > thirtyDaysAgo
      );
      
      await this.saveRollbackLogs();
      console.log('Cleared old rollback logs');
    } catch (error) {
      console.error('Error clearing old rollback logs:', error);
    }
  }

  // Reset semua data versioning
  public async resetVersioning(): Promise<void> {
    try {
      this.versions = [];
      this.rollbackLogs = [];
      this.currentVersion = 0;
      
      await AsyncStorage.removeItem(this.VERSIONS_KEY);
      await AsyncStorage.removeItem(this.LOGS_KEY);
      await AsyncStorage.removeItem(this.CURRENT_VERSION_KEY);
      
      console.log('Reset backup versioning data');
    } catch (error) {
      console.error('Error resetting versioning data:', error);
    }
  }
}

// Export instance singleton
export default BackupVersioningService.getInstance();

// Export types
export type { BackupVersion, RollbackLog };