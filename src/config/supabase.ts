import { createClient } from '@supabase/supabase-js'

// Dapatkan URL dan key dari environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Validasi environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL dan Anon Key tidak ditemukan. Pastikan file .env sudah dikonfigurasi dengan benar.')
}

// Buat instance Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default supabase