import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllInventoryItems, updateInventoryItem, calculateTotalSalesLastMonth } from '../services/DatabaseService';
import { InventoryItem } from '../models/Inventory';
import ScannerModal from './ScannerModal';
import { saveAutomaticPOSession, saveLastView } from '../services/AutomaticPOSessionService';

interface Barang {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  currentStock: number;
  idealStock: number;
  minOrder: number;
  originalIdealStock: number; // To track changes
  originalMinOrder: number; // To track changes
  isPopular: boolean;
  totalSales: number;
  sku?: string; // Add sku property as optional
}

interface SettingMinimalOrderScreenProps {
  onBack: () => void;
}

const SettingMinimalOrderScreen: React.FC<SettingMinimalOrderScreenProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'notPopular' | 'all'>('all');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load inventory items when component mounts
  useEffect(() => {
    loadInventoryItems();
  }, []);

  // Save session when component mounts
  useEffect(() => {
    saveAutomaticPOSession({ lastView: 'settingMinimalOrder' });
    saveLastView('settingMinimalOrder');
  }, []);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Konfirmasi',
        'Apakah Anda yakin ingin keluar dari halaman setting minimal order?',
        [
          {
            text: 'Batal',
            onPress: () => {},
            style: 'cancel'
          },
          {
            text: 'Keluar',
            onPress: () => onBack()
          }
        ]
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, []);

  // Check for changes whenever barangList updates
  useEffect(() => {
    const hasAnyChanges = barangList.some(
      barang => barang.idealStock !== barang.originalIdealStock || 
                (barang.minOrder > 0 && barang.minOrder !== barang.originalMinOrder) ||
                (barang.minOrder === 0 && barang.originalMinOrder !== 1) // Jika minOrder 0, bandingkan dengan default 1
    );
    setHasChanges(hasAnyChanges);
  }, [barangList]);

  const loadInventoryItems = async () => {
    try {
      setIsLoading(true);
      const items = await getAllInventoryItems();
      const barangData: Barang[] = [];
      
      // Process each item to calculate total sales and determine popularity
      for (const item of items) {
        try {
          // Calculate total sales for the last month
          const totalSales = await calculateTotalSalesLastMonth(item.code);
          
          // Determine if item is popular based on sales (more than 10 sales in a month)
          const isPopular = totalSales > 10;
          
          barangData.push({
            id: item.code,
            code: item.code,
            name: item.name,
            category: item.category,
            price: item.price,
            cost: item.cost,
            currentStock: item.quantity,
            idealStock: item.reorderLevel,
            minOrder: Math.max(1, item.minOrder || 1), // Ensure minOrder is at least 1
            originalIdealStock: item.reorderLevel, // Store original value for change tracking
            originalMinOrder: Math.max(1, item.minOrder || 1), // Store original value for change tracking
            isPopular: isPopular,
            totalSales: totalSales,
            sku: item.sku // Add sku property
          });
        } catch (itemError) {
          console.error(`Error processing item ${item.code}:`, itemError);
          // Still add the item but with default values for sales data
          barangData.push({
            id: item.code,
            code: item.code,
            name: item.name,
            category: item.category,
            price: item.price,
            cost: item.cost,
            currentStock: item.quantity,
            idealStock: item.reorderLevel,
            minOrder: Math.max(1, item.minOrder || 1), // Ensure minOrder is at least 1
            originalIdealStock: item.reorderLevel, // Store original value for change tracking
            originalMinOrder: Math.max(1, item.minOrder || 1), // Store original value for change tracking
            isPopular: false,
            totalSales: 0,
            sku: item.sku // Add sku property
          });
        }
      }
      
      setBarangList(barangData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdealStockChange = (id: string, value: string) => {
    const newIdealStock = parseInt(value) || 0;
    
    // Update local state immediately for responsive UI
    setBarangList(prev => 
      prev.map(barang => 
        barang.id === id ? {...barang, idealStock: newIdealStock} : barang
      )
    );
  };

  const handleMinOrderChange = (id: string, value: string) => {
    // Allow empty value during editing
    if (value === '') {
      setBarangList(prev => 
        prev.map(barang => 
          barang.id === id ? {...barang, minOrder: 0} : barang
        )
      );
      return;
    }
    
    const newMinOrder = parseInt(value) || 0;
    
    // Update local state immediately for responsive UI
    setBarangList(prev => 
      prev.map(barang => 
        barang.id === id ? {...barang, minOrder: newMinOrder} : barang
      )
    );
  };

  // Save all changes to the database
  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      // Get all items that have changed
      const changedItems = barangList.filter(
        barang => barang.idealStock !== barang.originalIdealStock || barang.minOrder !== barang.originalMinOrder
      );
      
      // Update each changed item in the database
      const updatePromises = changedItems.map(async (barang) => {
        try {
          const updates: any = {};
          if (barang.idealStock !== barang.originalIdealStock) {
            updates.reorderLevel = barang.idealStock;
          }
          if (barang.minOrder !== barang.originalMinOrder) {
            // Ensure minOrder is at least 1 when saving
            updates.minOrder = Math.max(1, barang.minOrder);
          }
          
          await updateInventoryItem(barang.id, updates);
          return { success: true, id: barang.id };
        } catch (error) {
          console.error(`Error updating item ${barang.id}:`, error);
          return { success: false, id: barang.id, error };
        }
      });
      
      const results = await Promise.all(updatePromises);
      
      // Check for any failures
      const failedUpdates = results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        Alert.alert(
          'Sebagian Gagal', 
          `Gagal menyimpan ${failedUpdates.length} item. Silakan coba lagi.`
        );
        // Reload data to revert failed changes
        loadInventoryItems();
      } else {
        // Update original values to match current values
        setBarangList(prev => 
          prev.map(barang => ({
            ...barang,
            originalIdealStock: barang.idealStock,
            originalMinOrder: Math.max(1, barang.minOrder) // Also update original value with validated minOrder
          }))
        );
        setHasChanges(false);
        Alert.alert('Berhasil', 'Semua perubahan telah disimpan');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setScannerVisible(false);
  };

  const renderBarangItem = ({ item }: { item: Barang }) => {
    const hasChanged = item.idealStock !== item.originalIdealStock;
    
    return (
      <View style={[styles.barangCard, hasChanged && styles.barangCardChanged]}>
        <View style={styles.barangHeader}>
          <Text style={styles.barangName} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.popularityBadge, item.isPopular ? styles.popular : styles.notPopular]}>
            <Text style={styles.popularityText}>
              {item.isPopular ? 'Laku' : 'Tidak Laku'}
            </Text>
          </View>
        </View>
        
        <View style={styles.barangInfo}>
          <Text style={styles.barangDetail}>Kode: {item.code}</Text>
          {item.sku ? <Text style={styles.barangDetail}>SKU: {item.sku}</Text> : null}
          <Text style={styles.barangDetail}>Kategori: {item.category}</Text>
          <Text style={styles.barangDetail}>Harga Modal: Rp{item.cost.toLocaleString()}</Text>
          <View style={styles.stockInfoRow}>
            <Text style={styles.barangDetail}>Stok Saat Ini: {item.currentStock}</Text>
            {item.currentStock <= item.idealStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Stok Rendah</Text>
              </View>
            )}
          </View>
          <Text style={styles.barangDetail}>Total Penjualan (1 bulan): {item.totalSales}</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ideal Stok:</Text>
            <TextInput
              style={[styles.input, hasChanged && styles.inputChanged]}
              value={item.idealStock.toString()}
              onChangeText={(value) => handleIdealStockChange(item.id, value)}
              keyboardType="numeric"
              placeholder="0"
              onFocus={() => {}}
            />
            {hasChanged && (
              <Text style={styles.changeIndicator}>Berubah</Text>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Min Order:</Text>
            <TextInput
              style={styles.input}
              value={item.minOrder > 0 ? item.minOrder.toString() : ''}
              onChangeText={(value) => handleMinOrderChange(item.id, value)}
              keyboardType="numeric"
              placeholder="Min 1"
              onFocus={() => {}}
            />
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Setting Minimal Order</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const filteredAndSortBarangList = barangList
    .filter(barang => 
      barang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barang.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barang.sku && barang.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by popularity first if sorting by popular or not popular
      if (sortBy === 'popular') {
        // Items marked as popular first
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
      } else if (sortBy === 'notPopular') {
        // Items marked as not popular first
        if (!a.isPopular && b.isPopular) return -1;
        if (a.isPopular && !b.isPopular) return 1;
      }
      // Then sort by name alphabetically
      return a.name.localeCompare(b.name);
    });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Setting Minimal Order</Text>
            <TouchableOpacity 
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
              onPress={saveAllChanges}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari barang..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            
            {/* Sort options */}
            <View style={styles.sortContainer}>
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'all' && styles.activeSortButton]} 
                onPress={() => setSortBy('all')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'all' && styles.activeSortButtonText]}>Semua</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'popular' && styles.activeSortButton]} 
                onPress={() => setSortBy('popular')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'popular' && styles.activeSortButtonText]}>Laku</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortBy === 'notPopular' && styles.activeSortButton]} 
                onPress={() => setSortBy('notPopular')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'notPopular' && styles.activeSortButtonText]}>Tidak Laku</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.scrollView} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.content}>
              <FlatList
                data={filteredAndSortBarangList}
                renderItem={renderBarangItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                extraData={barangList}
              />
            </View>
          </ScrollView>
          
          <ScannerModal
            visible={scannerVisible}
            onBarcodeScanned={handleBarcodeScanned}
            onClose={() => setScannerVisible(false)}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
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
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 10,
    zIndex: 1,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  activeSortButtonText: {
    color: 'white',
  },
  content: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  barangCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  barangCardChanged: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  barangHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barangName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  popularityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  popular: {
    backgroundColor: '#e8f5e9',
  },
  notPopular: {
    backgroundColor: '#ffebee',
  },
  popularityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  barangInfo: {
    marginBottom: 15,
  },
  stockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lowStockBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lowStockText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  barangDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  inputChanged: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  changeIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 5,
  },
});

export default SettingMinimalOrderScreen;