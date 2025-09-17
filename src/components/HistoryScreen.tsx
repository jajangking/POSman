import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllPurchaseRequests, getPurchaseRequestById } from '../services/DatabaseService';
import { printPurchaseRequest, savePurchaseRequestPDF } from '../services/PrintService';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { saveAutomaticPOSession, saveLastView } from '../services/AutomaticPOSessionService';

interface HistoryScreenProps {
  onBack: () => void;
}

interface PurchaseRequest {
  id: number;
  poNumber: string;
  date: string;
  items: any[];
  totalAmount: number;
  supplier?: string;
  notes?: string;
  status?: string;
  createdAt: string;
  processedAt?: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load purchase requests when component mounts
  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  // Save session when component mounts
  useEffect(() => {
    saveAutomaticPOSession({ lastView: 'history' });
    saveLastView('history');
  }, []);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Konfirmasi',
        'Apakah Anda yakin ingin keluar dari halaman history?',
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

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      const requests = await getAllPurchaseRequests();
      setPurchaseRequests(requests);
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      Alert.alert('Error', 'Gagal memuat history permintaan barang: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchaseRequests();
    setRefreshing(false);
  };

  const handleShare = async (request: PurchaseRequest) => {
    // Tampilkan opsi untuk mencetak atau berbagi
    Alert.alert(
      'Opsi Permintaan Barang',
      `Pilih opsi untuk permintaan barang dengan No. PO: ${request.poNumber}`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Cetak',
          onPress: async () => {
            try {
              // Dapatkan data lengkap permintaan
              const fullRequest = await getPurchaseRequestById(request.id);
              if (!fullRequest) {
                Alert.alert('Error', 'Gagal mengambil data permintaan barang');
                return;
              }
              
              // Siapkan data untuk cetak
              const printData = {
                poNumber: fullRequest.poNumber,
                date: fullRequest.date,
                items: fullRequest.items,
                totalAmount: fullRequest.totalAmount,
                supplier: fullRequest.supplier,
                notes: fullRequest.notes
              };
              
              // Cetak permintaan barang
              const success = await printPurchaseRequest(printData);
              
              if (success) {
                Alert.alert('Sukses', 'Permintaan barang telah dicetak');
              } else {
                Alert.alert('Error', 'Gagal mencetak permintaan barang');
              }
            } catch (error) {
              console.error('Error printing purchase request:', error);
              Alert.alert('Error', 'Gagal mencetak permintaan barang: ' + (error as Error).message);
            }
          }
        },
        {
          text: 'Simpan PDF & Bagikan',
          onPress: async () => {
            try {
              // Dapatkan data lengkap permintaan
              const fullRequest = await getPurchaseRequestById(request.id);
              if (!fullRequest) {
                Alert.alert('Error', 'Gagal mengambil data permintaan barang');
                return;
              }
              
              // Siapkan data untuk PDF
              const pdfData = {
                poNumber: fullRequest.poNumber,
                date: fullRequest.date,
                items: fullRequest.items,
                totalAmount: fullRequest.totalAmount,
                supplier: fullRequest.supplier,
                notes: fullRequest.notes
              };
              
              // Simpan sebagai PDF
              const pdfUri = await savePurchaseRequestPDF(pdfData);
              
              if (pdfUri) {
                // Bagikan PDF
                await Sharing.shareAsync(pdfUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Permintaan Barang ${fullRequest.poNumber}`,
                });
              } else {
                Alert.alert('Error', 'Gagal membuat PDF');
              }
            } catch (error) {
              console.error('Error sharing purchase request:', error);
              Alert.alert('Error', 'Gagal menyimpan dan membagikan PDF: ' + (error as Error).message);
            }
          }
        }
      ]
    );
  };

  const handleViewDetail = async (request: PurchaseRequest) => {
    // Dapatkan data lengkap permintaan
    const fullRequest = await getPurchaseRequestById(request.id);
    if (!fullRequest) {
      Alert.alert('Error', 'Gagal mengambil data permintaan barang');
      return;
    }
    
    // Buat detail item
    let itemsDetail = '';
    fullRequest.items.forEach((item: any, index: number) => {
      itemsDetail += `${index + 1}. ${item.name}\n   Kode: ${item.code}\n   Jumlah: ${item.quantity}\n   Harga: Rp${item.price.toLocaleString()}\n   Total: Rp${item.total.toLocaleString()}\n\n`;
    });
    
    Alert.alert(
      'Detail Permintaan Barang',
      `No. PO: ${fullRequest.poNumber}\n` +
      `Tanggal: ${fullRequest.date}\n` +
      `Jumlah Item: ${fullRequest.items.length}\n` +
      `Total: Rp${fullRequest.totalAmount.toLocaleString()}\n` +
      `${fullRequest.supplier ? `\nSupplier: ${fullRequest.supplier}` : ''}` +
      `${fullRequest.notes ? `\nCatatan: ${fullRequest.notes}` : ''}` +
      `\n\nItem:\n` +
      itemsDetail,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>History Permintaan Barang</Text>
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
          <Text style={styles.title}>History Permintaan Barang</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>
            {purchaseRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada history permintaan barang</Text>
                <Text style={styles.emptySubtext}>Permintaan barang yang telah disimpan akan muncul di sini</Text>
              </View>
            ) : (
              purchaseRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.poNumber}>No. PO: {request.poNumber}</Text>
                    <Text style={styles.date}>{request.date}</Text>
                  </View>
                  
                  {(request.status === 'processed') && (
                    <View style={styles.statusContainer}>
                      <Text style={styles.processedLabel}>Diproses</Text>
                    </View>
                  )}
                  
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Jumlah Item:</Text>
                      <Text style={styles.value}>{request.items.length}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Total:</Text>
                      <Text style={styles.totalValue}>Rp{request.totalAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <TouchableOpacity 
                      style={styles.detailButton}
                      onPress={() => handleViewDetail(request)}
                    >
                      <Text style={styles.detailButtonText}>Detail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.shareButton}
                      onPress={() => handleShare(request)}
                    >
                      <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  requestCard: {
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
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  poNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  processedLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  detailButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default HistoryScreen;