import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, Switch, ToastAndroid } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { InventoryItem, formatRupiah } from '../models/Inventory';
import ViewShot from 'react-native-view-shot';

interface InventoryItemProps {
  item: InventoryItem;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (code: string, selected: boolean) => void;
  editMode?: boolean;
}

const InventoryItemComponent: React.FC<InventoryItemProps> = ({ item, onEdit, onDelete, isSelected, onSelect, editMode }) => {
  // State for barcode modal
  const [showBarcode, setShowBarcode] = React.useState(false);
  const [useQRCode, setUseQRCode] = React.useState(true); // Switch between QR code and barcode
  const viewShotRef = React.useRef<any>(null);

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

  // Handle product press (for logging and other actions)
  const handleProductPress = () => {
    if (!editMode) {
      // Show product info and options
      Alert.alert(
        'Product Actions',
        'Product: ' + item.name + '\nCode: ' + item.code + '\n\nWhat would you like to do?',
        [
          {
            text: 'View Logs',
            onPress: () => {
              // This would be implemented with actual log data in a real app
              Alert.alert(
                'Product Logs',
                'Stock Opname Logs:\n- No logs yet\n\nSales Logs:\n- No logs yet\n\nLast Updated: ' + item.updatedAt.toLocaleString(),
                [{ text: 'OK' }]
              );
            }
          },
          {
            text: 'Generate Barcode',
            onPress: () => {
              setShowBarcode(true);
              setUseQRCode(true); // Default to QR code
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Save barcode as image (show instructions to user)
  const saveBarcode = async () => {
    // Create filename with product name and code for reference
    const productName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${productName}_${item.code}_barcode.png`;
    
    // Show instructions to user
    Alert.alert(
      'Save Barcode',
      `To save this barcode:\n\n1. Tap "OK" below\n2. Take a screenshot of this barcode\n3. The file will be saved as: ${fileName}\n\nOn most devices, press the power and volume down buttons simultaneously to take a screenshot.`,
      [
        { text: 'OK', onPress: () => ToastAndroid.show('Take a screenshot now', ToastAndroid.SHORT) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={handleProductPress}
        disabled={editMode} // Disable press when in edit mode
      >
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.code}>Code: {item.code}</Text>
        </View>
        
        {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
        
        <Text style={styles.description} numberOfLines={2}>{item.description || 'No description'}</Text>
        
        <View style={styles.row}>
          <Text style={styles.price}>Sell: {formatRupiah(item.price)}</Text>
          <Text style={styles.cost}>Cost: {formatRupiah(item.cost)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={[styles.profit, calculateProfit() >= 0 ? styles.profitPositive : styles.profitNegative]}>
            Profit: {formatRupiah(calculateProfit())}
          </Text>
          <Text style={[styles.profitMargin, calculateProfit() >= 0 ? styles.profitPositive : styles.profitNegative]}>
            Margin: {calculateProfitMargin().toFixed(2)}%
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.quantity}>Stock: {item.quantity}</Text>
          <View style={[styles.stockIndicator, { backgroundColor: getStockStatusColor() }]}>
            <Text style={styles.stockText}>{getStockStatus()}</Text>
          </View>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.reorderLevel}>Reorder at: {item.reorderLevel}</Text>
        </View>
        
        {item.sku ? <Text style={styles.sku}>SKU/Barcode: {item.sku}</Text> : null}
        {item.supplier ? <Text style={styles.supplier}>Supplier: {item.supplier}</Text> : null}
        
        <View style={styles.datesRow}>
          <Text style={styles.dateText}>Created: {item.createdAt.toLocaleDateString()}</Text>
          <Text style={styles.dateText}>Updated: {item.updatedAt.toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.status, item.isActive ? styles.activeStatus : styles.inactiveStatus]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {editMode ? (
        <View style={styles.selectionArea}>
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => onSelect && onSelect(item.code, !isSelected)}
          >
            <View style={[styles.checkbox, isSelected && styles.checked]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>
      ) : null}
      
      {/* Barcode Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showBarcode}
        onRequestClose={() => setShowBarcode(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Product Barcode</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowBarcode(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>QR Code</Text>
            <Switch
              value={useQRCode}
              onValueChange={setUseQRCode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useQRCode ? '#f5dd4b' : '#f4f3f4'}
            />
            <Text style={styles.switchLabel}>Barcode</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.barcodeContainer}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCode}>Code: {item.code}</Text>
              
              {/* Barcode Display */}
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <View style={styles.barcodeWrapper}>
                  {useQRCode ? (
                    <QRCode
                      value={item.code}
                      size={200}
                      color="black"
                      backgroundColor="white"
                    />
                  ) : (
                    <View style={styles.linearBarcodeContainer}>
                      <Text style={styles.linearBarcodeText}>{item.code}</Text>
                      <View style={styles.linearBarcodeLines}>
                        {/* This is a simplified representation of a linear barcode */}
                        {item.code.split('').map((char, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.barcodeLine, 
                              { 
                                backgroundColor: parseInt(char, 36) % 2 === 0 ? 'black' : 'white',
                                width: (parseInt(char, 36) % 4) + 1
                              }
                            ]} 
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ViewShot>
              
              <Text style={styles.barcodeValue}>{item.code}</Text>
              
              <TouchableOpacity style={styles.downloadButton} onPress={saveBarcode}>
                <Text style={styles.downloadButtonText}>Save Barcode</Text>
              </TouchableOpacity>
              
              <View style={styles.barcodeInfo}>
                <Text style={styles.infoText}>
                  {useQRCode 
                    ? 'This QR code contains the product code and can be used for inventory tracking and sales transactions.' 
                    : 'This linear barcode represents the product code and can be used for inventory tracking and sales transactions.'}
                </Text>
                <Text style={styles.infoText}>
                  Tap "Save Barcode" for instructions on saving this image with the filename: {item.name.replace(/[^a-zA-Z0-9]/g, '_')}_{item.code}_barcode.png
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  code: {
    fontSize: 12,
    color: '#999',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  cost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  profit: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitMargin: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitPositive: {
    color: '#34C759',
  },
  profitNegative: {
    color: '#FF3B30',
  },
  quantity: {
    fontSize: 14,
    color: '#333',
  },
  reorderLevel: {
    fontSize: 14,
    color: '#666',
  },
  stockIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sku: {
    fontSize: 13,
    color: '#999',
    marginBottom: 3,
  },
  supplier: {
    fontSize: 13,
    color: '#999',
    marginBottom: 3,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 5,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeStatus: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  inactiveStatus: {
    backgroundColor: '#FF9500',
    color: 'white',
  },
  selectionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // QR Code Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 10,
  },
  modalContent: {
    flex: 1,
  },
  barcodeContainer: {
    alignItems: 'center',
    padding: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  barcodeWrapper: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  linearBarcodeContainer: {
    alignItems: 'center',
  },
  linearBarcodeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  linearBarcodeLines: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeLine: {
    height: 80,
    marginHorizontal: 1,
  },
  barcodeValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  barcodeInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default InventoryItemComponent;