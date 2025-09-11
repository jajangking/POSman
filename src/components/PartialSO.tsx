import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, Alert, Platform, Keyboard, LayoutAnimation, UIManager, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScannerModal from './ScannerModal';
import ItemListModal from './ItemListModal';
import { fetchInventoryItemByCode, fetchAllInventoryItems } from '../services/InventoryService';
import { getCurrentSOSession, updateSOSessionItems, deleteSOSession, upsertSOSession, SOSession } from '../services/DatabaseService';
import { InventoryItem } from '../models/Inventory';

// Define session storage keys
const SO_SESSION_STORAGE_KEY = 'stock_opname_session';
const SO_ITEMS_STORAGE_KEY = 'stock_opname_items';

interface PartialSOProps {
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
  category: string; // Add category field (used for sorting only)
  price: number; // Add price field
}

export type { SOItem };

const PartialSO: React.FC<PartialSOProps> = ({ onBack, onNavigateToEditSO }) => {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<SOItem[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [itemListVisible, setItemListVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Tambahkan state tracking penyimpanan
  const scrollViewRef = useRef<ScrollView>(null);
  const bottomButtonContainerRef = useRef<View>(null);

  // console.log('PartialSO component mounted, initial items state:', items);

  // Load saved items on component mount
  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const sessionData = await getCurrentSOSession();
        // console.log('Loading session data from database:', sessionData);
        if (sessionData && sessionData.items) {
          const parsedItems: SOItem[] = JSON.parse(sessionData.items);
          // console.log('Parsed items:', parsedItems);
          setItems(parsedItems);
          // console.log('Items state updated with saved items');
        } else {
          // console.log('No saved items found in database session');
        }
      } catch (error) {
        console.error('Error loading saved SO items:', error);
      }
    };
    
    loadSavedItems();
  }, []); // Empty dependency array means this runs only once on mount
  
  // Save items to session storage whenever they change with debounce
  useEffect(() => {
    // Jangan simpan jika sedang menyimpan
    if (isSaving) return;
    
    // Gunakan debounce untuk menghindari terlalu sering menyimpan
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        // console.log('Saving items to database session:', items);
        if (items.length > 0) {
          const itemsJson = JSON.stringify(items);
          await updateSOSessionItems(itemsJson);
          // console.log('Items saved successfully to database');
        } else {
          // console.log('No items to save, updating session with empty items');
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
  }, [items, isSaving]); // Dependency on items array and isSaving means this runs when items change or when saving state changes

  // Enable LayoutAnimation for Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

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

  const handleScan = () => {
    // console.log('Scan button pressed');
    // console.log('Setting scannerVisible to true');
    setScannerVisible(true);
    // console.log('scannerVisible state after set:', scannerVisible);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setInputText(barcode);
    // Automatically look up the item after scanning
    processItemLookup(barcode);
  };

  const handleAdd = () => {
    // console.log('Add button pressed');
    if (inputText.trim()) {
      processItemLookup(inputText);
    }
  };

  const processItemLookup = async (query: string) => {
    try {
      const item = await fetchInventoryItemByCode(query);
      
      if (item) {
        // Check if item is already in the SO list
        const existingItem = items.find(i => i.code === item.code);
        
        if (existingItem) {
          Alert.alert(
            'Item Sudah Ada',
            'Item ini sudah ada dalam daftar SO. Apakah Anda ingin menambahkan ulang?',
            [
              { text: 'Batal', style: 'cancel' },
              { 
                text: 'Tambahkan Ulang', 
                onPress: () => showAddItemConfirmation(item) 
              }
            ]
          );
        } else {
          showAddItemConfirmation(item);
        }
      } else {
        Alert.alert(
          'Item Tidak Ditemukan',
          'Item dengan kode/barcode tersebut tidak ditemukan dalam database.'
        );
      }
    } catch (error) {
      console.error('Error looking up item:', error);
      Alert.alert(
        'Error',
        'Terjadi kesalahan saat mencari item.'
      );
    }
  };

  const showAddItemConfirmation = (item: InventoryItem) => {
    Alert.alert(
      'Tambah Item ke SO',
      `Apakah Anda yakin ingin menambahkan item berikut ke daftar SO?\n\nKode: ${item.code}\nNama: ${item.name}\nSKU: ${item.sku || '-'}\nKategori: ${item.category || '-'}\nQty Sistem: ${item.quantity}`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Tambahkan', 
          onPress: () => addItemToSO(item) 
        }
      ]
    );
  };

  const addItemToSO = (item: InventoryItem) => {
    // console.log('addItemToSO called with item:', item);
    const newItem: SOItem = {
      id: Date.now().toString(),
      code: item.code,
      name: item.name,
      sku: item.sku,
      quantity: 1,
      systemQuantity: item.quantity,
      soQuantity: 0, // Default to 0 instead of system quantity
      category: item.category || '', // Add category (for sorting only)
      price: item.price || 0 // Add price
    };
    
    // console.log('Adding new item to SO:', newItem);
    setItems(prevItems => {
      const newItems = [...prevItems, newItem];
      // console.log('Updated items state:', newItems);
      return newItems;
    });
    setInputText('');
    // console.log('Input text cleared');
  };

  const handleF1 = () => {
    // console.log('F1 button pressed');
    // console.log('Setting itemListVisible to true');
    setItemListVisible(true);
    // console.log('itemListVisible state after set:', itemListVisible);
  };

  const handleItemSelect = (item: InventoryItem) => {
    // Check if item is already in the SO list
    const existingItem = items.find(i => i.code === item.code);
    
    if (existingItem) {
      Alert.alert(
        'Item Sudah Ada',
        'Item ini sudah ada dalam daftar SO.',
        [{ text: 'OK' }]
      );
    } else {
      showAddItemConfirmation(item);
    }
    
    setItemListVisible(false);
  };

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

  const handleRemoveItem = (id: string, itemName: string) => {
    // console.log('handleRemoveItem called with id:', id, 'itemName:', itemName);
    Alert.alert(
      'Hapus Item',
      `Apakah Anda yakin ingin menghapus item "${itemName}" dari daftar SO?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          onPress: () => {
            // console.log('Removing item with id:', id);
            setItems(prevItems => {
              const filteredItems = prevItems.filter(item => item.id !== id);
              // console.log('Items after removal:', filteredItems);
              return filteredItems;
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handlePrintDifference = () => {
    // Filter items with differences (selisih)
    const itemsWithDifference = items.filter(item => item.soQuantity !== item.systemQuantity);
    
    if (itemsWithDifference.length === 0) {
      Alert.alert(
        'Tidak Ada Selisih',
        'Tidak ada item dengan selisih antara qty fisik dan qty sistem.'
      );
      return;
    }
    
    // Generate a simple report string
    let report = 'LAPORAN SELISIH STOCK OPNAME\n';
    report += '==============================\n\n';
    
    // Sort items by category first, then by name
    const sortedItems = [...itemsWithDifference].sort((a, b) => {
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
    
    // Group items by category
    const groupedItems: { [key: string]: typeof sortedItems } = {};
    sortedItems.forEach(item => {
      const category = item.category || 'Tidak Berkategori';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });
    
    // Add items to report grouped by category
    Object.keys(groupedItems).forEach(category => {
      report += `\nKategori: ${category}\n`;
      report += '----------------------------------------\n';
      report += 'Kode\t\tNama\t\tSistem\tFisik\tSelisih\n';
      report += '----------------------------------------\n';
      
      groupedItems[category].forEach(item => {
        const difference = item.soQuantity - item.systemQuantity;
        report += `${item.code}\t\t${item.name.substring(0, 8)}\t${item.systemQuantity}\t${item.soQuantity}\t${difference > 0 ? '+' : ''}${difference}\n`;
      });
    });
    
    report += '\n\nTotal Item dengan Selisih: ' + itemsWithDifference.length;
    
    // In a real implementation, you would send this to a printer or generate a PDF
    // For now, we'll just show an alert with a preview of the report
    Alert.alert(
      'Cetak Selisih',
      `Preview Laporan:\n\n${report.substring(0, 1000)}${report.length > 1000 ? '\n\n... (lanjutannya dipotong untuk preview)' : ''}\n\nDalam implementasi nyata, ini akan dikirim ke printer.`,
      [{ text: 'OK' }]
    );
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
      <Text style={[styles.tableHeaderText, styles.actionColumn]}>Aksi</Text>
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
      <TouchableOpacity 
        style={[styles.actionColumn, styles.removeButton]}
        onPress={() => handleRemoveItem(item.id, item.name)}
      >
        <Text style={styles.removeButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  // Handle process button press - show confirmation with item counts only
  const handleProcess = async () => {
    // console.log('handleProcess called with items:', items);
    // Save draft before navigating to EditSO and update session
    try {
      // Update session to reflect that we're going to editSO
      const sessionData = await getCurrentSOSession();
      if (sessionData) {
        const updatedSession: Omit<SOSession, 'id' | 'createdAt' | 'updatedAt'> = {
          ...sessionData,
          lastView: 'partialSO'
        };
        await upsertSOSession(updatedSession);
        // console.log('Session updated with last view: partialSO');
      }
      
      // Save items as draft
      const itemsJson = JSON.stringify(items);
      await updateSOSessionItems(itemsJson);
      // console.log('Items saved successfully to database before navigating to EditSO');
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
              // console.log('Navigating to EditSO with items:', items);
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
          <Text style={styles.title}>Partial Stock Opname</Text>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          keyboardShouldPersistTaps="handled"
        >
          {/* Single Input Field with Add Button */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Masukkan kode item / barcode / nama"
                onSubmitEditing={handleAdd}
              />
            </View>
            <TouchableOpacity style={styles.inlineAddButton} onPress={handleAdd}>
              <Text style={styles.buttonText}>ADD</Text>
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
                <Text style={styles.buttonText}>SCAN</Text>
              </TouchableOpacity>
              <Text style={styles.buttonDescription}>Scan barcode</Text>
            </View>
            
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={styles.f1Button} onPress={handleF1}>
                <Text style={styles.buttonText}>F1</Text>
              </TouchableOpacity>
              <Text style={styles.buttonDescription}>Data barang</Text>
            </View>
          </View>
          
          {/* Items List */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Items untuk SO:</Text>
            {items.length > 0 ? (
              <View style={styles.tableContainer}>
                {renderTableHeader()}
                <FlatList
                  data={items} // Show all items
                  renderItem={renderTableRow}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>Belum ada item yang ditambahkan</Text>
            )}
          </View>
          
          </ScrollView>
          
          {/* Fixed Action Button at the bottom */}
          {items.length > 0 && (
            <View 
              ref={bottomButtonContainerRef}
              style={[
                styles.bottomButtonContainer,
                isKeyboardVisible && { marginBottom: keyboardHeight }
              ]}
            >
              <TouchableOpacity 
                style={styles.processButton}
                onPress={handleProcess} // Use new handler
              >
                <Text style={styles.processButtonText}>Proses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      
      {/* Scanner Modal */}
      <ScannerModal
        visible={scannerVisible}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />
      
      {/* Item List Modal */}
      <ItemListModal
        visible={itemListVisible}
        onSelectItem={handleItemSelect}
        onClose={() => setItemListVisible(false)}
      />
    </SafeAreaView>
  );
}

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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inlineAddButton: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    minWidth: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 1, // Ensure buttons stay above other elements
  },
  buttonWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  f1Button: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  buttonDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
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

export default PartialSO;