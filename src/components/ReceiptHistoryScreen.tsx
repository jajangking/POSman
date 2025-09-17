import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InventoryTransaction } from '../models/Inventory';
import { fetchInventoryTransactions } from '../services/InventoryService';
import { formatRupiah } from '../models/Inventory';

interface ReceiptHistoryScreenProps {
  onBack: () => void;
}

const ReceiptHistoryScreen: React.FC<ReceiptHistoryScreenProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Untuk saat ini, kita akan menampilkan semua transaksi
      // Di implementasi nyata, ini akan difilter untuk hanya menampilkan transaksi penerimaan
      const allTransactions = await fetchAllTransactions();
      // Filter hanya transaksi penerimaan (type 'in')
      const receiptTransactions = allTransactions.filter(t => t.type === 'in');
      setTransactions(receiptTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi sementara untuk mengambil semua transaksi
  const fetchAllTransactions = async (): Promise<InventoryTransaction[]> => {
    // Implementasi sementara - dalam aplikasi nyata ini akan mengambil dari database
    return [
      {
        id: '1',
        itemCode: 'ITEM-001',
        type: 'in',
        quantity: 10,
        price: 50000,
        reason: 'Pembelian dari supplier ABC',
        reference: 'PO-001',
        createdAt: new Date(),
        createdBy: 'Admin'
      },
      {
        id: '2',
        itemCode: 'ITEM-002',
        type: 'in',
        quantity: 5,
        price: 75000,
        reason: 'Pembelian dari supplier XYZ',
        reference: 'PO-002',
        createdAt: new Date(Date.now() - 86400000), // Kemarin
        createdBy: 'Staff'
      },
      {
        id: '3',
        itemCode: 'ITEM-003',
        type: 'in',
        quantity: 20,
        price: 25000,
        reason: 'Pembelian dari supplier DEF',
        reference: 'PO-003',
        createdAt: new Date(Date.now() - 172800000), // 2 hari yang lalu
        createdBy: 'Admin'
      }
    ];
  };

  const renderTransactionItem = ({ item }: { item: InventoryTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString('id-ID')}
        </Text>
        <Text style={styles.transactionQuantity}>+{item.quantity}</Text>
      </View>
      <Text style={styles.transactionPrice}>{formatRupiah(item.price)}</Text>
      <Text style={styles.transactionReason}>{item.reason || 'Tidak ada catatan'}</Text>
      <Text style={styles.transactionReference}>Ref: {item.reference || 'Tidak ada referensi'}</Text>
      <Text style={styles.transactionUser}>Oleh: {item.createdBy}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Riwayat Penerimaan</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada riwayat penerimaan</Text>
              <Text style={styles.emptySubtext}>Belum ada penerimaan barang</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
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
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionDate: {
    fontSize: 16,
    color: '#666',
  },
  transactionQuantity: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: 'bold',
  },
  transactionPrice: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 10,
  },
  transactionReason: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  transactionReference: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  transactionUser: {
    fontSize: 14,
    color: '#999',
  },
});

export default ReceiptHistoryScreen;