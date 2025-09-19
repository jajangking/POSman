// NotificationService.ts
// Layanan untuk notifikasi push

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Request permission untuk notifikasi
export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Jadwalkan notifikasi lokal
export const scheduleLocalNotification = async (title: string, body: string, trigger?: Notifications.NotificationTriggerInput) => {
  try {
    // Request permission jika belum diberikan
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return null;
    }
    
    // Buat notifikasi
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#007AFF', // Warna biru untuk sesuai dengan tema aplikasi
      },
      trigger: trigger || {
        seconds: 1, // Tampilkan segera jika tidak ada trigger khusus
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Batalkan notifikasi
export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Batalkan semua notifikasi
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

// Tampilkan notifikasi segera
export const showImmediateNotification = async (title: string, body: string) => {
  return scheduleLocalNotification(title, body, {
    seconds: 1,
  });
};

// Tampilkan notifikasi untuk backup berhasil
export const showBackupSuccessNotification = async (fileName: string) => {
  return showImmediateNotification(
    'Backup Berhasil', 
    `Database berhasil dibackup ke file: ${fileName}`
  );
};

// Tampilkan notifikasi untuk backup gagal
export const showBackupFailureNotification = async (error: string) => {
  return showImmediateNotification(
    'Backup Gagal', 
    `Backup database gagal: ${error}`
  );
};

// Tampilkan notifikasi untuk restore berhasil
export const showRestoreSuccessNotification = async () => {
  return showImmediateNotification(
    'Restore Berhasil', 
    'Database berhasil direstore'
  );
};

// Tampilkan notifikasi untuk restore gagal
export const showRestoreFailureNotification = async (error: string) => {
  return showImmediateNotification(
    'Restore Gagal', 
    `Restore database gagal: ${error}`
  );
};

// Tampilkan notifikasi untuk sinkronisasi berhasil
export const showSyncSuccessNotification = async () => {
  return showImmediateNotification(
    'Sinkronisasi Berhasil', 
    'Database berhasil disinkronkan'
  );
};

// Tampilkan notifikasi untuk sinkronisasi gagal
export const showSyncFailureNotification = async (error: string) => {
  return showImmediateNotification(
    'Sinkronisasi Gagal', 
    `Sinkronisasi database gagal: ${error}`
  );
};

// Setup notifikasi handler
export const setupNotificationHandler = () => {
  // Handler untuk notifikasi yang diterima saat app aktif
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

// Dapatkan notifikasi yang diterima saat app aktif
export const addNotificationReceivedListener = (callback: (notification: Notifications.Notification) => void) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Dapatkan notifikasi yang diklik
export const addNotificationResponseReceivedListener = (callback: (response: Notifications.NotificationResponse) => void) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Simpan token notifikasi ke storage
export const saveNotificationToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('notification_token', token);
  } catch (error) {
    console.error('Error saving notification token:', error);
  }
};

// Dapatkan token notifikasi dari storage
export const getNotificationToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('notification_token');
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

export default {
  requestNotificationPermission,
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  showImmediateNotification,
  showBackupSuccessNotification,
  showBackupFailureNotification,
  showRestoreSuccessNotification,
  showRestoreFailureNotification,
  showSyncSuccessNotification,
  showSyncFailureNotification,
  setupNotificationHandler,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  saveNotificationToken,
  getNotificationToken,
};