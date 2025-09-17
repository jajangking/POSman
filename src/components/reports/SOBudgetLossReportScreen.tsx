import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllSOHistory } from '../../services/SOHistoryService';

interface SOBudgetLossReportScreenProps {
  onBack: () => void;
}

const SOBudgetLossReportScreen: React.FC<SOBudgetLossReportScreenProps> = ({ onBack }) => {
  const [soData, setSoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchSOData();
  }, [timeRange]);

  const fetchSOData = async () => {
    try {
      setLoading(true);
      // In a real implementation, we would fetch actual SO data
      // For now, we'll simulate with sample data
      const sampleData = [
        { date: '2023-05-01', totalItems: 120, totalDifference: -5, totalRpDifference: -2500000 },
        { date: '2023-05-02', totalItems: 145, totalDifference: -8, totalRpDifference: -4000000 },
        { date: '2023-05-03', totalItems: 98, totalDifference: -2, totalRpDifference: -1000000 },
        { date: '2023-05-04', totalItems: 167, totalDifference: -12, totalRpDifference: -6000000 },
        { date: '2023-05-05', totalItems: 156, totalDifference: -7, totalRpDifference: -3500000 },
        { date: '2023-05-06', totalItems: 182, totalDifference: -15, totalRpDifference: -7500000 },
        { date: '2023-05-07', totalItems: 138, totalDifference: -6, totalRpDifference: -3000000 },
      ];
      setSoData(sampleData);
    } catch (error) {
      console.error('Error fetching SO data:', error);
      Alert.alert('Error', 'Failed to load SO data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalLossItems = () => {
    return soData.reduce((sum, item) => sum + Math.abs(item.totalDifference), 0);
  };

  const getTotalLossRp = () => {
    return soData.reduce((sum, item) => sum + Math.abs(item.totalRpDifference), 0);
  };

  const getAverageLossRp = () => {
    if (soData.length === 0) return 0;
    return Math.round(getTotalLossRp() / soData.length);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Kerugian SO</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data kerugian SO...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Kerugian SO</Text>
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
            <Text style={styles.sectionTitle}>Ringkasan Kerugian SO</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Item Hilang:</Text>
                <Text style={styles.summaryValue}>{getTotalLossItems().toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Kerugian (Rp):</Text>
                <Text style={styles.summaryValue}>Rp {getTotalLossRp().toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rata-rata Kerugian/Hari:</Text>
                <Text style={styles.summaryValue}>Rp {getAverageLossRp().toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Kerugian SO</Text>
            {soData.map((item, index) => (
              <View key={index} style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Item SO:</Text>
                  <Text style={styles.detailValue}>{item.totalItems.toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Selisih Qty:</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    {item.totalDifference.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kerugian (Rp):</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    Rp {Math.abs(item.totalRpDifference).toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Persentase Kerugian:</Text>
                  <Text style={[styles.detailValue, styles.negativeValue]}>
                    {item.totalItems > 0 
                      ? `${((Math.abs(item.totalDifference) / item.totalItems) * 100).toFixed(2)}%` 
                      : '0%'}
                  </Text>
                </View>
              </View>
            ))}
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  detailSection: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  detailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  detailDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  negativeValue: {
    color: '#FF3B30',
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

export default SOBudgetLossReportScreen;