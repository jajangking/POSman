import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList,
  TextInput,
  Modal,
  Pressable,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllInventoryItems } from '../services/InventoryService';
import { InventoryItem } from '../models/Inventory';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { savePurchaseRequest, getPendingPurchaseRequests } from '../services/DatabaseService';
import { printPurchaseRequest, savePurchaseRequestPDF } from '../services/PrintService';
import { saveAutomaticPOSession, saveLastView } from '../services/AutomaticPOSessionService';

interface POItem {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  minOrder: number;
  quantityToOrder: number;
  price: number;
  cost: number;
  category: string;
  supplier?: string;
  purchased: boolean;
  purchaseDate?: Date;
}

interface PermintaanBarangScreenProps {
  onBack: () => void;
}

const PermintaanBarangScreen: React.FC<PermintaanBarangScreenProps> = ({ onBack }) => {
  const [items, setItems] = useState<POItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showProcessPreview, setShowProcessPreview] = useState(false);
  const [poNumber, setPoNumber] = useState('');

  useEffect(() => {
    loadInventoryItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchQuery, sortBy]);
  
  // Handle Android back button
  useEffect(() => {
    // Save session when component mounts
    saveAutomaticPOSession({ lastView: 'permintaanBarang' });
    saveLastView('permintaanBarang');
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Konfirmasi',
        'Apakah Anda yakin ingin keluar dari halaman permintaan barang? Perubahan yang belum disimpan akan hilang.',
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

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      
      // Check for pending POs first
      const pendingPOs = await getPendingPurchaseRequests();
      if (pendingPOs.length > 0) {
        const pendingPONumbers = pendingPOs.map(po => po.poNumber).join(', ');
        Alert.alert(
          'PO Pending Ditemukan',
          `Masih ada PO yang belum diproses: ${pendingPONumbers}. Harap proses penerimaan barang terlebih dahulu sebelum membuat PO baru.`,
          [{ text: 'OK', onPress: onBack }]
        );
        return;
      }
      
      const inventoryItems = await fetchAllInventoryItems();
      
      // Convert to PO items with calculated quantities
      const poItems: POItem[] = inventoryItems
        .filter(item => {
          // Ensure current stock is not negative for calculation
          const currentStock = Math.max(0, item.quantity);
          const shortage = item.reorderLevel - currentStock;
          const minOrder = item.minOrder || 1;
          // Only show items that need to be ordered based on min order
          return shortage >= minOrder;
        })
        .map(item => {
          // Ensure current stock is not negative for calculation
          const currentStock = Math.max(0, item.quantity);
          // Calculate quantity to order based on min order
          const baseOrder = item.reorderLevel - currentStock;
          const minOrder = item.minOrder || 1;
          const quantityToOrder = Math.max(baseOrder, minOrder);
          
          return {
            id: item.code,
            code: item.code,
            name: item.name,
            currentStock: item.quantity,
            reorderLevel: item.reorderLevel,
            minOrder: item.minOrder,
            quantityToOrder: quantityToOrder,
            price: item.price,
            cost: item.cost,
            category: item.category || '',
            supplier: item.supplier,
            purchased: false
          };
        });
      
      setItems(poItems);
      setPoNumber(`PO-${format(new Date(), 'yyyyMMdd-HHmmss')}`);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let result = [...items];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.code.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.supplier && item.supplier.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.quantityToOrder - a.quantityToOrder;
      }
    });
    
    setFilteredItems(result);
  };

  const handleMarkAsPurchased = (id: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              purchased: true, 
              purchaseDate: new Date() 
            } 
          : item
      )
    );
  };

  const handleUnmarkPurchased = (id: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              purchased: false,
              purchaseDate: undefined
            } 
          : item
      )
    );
  };

  const generatePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const generateProcessPreview = () => {
    setShowProcessPreview(true);
  };

  const renderPOItem = ({ item }: { item: POItem }) => (
    <View style={[styles.itemCard, item.purchased && styles.purchasedItem]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.purchased && (
          <View style={styles.purchasedBadge}>
            <Text style={styles.purchasedText}>Dibeli</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>Kode: {item.code}</Text>
        <Text style={styles.detailText}>Kategori: {item.category || 'Tidak ada'}</Text>
        <Text style={styles.detailText}>Supplier: {item.supplier || 'Tidak ada'}</Text>
        <View style={styles.stockInfo}>
          <Text style={styles.detailText}>Stok Saat Ini: {item.currentStock}</Text>
          <Text style={styles.detailText}>Stok Ideal: {item.reorderLevel}</Text>
          <Text style={styles.detailText}>Min Order: {item.minOrder}</Text>
          <Text style={styles.detailText}>
            Kekurangan: {item.reorderLevel - Math.max(0, item.currentStock)}
          </Text>
        </View>
        <Text style={styles.quantityText}>Perlu Dipesan: {item.quantityToOrder}</Text>
        <Text style={styles.priceText}>Harga Modal: Rp{item.cost.toLocaleString()}</Text>
        <Text style={styles.totalText}>Total Modal: Rp{(item.cost * item.quantityToOrder).toLocaleString()}</Text>
      </View>
      
      <View style={styles.itemActions}>
        {!item.purchased ? (
          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={() => handleMarkAsPurchased(item.id)}
          >
            <Text style={styles.purchaseButtonText}>Tandai Sudah Dibeli</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.unpurchaseButton}
            onPress={() => handleUnmarkPurchased(item.id)}
          >
            <Text style={styles.unpurchaseButtonText}>Batalkan Pembelian</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Permintaan Barang</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Text>Memuat data...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Permintaan Barang</Text>
          <TouchableOpacity 
            style={[styles.printButton, { backgroundColor: '#4CAF50' }]}
            onPress={generateProcessPreview}
            disabled={items.filter(item => !item.purchased).length === 0}
          >
            <Text style={styles.printButtonText}>Proses</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.controlsContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari barang..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.activeSortButtonText]}>
                Nama
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'quantity' && styles.activeSortButton]}
              onPress={() => setSortBy('quantity')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'quantity' && styles.activeSortButtonText]}>
                Jumlah
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        
        
        <View style={styles.summaryContainer}>
          <View style={styles.poNumberContainer}>
            <Text style={styles.poNumberText} numberOfLines={1} ellipsizeMode="tail">
              No. PO: {poNumber}
            </Text>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {filteredItems.length > 0 ? (
              <FlatList
                data={filteredItems}
                renderItem={renderPOItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tidak ada barang yang perlu dipesan</Text>
                <Text style={styles.emptySubtext}>
                  Semua barang sudah memenuhi stok ideal
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Print Preview Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={showPrintPreview}
          onRequestClose={() => setShowPrintPreview(false)}
        >
          <View style={styles.printPreviewContainer}>
            <View style={styles.printHeader}>
              <Text style={styles.printTitle}>PURCHASE ORDER</Text>
              <Text style={styles.poNumber} numberOfLines={1} adjustsFontSizeToFit>
                No. PO: {poNumber}
              </Text>
              <Text style={styles.printDate}>
                Tanggal: {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
              </Text>
            </View>
            
            <ScrollView style={styles.printContent} nestedScrollEnabled={true}>
              <View style={styles.printTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.colNo]}>No</Text>
                  <Text style={[styles.tableHeaderText, styles.colCode]}>Kode</Text>
                  <Text style={[styles.tableHeaderText, styles.colName]}>Nama Barang</Text>
                  <Text style={[styles.tableHeaderText, styles.colQty]}>Jumlah</Text>
                  <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga</Text>
                  <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                </View>
                
                {filteredItems.map((item, index) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, styles.colCode]}>{item.code}</Text>
                    <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
                    <Text style={[styles.tableCell, styles.colQty]}>{item.quantityToOrder}</Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>
                      Rp{item.cost.toLocaleString()}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>
                      Rp{(item.cost * item.quantityToOrder).toLocaleString()}
                    </Text>
                  </View>
                ))}
                
                <View style={styles.tableFooter}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalValue}>
                    Rp{filteredItems.reduce(
                      (sum, item) => sum + (item.cost * item.quantityToOrder), 
                      0
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.printActions}>
              <TouchableOpacity 
                style={styles.closePrintButton}
                onPress={() => setShowPrintPreview(false)}
              >
                <Text style={styles.closePrintButtonText}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.printActionButton}
                onPress={() => Alert.alert('Cetak', 'Fungsi cetak akan diimplementasikan')}
              >
                <Text style={styles.printActionButtonText}>Cetak</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Process Preview Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={showProcessPreview}
          onRequestClose={() => setShowProcessPreview(false)}
        >
          <View style={styles.processPreviewContainer}>
            <View style={styles.processHeader}>
              <Text style={styles.processTitle}>DAFTAR PERMINTAAN BARANG</Text>
              <Text style={styles.poNumber} numberOfLines={1} adjustsFontSizeToFit>
                No. PO: {poNumber}
              </Text>
              <Text style={styles.processDate}>
                Tanggal: {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
              </Text>
            </View>
            
            <ScrollView style={styles.processContent} nestedScrollEnabled={true}>
              <View style={styles.processTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.colNo]}>No</Text>
                  <Text style={[styles.tableHeaderText, styles.colCode]}>Kode</Text>
                  <Text style={[styles.tableHeaderText, styles.colName]}>Nama Barang</Text>
                  <Text style={[styles.tableHeaderText, styles.colQty]}>Jumlah</Text>
                  <Text style={[styles.tableHeaderText, styles.colCost]}>Harga Modal</Text>
                </View>
                
                {filteredItems.filter(item => !item.purchased).map((item, index) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, styles.colCode]}>{item.code}</Text>
                    <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
                    <Text style={[styles.tableCell, styles.colQty]}>{item.quantityToOrder}</Text>
                    <Text style={[styles.tableCell, styles.colCost]}>
                      Rp{item.cost.toLocaleString()}
                    </Text>
                  </View>
                ))}
                
                <View style={styles.tableFooter}>
                  <Text style={styles.totalLabel}>TOTAL PEMBELIAN</Text>
                  <Text style={styles.totalValue}>
                    Rp{filteredItems.filter(item => !item.purchased).reduce(
                      (sum, item) => sum + (item.cost * item.quantityToOrder), 
                      0
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.processActions}>
              <TouchableOpacity 
                style={styles.closeProcessButton}
                onPress={() => setShowProcessPreview(false)}
              >
                <Text style={styles.closeProcessButtonText}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.processActionButton}
                onPress={() => {
                  // Menyimpan data ke database history
                  Alert.alert(
                    'Simpan Permintaan Barang',
                    'Apakah Anda ingin menyimpan permintaan barang ini?',
                    [
                      {
                        text: 'Batal',
                        style: 'cancel'
                      },
                      {
                        text: 'Simpan',
                        onPress: async () => {
                          try {
                            // Siapkan data untuk disimpan
                            const itemsToSave = filteredItems.filter(item => !item.purchased).map(item => ({
                              code: item.code,
                              name: item.name,
                              quantity: item.quantityToOrder,
                              price: item.cost,
                              total: item.cost * item.quantityToOrder
                            }));
                            
                            const totalAmount = itemsToSave.reduce((sum, item) => sum + item.total, 0);
                            
                            // Check for pending POs before saving
                        const pendingPOs = await getPendingPurchaseRequests();
                        if (pendingPOs.length > 0 && !pendingPOs.some(po => po.poNumber === poNumber)) {
                          Alert.alert(
                            'PO Pending Ditemukan',
                            'Masih ada PO lain yang belum diproses. Harap proses penerimaan barang terlebih dahulu.',
                            [{ text: 'OK' }]
                          );
                          return;
                        }
                        
                        // Simpan ke database
                        const requestId = await savePurchaseRequest(
                              poNumber,
                              format(selectedDate, 'dd MMMM yyyy', { locale: id }),
                              itemsToSave,
                              totalAmount,
                              '', // supplier (kosong untuk sekarang)
                              ''  // notes (kosong untuk sekarang)
                            );
                            
                            // Tampilkan konfirmasi untuk mencetak
                            Alert.alert(
                              'Permintaan Barang Disimpan',
                              'Data telah disimpan ke history. Silakan proses penerimaan barang di halaman Penerimaan Barang. Apakah Anda ingin mencetak permintaan barang ini?',
                              [
                                {
                                  text: 'Tidak',
                                  onPress: () => {
                                    // Tutup modal dan kembali ke halaman utama
                                    setShowProcessPreview(false);
                                    Alert.alert(
                                      'Sukses', 
                                      'Permintaan barang telah disimpan ke history. Silakan proses penerimaan barang di halaman Penerimaan Barang.',
                                      [{ text: 'OK', onPress: onBack }]
                                    );
                                  }
                                },
                                {
                                  text: 'Cetak',
                                  onPress: async () => {
                                    try {
                                      // Siapkan data untuk cetak
                                      const printData = {
                                        poNumber,
                                        date: format(selectedDate, 'dd MMMM yyyy', { locale: id }),
                                        items: itemsToSave,
                                        totalAmount,
                                        supplier: '', // supplier (kosong untuk sekarang)
                                        notes: ''  // notes (kosong untuk sekarang)
                                      };
                                      
                                      // Cetak permintaan barang
                                      const success = await printPurchaseRequest(printData);
                                      
                                      if (success) {
                                        // Tutup modal dan kembali ke halaman utama
                                        setShowProcessPreview(false);
                                        Alert.alert(
                                          'Sukses', 
                                          'Permintaan barang telah dicetak. Silakan proses penerimaan barang di halaman Penerimaan Barang.',
                                          [{ text: 'OK', onPress: onBack }]
                                        );
                                      } else {
                                        // Tutup modal dan kembali ke halaman utama
                                        setShowProcessPreview(false);
                                        Alert.alert('Error', 'Gagal mencetak permintaan barang');
                                      }
                                    } catch (error) {
                                      console.error('Error printing purchase request:', error);
                                      // Tutup modal dan kembali ke halaman utama
                                      setShowProcessPreview(false);
                                      Alert.alert('Error', 'Gagal mencetak permintaan barang: ' + (error as Error).message);
                                    }
                                  }
                                }
                              ]
                            );
                          } catch (error) {
                            console.error('Error saving purchase request:', error);
                            Alert.alert('Error', 'Gagal menyimpan permintaan barang: ' + (error as Error).message);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.processActionButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  printButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
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
  summaryContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  summaryTextContainer: {
    marginBottom: 5,
  },
  poNumberContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  poNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  poNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
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
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  purchasedItem: {
    opacity: 0.7,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  purchasedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  purchasedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  itemDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 3,
  },
  priceText: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'flex-start',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  purchaseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  unpurchaseButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unpurchaseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  printPreviewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  printHeader: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  printTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  printDate: {
    fontSize: 14,
    color: '#666',
  },
  printContent: {
    flex: 1,
  },
  printTable: {
    padding: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  tableCell: {
    color: '#333',
    fontSize: 12,
  },
  colNo: {
    width: 30,
  },
  colCode: {
    width: 80,
  },
  colName: {
    flex: 1,
  },
  colQty: {
    width: 60,
    textAlign: 'right',
  },
  colPrice: {
    width: 100,
    textAlign: 'right',
  },
  colCost: {
    width: 120,
    textAlign: 'right',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  printActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  closePrintButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  closePrintButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  printActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  printActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  processPreviewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  processHeader: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  processTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  processDate: {
    fontSize: 14,
    color: '#666',
  },
  processContent: {
    flex: 1,
  },
  processTable: {
    padding: 10,
  },
  processActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  closeProcessButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  closeProcessButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  processActionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  processActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});

export default PermintaanBarangScreen;