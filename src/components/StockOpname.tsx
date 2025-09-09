import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentSOSession, upsertSOSession, deleteSOSession } from '../services/DatabaseService';

interface StockOpnameProps {
  onBack?: () => void;
  onNavigate?: (view: 'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO') => void;
}

// Define session storage key
const SO_SESSION_STORAGE_KEY = 'stock_opname_session';
const SO_ITEMS_STORAGE_KEY = 'stock_opname_items';

// Define session data interface
interface SOSessionData {
  type: 'partial' | 'grand';
  startTime: string; // ISO string
  lastView: 'partialSO' | 'grandSO' | 'editSO';
}

const StockOpname = React.forwardRef(({ onBack, onNavigate }: StockOpnameProps, ref) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSOType, setSelectedSOType] = useState<'partial' | 'grand' | null>(null);
  const [savedSession, setSavedSession] = useState<SOSessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  
  // Load saved session on component mount
  useEffect(() => {
    const loadSavedSession = async () => {
      try {
        const sessionData = await getCurrentSOSession();
        // console.log('Loading session data from database:', sessionData);
        if (sessionData) {
          const parsedSession: SOSessionData = {
            type: sessionData.type,
            startTime: sessionData.startTime,
            lastView: sessionData.lastView
          };
          setSavedSession(parsedSession);
          setHasActiveSession(true);
          // console.log('Session loaded successfully:', parsedSession);
        } else {
          // console.log('No session data found in database');
        }
      } catch (error) {
        console.error('Error loading SO session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    loadSavedSession();
  }, []);
  
  // Handle back button press with confirmation for active sessions
  const handleBackPress = () => {
    // If there's an active session, show confirmation dialog
    if (hasActiveSession || selectedSOType) {
      Alert.alert(
        'Minimalkan Sesi Stock Opname',
        'Anda memiliki sesi Stock Opname yang sedang berjalan. Apakah Anda ingin meminimalkan sesi ini untuk dilanjutkan nanti?',
        [
          {
            text: 'Keluar dan Hapus',
            onPress: async () => {
              // Clear the session and go back
              try {
                await deleteSOSession();
              } catch (error) {
                console.error('Error clearing SO session:', error);
              }
              onBack && onBack();
            },
            style: 'destructive',
          },
          {
            text: 'Minimalkan',
            onPress: async () => {
              // If we have a selected SO type but no saved session yet, save it
              if (selectedSOType && !savedSession) {
                const sessionData = {
                  type: selectedSOType,
                  startTime: new Date().toISOString(),
                  lastView: selectedSOType === 'partial' ? 'partialSO' : 'editSO',
                  items: ''
                };
                
                try {
                  await upsertSOSession(sessionData);
                } catch (error) {
                  console.error('Error saving SO session:', error);
                }
              }
              // Go back but keep the session
              onBack && onBack();
            },
          },
        ]
      );
    } else {
      // No active session, just go back normally
      onBack && onBack();
    }
  };
  
  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleContinueSession = async () => {
    if (savedSession && onNavigate) {
      try {
        // Set active session flag
        setHasActiveSession(true);
        // Navigate to the last view in the session
        // console.log('Continuing session from last view:', savedSession.lastView);
        onNavigate(savedSession.lastView);
      } catch (error) {
        console.error('Error continuing SO session:', error);
      }
    }
  };
  
  const handleStartSO = async () => {
    if (selectedSOType && onNavigate) {
      // Clear any existing session data first
      try {
        await deleteSOSession();
      } catch (error) {
        console.error('Error clearing previous SO session:', error);
      }
      
      // Save new session data
      const sessionData = {
        type: selectedSOType,
        startTime: new Date().toISOString(),
        lastView: selectedSOType === 'partial' ? 'partialSO' : 'grandSO', // Arahkan ke grandSO untuk Grand SO
        items: ''
      };
      
      try {
        // console.log('Saving session data to database:', sessionData);
        await upsertSOSession(sessionData);
        setHasActiveSession(true);
        // console.log('Session saved successfully');
      } catch (error) {
        console.error('Error saving SO session:', error);
      }
      
      // Navigate to the appropriate view
      if (selectedSOType === 'partial') {
        onNavigate('partialSO');
      } else if (selectedSOType === 'grand') {
        onNavigate('grandSO'); // Ke grandSO terlebih dahulu untuk Grand SO
      }
    }
  };

  // Expose method for hardware back button handling
  React.useImperativeHandle(ref, () => ({
    handleHardwareBackPress: () => {
      // This will be called when hardware back button is pressed
      handleBackPress();
    }
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Stock Opname</Text>
        </View>
        
        <View style={styles.content}>
          {/* Date and Time Display */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{formatDate(currentTime)}</Text>
            
            <Text style={styles.infoLabel}>Jam</Text>
            <Text style={styles.infoValue}>{formatTime(currentTime)}</Text>
            
            <Text style={styles.infoLabel}>User</Text>
            <Text style={styles.infoValue}>Admin User</Text>
          </View>
          
          {/* SO Type Selection */}
          <View style={styles.selectionContainer}>
            <Text style={styles.sectionTitle}>Tipe Stock Opname</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.selectionButton, 
                  selectedSOType === 'partial' ? styles.selectedButton : styles.unselectedButton
                ]}
                onPress={() => setSelectedSOType('partial')}
              >
                <Text style={[
                  styles.buttonText, 
                  selectedSOType === 'partial' ? styles.selectedButtonText : styles.unselectedButtonText
                ]}>Partial SO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.selectionButton, 
                  selectedSOType === 'grand' ? styles.selectedButton : styles.unselectedButton
                ]}
                onPress={() => setSelectedSOType('grand')}
              >
                <Text style={[
                  styles.buttonText, 
                  selectedSOType === 'grand' ? styles.selectedButtonText : styles.unselectedButtonText
                ]}>Grand SO</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {isLoadingSession ? (
              <Text style={styles.loadingText}>Memuat sesi...</Text>
            ) : savedSession ? (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.continueButton]}
                  onPress={handleContinueSession}
                >
                  <Text style={styles.actionButtonText}>Lanjutkan SO</Text>
                </TouchableOpacity>
                <Text style={styles.sessionInfo}>
                  Lanjutkan SO {savedSession.type === 'partial' ? 'Partial' : 'Grand'} yang tersimpan
                </Text>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.newSOButton]}
                  onPress={async () => {
                    try {
                      await deleteSOSession();
                      setSavedSession(null);
                      setHasActiveSession(false);
                    } catch (error) {
                      console.error('Error clearing SO session:', error);
                    }
                  }}
                >
                  <Text style={styles.actionButtonText}>SO Baru</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, !selectedSOType && styles.disabledButton]}
                  onPress={handleStartSO}
                  disabled={!selectedSOType}
                >
                  <Text style={styles.actionButtonText}>Start SO</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    position: 'relative',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionContainer: {
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
  },
  unselectedButton: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unselectedButtonText: {
    color: '#666',
  },
  selectedButtonText: {
    color: 'white',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButton: {
    backgroundColor: '#34C759',
  },
  newSOButton: {
    backgroundColor: '#FF9500',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default React.memo(StockOpname);