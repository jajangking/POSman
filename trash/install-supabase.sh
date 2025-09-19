#!/bin/bash
# Script untuk menginstal dependensi Supabase

echo "Menginstal dependensi Supabase..."
npm install @supabase/supabase-js

echo "Dependensi Supabase berhasil diinstal!"

echo "Jangan lupa untuk:"
echo "1. Membuat file .env dengan konfigurasi Supabase Anda"
echo "2. Menjalankan npx supabase init jika menggunakan Supabase CLI"
echo "3. Membuat tabel-tabel di Supabase sesuai dengan SUPABASE_SCHEMA.md"