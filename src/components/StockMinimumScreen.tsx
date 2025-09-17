import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLowStockItems, modifyInventoryItem, fetchTopSellingItems } from '../services/InventoryService';
import { InventoryItem } from '../models/Inventory';

interface StockMinimumScreenProps {
  onBack: () => void;
  onNavigateToInputBarang: (item: InventoryItem) => void;
}

const StockMinimumScreen: React.FC<StockMinimumScreenProps> = ({ onBack, onNavigateToInputBarang }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReorderLevel, setEditingReorderLevel] = useState<string | null>(null);
  const [newReorderLevel, setNewReorderLevel] = useState<string>('');
  const [topSellingItems, setTopSellingItems] = useState<{[key: string]: number}>({});

  useEffect(() => {
    loadLowStockItems();
    loadTopSellingItems();
  }, []);

  const loadLowStockItems = async () => {
    try {
      setLoading(true);
      const lowStockItems = await fetchLowStockItems();
      setItems(lowStockItems);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      Alert.alert('Error', 'Failed to load low stock items');
    } finally {
      setLoading(false);
    }
  };

  const loadTopSellingItems = async () => {
    try {
      const topItems = await fetchTopSellingItems(20); // Get top 20 selling items
      const topItemsMap: {[key: string]: number} = {};
      topItems.forEach(item => {
        topItemsMap[item.itemCode] = item.totalSold;
      });
      setTopSellingItems(topItemsMap);
    } catch (error) {
      console.error('Error loading top selling items:', error);
    }
  };

  const handleRefresh = async () => {
    await loadLowStockItems();
    await loadTopSellingItems();
  };

  const handleSaveReorderLevel = async (itemCode: string) => {
    try {
      const newLevel = parseInt(newReorderLevel);
      if (isNaN(newLevel) || newLevel < 0) {
        Alert.alert('Error', 'Masukkan angka yang valid untuk stok minimum');
        return;
      }
      
      await modifyInventoryItem(itemCode, { reorderLevel: newLevel });
      setEditingReorderLevel(null);
      setNewReorderLevel('');
      await loadLowStockItems(); // Refresh the list
    } catch (error) {
      console.error('Error updating reorder level:', error);
      Alert.alert('Error', 'Gagal memperbarui stok minimum');
    }
  };

  const isTopSellingItem = (itemCode: string): boolean => {
    return Object.keys(topSellingItems).includes(itemCode);
  };

  const renderStockItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {isTopSellingItem(item.code) && (
            <View style={styles.topSellingBadge}>
              <Text style={styles.topSellingText}>Terlaris</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemCode}>Kode: {item.code}</Text>
        <Text style={styles.itemCategory}>Kategori: {item.category || 'Tidak ada kategori'}</Text>
        <View style={styles.stockInfo}>
          <Text style={styles.currentStock}>Stok saat ini: {item.quantity}</Text>
          {editingReorderLevel === item.code ? (
            <View style={styles.reorderLevelInputContainer}>
              <TextInput
                style={styles.reorderLevelInput}
                value={newReorderLevel}
                onChangeText={setNewReorderLevel}
                keyboardType="numeric"
                placeholder="Stok minimum"
              />
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => handleSaveReorderLevel(item.code)}
              >
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reorderLevelContainer}>
              <Text style={styles.reorderLevel}>Stok minimum: {item.reorderLevel}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setEditingReorderLevel(item.code);
                  setNewReorderLevel(item.reorderLevel.toString());
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => onNavigateToInputBarang(item)}
      >
        <Text style={styles.addButtonText}>Tambah Stok</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Stok Minimum</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada barang dengan stok minimum</Text>
            <Text style={styles.emptySubtext}>Semua barang memiliki stok yang cukup</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.code}
            renderItem={renderStockItem}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  refreshButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
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
    padding: 15,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemInfo: {
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  topSellingBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  topSellingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentStock: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  reorderLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderLevel: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reorderLevelInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderLevelInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 5,
    width: 80,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default StockMinimumScreen;