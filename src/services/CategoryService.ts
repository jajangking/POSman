import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryCategory } from '../models/Inventory';
import { getAllInventoryItems } from './DatabaseService';

const CATEGORIES_STORAGE_KEY = '@posman_categories';

// Initialize with default categories (empty array for now)
export const initializeCategories = async (): Promise<InventoryCategory[]> => {
  try {
    const storedCategories = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (storedCategories) {
      return JSON.parse(storedCategories);
    }
    
    // Return empty array - users will add their own categories
    return [];
  } catch (error) {
    console.error('Error initializing categories:', error);
    return [];
  }
};

// Save categories to storage
export const saveCategories = async (categories: InventoryCategory[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
};

// Add a new category
export const addCategory = async (category: Omit<InventoryCategory, 'id'>): Promise<InventoryCategory> => {
  try {
    const categories = await initializeCategories();
    
    // Check if category code already exists
    if (categories.some(cat => cat.code === category.code)) {
      throw new Error('Category code already exists');
    }
    
    // Check if category name already exists
    if (categories.some(cat => cat.name === category.name)) {
      throw new Error('Category name already exists');
    }
    
    // Create new category with ID
    const newCategory: InventoryCategory = {
      ...category,
      id: Date.now().toString() // Use timestamp as ID
    };
    
    const updatedCategories = [...categories, newCategory];
    await saveCategories(updatedCategories);
    
    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const categories = await initializeCategories();
    const updatedCategories = categories.filter(cat => cat.id !== id);
    await saveCategories(updatedCategories);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Get all categories
export const getAllCategories = async (): Promise<InventoryCategory[]> => {
  try {
    return await initializeCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

// Get category by code
export const getCategoryByCode = async (code: string): Promise<InventoryCategory | undefined> => {
  try {
    const categories = await initializeCategories();
    return categories.find(cat => cat.code === code);
  } catch (error) {
    console.error('Error getting category by code:', error);
    return undefined;
  }
};

// Get category by name
export const getCategoryByName = async (name: string): Promise<InventoryCategory | undefined> => {
  try {
    const categories = await initializeCategories();
    return categories.find(cat => cat.name === name);
  } catch (error) {
    console.error('Error getting category by name:', error);
    return undefined;
  }
};

// Generate intelligent product code with duplicate prevention
export const generateIntelligentProductCode = async (
  categoryName: string
): Promise<string> => {
  try {
    // Get the category object
    const category = await getCategoryByName(categoryName);
    if (!category) {
      // If category not found, use first 3 characters of name as fallback
      const categoryCode = categoryName.substring(0, 3);
      return generateCodeWithSequence(categoryCode);
    }
    
    // Generate code with sequence
    return generateCodeWithSequence(category.code);
  } catch (error) {
    console.error('Error generating intelligent product code:', error);
    throw error;
  }
};

// Generate code with automatic sequence detection
const generateCodeWithSequence = async (categoryCode: string): Promise<string> => {
  try {
    // Clean category code (remove spaces, limit to reasonable length)
    const cleanCategoryCode = categoryCode.trim().substring(0, 3);
    
    // Get all existing inventory items to check for duplicates
    const allItems = await getAllInventoryItems();
    
    // Extract existing codes that match this category pattern
    const existingCodes = allItems
      .filter(item => item.code.startsWith(cleanCategoryCode))
      .map(item => item.code);
    
    // Find the highest sequence number for this category
    let maxSequence = 0;
    for (const code of existingCodes) {
      // Extract sequence part (last 2 digits)
      const sequencePart = code.substring(code.length - 2);
      if (/^\d{2}$/.test(sequencePart)) {
        const sequence = parseInt(sequencePart, 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
    
    // Generate next sequence number
    const nextSequence = maxSequence + 1;
    
    // Format sequence number (2 digits with leading zeros)
    const sequenceStr = nextSequence.toString().padStart(2, '0');
    
    // Create the code
    const newCode = `${cleanCategoryCode}${sequenceStr}`;
    
    // Double-check for duplicates (shouldn't happen but just in case)
    if (existingCodes.includes(newCode)) {
      // If duplicate found, find next available sequence
      let finalSequence = nextSequence + 1;
      let finalCode = `${cleanCategoryCode}${finalSequence.toString().padStart(2, '0')}`;
      
      while (existingCodes.includes(finalCode) && finalSequence < 99) {
        finalSequence++;
        finalCode = `${cleanCategoryCode}${finalSequence.toString().padStart(2, '0')}`;
      }
      
      return finalCode;
    }
    
    return newCode;
  } catch (error) {
    console.error('Error generating code with sequence:', error);
    // Fallback to random sequence
    const randomSequence = Math.floor(Math.random() * 99) + 1;
    const cleanCategoryCode = categoryCode.trim().substring(0, 3);
    return `${cleanCategoryCode}${randomSequence.toString().padStart(2, '0')}`;
  }
};