import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportScreenProps {
  onBack: () => void;
  onNavigateToSalesReport?: () => void;
  onNavigateToItemReport?: () => void;
  onNavigateToProfitLossReport?: () => void;
  onNavigateToDailyTransactionReport?: () => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ 
  onBack, 
  onNavigateToSalesReport,
  onNavigateToItemReport,
  onNavigateToProfitLossReport,
  onNavigateToDailyTransactionReport
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.reportCategory}>
            <Text style={styles.categoryTitle}>Laporan Penjualan</Text>
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={onNavigateToSalesReport}
            >
              <Text style={styles.reportIcon}>💰</Text>
              <Text style={styles.reportTitle}>Laporan Sales</Text>
              <Text style={styles.reportDescription}>Lihat analisis penjualan harian, mingguan, dan bulanan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={onNavigateToItemReport}
            >
              <Text style={styles.reportIcon}>📦</Text>
              <Text style={styles.reportTitle}>Item Penjualan Tertinggi & Terendah</Text>
              <Text style={styles.reportDescription}>Identifikasi produk terlaris dan kurang laris</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.reportCategory}>
            <Text style={styles.categoryTitle}>Laporan Keuangan</Text>
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={onNavigateToProfitLossReport}
            >
              <Text style={styles.reportIcon}>📈</Text>
              <Text style={styles.reportTitle}>Laba Rugi</Text>
              <Text style={styles.reportDescription}>Laporan pendapatan dan pengeluaran bisnis</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportCard} 
              onPress={onNavigateToDailyTransactionReport}
            >
              <Text style={styles.reportIcon}>🧾</Text>
              <Text style={styles.reportTitle}>Transaksi Harian</Text>
              <Text style={styles.reportDescription}>Detail transaksi harian dengan metode pembayaran</Text>
            </TouchableOpacity>
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
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  reportCategory: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  reportIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ReportScreen;