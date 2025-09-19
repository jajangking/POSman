// CompressionService.ts
// Layanan untuk kompresi dan dekompresi data

// Fungsi untuk kompresi string menggunakan algoritma sederhana
// Untuk produksi, pertimbangkan menggunakan pako (gzip) atau library kompresi lainnya
export const compressString = (input: string): string => {
  // Ini adalah implementasi sederhana untuk demo
  // Dalam produksi, gunakan library kompresi yang sudah terbukti
  
  if (!input) return '';
  
  let compressed = '';
  let currentChar = input[0];
  let count = 1;
  
  for (let i = 1; i <= input.length; i++) {
    if (i === input.length || input[i] !== currentChar) {
      // Tambahkan karakter dan jumlahnya ke hasil kompresi
      compressed += currentChar + count;
      if (i < input.length) {
        currentChar = input[i];
        count = 1;
      }
    } else {
      count++;
    }
  }
  
  // Hanya gunakan hasil kompresi jika lebih pendek dari aslinya
  return compressed.length < input.length ? compressed : input;
};

// Fungsi untuk dekompresi string
export const decompressString = (compressed: string): string => {
  // Ini adalah implementasi sederhana untuk demo
  if (!compressed) return '';
  
  // Periksa apakah string tampaknya dikompresi (mengandung pola angka)
  // Ini adalah pendekatan sederhana, dalam produksi gunakan header atau metadata
  let decompressed = '';
  let i = 0;
  
  while (i < compressed.length) {
    const char = compressed[i];
    i++;
    
    // Baca angka berikutnya
    let numStr = '';
    while (i < compressed.length && /\d/.test(compressed[i])) {
      numStr += compressed[i];
      i++;
    }
    
    if (numStr) {
      const count = parseInt(numStr, 10);
      if (!isNaN(count)) {
        decompressed += char.repeat(count);
      } else {
        // Jika tidak bisa parse angka, tambahkan karakter asli
        decompressed += char + numStr;
      }
    } else {
      decompressed += char;
    }
  }
  
  return decompressed;
};

// Fungsi untuk kompresi file backup
export const compressBackupFile = (fileContent: string): string => {
  try {
    if (!fileContent) return '';
    const compressed = compressString(fileContent);
    return compressed;
  } catch (error) {
    console.error('Error compressing backup file:', error);
    // Jika kompresi gagal, kembalikan konten asli
    return fileContent;
  }
};

// Fungsi untuk dekompresi file backup
export const decompressBackupFile = (compressedContent: string): string => {
  try {
    if (!compressedContent) return '';
    // Coba dekompresi, jika gagal kembalikan konten asli
    const decompressed = decompressString(compressedContent);
    return decompressed;
  } catch (error) {
    console.error('Error decompressing backup file:', error);
    // Jika dekompresi gagal, kembalikan konten asli
    return compressedContent;
  }
};

// Fungsi untuk menghitung rasio kompresi
export const getCompressionRatio = (original: string, compressed: string): number => {
  if (!original || !compressed) return 0;
  
  const ratio = (1 - (compressed.length / original.length)) * 100;
  return Math.max(0, Math.round(ratio * 100) / 100); // Bulatkan ke 2 desimal
};

export default {
  compressString,
  decompressString,
  compressBackupFile,
  decompressBackupFile,
  getCompressionRatio
};