import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { InventoryItem, formatRupiah, parseRupiah, formatBarcode, generateProductCode } from '../models/Inventory';
import { addInventoryItem, modifyInventoryItem, fetchAllInventoryItems } from '../services/InventoryService';
import ScannerModal from './ScannerModal';
import CategorySelector from './CategorySelector';

interface InventoryFormProps {
  item?: InventoryItem;
  onSave: () => void;
  onCancel: () => void;
  onShowCategoryManagement?: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSave, onCancel, onShowCategoryManagement }) => {
  const [code, setCode] = useState(item?.code || ''); // Generated code
  const [barcode, setBarcode] = useState(item?.sku || ''); // Barcode from product
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [cost, setCost] = useState(item?.cost?.toString() || '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '');
  const [supplier, setSupplier] = useState(item?.supplier || '');
  const [isActive, setIsActive] = useState(item?.isActive !== undefined ? item.isActive : true);
  const [loading, setLoading] = useState(false);
  const [isCodeEditable, setIsCodeEditable] = useState(!item); // Code is only editable for new items
  const [scannerVisible, setScannerVisible] = useState(false);

  // Generate code for new items automatically
  useEffect(() => {
    const generateCode = async () => {
      if (!item && isCodeEditable && category && category.trim() !== '') {
        try {
          // Small delay to allow state updates to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          const newCode = await generateProductCode(category); // Always use auto-generation
          setCode(newCode);
        } catch (error) {
          console.warn('Failed to auto-generate code:', error);
        }
      } else if (!item && isCodeEditable && (!category || category.trim() === '')) {
        // Clear code when no category is selected
        setCode('');
      }
    };
    
    generateCode();
  }, [item, isCodeEditable, category]);

  const handleSubmit = async () => {
    // Validation
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a product code');
      return;
    }
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }
    
    if (!category.trim()) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    
    const priceValue = parseRupiah(price || '0');
    const costValue = parseRupiah(cost || '0');
    const quantityValue = parseInt(quantity || '0');
    
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid selling price');
      return;
    }
    
    if (isNaN(costValue) || costValue <= 0) {
      Alert.alert('Error', 'Please enter a valid cost price');
      return;
    }
    
    if (isNaN(quantityValue) || quantityValue < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    // Check for duplicate SKU if one was entered
    if (barcode.trim() !== '') {
      try {
        // We'll check if any item already has this SKU
        const allItems = await fetchAllInventoryItems();
        const duplicateItem = allItems.find(item => item.sku === barcode.trim());
        if (duplicateItem && (!item || item.code !== duplicateItem.code)) {
          Alert.alert(
            'Duplicate Barcode', 
            `The barcode "${barcode}" is already assigned to item "${duplicateItem.name}" (Code: ${duplicateItem.code}).\n\nPlease use a different barcode or leave it blank.`
          );
          return;
        }
      } catch (error) {
        console.warn('Could not check for duplicate SKU:', error);
      }
    }

    setLoading(true);
    
    try {
      const itemData = {
        code,
        name,
        category,
        price: priceValue,
        cost: costValue,
        quantity: quantityValue,
        supplier,
        isActive,
        // Required default values for other fields
        description: '',
        sku: barcode, // Use barcode as SKU
        reorderLevel: 0
      };

      if (item) {
        // Update existing item
        await modifyInventoryItem(item.code, itemData);
        Alert.alert('Success', 'Item updated successfully');
        onSave();
      } else {
        // Create new item with confirmation
        Alert.alert(
          'Confirm Item Creation',
          `Create new item:\n\nCode: ${code}\nName: ${name}\nCategory: ${category}\nPrice: ${formatRupiah(priceValue)}\nQuantity: ${quantityValue}\n\nProceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create',
              onPress: async () => {
                try {
                  await addInventoryItem(itemData as any);
                  Alert.alert('Success', 'Item created successfully');
                  onSave();
                } catch (error: any) {
                  console.error('Error creating item:', error);
                  // Handle specific SQLite errors
                  if (error.message && error.message.includes('UNIQUE constraint failed')) {
                    if (error.message.includes('inventory_items.code')) {
                      Alert.alert('Error', `The product code "${code}" is already in use. Please try again to generate a different code.`);
                    } else if (error.message.includes('inventory_items.sku')) {
                      Alert.alert('Error', `The barcode/SKU "${barcode}" is already in use. Please enter a different barcode or leave it blank.`);
                    } else {
                      Alert.alert('Error', 'Duplicate entry detected. Please check that the product code and barcode are unique.');
                    }
                  } else {
                    Alert.alert('Error', error.message || 'Failed to create item');
                  }
                }
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      Alert.alert('Error', error.message || `Failed to ${item ? 'update' : 'create'} item`);
    } finally {
      setLoading(false);
    }
  };

  // Format price inputs as user types
  const handlePriceChange = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Remove non-numeric characters except comma for decimal
    const cleanText = text.replace(/[^0-9,]/g, '');
    setter(cleanText);
  };

  // Format price for display
  const formatPriceForDisplay = (value: string): string => {
    if (!value) return '';
    const numValue = parseRupiah(value);
    if (isNaN(numValue)) return '';
    return formatRupiah(numValue);
  };

  const handleBarcodeScanned = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
  };

  // Validate sequence number (no longer used but kept for compatibility)
  const validateSequence = async (categoryName: string, sequence: string) => {
    return true;
  };

  // Generate code with auto-generated sequence only
  const generateProductCode = async (categoryName: string) => {
    try {
      // Import category service to get category code
      const { getCategoryByName } = await import('../services/CategoryService');
      const categoryObj = await getCategoryByName(categoryName);
      const categoryCode = categoryObj ? categoryObj.code : categoryName.substring(0, 3);
      
      // Auto-generate next available sequence for this category
      try {
        const allItems = await fetchAllInventoryItems();
        
        // Create a set of existing sequences for this specific category only
        const existingSequences = new Set<number>();
        for (const item of allItems) {
          if (item.code.startsWith(categoryCode)) {
            const sequencePart = item.code.substring(categoryCode.length);
            if (/^\d{2}$/.test(sequencePart)) {
              const sequence = parseInt(sequencePart, 10);
              if (!isNaN(sequence)) {
                existingSequences.add(sequence);
              }
            }
          }
        }
        
        // Find the next available sequence (1-99)
        for (let i = 1; i <= 99; i++) {
          if (!existingSequences.has(i)) {
            return `${categoryCode}${i.toString().padStart(2, '0')}`;
          }
        }
        
        // If all sequences are taken (highly unlikely), generate a random one
        console.warn(`All sequences taken for category ${categoryCode}, using random sequence`);
        const randomSequence = Math.floor(Math.random() * 99) + 1;
        return `${categoryCode}${randomSequence.toString().padStart(2, '0')}`;
      } catch (dbError) {
        console.warn('Database check failed for auto-sequence, using random:', dbError);
        // Fallback to random sequence
        const randomSequence = Math.floor(Math.random() * 99) + 1;
        return `${categoryCode}${randomSequence.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('Error generating code with auto sequence:', error);
      throw error;
    }
  };

  const handleGenerateCode = async () => {
    // Check if category is selected
    if (!category || category.trim() === '') {
      Alert.alert('Error', 'Please select a category before generating a code');
      return;
    }
    
    try {
      const newCode = await generateProductCode(category);
      setCode(newCode);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate code');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Code *</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={code}
              onChangeText={setCode}
              placeholder="System-generated code"
              editable={false} // Make it read-only
            />
          </View>
        </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Barcode (Optional)</Text>
        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.input}
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Scan or enter product barcode"
          />
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => setScannerVisible(true)}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>Original barcode from the product packaging</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category *</Text>
        <CategorySelector 
          selectedCategory={category} 
          onCategorySelect={(selectedCategory) => {
            setCategory(selectedCategory);
          }} 
          onNavigateToCategoryManagement={onShowCategoryManagement}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Sequence Number</Text>
        <Text style={styles.helperText}>
          Sequence will be automatically generated.
        </Text>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Selling Price *</Text>
            <TextInput
              style={styles.input}
              value={formatPriceForDisplay(price)}
              onChangeText={(text) => handlePriceChange(text, setPrice)}
              placeholder="Rp 0"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.halfColumn}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cost Price *</Text>
            <TextInput
              style={styles.input}
              value={formatPriceForDisplay(cost)}
              onChangeText={(text) => handlePriceChange(text, setCost)}
              placeholder="Rp 0"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Stock Quantity *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Supplier</Text>
        <TextInput
          style={styles.input}
          value={supplier}
          onChangeText={setSupplier}
          placeholder="Enter supplier name"
        />
      </View>
      
      <View style={[styles.formGroup, styles.switchContainer]}>
        <Text style={styles.label}>Active</Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScannerModal
        visible={scannerVisible}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />
    </ScrollView>
        
      </KeyboardAvoidingView>
    );
  }


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 30, // Menambahkan padding bawah agar tidak tertutup navbar android
  },
  formHeader: {
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
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  headerCategoryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCategoryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  contentContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  codeInputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  scanButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  helperLink: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfColumn: {
    flex: 1,
    marginRight: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF', // Warna biru untuk tombol save
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  thirdColumn: {
    flex: 1,
    marginRight: 10,
  },
  categoryDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  categoryDropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999',
  },
});

export default InventoryForm;