import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem } from '../models/Inventory';
import { fetchAllInventoryItems, fetchInventoryItemByCode } from '../services/InventoryService';

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  getItemByCode: (code: string) => Promise<InventoryItem | null>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const inventoryItems = await fetchAllInventoryItems();
      setItems(inventoryItems);
    } catch (err) {
      console.error('Error loading inventory items:', err);
      setError('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const getItemByCode = async (code: string): Promise<InventoryItem | null> => {
    try {
      const item = await fetchInventoryItemByCode(code);
      return item;
    } catch (err) {
      console.error('Error getting inventory item:', err);
      return null;
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const value = {
    items,
    loading,
    error,
    loadItems,
    getItemByCode
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};