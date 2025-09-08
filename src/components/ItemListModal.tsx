import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Modal } from 'react-native';
import { InventoryItem } from '../models/Inventory';
import { fetchAllInventoryItems } from '../services/InventoryService';

interface ItemListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectItem: (item: InventoryItem) => void;
}

const ItemListModal: React.FC<ItemListModalProps> = ({ visible, onClose, onSelectItem }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadItems();
    }
  }, [visible]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const inventoryItems = await fetchAllInventoryItems();
      setItems(inventoryItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Gagal memuat daftar barang');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    onSelectItem(item);
    onClose();
  };

  const renderItem = ({ item, index }: { item: InventoryItem; index: number }) => (
    <TouchableOpacity 
                      style={styles.itemRow}
                      onPress={() => onSelectItem(item)}
                    >
      <Text style={styles.itemNumber}>{index + 1}.</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCode}>Kode: {item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Daftar Barang</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Memuat data...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            style={styles.list}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 30,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemCode: {
    fontSize: 14,
    color: '#666',
  },
});

export default ItemListModal;