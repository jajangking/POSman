import { supabase } from './SupabaseService';

// Tipe data untuk user
export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
}

// Tipe data untuk session
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: SupabaseUser;
}

// Fungsi untuk mendaftar pengguna baru
export const signUp = async (email: string, password: string): Promise<{ user: SupabaseUser | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    
    return { user: data.user as SupabaseUser, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }
};

// Fungsi untuk login pengguna
export const signIn = async (email: string, password: string): Promise<{ session: SupabaseSession | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    return { session: data.session as SupabaseSession, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { session: null, error };
  }
};

// Fungsi untuk logout pengguna
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
};

// Fungsi untuk mendapatkan user saat ini
export const getCurrentUser = async (): Promise<{ user: SupabaseUser | null; error: Error | null }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Jika tidak ada user (belum login), itu tidak masalah
    if (error && error.name !== 'AuthSessionMissingError') {
      throw error;
    }
    
    return { user: user as SupabaseUser, error: null };
  } catch (error: any) {
    // Jika error karena tidak ada session, return null user tanpa error
    if (error.name === 'AuthSessionMissingError') {
      return { user: null, error: null };
    }
    
    console.error('Get current user error:', error);
    return { user: null, error };
  }
};

// Fungsi untuk mengirim email reset password
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://your-app-url.com/reset-password',
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error };
  }
};

// Fungsi untuk mengupdate password
export const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Update password error:', error);
    return { error };
  }
};

// Listener untuk perubahan status autentikasi
export const onAuthStateChange = (callback: (event: string, session: SupabaseSession | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session as SupabaseSession);
  });
  
  return subscription;
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  resetPassword,
  updatePassword,
  onAuthStateChange,
};