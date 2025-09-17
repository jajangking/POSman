import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDailyTransactions, saveReportHistory } from '../../services/DatabaseService';

interface Transaction {
  id: string;
  date: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'other';
  status: 'completed' | 'cancelled' | 'refunded';
}

interface DailyTransactionReportScreenProps {
  onBack: () => void;
}

// Simple history storage in memory (in a real app, this would be stored in a database)
let reportHistory: { date: string; accessTime: string }[] = [];

const DailyTransactionReportScreen: React.FC<DailyTransactionReportScreenProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Today's date

  useEffect(() => {
    fetchTransactions();
    // Add to history when accessing a report
    addToHistory(selectedDate);
  }, [selectedDate]);

  const addToHistory = async (date: string) => {
    try {
      // Save to database
      await saveReportHistory('daily_transaction', date);
      console.log('Report history saved for date:', date);
    } catch (error) {
      console.error('Error saving report history:', error);
      // Continue without saving to history if there's an error
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch actual transaction data from database
      const transactionData = await getDailyTransactions(selectedDate);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      Alert.alert('Error', 'Failed to load transaction data');
      // Fallback to sample data in case of error
      const sampleData: Transaction[] = [
        { id: 'TXN001', date: '2023-05-07', time: '08:30', items: 5, total: 125000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN002', date: '2023-05-07', time: '09:15', items: 3, total: 75000, paymentMethod: 'credit', status: 'completed' },
        { id: 'TXN003', date: '2023-05-07', time: '10:45', items: 8, total: 210000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN004', date: '2023-05-07', time: '11:30', items: 2, total: 45000, paymentMethod: 'debit', status: 'completed' },
        { id: 'TXN005', date: '2023-05-07', time: '12:15', items: 6, total: 180000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN006', date: '2023-05-07', time: '13:20', items: 4, total: 95000, paymentMethod: 'credit', status: 'completed' },
        { id: 'TXN007', date: '2023-05-07', time: '14:10', items: 7, total: 195000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN008', date: '2023-05-07', time: '15:30', items: 1, total: 25000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN009', date: '2023-05-07', time: '16:45', items: 5, total: 135000, paymentMethod: 'debit', status: 'completed' },
        { id: 'TXN010', date: '2023-05-07', time: '17:20', items: 9, total: 240000, paymentMethod: 'cash', status: 'completed' },
        { id: 'TXN011', date: '2023-05-07', time: '18:10', items: 4, total: 110000, paymentMethod: 'credit', status: 'completed' },
        { id: 'TXN012', date: '2023-05-07', time: '19:30', items: 6, total: 165000, paymentMethod: 'cash', status: 'completed' },
      ];
      setTransactions(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTransactions = () => {
    return transactions.length;
  };

  const getTotalItems = () => {
    return transactions.reduce((sum, txn) => sum + txn.items, 0);
  };

  const getTotalRevenue = () => {
    return transactions.reduce((sum, txn) => sum + txn.total, 0);
  };

  const getPaymentMethodStats = () => {
    const stats = {
      cash: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
      debit: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    };

    transactions.forEach(txn => {
      stats[txn.paymentMethod].count += 1;
      stats[txn.paymentMethod].amount += txn.total;
    });

    return stats;
  };

  const getStatusStats = () => {
    const stats = {
      completed: 0,
      cancelled: 0,
      refunded: 0
    };

    transactions.forEach(txn => {
      stats[txn.status] += 1;
    });

    return stats;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString;
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'credit': return 'Kartu Kredit';
      case 'debit': return 'Kartu Debit';
      case 'other': return 'Lainnya';
      default: return method;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'refunded': return 'Dikembalikan';
      default: return status;
    }
  };

  const getStatusStyle = (status: string): any => {
    switch (status) {
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      case 'refunded': return styles.statusRefunded;
      default: return styles.statusDefault;
    }
  };

  // Function to change date
  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Function to get today's date
  const getToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionId}>#{item.id}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Waktu:</Text>
          <Text style={styles.detailValue}>{formatTime(item.time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Item:</Text>
          <Text style={styles.detailValue}>{item.items}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>Rp {item.total.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Metode Bayar:</Text>
          <Text style={styles.detailValue}>{getPaymentMethodLabel(item.paymentMethod)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Transaksi Harian</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data transaksi...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const paymentStats = getPaymentMethodStats();
  const statusStats = getStatusStats();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Transaksi Harian</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.dateSection}>
            <View style={styles.dateNavigation}>
              <TouchableOpacity style={styles.navButton} onPress={() => changeDate(-1)}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                <TouchableOpacity onPress={getToday}>
                  <Text style={styles.todayText}>Hari Ini</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.navButton} onPress={() => changeDate(1)}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Ringkasan Transaksi</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Transaksi:</Text>
                <Text style={styles.summaryValue}>{getTotalTransactions()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Item:</Text>
                <Text style={styles.summaryValue}>{getTotalItems()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Pendapatan:</Text>
                <Text style={styles.summaryValue}>Rp {getTotalRevenue().toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistik Metode Pembayaran</Text>
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Tunai:</Text>
                <Text style={styles.statValue}>{paymentStats.cash.count} transaksi</Text>
                <Text style={styles.statValue}>Rp {paymentStats.cash.amount.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Kartu Kredit:</Text>
                <Text style={styles.statValue}>{paymentStats.credit.count} transaksi</Text>
                <Text style={styles.statValue}>Rp {paymentStats.credit.amount.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Kartu Debit:</Text>
                <Text style={styles.statValue}>{paymentStats.debit.count} transaksi</Text>
                <Text style={styles.statValue}>Rp {paymentStats.debit.amount.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Lainnya:</Text>
                <Text style={styles.statValue}>{paymentStats.other.count} transaksi</Text>
                <Text style={styles.statValue}>Rp {paymentStats.other.amount.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Status Transaksi</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Selesai:</Text>
                <Text style={styles.statusValue}>{statusStats.completed}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Dibatalkan:</Text>
                <Text style={styles.statusValue}>{statusStats.cancelled}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Dikembalikan:</Text>
                <Text style={styles.statusValue}>{statusStats.refunded}</Text>
              </View>
            </View>
          </View>

          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Daftar Transaksi</Text>
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
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
  dateSection: {
    marginBottom: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
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
  statsSection: {
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  statusSection: {
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#d4edda',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
  },
  statusRefunded: {
    backgroundColor: '#cce7ff',
  },
  statusDefault: {
    backgroundColor: '#e2e3e5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDetails: {
    // No additional styling needed
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
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
});

export default DailyTransactionReportScreen;