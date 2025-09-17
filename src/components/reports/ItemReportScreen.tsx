import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openDatabase } from '../../services/DatabaseService';

interface ItemData {
  code: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

const ItemReportScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [itemsData, setItemsData] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'highest' | 'lowest'>('highest');

  useEffect(() => {
    fetchItemsData();
  }, [sortOption]);

  const fetchItemsData = async () => {
    try {
      setLoading(true);
      const database = await openDatabase();
      
      // Query to get item sales data with quantity and revenue
      const result: any[] = await database.getAllAsync(
        `SELECT 
          t.itemId as code,
          SUM(t.quantity) as totalQuantity,
          SUM(t.quantity * t.price) as totalRevenue
        FROM inventory_transactions t
        WHERE t.type = 'out'
        GROUP BY t.itemId
        ORDER BY totalRevenue DESC`
      );
      
      // Get item details for each item
      const itemsWithDetails: ItemData[] = [];
      for (const item of result) {
        // Get item details from inventory_items table
        const itemDetails: any = await database.getFirstAsync(
          'SELECT name, category FROM inventory_items WHERE code = ?',
          [item.code]
        );
        
        if (itemDetails) {
          itemsWithDetails.push({
            code: item.code,
            name: itemDetails.name,
            category: itemDetails.category || 'Tidak Berkategori',
            quantity: parseInt(item.totalQuantity) || 0,
            revenue: parseFloat(item.totalRevenue) || 0
          });
        }
      }
      
      // Sort based on selected option
      const sortedData = [...itemsWithDetails].sort((a, b) => {
        if (sortOption === 'highest') {
          return b.revenue - a.revenue;
        } else {
          return a.revenue - b.revenue;
        }
      });
      
      setItemsData(sortedData);
    } catch (error) {
      console.error('Error fetching items data:', error);
      Alert.alert('Error', 'Failed to load items data');
      // Fallback to sample data in case of error
      const sampleData: ItemData[] = [
        { code: 'PRD001', name: 'Produk A', category: 'Elektronik', quantity: 150, revenue: 15000000 },
        { code: 'PRD002', name: 'Produk B', category: 'Pakaian', quantity: 200, revenue: 8000000 },
        { code: 'PRD003', name: 'Produk C', category: 'Makanan', quantity: 350, revenue: 7000000 },
        { code: 'PRD004', name: 'Produk D', category: 'Elektronik', quantity: 80, revenue: 12000000 },
        { code: 'PRD005', name: 'Produk E', category: 'Pakaian', quantity: 120, revenue: 4800000 },
        { code: 'PRD006', name: 'Produk F', category: 'Aksesori', quantity: 90, revenue: 2700000 },
        { code: 'PRD007', name: 'Produk G', category: 'Makanan', quantity: 250, revenue: 5000000 },
        { code: 'PRD008', name: 'Produk H', category: 'Elektronik', quantity: 60, revenue: 9000000 },
      ];
      
      // Sort based on selected option
      const sortedData = [...sampleData].sort((a, b) => {
        if (sortOption === 'highest') {
          return b.revenue - a.revenue;
        } else {
          return a.revenue - b.revenue;
        }
      });
      
      setItemsData(sortedData);
    } finally {
      setLoading(false);
    }
  };

  const getTopItems = () => {
    return itemsData.slice(0, 5);
  };

  const getBottomItems = () => {
    return itemsData.slice(-5).reverse();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Item Penjualan</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data item...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Item Penjualan</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filter Urutan</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={[styles.filterButton, sortOption === 'highest' && styles.activeFilterButton]}
                onPress={() => setSortOption('highest')}
              >
                <Text style={[styles.filterButtonText, sortOption === 'highest' && styles.activeFilterButtonText]}>
                  Tertinggi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, sortOption === 'lowest' && styles.activeFilterButton]}
                onPress={() => setSortOption('lowest')}
              >
                <Text style={[styles.filterButtonText, sortOption === 'lowest' && styles.activeFilterButtonText]}>
                  Terendah
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.topItemsSection}>
            <Text style={styles.sectionTitle}>
              {sortOption === 'highest' ? '5 Item Penjualan Tertinggi' : '5 Item Penjualan Terendah'}
            </Text>
            {getTopItems().map((item, index) => (
              <View key={item.code} style={styles.itemCard}>
                <View style={styles.itemRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={styles.itemMetrics}>
                  <Text style={styles.metricValue}>{item.quantity}</Text>
                  <Text style={styles.metricLabel}>Qty</Text>
                </View>
                <View style={styles.itemMetrics}>
                  <Text style={styles.metricValue}>Rp {item.revenue.toLocaleString('id-ID')}</Text>
                  <Text style={styles.metricLabel}>Revenue</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomItemsSection}>
            <Text style={styles.sectionTitle}>
              {sortOption === 'highest' ? '5 Item Penjualan Terendah' : '5 Item Penjualan Tertinggi'}
            </Text>
            {getBottomItems().map((item, index) => (
              <View key={item.code} style={styles.itemCard}>
                <View style={styles.itemRank}>
                  <Text style={styles.rankText}>#</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={styles.itemMetrics}>
                  <Text style={styles.metricValue}>{item.quantity}</Text>
                  <Text style={styles.metricLabel}>Qty</Text>
                </View>
                <View style={styles.itemMetrics}>
                  <Text style={styles.metricValue}>Rp {item.revenue.toLocaleString('id-ID')}</Text>
                  <Text style={styles.metricLabel}>Revenue</Text>
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
  topItemsSection: {
    marginBottom: 20,
  },
  bottomItemsSection: {
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    alignItems: 'center',
  },
  itemRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#888',
  },
  itemMetrics: {
    alignItems: 'center',
    marginLeft: 10,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
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

export default ItemReportScreen;