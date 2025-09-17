import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { InventoryCategory } from '../models/Inventory';
import { addCategory, deleteCategory, getAllCategories, saveCategories, getCategoryByCode } from '../services/CategoryService';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  // Check if category code is already in use
  const checkCodeAvailability = async (categoryCode: string) => {
    if (!categoryCode.trim()) {
      setCodeError('');
      return;
    }
    
    try {
      const existingCategory = await getCategoryByCode(categoryCode.trim());
      if (existingCategory) {
        setCodeError(`Category code "${categoryCode}" is already in use by "${existingCategory.name}"`);
      } else {
        setCodeError('');
      }
    } catch (error) {
      console.error('Error checking category code:', error);
      setCodeError('');
    }
  };

  // Handle code change with validation
  const handleCodeChange = (text: string) => {
    setCode(text);
    // Debounce the validation to avoid too many calls
    setTimeout(() => {
      checkCodeAvailability(text);
    }, 300);
  };

  const loadCategories = async () => {
    try {
      const loadedCategories = await getAllCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a category code');
      return;
    }
    
    // Check for duplicate code before adding
    try {
      const existingCategory = await getCategoryByCode(code.trim());
      if (existingCategory) {
        Alert.alert('Error', `Category code "${code}" is already in use by "${existingCategory.name}"`);
        return;
      }
    } catch (error) {
      console.error('Error checking category code:', error);
    }
    
    try {
      const newCategory = await addCategory({
        name: name.trim(),
        description: description.trim(),
        code: code.trim()
      });
      
      setCategories([...categories, newCategory]);
      setName('');
      setDescription('');
      setCode('');
      setCodeError('');
      
      Alert.alert('Success', 'Category added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(id);
              setCategories(categories.filter(cat => cat.id !== id));
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const renderCategory = ({ item }: { item: InventoryCategory }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <Text style={styles.categoryCode}>Code: {item.code}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDeleteCategory(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Management</Text>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter category name (e.g., Minuman)"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category Code *</Text>
          <TextInput
            style={[styles.input, codeError ? styles.inputError : null]}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="Enter category code (e.g., 1, A, DR)"
            maxLength={3}
          />
          {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>Existing Categories</Text>
      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories added yet</Text>
          <Text style={styles.emptySubtext}>Add your first category to get started</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          style={styles.categoryList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryList: {
    flex: 1,
    marginTop: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  categoryCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
});

export default CategoryManagement;