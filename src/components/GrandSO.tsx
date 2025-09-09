import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Platform, Keyboard, LayoutAnimation, UIManager, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllInventoryItems, fetchInventoryItemByCode } from '../services/InventoryService';
import { getCurrentSOSession, updateSOSessionItems, upsertSOSession } from '../services/DatabaseService';
import { InventoryItem } from '../models/Inventory';

interface GrandSOProps {
  onBack?: () => void;
  onNavigateToEditSO?: (items: SOItem[]) => void;
}

interface SOItem {
  id: string;
  code: string;
  name: string;
  sku: string;
  quantity: number;
  systemQuantity: number;
  soQuantity: number;
  category: string;
  price: number;
}

export type { SOItem };

const GrandSO: React.FC<GrandSOProps> = ({ onBack, onNavigateToEditSO }) => {
  const [items, setItems] = useState<SOItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Enable LayoutAnimation for Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // Load all inventory items on component mount
  useEffect(() => {
    const loadAllItems = async () => {
      try {
        // Check if there's a saved session first
        const sessionData = await getCurrentSOSession();
        if (sessionData && sessionData.items) {
          const parsedItems: SOItem[] = JSON.parse(sessionData.items);
          setItems(parsedItems);
        } else {
          // Load all inventory items
          const inventoryItems = await fetchAllInventoryItems();
          const soItems: SOItem[] = inventoryItems.map(item => ({
            id: Date.now().toString() + item.code,
            code: item.code,
            name: item.name,
            sku: item.sku || '',
            quantity: 1,
            systemQuantity: item.quantity,
            soQuantity: 0,
            category: item.category || '',
            price: item.price || 0
          }));
          setItems(soItems);
        }
      } catch (error) {
        console.error('Error loading inventory items:', error);
        Alert.alert(
          'Error',
          'Terjadi kesalahan saat memuat data inventory.'
        );
      }
    };
    
    loadAllItems();
  }, []);

  // Save items to session storage whenever they change with debounce
  useEffect(() => {
    // Jangan simpan jika sedang menyimpan
    if (isSaving) return;
    
    // Gunakan debounce untuk menghindari terlalu sering menyimpan
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        if (items.length > 0) {
          const itemsJson = JSON.stringify(items);
          await updateSOSessionItems(itemsJson);
        } else {
          await updateSOSessionItems('');
        }
      } catch (error) {
        console.error('Error saving SO items to database:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500); // Tunggu 500ms setelah perubahan terakhir
    
    // Bersihkan timer jika items berubah sebelum timeout
    return () => clearTimeout(timer);
  }, [items, isSaving]);

  // Handle Android back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show confirmation dialog when trying to exit during an SO session
      Alert.alert(
        'Konfirmasi Keluar',
        'Anda memiliki sesi Stock Opname yang sedang berjalan. Apakah Anda yakin ingin keluar? Data akan disimpan sementara dan dapat dilanjutkan nanti.',
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Keluar',
            style: 'destructive',
            onPress: () => {
              // Save current session before exiting
              if (onBack) {
                onBack();
              }
            },
          },
        ]
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [items, onBack]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSoQuantityChange = (id: string, value: string) => {
    // Allow empty values (will show as empty in UI but store as 0)
    if (value === '') {
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id 
            ? { ...item, soQuantity: 0 } // Set to 0 when empty
            : item
        )
      );
    } else {
      // Only allow numeric values
      const newSoQuantity = parseInt(value, 10);
      if (!isNaN(newSoQuantity)) {
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === id 
              ? { ...item, soQuantity: newSoQuantity } 
              : item
          )
        );
      }
    }
  };

  // Sort items by category
  const getSortedItems = () => {
    return [...items].sort((a, b) => {
      // Sort by category first
      const categoryA = a.category || 'Tidak Berkategori';
      const categoryB = b.category || 'Tidak Berkategori';
      
      if (categoryA < categoryB) return -1;
      if (categoryA > categoryB) return 1;
      
      // If categories are the same, sort by name
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      
      return 0;
    });
  };

  // Table header component
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.noColumn]}>No</Text>
      <Text style={[styles.tableHeaderText, styles.codeSkuColumn]}>Kode/SKU</Text>
      <Text style={[styles.tableHeaderText, styles.nameColumn]}>Nama</Text>
      <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Qty Fisik</Text>
    </View>
  );

  // Table row component
  const renderTableRow = ({ item, index }: { item: SOItem; index: number }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCellText, styles.noColumn]}>{index + 1}</Text>
      <View style={[styles.codeSkuColumn, styles.codeSkuContainer]}>
        <Text style={styles.codeText} numberOfLines={1}>{item.code}</Text>
        <Text style={styles.skuText} numberOfLines={1}>{item.sku || '-'}</Text>
      </View>
      <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={1}>{item.name}</Text>
      <View style={[styles.qtyColumn, styles.qtyInputContainer]}>
        <TextInput
          style={styles.qtyInput}
          value={item.soQuantity === 0 ? '' : item.soQuantity.toString()}
          onChangeText={(value) => handleSoQuantityChange(item.id, value)}
          keyboardType="numeric"
          placeholder="0"
          onFocus={() => {
            // Scroll to item when input is focused
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
      </View>
    </View>
  );

  // Handle process button press - show confirmation with item counts only
  const handleProcess = async () => {
    // Save draft before navigating to EditSO and update session
    try {
      // Update session to reflect that we're going to editSO
      const sessionData = await getCurrentSOSession();
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          lastView: 'editSO'
        };
        await upsertSOSession(updatedSession);
      }
      
      // Save items as draft
      const itemsJson = JSON.stringify(items);
      await updateSOSessionItems(itemsJson);
    } catch (error) {
      console.error('Error saving SO session/items to database before navigating to EditSO:', error);
    }
    
    // Navigate to EditSO with all items
    if (onNavigateToEditSO) {
      // Show confirmation dialog with item counts only
      const matchingItems = items.filter(item => item.soQuantity === item.systemQuantity);
      const mismatchingItems = items.filter(item => item.soQuantity !== item.systemQuantity);
      
      let message = `Total Item: ${items.length}\n`;
      
      if (matchingItems.length > 0) {
        message += `\nItem yang sesuai: ${matchingItems.length}\n`;
      }
      
      if (mismatchingItems.length > 0) {
        message += `\nItem dengan selisih: ${mismatchingItems.length}\n`;
      }
      
      message += '\nLanjutkan ke halaman Edit SO?';
      
      Alert.alert(
        'Konfirmasi Proses',
        message,
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Lanjutkan', 
            onPress: () => {
              onNavigateToEditSO(items);
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Grand Stock Opname</Text>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          keyboardShouldPersistTaps="handled"
        >
          {/* Items List */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Semua Item Inventory:</Text>
            {items.length > 0 ? (
              <View style={styles.tableContainer}>
                {renderTableHeader()}
                <FlatList
                  data={getSortedItems()}
                  renderItem={renderTableRow}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>Belum ada item inventory</Text>
            )}
          </View>
          
        </ScrollView>
        
        {/* Fixed Action Button at the bottom */}
        {items.length > 0 && (
          <View 
            style={[
              styles.bottomButtonContainer,
              isKeyboardVisible && { marginBottom: keyboardHeight }
            ]}
          >
            <TouchableOpacity 
              style={styles.processButton}
              onPress={handleProcess}
            >
              <Text style={styles.processButtonText}>Proses</Text>
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'center',
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
  content: {
    flex: 1,
    padding: 15,
    paddingBottom: 150, // Increased padding at the bottom to prevent content from being covered
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    fontSize: 14,
  },
  tableCellText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 14,
  },
  noColumn: {
    width: '5%',
  },
  codeSkuColumn: {
    width: '20%',
  },
  nameColumn: {
    width: '50%',
  },
  qtyColumn: {
    width: '15%',
  },
  actionColumn: {
    width: '10%',
  },
  codeSkuContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  skuText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  qtyInputContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    width: '90%',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 18,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 30,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingBottom: 35,
    paddingTop: 10,
  },
  processButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  plusText: {
    color: '#34C759',
    fontWeight: '600',
  },
  minusText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  zeroText: {
    color: '#888',
  },
});

export default GrandSO;