import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import ScannerModal from '../ScannerModal';
import { formatRupiah, parseRupiah } from '../../models/Inventory';

interface BarangPO {
  id: string;
  code: string;
  sku: string;
  name: string;
  quantityOrdered: number;
  quantityReceived: number;
  newCost: number;
  isChecked: boolean;
  hasIssue: boolean;
  issueNote: string;
}

interface Step2Props {
  usePO: boolean;
  poNumber: string;
  barangPO: BarangPO[];
  setBarangPO: (barangPO: BarangPO[]) => void;
  setCurrentStep: (step: number) => void;
  handleProcess: () => void;
  isProcessing: boolean;
}

const Step2: React.FC<Step2Props> = ({
  usePO,
  poNumber,
  barangPO,
  setBarangPO,
  setCurrentStep,
  handleProcess,
  isProcessing,
  isPOProcessed = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Toggle checklist for an item
  const toggleBarangPOCheck = (id: string) => {
    setBarangPO(prev => 
      prev.map(barang => 
        barang.id === id ? { ...barang, isChecked: !barang.isChecked } : barang
      )
    );
  };

  // Toggle issue status for an item
  const toggleBarangIssue = (id: string) => {
    setBarangPO(prev => 
      prev.map(barang => 
        barang.id === id ? { 
          ...barang, 
          hasIssue: !barang.hasIssue,
          isChecked: !barang.hasIssue ? true : barang.isChecked
        } : barang
      )
    );
  };

  // Handle quantity received change
  const handleQuantityReceivedChange = (id: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setBarangPO(prev => 
      prev.map(barang => 
        barang.id === id ? { ...barang, quantityReceived: quantity } : barang
      )
    );
  };

  // Handle new cost change
  const handleNewCostChange = (id: string, value: string) => {
    const newCost = parseRupiah(value);
    setBarangPO(prev => 
      prev.map(barang => 
        barang.id === id ? { ...barang, newCost } : barang
      )
    );
  };

  // Handle issue note change
  const handleIssueNoteChange = (id: string, note: string) => {
    setBarangPO(prev => 
      prev.map(barang => 
        barang.id === id ? { ...barang, issueNote: note } : barang
      )
    );
  };

  // Toggle all items
  const toggleAllBarang = () => {
    const allChecked = barangPO.every(item => item.isChecked);
    setBarangPO(prev => 
      prev.map(barang => ({ ...barang, isChecked: !allChecked }))
    );
  };

  // Filter items based on search query
  const filteredBarangPO = barangPO.filter(item => 
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const checkedItems = barangPO.filter(item => item.isChecked);
  const totalItemsProcessed = checkedItems.length;
  const totalItems = barangPO.length;
  
  const totalCost = checkedItems.reduce((total, item) => {
    if (item.hasIssue && item.quantityReceived > 0) {
      return total + (item.newCost * item.quantityReceived);
    }
    return total + (item.newCost * item.quantityOrdered);
  }, 0);
  
  const itemsWithZeroCost = checkedItems.filter(item => !item.newCost || item.newCost === 0).length;

  // Render item in a card layout
  const renderBarangPO = ({ item }: { item: BarangPO }) => (
    <View style={[styles.itemCard, item.isChecked && styles.checkedCard]}>
      {/* Header with checkbox, code, and issue button */}
      <View style={styles.cardHeader}>
        <TouchableOpacity 
          style={[styles.checkbox, item.isChecked && styles.checkedBox]}
          onPress={() => toggleBarangPOCheck(item.id)}
        >
          {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Kode:</Text>
            <Text style={styles.codeValue}>{item.code}</Text>
          </View>
          {item.sku ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>SKU:</Text>
              <Text style={styles.codeValue}>{item.sku}</Text>
            </View>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={[styles.issueButton, item.hasIssue && styles.issueButtonActive]}
          onPress={() => toggleBarangIssue(item.id)}
        >
          <Text style={[styles.issueButtonText, item.hasIssue && styles.issueButtonTextActive]}>
            {item.hasIssue ? 'Bermasalah' : 'Tandai'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Quantity and cost info */}
      <View style={styles.quantityInfo}>
        <View style={styles.quantityBox}>
          <Text style={styles.quantityLabel}>Diminta</Text>
          <Text style={styles.quantityValue}>{item.quantityOrdered}</Text>
        </View>
        
        <View style={styles.costBox}>
          <Text style={styles.costLabel}>Harga Modal</Text>
          <Text style={styles.costValue}>{formatRupiah(item.newCost)}</Text>
        </View>
      </View>
      
      {/* Issue details (if item has issue) */}
      {item.hasIssue && (
        <View style={styles.issueDetailsContainer}>
          <View style={styles.issueInputRow}>
            <Text style={styles.issueInputLabel}>Diterima:</Text>
            <TextInput
              style={styles.quantityInput}
              value={item.quantityReceived.toString()}
              onChangeText={(value) => handleQuantityReceivedChange(item.id, value)}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.issueInputRow}>
            <Text style={styles.issueInputLabel}>Harga Modal Baru:</Text>
            <TextInput
              style={styles.costInput}
              value={formatRupiah(item.newCost)}
              onChangeText={(value) => handleNewCostChange(item.id, value)}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Catatan Masalah:</Text>
            <TextInput
              style={styles.noteInput}
              value={item.issueNote}
              onChangeText={(text) => handleIssueNoteChange(item.id, text)}
              placeholder="Tulis catatan masalah..."
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* Search and Scan */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari barang (kode/sku/nama)..."
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
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Scanner Modal */}
      <ScannerModal
        visible={showScanner}
        onBarcodeScanned={(barcode) => {
          setSearchQuery(barcode);
          setShowScanner(false);
          // Find and check the item if it exists
          const matchedItem = barangPO.find(item => 
            item.code === barcode || item.sku === barcode
          );
          
          if (matchedItem) {
            toggleBarangPOCheck(matchedItem.id);
          }
        }}
        onClose={() => setShowScanner(false)}
      />
      
      {/* Items List */}
      <FlatList
        data={filteredBarangPO}
        renderItem={renderBarangPO}
        keyExtractor={(item) => item.id}
        style={styles.itemsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada barang yang ditemukan</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.checkAllContainer}>
            <TouchableOpacity 
              style={styles.checkAllButton}
              onPress={toggleAllBarang}
            >
              <Text style={styles.checkAllText}>
                {barangPO.every(item => item.isChecked) ? 'Uncheck Semua' : 'Check Semua'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Ringkasan Penerimaan</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Barang Diproses:</Text>
          <Text style={styles.summaryValue}>{totalItemsProcessed} dari {totalItems}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Biaya:</Text>
          <Text style={styles.summaryValue}>{formatRupiah(totalCost)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Item dengan Harga 0:</Text>
          <Text style={styles.summaryValue}>{itemsWithZeroCost}</Text>
        </View>
      </View>
      
      {/* Process Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
          onPress={() => {
            Alert.alert(
              'Konfirmasi Penerimaan',
              'Apakah Anda yakin ingin memproses penerimaan barang ini? Stok akan diperbarui setelah diproses.',
              [
                {
                  text: 'Batal',
                  onPress: () => {},
                  style: 'cancel'
                },
                {
                  text: 'Proses',
                  onPress: handleProcess
                }
              ]
            );
          }}
          disabled={isProcessing}
        >
          <Text style={styles.processButtonText}>
            {isProcessing ? 'Memproses...' : 'Proses Penerimaan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsList: {
    flex: 1,
    padding: 15,
  },
  itemCard: {
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
    borderLeftColor: '#e0e0e0',
  },
  checkedCard: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginRight: 5,
  },
  codeValue: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  issueButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  issueButtonActive: {
    backgroundColor: '#F44336',
  },
  issueButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  issueButtonTextActive: {
    color: 'white',
  },
  quantityInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  quantityBox: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    padding: 10,
    marginRight: 5,
  },
  costBox: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
    padding: 10,
    marginLeft: 5,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
    marginBottom: 3,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  costLabel: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 3,
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  issueDetailsContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  issueInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueInputLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  quantityInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  costInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  noteContainer: {
    marginTop: 5,
  },
  noteLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  noteInput: {
    height: 60,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  checkAllContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  checkAllButton: {
    padding: 10,
  },
  checkAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    padding: 15,
  },
  processButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#ccc',
  },
  processButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Step2;