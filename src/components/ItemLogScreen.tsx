import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchInventoryTransactions } from '../services/InventoryService';
import { getAllSOHistory } from '../services/SOHistoryService';
import { getSOMonitoringRecordsByItemCode } from '../services/DatabaseService';

interface TransactionLog {
  id: string;
  date: string;
  type: 'so_minus' | 'so_plus' | 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  price: number;
  description: string;
}

interface MonitoringRecord {
  id: string;
  date: string;
  soCount: number;
  totalDifference: number;
  totalRpDifference: number;
  consecutiveSOCount: number;
  status: 'normal' | 'warning' | 'critical';
  notes: string;
}

interface GroupedTransactions {
  [date: string]: {
    transactions: TransactionLog[];
    monitoring?: MonitoringRecord;
  };
}

interface ItemLogScreenProps {
  itemCode: string;
  itemName: string;
  onBack: () => void;
}

const ItemLogScreen: React.FC<ItemLogScreenProps> = ({ itemCode, itemName, onBack }) => {
  const [groupedData, setGroupedData] = useState<GroupedTransactions>({});
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      // Load inventory transactions
      const inventoryTransactions = await fetchInventoryTransactions(itemCode);
      
      // Format inventory transactions
      const formattedTransactions: TransactionLog[] = inventoryTransactions.map(tx => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        type: tx.type === 'in' ? 'purchase' : 'sale',
        quantity: tx.quantity,
        price: tx.price,
        description: tx.reason || (tx.type === 'in' ? 'Penerimaan stock' : 'Penjualan')
      }));
      
      // Load SO history
      const history = await getAllSOHistory();
      
      // Parse SO history to find relevant entries for this item
      const soTransactions: TransactionLog[] = [];
      for (const so of history) {
        try {
          const items = JSON.parse(so.items);
          const item = items.find((i: any) => i.code === itemCode);
          
          if (item) {
            // Determine SO type based on difference
            const soType = item.difference < 0 ? 'so_minus' : item.difference > 0 ? 'so_plus' : 'adjustment';
            
            soTransactions.push({
              id: so.id,
              date: so.date,
              type: soType,
              quantity: Math.abs(item.difference),
              price: item.price,
              description: `Stock Opname - Selisih: ${item.difference > 0 ? '+' : ''}${item.difference}`
            });
          }
        } catch (error) {
          console.error('Error parsing SO items:', error);
        }
      }
      
      // Load SO monitoring records
      const monitoringRecords = await getSOMonitoringRecordsByItemCode(itemCode);
      
      // Combine all transactions
      const allTransactions = [...formattedTransactions, ...soTransactions];
      
      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Group transactions by date
      const grouped: GroupedTransactions = {};
      
      // Group transactions
      allTransactions.forEach(transaction => {
        const dateKey = new Date(transaction.date).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!grouped[dateKey]) {
          grouped[dateKey] = { transactions: [] };
        }
        grouped[dateKey].transactions.push(transaction);
      });
      
      // Add monitoring records to grouped data
      monitoringRecords.forEach(record => {
        const dateKey = record.date.split('T')[0]; // YYYY-MM-DD
        if (grouped[dateKey]) {
          grouped[dateKey].monitoring = record;
        } else {
          grouped[dateKey] = { transactions: [], monitoring: record };
        }
      });
      
      setGroupedData(grouped);
    } catch (error) {
      console.error('Error loading logs:', error);
      Alert.alert('Error', 'Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'so_minus': return 'SO Minus';
      case 'so_plus': return 'SO Plus';
      case 'sale': return 'Penjualan';
      case 'purchase': return 'Penerimaan Stock';
      case 'adjustment': return 'Adjustment';
      default: return type;
    }
  };

  const getTypeStyle = (type: string): any => {
    switch (type) {
      case 'so_minus': return styles.soMinusType;
      case 'so_plus': return styles.soPlusType;
      case 'sale': return styles.saleType;
      case 'purchase': return styles.purchaseType;
      case 'adjustment': return styles.adjustmentType;
      default: return styles.defaultType;
    }
  };

  const getStatusStyle = (status: string): any => {
    switch (status) {
      case 'warning': return styles.warningStatus;
      case 'critical': return styles.criticalStatus;
      default: return styles.normalStatus;
    }
  };

  useEffect(() => {
    loadLogs();
  }, [itemCode]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.title}>Log Item: {itemName}</Text>
          <Text style={styles.code}>Code: {itemCode}</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat log transaksi...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{itemName}</Text>
          <Text style={styles.code}>{itemCode}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {Object.keys(groupedData).length > 0 ? (
          Object.keys(groupedData).map(date => {
            const { transactions, monitoring } = groupedData[date];
            const soCount = transactions.filter(tx => 
              tx.type === 'so_minus' || tx.type === 'so_plus' || tx.type === 'adjustment'
            ).length;
            
            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  {soCount > 0 && (
                    <Text style={styles.soCountText}>{soCount}x SO</Text>
                  )}
                </View>
                
                {/* Monitoring Section */}
                {monitoring && (
                  <View style={[styles.monitoringItem, getStatusStyle(monitoring.status)]}>
                    <View style={styles.monitoringHeader}>
                      <Text style={styles.monitoringTitle}>Monitoring Qty</Text>
                      <Text style={styles.monitoringStatus}>{monitoring.status.toUpperCase()}</Text>
                    </View>
                    <View style={styles.monitoringDetails}>
                      <Text style={styles.monitoringText}>
                        Selisih Total: {monitoring.totalDifference > 0 ? '+' : ''}{monitoring.totalDifference}
                      </Text>
                      <Text style={styles.monitoringText}>
                        Nilai: Rp {Math.abs(monitoring.totalRpDifference).toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {monitoring.consecutiveSOCount > 0 && (
                      <Text style={styles.monitoringText}>
                        SO Berturut-turut: {monitoring.consecutiveSOCount}x
                      </Text>
                    )}
                    {monitoring.notes && (
                      <Text style={styles.monitoringNotes}>{monitoring.notes}</Text>
                    )}
                  </View>
                )}
                
                {/* Transactions */}
                {transactions.map((transaction, index) => (
                  <View key={`${date}-${index}`} style={styles.logItem}>
                    <View style={styles.logHeader}>
                      <Text style={[styles.logType, getTypeStyle(transaction.type)]}>
                        {getTypeText(transaction.type)}
                      </Text>
                      <Text style={styles.logTime}>
                        {new Date(transaction.date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <Text style={styles.logDescription}>{transaction.description}</Text>
                    <View style={styles.logDetails}>
                      <Text style={styles.logQuantity}>
                        Qty: {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                      </Text>
                      <Text style={styles.logPrice}>
                        Rp {Math.abs(transaction.price * transaction.quantity).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Tidak ada log transaksi untuk item ini</Text>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  code: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  soCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monitoringItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monitoringTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
  },
  monitoringStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#1565c0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monitoringDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  monitoringText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
  },
  monitoringNotes: {
    fontSize: 13,
    color: '#1565c0',
    fontStyle: 'italic',
    marginTop: 5,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  logDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  logPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 30,
  },
  // Type styles
  soMinusType: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  soPlusType: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  saleType: {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
  },
  purchaseType: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
  },
  adjustmentType: {
    backgroundColor: '#f3e5f5',
    color: '#6a1b9a',
  },
  defaultType: {
    backgroundColor: '#eeeeee',
    color: '#616161',
  },
  // Status styles
  normalStatus: {
    borderColor: '#bbdefb',
    backgroundColor: '#e3f2fd',
  },
  warningStatus: {
    borderColor: '#ffd54f',
    backgroundColor: '#fff8e1',
  },
  criticalStatus: {
    borderColor: '#ef9a9a',
    backgroundColor: '#ffebee',
  },
});

export default ItemLogScreen;