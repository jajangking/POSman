import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { getAllPurchaseRequests } from '../../services/DatabaseService';

interface PO {
  id: number;
  poNumber: string;
  date: string;
  supplier?: string;
  items: any[];
  totalAmount: number;
}

interface Step1Props {
  usePO: boolean;
  setUsePO: (usePO: boolean) => void;
  poNumber: string;
  setPoNumber: (poNumber: string) => void;
  setBarangPO: (barangPO: any[]) => void;
  setCurrentStep: (step: number) => void;
}

const Step1: React.FC<Step1Props> = ({
  usePO,
  setUsePO,
  poNumber,
  setPoNumber,
  setBarangPO,
  setCurrentStep
}) => {
  const [availablePOs, setAvailablePOs] = useState<PO[]>([]);
  const [showPOList, setShowPOList] = useState(false);
  const [isLoadingPO, setIsLoadingPO] = useState(false);

  // Fetch available POs from database
  const fetchAvailablePOs = async () => {
    setIsLoadingPO(true);
    try {
      const purchaseRequests = await getAllPurchaseRequests();
      // Filter to show only pending POs
      const pendingPOs = purchaseRequests.filter((request: any) => 
        request.status === 'pending' || !request.status
      );
      setAvailablePOs(pendingPOs);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      Alert.alert('Error', 'Gagal mengambil daftar PO dari riwayat permintaan barang');
    } finally {
      setIsLoadingPO(false);
    }
  };

  // Handle PO selection
  const handleSelectPO = (po: PO) => {
    setPoNumber(po.poNumber);
    setShowPOList(false);
    
    // Convert PO items to barang PO format
    const barangPOData = po.items.map((item: any, index: number) => ({
      id: `${po.poNumber}-${index}`,
      code: item.code,
      sku: item.sku || '',
      name: item.name,
      quantityOrdered: item.quantity,
      quantityReceived: item.quantity, // Default to ordered quantity
      newCost: item.price || 0, // Default to item price
      isChecked: false,
      hasIssue: false,
      issueNote: ''
    }));
    
    setBarangPO(barangPOData);
  };

  // Proceed to step 2
  const handleProceed = () => {
    if (usePO && !poNumber) {
      Alert.alert('Error', 'Pilih nomor PO terlebih dahulu');
      return;
    }
    setCurrentStep(2);
  };

  return (
    <View style={styles.container}>
      
      {/* Toggle untuk menggunakan PO atau manual */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, usePO && styles.toggleButtonActive]}
          onPress={() => setUsePO(true)}
        >
          <Text style={[styles.toggleButtonText, usePO && styles.toggleButtonTextActive]}>
            Gunakan PO
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, !usePO && styles.toggleButtonActive]}
          onPress={() => setUsePO(false)}
        >
          <Text style={[styles.toggleButtonText, !usePO && styles.toggleButtonTextActive]}>
            Manual
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Form input PO */}
      {usePO && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Informasi PO</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. PO</Text>
            <View style={styles.poInputContainer}>
              <TouchableOpacity 
                style={[styles.input, styles.poInput]}
                onPress={() => {
                  setShowPOList(true);
                  fetchAvailablePOs();
                }}
              >
                <Text style={poNumber ? styles.poNumberText : styles.poPlaceholderText}>
                  {poNumber || "Pilih dari daftar PO"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Daftar PO yang tersedia */}
          {showPOList && (
            <View style={styles.poListContainer}>
              <View style={styles.poListHeader}>
                <Text style={styles.poListTitle}>Daftar PO Tersedia</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowPOList(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {isLoadingPO ? (
                <View style={styles.loadingContainer}>
                  <Text>Loading daftar PO...</Text>
                </View>
              ) : (
                <FlatList
                  data={availablePOs}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.poItem}
                      onPress={() => handleSelectPO(item)}
                    >
                      <View style={styles.poItemHeader}>
                        <Text style={styles.poItemNumber}>{item.poNumber}</Text>
                        <Text style={styles.poItemDate}>{item.date}</Text>
                      </View>
                      {item.supplier && <Text style={styles.poItemSupplier}>Supplier: {item.supplier}</Text>}
                      <Text style={styles.poItemTotal}>Total: Rp{item.totalAmount.toLocaleString()}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.poList}
                />
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Mode Manual */}
      {!usePO && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Mode Manual</Text>
          <Text style={styles.infoText}>
            Anda akan menambahkan barang secara manual tanpa mengacu pada PO.
          </Text>
        </View>
      )}
      
      {/* Tombol Lanjut */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.processButton}
          onPress={handleProceed}
        >
          <Text style={styles.processButtonText}>
            Lanjut ke Penerimaan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  poInputContainer: {
    flexDirection: 'row',
  },
  poInput: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  poPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  poNumberText: {
    fontSize: 16,
    color: '#333',
  },
  poListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    maxHeight: 300,
  },
  poListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  poListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poList: {
    maxHeight: 200,
  },
  poItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  poItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  poItemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  poItemDate: {
    fontSize: 14,
    color: '#666',
  },
  poItemSupplier: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  poItemTotal: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  processButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  processButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Step1;