import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getItemsForMonitoring } from '../services/SOAnalysisService';

interface MonitoringItem {
  code: string;
  name: string;
  status: string;
  history: string;
  recommendation: string;
  recentTrend: string;
}

interface MonitoringItemsScreenProps {
  onBack?: () => void;
  currentSoItems?: any[]; // Items from current SO if available
}

const MonitoringItemsScreen: React.FC<MonitoringItemsScreenProps> = ({ onBack, currentSoItems }) => {
  const [monitoringItems, setMonitoringItems] = useState<MonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringItems();
  }, []);

  const loadMonitoringItems = async () => {
    try {
      setLoading(true);
      const items = await getItemsForMonitoring(currentSoItems || []);
      setMonitoringItems(items);
    } catch (error) {
      console.error('Error loading monitoring items:', error);
      Alert.alert('Error', 'Failed to load monitoring items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Pemantauan Barang</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data pemantauan...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pemantauan Barang</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Barang yang Perlu Dipantau</Text>
            <Text style={styles.analysisText}>
              Berikut adalah barang yang memerlukan perhatian khusus berdasarkan analisis riwayat SO:
            </Text>
            
            {monitoringItems.length > 0 ? (
              monitoringItems.map((item, index) => (
                <View 
                  key={index} 
                  style={styles.monitoringItem}
                >
                  <Text style={styles.monitoringItemName}>{item.name} ({item.code})</Text>
                  <Text style={styles.monitoringItemStatus}>{item.status}</Text>
                  <Text style={styles.monitoringItemHistory}>{item.history}</Text>
                  <Text style={styles.monitoringItemTrend}>Tren Terkini: {item.recentTrend}</Text>
                  <Text style={styles.monitoringItemRecommendation}>{item.recommendation}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Tidak ada barang yang memerlukan pemantauan khusus saat ini.</Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi Umum</Text>
            <Text style={styles.analysisText}>
              Disarankan untuk:
            </Text>
            <Text style={styles.listText}>• Meningkatkan pengawasan terhadap barang yang sering minus</Text>
            <Text style={styles.listText}>• Memeriksa prosedur penyimpanan dan pengeluaran untuk barang bermasalah</Text>
            <Text style={styles.listText}>• Melakukan pelatihan ulang kepada staf yang menangani barang bermasalah</Text>
            <Text style={styles.listText}>• Memantau barang yang baru pertama kali SO secara berkala</Text>
            <Text style={styles.listText}>• Mencatat setiap perubahan pola pada barang yang sebelumnya stabil</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  analysisText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  monitoringItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  monitoringItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  monitoringItemStatus: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  monitoringItemHistory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  monitoringItemTrend: {
    fontSize: 14,
    color: '#ff9800',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  monitoringItemRecommendation: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  listText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default MonitoringItemsScreen;