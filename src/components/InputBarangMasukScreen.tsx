import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addStock } from '../services/InventoryService';
import { InventoryItem } from '../models/Inventory';

interface InputBarangMasukScreenProps {
  item: InventoryItem;
  onBack: () => void;
  onNavigateToStockMinimum: () => void;
}

const InputBarangMasukScreen: React.FC<InputBarangMasukScreenProps> = ({ item, onBack, onNavigateToStockMinimum }) => {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('Barang masuk');
  const [loading, setLoading] = useState(false);

  const handleAddStock = async () => {
    // Validasi input
    if (!quantity || !price) {
      Alert.alert('Error', 'Mohon isi semua field yang diperlukan');
      return;
    }

    const quantityValue = parseInt(quantity);
    const priceValue = parseFloat(price);

    if (isNaN(quantityValue) || quantityValue <= 0) {
      Alert.alert('Error', 'Jumlah harus berupa angka positif');
      return;
    }

    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Error', 'Harga harus berupa angka positif atau nol');
      return;
    }

    try {
      setLoading(true);
      // Dalam aplikasi nyata, createdBy akan diambil dari user yang login
      await addStock(item.code, quantityValue, priceValue, reason, 'Admin');
      
      Alert.alert(
        'Sukses', 
        'Stok barang berhasil ditambahkan',
        [
          {
            text: 'OK',
            onPress: () => {
              // Kembali ke halaman stok minimum setelah sukses
              onNavigateToStockMinimum();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding stock:', error);
      Alert.alert('Error', 'Gagal menambahkan stok barang');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: string) => {
    // Hapus semua karakter non-digit
    const cleanValue = value.replace(/\D/g, '');
    
    // Jika string kosong, kembalikan '0'
    if (cleanValue === '') return '0';
    
    // Konversi ke angka dan format sebagai Rupiah
    const numberValue = parseInt(cleanValue);
    return new Intl.NumberFormat('id-ID').format(numberValue);
  };

  const handlePriceChange = (text: string) => {
    // Hapus semua karakter non-digit untuk mendapatkan angka mentah
    const cleanValue = text.replace(/\D/g, '');
    setPrice(cleanValue);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Input Barang Masuk</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.itemInfoCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCode}>Kode: {item.code}</Text>
            <Text style={styles.itemCategory}>Kategori: {item.category || 'Tidak ada kategori'}</Text>
            <View style={styles.currentStockContainer}>
              <Text style={styles.currentStockLabel}>Stok saat ini:</Text>
              <Text style={styles.currentStockValue}>{item.quantity}</Text>
            </View>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jumlah Barang Masuk *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Masukkan jumlah barang"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Harga Beli per Unit (Rp) *</Text>
              <TextInput
                style={styles.input}
                value={price ? formatRupiah(price) : ''}
                onChangeText={handlePriceChange}
                placeholder="Masukkan harga beli"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Keterangan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Masukkan keterangan"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleAddStock}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Menambahkan...' : 'Tambah Stok'}
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
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  currentStockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InputBarangMasukScreen;