import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAutomaticPOSession } from '../services/AutomaticPOSessionService';

interface AutomaticPOScreenProps {
  onBack: () => void;
  onNavigateToSettingMinimalOrder: () => void;
  onNavigateToPermintaanBarang: () => void;
  onNavigateToHistory: () => void;
  onNavigateToPenerimaanBarang: () => void;
}

const AutomaticPOScreen: React.FC<AutomaticPOScreenProps> = ({ 
  onBack, 
  onNavigateToSettingMinimalOrder,
  onNavigateToPermintaanBarang,
  onNavigateToHistory,
  onNavigateToPenerimaanBarang
}) => {
  // Check for saved session on component mount
  useEffect(() => {
    const checkForSavedSession = async () => {
      try {
        const session = await getAutomaticPOSession();
        if (session?.lastView) {
          // We could navigate to the last view here if needed
          // For now, we'll just log it
          console.log('Last accessed view:', session.lastView);
        }
      } catch (error) {
        console.error('Error checking saved session:', error);
      }
    };
    
    checkForSavedSession();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>PO Otomatis</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.navigationGrid}>
              <TouchableOpacity 
                style={styles.navCard} 
                onPress={onNavigateToPermintaanBarang}
              >
                <Text style={styles.navIcon}>📋</Text>
                <Text style={styles.navTitle}>Permintaan Barang</Text>
                <Text style={styles.navDescription}>Buat dan kelola permintaan barang</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navCard} 
                onPress={onNavigateToPenerimaanBarang}
              >
                <Text style={styles.navIcon}>📦</Text>
                <Text style={styles.navTitle}>Penerimaan Barang</Text>
                <Text style={styles.navDescription}>Proses penerimaan barang</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navCard} 
                onPress={onNavigateToSettingMinimalOrder}
              >
                <Text style={styles.navIcon}>⚙️</Text>
                <Text style={styles.navTitle}>Setting Minimal Order</Text>
                <Text style={styles.navDescription}>Atur jumlah minimal pemesanan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navCard} 
                onPress={onNavigateToHistory}
              >
                <Text style={styles.navIcon}>🕒</Text>
                <Text style={styles.navTitle}>History</Text>
                <Text style={styles.navDescription}>Lihat riwayat permintaan barang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
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
  content: {
    padding: 20,
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  navCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    alignItems: 'flex-start',
  },
  navIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  navDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
  },
  infoSection: {
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default AutomaticPOScreen;