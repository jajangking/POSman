import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { InventoryCategory } from '../models/Inventory';
import { getAllCategories, addCategory } from '../services/CategoryService';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategorySelect: (categoryName: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategorySelect }) => {
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

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    if (!newCategoryCode.trim()) {
      Alert.alert('Error', 'Please enter a category code');
      return;
    }
    
    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        code: newCategoryCode.trim(),
        description: newCategoryDescription.trim()
      });
      
      setCategories([...categories, newCategory]);
      onCategorySelect(newCategory.name);
      setModalVisible(false);
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryCode('');
      setNewCategoryDescription('');
      
      Alert.alert('Success', 'Category created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create category');
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
        onPress={() => setModalVisible(true)}
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
                      <Text style={styles.emptySubtext}>Create your first category</Text>
                    </View>
                  }
                />
                
                <TouchableOpacity 
                  style={styles.createButton} 
                  onPress={() => setShowNewCategoryForm(true)}
                >
                  <Text style={styles.createButtonText}>+ Create New Category</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalContent}>
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
                  <Text style={styles.label}>Category Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={newCategoryCode}
                    onChangeText={setNewCategoryCode}
                    placeholder="Enter category code (e.g., 1, A)"
                    maxLength={3}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={newCategoryDescription}
                    onChangeText={setNewCategoryDescription}
                    placeholder="Enter description"
                  />
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={() => setShowNewCategoryForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={handleCreateNewCategory}
                  >
                    <Text style={styles.saveButtonText}>Create</Text>
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategorySelector;