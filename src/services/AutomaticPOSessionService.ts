import AsyncStorage from '@react-native-async-storage/async-storage';

// Session keys
const SESSION_KEY = '@posman_automatic_po_session';
const LAST_VIEW_KEY = '@posman_automatic_po_last_view';

// Session data structure
export interface AutomaticPOSession {
  lastView: 'permintaanBarang' | 'penerimaanBarang' | 'settingMinimalOrder' | 'history' | null;
  permintaanBarangData?: any; // We can store form data or state here if needed
  penerimaanBarangData?: any;
  timestamp: number;
}

// Save session data
export const saveAutomaticPOSession = async (session: Partial<AutomaticPOSession>) => {
  try {
    const existingSession = await getAutomaticPOSession();
    const updatedSession: AutomaticPOSession = {
      lastView: session.lastView || existingSession?.lastView || null,
      permintaanBarangData: session.permintaanBarangData || existingSession?.permintaanBarangData,
      penerimaanBarangData: session.penerimaanBarangData || existingSession?.penerimaanBarangData,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession;
  } catch (error) {
    console.error('Error saving automatic PO session:', error);
    return null;
  }
};

// Get session data
export const getAutomaticPOSession = async (): Promise<AutomaticPOSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting automatic PO session:', error);
    return null;
  }
};

// Clear session data
export const clearAutomaticPOSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing automatic PO session:', error);
  }
};

// Save last view
export const saveLastView = async (view: string) => {
  try {
    await AsyncStorage.setItem(LAST_VIEW_KEY, view);
  } catch (error) {
    console.error('Error saving last view:', error);
  }
};

// Get last view
export const getLastView = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_VIEW_KEY);
  } catch (error) {
    console.error('Error getting last view:', error);
    return null;
  }
};

// Clear last view
export const clearLastView = async () => {
  try {
    await AsyncStorage.removeItem(LAST_VIEW_KEY);
  } catch (error) {
    console.error('Error clearing last view:', error);
  }
};