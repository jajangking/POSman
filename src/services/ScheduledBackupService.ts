// ScheduledBackupService.ts
// Layanan untuk penjadwalan backup otomatis

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backupDatabase } from './DatabaseBackupService';

// Tipe data untuk jadwal backup
export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // Format: HH:MM
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// Tipe data untuk log backup
export interface BackupLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  fileName?: string;
  errorMessage?: string;
}

class ScheduledBackupService {
  private static instance: ScheduledBackupService;
  private schedules: BackupSchedule[] = [];
  private backupInterval: NodeJS.Timeout | null = null;
  private readonly SCHEDULES_KEY = 'scheduled_backups';
  private readonly LOGS_KEY = 'backup_logs';

  private constructor() {
    this.loadSchedules();
    this.startScheduler();
  }

  // Singleton pattern
  public static getInstance(): ScheduledBackupService {
    if (!ScheduledBackupService.instance) {
      ScheduledBackupService.instance = new ScheduledBackupService();
    }
    return ScheduledBackupService.instance;
  }

  // Muat jadwal dari storage
  private async loadSchedules() {
    try {
      const schedulesStr = await AsyncStorage.getItem(this.SCHEDULES_KEY);
      if (schedulesStr) {
        this.schedules = JSON.parse(schedulesStr);
      }
    } catch (error) {
      console.error('Error loading backup schedules:', error);
    }
  }

  // Simpan jadwal ke storage
  private async saveSchedules() {
    try {
      await AsyncStorage.setItem(this.SCHEDULES_KEY, JSON.stringify(this.schedules));
    } catch (error) {
      console.error('Error saving backup schedules:', error);
    }
  }

  // Tambahkan jadwal backup baru
  public async addSchedule(schedule: Omit<BackupSchedule, 'id'>): Promise<BackupSchedule> {
    const newSchedule: BackupSchedule = {
      ...schedule,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    this.schedules.push(newSchedule);
    await this.saveSchedules();
    this.calculateNextRun(newSchedule);
    
    return newSchedule;
  }

  // Update jadwal backup
  public async updateSchedule(id: string, updates: Partial<BackupSchedule>): Promise<boolean> {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return false;
    
    this.schedules[index] = { ...this.schedules[index], ...updates };
    await this.saveSchedules();
    this.calculateNextRun(this.schedules[index]);
    
    return true;
  }

  // Hapus jadwal backup
  public async removeSchedule(id: string): Promise<boolean> {
    const initialLength = this.schedules.length;
    this.schedules = this.schedules.filter(schedule => schedule.id !== id);
    
    if (this.schedules.length !== initialLength) {
      await this.saveSchedules();
      return true;
    }
    
    return false;
  }

  // Dapatkan semua jadwal
  public getSchedules(): BackupSchedule[] {
    return this.schedules;
  }

  // Dapatkan jadwal berdasarkan ID
  public getScheduleById(id: string): BackupSchedule | undefined {
    return this.schedules.find(schedule => schedule.id === id);
  }

  // Hitung waktu berikutnya untuk jadwal
  private calculateNextRun(schedule: BackupSchedule): string {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // Jika waktu sudah lewat hari ini, atur untuk besok
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    // Sesuaikan berdasarkan frekuensi
    switch (schedule.frequency) {
      case 'weekly':
        // Jadwalkan untuk hari yang sama minggu depan
        nextRun.setDate(nextRun.getDate() + 6);
        break;
      case 'monthly':
        // Jadwalkan untuk tanggal yang sama bulan depan
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      // Untuk 'daily', nextRun sudah benar
    }
    
    const nextRunStr = nextRun.toISOString();
    schedule.nextRun = nextRunStr;
    return nextRunStr;
  }

  // Mulai scheduler
  private startScheduler() {
    // Cek setiap menit
    this.backupInterval = setInterval(() => {
      this.checkAndRunScheduledBackups();
    }, 60000); // 1 menit
  }

  // Hentikan scheduler
  public stopScheduler() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  // Periksa dan jalankan backup yang terjadwal
  private async checkAndRunScheduledBackups() {
    const now = new Date();
    
    for (const schedule of this.schedules) {
      if (!schedule.enabled) continue;
      
      // Jika nextRun belum dihitung, hitung sekarang
      if (!schedule.nextRun) {
        this.calculateNextRun(schedule);
        continue;
      }
      
      const nextRun = new Date(schedule.nextRun);
      
      // Jika sekarang sudah melewati waktu nextRun, jalankan backup
      if (now >= nextRun) {
        await this.runScheduledBackup(schedule);
        // Hitung waktu berikutnya
        this.calculateNextRun(schedule);
      }
    }
    
    // Simpan jadwal yang diperbarui
    await this.saveSchedules();
  }

  // Jalankan backup terjadwal
  private async runScheduledBackup(schedule: BackupSchedule) {
    try {
      console.log(`Running scheduled backup: ${schedule.name}`);
      
      // Jalankan backup
      const fileName = await backupDatabase();
      
      // Catat log sukses
      await this.logBackup('success', fileName);
      
      // Update jadwal
      schedule.lastRun = new Date().toISOString();
      
      console.log(`Scheduled backup completed: ${fileName}`);
    } catch (error) {
      console.error(`Scheduled backup failed: ${schedule.name}`, error);
      
      // Catat log gagal
      await this.logBackup('failed', undefined, (error as Error).message);
    }
  }

  // Catat log backup
  private async logBackup(status: 'success' | 'failed', fileName?: string, errorMessage?: string) {
    try {
      const log: BackupLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        status,
        fileName,
        errorMessage: status === 'failed' ? errorMessage : undefined
      };
      
      // Dapatkan log yang ada
      const logsStr = await AsyncStorage.getItem(this.LOGS_KEY);
      let logs: BackupLog[] = [];
      
      if (logsStr) {
        logs = JSON.parse(logsStr);
      }
      
      // Tambahkan log baru
      logs.push(log);
      
      // Batasi jumlah log (simpan maksimal 100 log terbaru)
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }
      
      // Simpan log
      await AsyncStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging backup:', error);
    }
  }

  // Dapatkan log backup
  public async getBackupLogs(limit: number = 50): Promise<BackupLog[]> {
    try {
      const logsStr = await AsyncStorage.getItem(this.LOGS_KEY);
      if (logsStr) {
        const logs: BackupLog[] = JSON.parse(logsStr);
        // Urutkan berdasarkan timestamp terbaru dan batasi jumlah
        return logs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error getting backup logs:', error);
      return [];
    }
  }

  // Bersihkan log lama
  public async clearOldLogs() {
    try {
      await AsyncStorage.removeItem(this.LOGS_KEY);
    } catch (error) {
      console.error('Error clearing backup logs:', error);
    }
  }
}

// Export instance singleton
export default ScheduledBackupService.getInstance();

// Export types
export type { BackupSchedule, BackupLog };