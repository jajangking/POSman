import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { InventoryItem, formatRupiah } from '../models/Inventory';

interface ItemDetailModalProps {
  item: InventoryItem;
  onClose: () => void;
  onEdit: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onEdit }) => {
  // Determine stock status
  const getStockStatus = () => {
    if (item.quantity <= 0) return 'Out of Stock';
    if (item.quantity <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  // Get stock status color
  const getStockStatusColor = () => {
    if (item.quantity <= 0) return '#FF3B30'; // Red
    if (item.quantity <= item.reorderLevel) return '#FF9500'; // Orange
    return '#34C759'; // Green
  };

  // Calculate profit and profit margin
  const calculateProfit = () => {
    return item.price - item.cost;
  };

  const calculateProfitMargin = () => {
    if (item.price === 0) return 0;
    return ((item.price - item.cost) / item.price) * 100;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Item Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {/* Basic Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Product Code:</Text>
              <Text style={styles.value}>{item.code}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Product Name:</Text>
              <Text style={styles.value}>{item.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.value}>{item.category || '-'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{item.description || '-'}</Text>
            </View>
            
            {/* Pricing Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pricing Information</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Selling Price:</Text>
              <Text style={styles.value}>{formatRupiah(item.price)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Cost Price:</Text>
              <Text style={styles.value}>{formatRupiah(item.cost)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Profit:</Text>
              <Text style={[styles.value, calculateProfit() >= 0 ? styles.profitPositive : styles.profitNegative]}>
                {formatRupiah(calculateProfit())}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Profit Margin:</Text>
              <Text style={[styles.value, calculateProfit() >= 0 ? styles.profitPositive : styles.profitNegative]}>
                {calculateProfitMargin().toFixed(2)}%
              </Text>
            </View>
            
            {/* Inventory Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inventory Information</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Stock Quantity:</Text>
              <Text style={styles.value}>{item.quantity}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Stock Status:</Text>
              <View style={[styles.stockIndicator, { backgroundColor: getStockStatusColor() }]}>
                <Text style={styles.stockText}>{getStockStatus()}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Reorder Level:</Text>
              <Text style={styles.value}>{item.reorderLevel}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>SKU/Barcode:</Text>
              <Text style={styles.value}>{item.sku || '-'}</Text>
            </View>
            
            {/* Supplier Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Supplier Information</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Supplier:</Text>
              <Text style={styles.value}>{item.supplier || '-'}</Text>
            </View>
            
            {/* Status Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Status Information</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, item.isActive ? styles.activeText : styles.inactiveText]}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Created:</Text>
              <Text style={styles.value}>{item.createdAt.toLocaleString()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Last Updated:</Text>
              <Text style={styles.value}>{item.updatedAt.toLocaleString()}</Text>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>Edit Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
              <Text style={styles.closeButtonBottomText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  profitPositive: {
    color: '#34C759',
    fontWeight: '600',
  },
  profitNegative: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  stockIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  stockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: '#34C759',
    fontWeight: '600',
  },
  inactiveText: {
    color: '#FF9500',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButtonBottom: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  closeButtonBottomText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ItemDetailModal;