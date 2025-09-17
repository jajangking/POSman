import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InventoryItem, InventoryTransaction } from '../models/Inventory';
import { addStock, fetchInventoryTransactions } from '../services/InventoryService';
import { formatRupiah } from '../models/Inventory';

interface ReceiptScreenProps {
  onBack: () => void;
  onNavigateToReceiptHistory: () => void;
}

const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ onBack, onNavigateToReceiptHistory }) => {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      code: 'ITEM001',
      name: 'Contoh Barang 1',
      description: 'Deskripsi barang 1',
      category: 'Kategori A',
      price: 10000,
      cost: 8000,
      quantity: 50,
      sku: 'SKU001',
      supplier: 'Supplier A',
      reorderLevel: 10,
      minOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      code: 'ITEM002',
      name: 'Contoh Barang 2',
      description: 'Deskripsi barang 2',
      category: 'Kategori B',
      price: 15000,
      cost: 12000,
      quantity: 30,
      sku: 'SKU002',
      supplier: 'Supplier B',
      reorderLevel: 5,
      minOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [reason, setReason] = useState<string>('Penerimaan barang');

  const handleSaveReceipt = async () => {
    try {
      const qty = parseInt(quantity);
      const prc = parseFloat(price);
      
      if (!selectedItem) {
        Alert.alert('Error', 'Pilih item terlebih dahulu');
        return;
      }
      
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Error', 'Masukkan jumlah yang valid');
        return;
      }
      
      if (isNaN(prc) || prc < 0) {
        Alert.alert('Error', 'Masukkan harga yang valid');
        return;
      }
      
      // Simpan penerimaan barang
      await addStock(selectedItem.code, qty, prc, reason, 'User');
      
      Alert.alert(
        'Sukses', 
        'Penerimaan barang berhasil disimpan', 
        [
          { text: 'OK', onPress: () => {
            // Reset form
            setQuantity('');
            setPrice('');
            setReason('Penerimaan barang');
          }}
        ]
      );
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Gagal menyimpan penerimaan barang');
    }
  };

  const renderStockItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity 
      style={[
        styles.itemContainer, 
        selectedItem?.code === item.code && styles.selectedItem
      ]}
      onPress={() => setSelectedItem(item)}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemCode}>Kode: {item.code}</Text>
      <Text style={styles.itemCategory}>Kategori: {item.category || 'Tidak ada kategori'}</Text>
      <View style={styles.stockInfo}>
        <Text style={styles.currentStock}>Stok: {item.quantity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Penerimaan Barang</Text>
          <TouchableOpacity style={styles.historyButton} onPress={onNavigateToReceiptHistory}>
            <Text style={styles.historyButtonText}>Riwayat</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Pilih Item</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.code}
            renderItem={renderStockItem}
            contentContainerStyle={styles.listContainer}
          />
          
          {selectedItem && (
            <View style={styles.formContainer}>
              <View style={styles.itemInfoCard}>
                <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                <Text style={styles.selectedItemCode}>Kode: {selectedItem.code}</Text>
                <Text style={styles.selectedItemCategory}>Kategori: {selectedItem.category || 'Tidak ada kategori'}</Text>
                <View style={styles.currentStockContainer}>
                  <Text style={styles.currentStockLabel}>Stok saat ini:</Text>
                  <Text style={styles.currentStockValue}>{selectedItem.quantity}</Text>
                </View>
              </View>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Jumlah Diterima</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="Masukkan jumlah"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Harga Beli (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="Masukkan harga beli"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Catatan</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    placeholder="Masukkan catatan (opsional)"
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveReceipt}>
                <Text style={styles.saveButtonText}>Simpan Penerimaan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  historyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  historyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  listContainer: {
    paddingBottom: 20,
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
  selectedItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
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
  },
  currentStock: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  itemInfoCard: {
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
  selectedItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  selectedItemCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  selectedItemCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  currentStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  currentStockLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  currentStockValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
});

export default ReceiptScreen;