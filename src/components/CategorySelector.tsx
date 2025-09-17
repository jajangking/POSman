import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { InventoryCategory } from '../models/Inventory';
import { getAllCategories, addCategory } from '../services/CategoryService';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategorySelect: (categoryName: string) => void;
  onNavigateToCategoryManagement?: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategorySelect, onNavigateToCategoryManagement }) => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const loadedCategories = await getAllCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    onCategorySelect(categoryName);
    setModalVisible(false);
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Generate code from name if not provided
    const code = newCategoryCode.trim() || newCategoryName.trim().substring(0, 3).toUpperCase();

    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        code,
        description: newCategoryDescription.trim()
      });

      // Add new category to the list
      setCategories(prev => [...prev, newCategory]);
      
      // Select the new category
      onCategorySelect(newCategory.name);
      
      // Reset form and close modal
      setNewCategoryName('');
      setNewCategoryCode('');
      setNewCategoryDescription('');
      setShowNewCategoryForm(false);
      setModalVisible(false);
      
      Alert.alert('Success', 'Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      Alert.alert('Error', error.message || 'Failed to add category');
    }
  };

  const renderCategoryItem = ({ item }: { item: InventoryCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.selectedCategoryItem
      ]}
      onPress={() => handleSelectCategory(item.name)}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity 
        style={styles.selectorContainer} 
        onPress={() => {
          // Refresh categories when opening the selector
          loadCategories();
          setModalVisible(true);
        }}
      >
        <Text style={[styles.selectorText, !selectedCategory && styles.placeholderText]}>
          {selectedCategory || 'Select or create a category'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {!showNewCategoryForm ? (
              <View style={styles.modalContent}>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCategoryItem}
                  style={styles.categoryList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No categories available</Text>
                    </View>
                  }
                />
                
                <TouchableOpacity 
                  style={styles.createButton} 
                  onPress={() => setShowNewCategoryForm(true)}
                >
                  <Text style={styles.createButtonText}>+ Add New Category</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.createButton, styles.manageButton]} 
                  onPress={() => {
                    setModalVisible(false);
                    if (onNavigateToCategoryManagement && typeof onNavigateToCategoryManagement === 'function') {
                      onNavigateToCategoryManagement();
                    }
                  }}
                >
                  <Text style={styles.createButtonText}>Manage Categories</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.formTitle}>Add New Category</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Category Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="Enter category name"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Code</Text>
                  <TextInput
                    style={styles.input}
                    value={newCategoryCode}
                    onChangeText={setNewCategoryCode}
                    placeholder="Auto-generated from name"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newCategoryDescription}
                    onChangeText={setNewCategoryDescription}
                    placeholder="Enter description (optional)"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]} 
                    onPress={() => setShowNewCategoryForm(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]} 
                    onPress={handleAddNewCategory}
                  >
                    <Text style={styles.buttonText}>Add Category</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
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
  selectorText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 15,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#e3f2fd',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCode: {
    fontSize: 12,
    color: '#999',
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  manageButton: {
    backgroundColor: '#007AFF', // Warna biru untuk tombol Manage Categories
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategorySelector;