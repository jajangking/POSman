import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchInventoryItemByCode, modifyInventoryItem } from '../services/InventoryService';
import { createSOHistory } from '../services/SOHistoryService';

// Define the SOItem interface to match the PartialSO component
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

interface EditSOProps {
  onBack?: (reportData: any) => void;
  items?: SOItem[];
  currentUser?: any;
}

const EditSO: React.FC<EditSOProps> = ({ onBack, items = [], currentUser }) => {
  const [soItems, setSoItems] = useState<SOItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize with items passed from PartialSO and fetch system quantities
  useEffect(() => {
    const initializeItems = async () => {
      if (items && items.length > 0) {
        // Fetch updated system quantities for all items
        const updatedItems = await Promise.all(items.map(async (item) => {
          try {
            const inventoryItem = await fetchInventoryItemByCode(item.code);
            if (inventoryItem) {
              return {
                ...item,
                systemQuantity: inventoryItem.quantity,
                price: inventoryItem.price || item.price || 0
              };
            }
            return item;
          } catch (error) {
            console.warn('Failed to fetch system quantity for item:', item.code);
            return item;
          }
        }));
        
        setSoItems(updatedItems);
      }
    };

    initializeItems();
  }, [items]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Refresh system quantities while preserving physical quantities
  const handleRefresh = async () => {
    if (soItems.length === 0) return;
    
    // Show confirmation dialog before refreshing
    Alert.alert(
      'Konfirmasi Refresh',
      'Apakah Anda yakin ingin memperbarui data sistem? Data fisik yang sudah dimasukkan akan tetap dipertahankan.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Refresh', 
          onPress: async () => {
            setIsRefreshing(true);
            try {
              // Fetch updated system quantities for all items while preserving physical quantities
              const updatedItems = await Promise.all(soItems.map(async (item) => {
                try {
                  const inventoryItem = await fetchInventoryItemByCode(item.code);
                  if (inventoryItem) {
                    return {
                      ...item,
                      systemQuantity: inventoryItem.quantity,
                      price: inventoryItem.price || item.price || 0
                    };
                  }
                  return item;
                } catch (error) {
                  console.warn('Failed to fetch system quantity for item:', item.code);
                  return item;
                }
              }));
              
              setSoItems(updatedItems);
              // We're using the existing shouldFilterItems state
              
              // Hide items that match after refresh
              const mismatchedItems = updatedItems.filter(item => item.soQuantity !== item.systemQuantity);
              if (mismatchedItems.length < updatedItems.length) {
                Alert.alert(
                  'Refresh Berhasil',
                  `Data berhasil diperbarui.

Item yang sesuai dengan qty sistem telah disembunyikan.

Total item dengan selisih: ${mismatchedItems.length}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Berhasil',
                  'Data berhasil diperbarui.'
                );
              }
            } catch (error) {
              console.error('Error refreshing data:', error);
              Alert.alert(
                'Error',
                'Terjadi kesalahan saat memuat ulang data.'
              );
            } finally {
              setIsRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const sortItemsByCategory = (itemsToSort: SOItem[]): SOItem[] => {
    return [...itemsToSort].sort((a, b) => {
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

  const handlePhysicalQuantityChange = (id: string, value: string) => {
    // Allow empty values but don't filter items based on this
    if (value === '') {
      setSoItems(prevItems => 
        prevItems.map(item => 
          item.id === id 
            ? { ...item, soQuantity: 0 } // Set to 0 when empty, but keep item in list
            : item
        )
      );
    } else {
      // Only allow numeric values
      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity)) {
        setSoItems(prevItems => 
          prevItems.map(item => 
            item.id === id 
              ? { ...item, soQuantity: newQuantity } 
              : item
          )
        );
      }
    }
  };

  const getDifference = (item: SOItem): number => {
    // If soQuantity is 0 but was never explicitly set (user cleared field), treat as not matching
    return item.soQuantity - item.systemQuantity;
  };

  const getDifferenceType = (item: SOItem): 'plus' | 'minus' | 'match' => {
    const difference = getDifference(item);
    if (difference > 0) return 'plus';
    if (difference < 0) return 'minus';
    return 'match';
  };

  const getTotalRupiah = (item: SOItem): number => {
    // Calculate total based on price and difference
    const price = item.price || 0; // Use price from item or 0 if not available
    const difference = getDifference(item);
    return difference * price;
  };

  // State to track if refresh has been pressed and items should be filtered
  const [shouldFilterItems, setShouldFilterItems] = useState(false);

  // Get items to display - either all items or only mismatches
  const getDisplayItems = () => {
    if (shouldFilterItems) {
      // Only show items with actual discrepancies
      return soItems.filter(item => item.soQuantity !== item.systemQuantity);
    }
    // Show all items
    return soItems;
  };

  // Group items by difference type (plus/minus) and sort - for when showing only mismatched items
  const getMismatchedGroupedAndSortedItems = () => {
    const displayItems = getDisplayItems();
    const plusItems: SOItem[] = [];
    const minusItems: SOItem[] = [];
    
    displayItems.forEach(item => {
      const difference = getDifference(item);
      if (difference > 0) {
        plusItems.push(item);
      } else if (difference < 0) {
        minusItems.push(item);
      }
    });
    
    // Sort each group by category
    const sortedPlusItems = sortItemsByCategory(plusItems);
    const sortedMinusItems = sortItemsByCategory(minusItems);
    
    // Minus items come first, then plus items
    return [...sortedMinusItems, ...sortedPlusItems];
  };

  // Group all items by category and sort
  const getAllGroupedAndSortedItems = () => {
    return sortItemsByCategory(soItems);
  };

  const handleSave = () => {
    // Show confirmation dialog before completing SO
    Alert.alert(
      'Konfirmasi Selesai SO',
      'Apakah Anda yakin ingin menyelesaikan dan memperbaiki Stock Opname? Data akan disimpan dan qty di database akan diperbaiki sesuai input fisik.',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Fix SO', 
          onPress: async () => {
            setIsSaving(true);
            try {
              // Record end time
              const endTime = Date.now();
              const durationMs = endTime - startTimeRef.current;
              const durationSeconds = Math.floor(durationMs / 1000);
              const durationText = `${Math.floor(durationSeconds / 60)} menit ${durationSeconds % 60} detik`;
              
              // Update database quantities to match physical quantities
              for (const item of soItems) {
                try {
                  await modifyInventoryItem(item.code, {
                    quantity: item.soQuantity
                  });
                } catch (error) {
                  console.error('Error updating item:', item.code, error);
                  throw error;
                }
              }
              
              // Prepare report data
              const totalQtyDifference = soItems.reduce((total, item) => total + getDifference(item), 0);
              const totalRpDifference = soItems.reduce((total, item) => total + getTotalRupiah(item), 0);
              
              // Find largest minus and plus items
              let largestMinusItem = null;
              let largestPlusItem = null;
              let maxMinus = 0;
              let maxPlus = 0;
              
              for (const item of soItems) {
                const difference = getDifference(item);
                const total = getTotalRupiah(item);
                
                if (difference < maxMinus) {
                  maxMinus = difference;
                  largestMinusItem = {
                    name: item.name,
                    code: item.code,
                    difference: difference,
                    total: total
                  };
                }
                
                if (difference > maxPlus) {
                  maxPlus = difference;
                  largestPlusItem = {
                    name: item.name,
                    code: item.code,
                    difference: difference,
                    total: total
                  };
                }
              }
              
              // In a real implementation, you would fetch consecutive SO data from database
              // For now, we'll use mock data
              const consecutiveMinusItems: any[] = [
                // This would come from database in a real implementation
              ];
              
              const consecutivePlusItems: any[] = [
                // This would come from database in a real implementation
              ];
              
              // Calculate percentage of items SO'd
              // In a real implementation, you would get total items from database
              const totalDatabaseItems = soItems.length + 5; // Mock value
              const percentageSO = Math.round((soItems.length / totalDatabaseItems) * 100);
              
              const reportData = {
                totalItems: soItems.length,
                totalQtyDifference,
                totalRpDifference,
                soDuration: durationText,
                soUser: currentUser?.username || 'Unknown User',
                soDate: new Date().toISOString(),
                largestMinusItem,
                largestPlusItem,
                consecutiveMinusItems,
                consecutivePlusItems,
                items: soItems.map(item => ({
                  name: item.name,
                  code: item.code,
                  systemQty: item.systemQuantity,
                  physicalQty: item.soQuantity,
                  difference: getDifference(item),
                  price: item.price,
                  total: getTotalRupiah(item)
                })),
                percentageSO: `${percentageSO}%`,
                totalDatabaseItems
              };
              
              // Save SO history to database
              try {
                await createSOHistory({
                  date: new Date().toISOString(),
                  userId: currentUser?.id || 'unknown',
                  userName: currentUser?.username || 'Unknown User',
                  totalItems: soItems.length,
                  totalDifference: totalQtyDifference,
                  totalRpDifference: totalRpDifference,
                  duration: durationSeconds,
                  items: JSON.stringify(soItems.map(item => ({
                    code: item.code,
                    name: item.name,
                    systemQty: item.systemQuantity,
                    physicalQty: item.soQuantity,
                    difference: getDifference(item),
                    price: item.price,
                    total: getTotalRupiah(item)
                  })))
                });
              } catch (error) {
                console.error('Error saving SO history:', error);
                // Don't block the main flow if history saving fails
              }
              
              // Navigate to report screen with report data
              onBack && onBack(reportData);
            } catch (error) {
              console.error('Error saving SO data:', error);
              Alert.alert(
                'Error',
                'Terjadi kesalahan saat memperbaiki qty di database.'
              );
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  // Table header component
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.noColumn, { textAlign: 'center' }]}>No</Text>
      <Text style={[styles.tableHeaderText, styles.nameColumn, { textAlign: 'left' }]}>Nama Item (Kode/SKU)</Text>
      <Text style={[styles.tableHeaderText, styles.qtyColumn, { textAlign: 'center' }]}>Qty Fisik</Text>
      <Text style={[styles.tableHeaderText, styles.qtyColumn, { textAlign: 'center' }]}>Qty Sistem</Text>
      <Text style={[styles.tableHeaderText, styles.qtyColumn, { textAlign: 'center' }]}>Selisih</Text>
      <Text style={[styles.tableHeaderText, styles.totalColumn, { textAlign: 'center' }]}>Total (Rp)</Text>
    </View>
  );

  // Table row component
  const renderTableRow = ({ item, index }: { item: SOItem; index: number }) => {
    const difference = getDifference(item);
    const totalRupiah = getTotalRupiah(item);
    const differenceType = getDifferenceType(item);
    
    return (
      <View style={[styles.tableRow, differenceType === 'minus' && styles.minusRow]}>
        <Text style={[styles.tableCellText, styles.noColumn, { textAlign: 'center' }]}>{index + 1}</Text>
        <View style={[styles.nameColumn, styles.nameContainer]}>
          <Text style={[styles.nameText]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.codeSkuText]} numberOfLines={1}>
            {item.code}{item.sku ? ` (${item.sku})` : ''}
          </Text>
        </View>
        <View style={[styles.qtyColumn, styles.qtyInputContainer]}>
          <TextInput
            style={styles.qtyInput}
            value={item.soQuantity === 0 ? '' : item.soQuantity.toString()}
            onChangeText={(value) => handlePhysicalQuantityChange(item.id, value)}
            keyboardType="numeric"
            placeholder="0"
            textAlign="center"
          />
        </View>
        <Text style={[styles.tableCellText, styles.qtyColumn, { textAlign: 'center' }]}>{item.systemQuantity}</Text>
        <Text style={[styles.tableCellText, styles.qtyColumn, 
          difference > 0 ? styles.plusText : difference < 0 ? styles.minusText : styles.zeroText, { textAlign: 'center' }]}>
          {difference > 0 ? `+${difference}` : difference.toString()}
        </Text>
        <Text style={[styles.tableCellText, styles.totalColumn, { textAlign: 'center' }]} numberOfLines={1}>
          {totalRupiah > 0 ? `+${totalRupiah.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}` : totalRupiah < 0 ? `-${Math.abs(totalRupiah).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}` : totalRupiah.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Stock Opname</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <Text style={styles.refreshButtonText}>
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={[styles.content, { paddingBottom: Math.max(100, keyboardHeight + 50) }]}>
          {/* Items List */}
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Daftar Item untuk SO:</Text>
            {soItems.length > 0 ? (
              shouldFilterItems ? (
                // When filtering is enabled, show only mismatched items
                (() => {
                  const displayItems = getDisplayItems();
                  return displayItems.length > 0 ? (
                    <ScrollView horizontal>
                      <View style={styles.tableContainer}>
                        {renderTableHeader()}
                        <FlatList
                          data={getMismatchedGroupedAndSortedItems()}
                          renderItem={renderTableRow}
                          keyExtractor={item => item.id}
                          scrollEnabled={false}
                        />
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={styles.allMatchText}>Semua item sudah sesuai antara qty fisik dan qty sistem</Text>
                  );
                })()
              ) : (
                // When filtering is disabled, show all items
                <ScrollView horizontal>
                  <View style={styles.tableContainer}>
                    {renderTableHeader()}
                    <FlatList
                      data={getAllGroupedAndSortedItems()}
                      renderItem={renderTableRow}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                    />
                  </View>
                </ScrollView>
              )
            ) : (
              <Text style={styles.emptyText}>Belum ada item yang dimuat</Text>
            )}
          </View>
          
          {/* Summary Section */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Item SO:</Text>
              <Text style={styles.summaryValue}>{soItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Qty Selisih:</Text>
              <Text style={styles.summaryValue}>
                {soItems.reduce((total, item) => total + getDifference(item), 0)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Selisih Rp:</Text>
              <Text style={[styles.summaryValue, 
                soItems.reduce((total, item) => total + getTotalRupiah(item), 0) > 0 ? styles.plusText : 
                soItems.reduce((total, item) => total + getTotalRupiah(item), 0) < 0 ? styles.minusText : 
                styles.zeroText]} numberOfLines={1}>
                {(() => {
                  const totalRupiah = soItems.reduce((total, item) => total + getTotalRupiah(item), 0);
                  return totalRupiah > 0 ? 
                    `+${totalRupiah.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}` : 
                    totalRupiah < 0 ? 
                    `-${Math.abs(totalRupiah).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}` : 
                    totalRupiah.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
                })()}
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Action Buttons at the bottom */}
        <View style={[styles.bottomButtonContainer, { marginBottom: keyboardHeight }]}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>
              {isSaving ? 'Memperbaiki...' : 'Fix SO'}
            </Text>
          </TouchableOpacity>
        </View>
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
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
    paddingBottom: 100, // Add extra padding to prevent content from being covered by fixed buttons
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 400, // Ensure horizontal scroll works
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
    alignItems: 'center',
  },
  minusRow: {
    backgroundColor: '#fff0f0',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#555',
    fontSize: 14,
  },
  tableCellText: {
    color: '#333',
    fontSize: 14,
  },
  noColumn: {
    width: '5%',
  },
  nameColumn: {
    width: '35%',
  },
  qtyColumn: {
    width: '12%',
  },
  totalColumn: {
    width: '15%',
    minWidth: 120, // Ensure enough space for full currency display
  },
  nameContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  codeSkuText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'left',
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
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 30,
  },
  allMatchText: {
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
    padding: 30,
    fontStyle: 'italic',
  },
  summaryContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
    textAlign: 'right',
    flex: 1,
    minWidth: 120, // Ensure enough space for full currency display
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
  saveButton: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flex: 1,
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditSO;