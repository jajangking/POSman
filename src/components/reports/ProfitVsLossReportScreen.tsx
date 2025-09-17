import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfitVsLossReportScreenProps {
  onBack: () => void;
}

const ProfitVsLossReportScreen: React.FC<ProfitVsLossReportScreenProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // In a real implementation, we would fetch actual financial data
      // For now, we'll simulate with sample data
      const sampleData = {
        period: timeRange === 'daily' ? 'Harian' : timeRange === 'weekly' ? 'Mingguan' : 'Bulanan',
        startDate: '2023-05-01',
        endDate: '2023-05-31',
        totalRevenue: 150000000,
        totalCost: 90000000,
        totalProfit: 60000000,
        totalLoss: 15000000,
        netResult: 45000000,
        revenueItems: [
          { name: 'Penjualan Tunai', amount: 120000000 },
          { name: 'Penjualan Kredit', amount: 30000000 },
        ],
        costItems: [
          { name: 'Harga Pokok Penjualan', amount: 75000000 },
          { name: 'Biaya Operasional', amount: 15000000 },
        ],
        profitItems: [
          { name: 'Margin Penjualan Tinggi', amount: 60000000 },
          { name: 'Diskon yang Diambil Pelanggan', amount: -10000000 },
          { name: 'Retur Barang', amount: -5000000 },
        ],
        lossItems: [
          { name: 'Barang Kadaluarsa', amount: 5000000 },
          { name: 'Kehilangan Inventaris', amount: 3000000 },
          { name: 'Biaya Tidak Terduga', amount: 2000000 },
          { name: 'Selisih Kas', amount: 5000000 },
        ]
      };
      setReportData(sampleData);
    } catch (error) {
      console.error('Error fetching profit/loss data:', error);
      Alert.alert('Error', 'Failed to load profit/loss data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
  };

  const getResultColor = (amount: number): string => {
    return amount >= 0 ? '#34C759' : '#FF3B30';
  };

  const getResultText = (amount: number): string => {
    return amount >= 0 ? 'Profit' : 'Loss';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Profit vs Kerugian</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data profit vs kerugian...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!reportData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Profit vs Kerugian</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Data tidak tersedia</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profit vs Kerugian</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filter Periode</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'daily' && styles.activeFilterButton]}
                onPress={() => setTimeRange('daily')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'daily' && styles.activeFilterButtonText]}>
                  Harian
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'weekly' && styles.activeFilterButton]}
                onPress={() => setTimeRange('weekly')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'weekly' && styles.activeFilterButtonText]}>
                  Mingguan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'monthly' && styles.activeFilterButton]}
                onPress={() => setTimeRange('monthly')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'monthly' && styles.activeFilterButtonText]}>
                  Bulanan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Ringkasan Profit vs Kerugian - {reportData.period}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Pendapatan:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.totalRevenue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Biaya:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>
                  {formatCurrency(reportData.totalCost)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Profit:</Text>
                <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                  {formatCurrency(reportData.totalProfit)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Kerugian:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>
                  {formatCurrency(reportData.totalLoss)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Hasil Bersih:</Text>
                <Text style={[styles.totalValue, { color: getResultColor(reportData.netResult) }]}>
                  {formatCurrency(reportData.netResult)} ({getResultText(reportData.netResult)})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Pendapatan</Text>
            <View style={styles.detailCard}>
              {reportData.revenueItems.map((item: any, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Pendapatan</Text>
                <Text style={styles.totalValue}>{formatCurrency(reportData.totalRevenue)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Biaya</Text>
            <View style={styles.detailCard}>
              {reportData.costItems.map((item: any, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Biaya</Text>
                <Text style={[styles.totalValue, styles.negativeValue]}>
                  {formatCurrency(reportData.totalCost)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Profit</Text>
            <View style={styles.detailCard}>
              {reportData.profitItems.map((item: any, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={[styles.detailValue, { color: item.amount >= 0 ? '#34C759' : '#FF3B30' }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Profit</Text>
                <Text style={[styles.totalValue, { color: '#34C759' }]}>
                  {formatCurrency(reportData.totalProfit)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Kerugian</Text>
            <View style={styles.detailCard}>
              {reportData.lossItems.map((item: any, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Kerugian</Text>
                <Text style={[styles.totalValue, styles.negativeValue]}>
                  {formatCurrency(reportData.totalLoss)}
                </Text>
              </View>
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
  filterSection: {
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ProfitVsLossReportScreen;