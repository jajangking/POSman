// EncryptionService.ts
// Layanan untuk enkripsi dan dekripsi data

// Fungsi untuk menghasilkan kunci enkripsi sederhana
// Dalam produksi, gunakan kunci yang lebih aman dari secure storage
const getEncryptionKey = (): string => {
  // Untuk demo, kita gunakan kunci statis
  // Dalam produksi, simpan di secure storage atau gunakan biometric auth
  return 'posman-backup-encryption-key-2024';
};

// Fungsi untuk enkripsi teks menggunakan XOR sederhana
// Catatan: Ini adalah enkripsi dasar untuk demo. Untuk produksi, gunakan AES.
export const encryptString = (text: string): string => {
  if (!text) return '';
  
  const key = getEncryptionKey();
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    // XOR setiap karakter dengan karakter kunci yang sesuai
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  
  // Encode hasil dalam base64 untuk menyimpan sebagai string
  return btoa(result);
};

// Fungsi untuk dekripsi teks
export const decryptString = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  try {
    // Decode dari base64
    const text = atob(encryptedText);
    const key = getEncryptionKey();
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      // XOR setiap karakter dengan karakter kunci yang sesuai
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return result;
  } catch (error) {
    console.error('Error decrypting string:', error);
    // Jika dekripsi gagal, kembalikan teks asli
    return encryptedText;
  }
};

// Fungsi untuk enkripsi file backup
export const encryptBackupFile = (fileContent: string): string => {
  try {
    if (!fileContent) return '';
    const encrypted = encryptString(fileContent);
    return encrypted;
  } catch (error) {
    console.error('Error encrypting backup file:', error);
    // Jika enkripsi gagal, kembalikan konten asli
    return fileContent;
  }
};

// Fungsi untuk dekripsi file backup
export const decryptBackupFile = (encryptedContent: string): string => {
  try {
    if (!encryptedContent) return '';
    const decrypted = decryptString(encryptedContent);
    return decrypted;
  } catch (error) {
    console.error('Error decrypting backup file:', error);
    // Jika dekripsi gagal, kembalikan konten terenkripsi
    return encryptedContent;
  }
};

// Fungsi untuk menghasilkan hash dari konten (untuk verifikasi integritas)
export const generateHash = (content: string): string => {
  // Implementasi sederhana untuk demo
  // Dalam produksi, gunakan algoritma hash yang lebih kuat seperti SHA-256
  if (!content) return '0';
  
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export default {
  encryptString,
  decryptString,
  encryptBackupFile,
  decryptBackupFile,
  generateHash
};