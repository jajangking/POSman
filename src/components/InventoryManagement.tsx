import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InventoryItem } from '../models/Inventory';
import { fetchAllInventoryItems, searchInventory, fetchLowStockItems, removeInventoryItem, fetchInventoryItemByCode } from '../services/InventoryService';
import InventoryItemComponent from './InventoryItem';
import CompactInventoryItem from './CompactInventoryItem';
import InventorySearch from './InventorySearch';
import ItemDetailModal from './ItemDetailModal';
import ItemLogScreen from './ItemLogScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define column configuration
interface ColumnConfig {
  id: string;
  label: string;
  key: string;
  width: number;
  visible: boolean;
  order: number;
}

const COLUMN_STORAGE_KEY = 'inventory_column_config';

const defaultColumnConfigs: ColumnConfig[] = [
  { id: 'no', label: 'No', key: 'no', width: 30, visible: true, order: 0 },
  { id: 'code', label: 'Code', key: 'code', width: 50, visible: true, order: 1 },
  { id: 'name', label: 'Product Name', key: 'name', width: 60, visible: true, order: 2 },
  { id: 'stock', label: 'Stock', key: 'stock', width: 40, visible: true, order: 3 },
  { id: 'price', label: 'Price', key: 'price', width: 80, visible: true, order: 4 },
];

interface InventoryManagementProps {
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onViewItemLog: (item: InventoryItem) => void; // Tambahkan prop untuk navigasi ke log item
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ onAddItem, onEditItem, onViewItemLog }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]); // Store all items for client-side search
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('compact');
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [showItemLog, setShowItemLog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([
    { id: 'no', label: 'No', key: 'no', width: 30, visible: true, order: 0 },
    { id: 'code', label: 'Code', key: 'code', width: 50, visible: true, order: 1 },
    { id: 'name', label: 'Product Name', key: 'name', width: 0, visible: true, order: 2 }, // width 0 for flex
    { id: 'stock', label: 'Stock', key: 'stock', width: 60, visible: true, order: 3 }, // Increased width to 60
    { id: 'price', label: 'Price', key: 'price', width: 0, visible: true, order: 4 }, // width 0 for flex
  ]);

  useEffect(() => {
    loadInventoryItems();
  }, [filter]);

  useEffect(() => {
    loadColumnConfig();
  }, []);

  const loadColumnConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(COLUMN_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Ensure all required properties are present
        const validatedConfig = parsedConfig.map((col: any) => ({
          id: col.id,
          label: col.label,
          key: col.key || col.id, // fallback to id if key is missing
          width: col.id === 'stock' ? Math.max(col.width, 60) : (col.id === 'name' || col.id === 'price' ? 0 : col.width), // Increase stock width to 60
          visible: col.visible !== undefined ? col.visible : true,
          order: col.order
        })).filter((col: ColumnConfig) => col.id !== 'minOrder'); // Remove minOrder column if present
        setColumnConfigs(validatedConfig);
      } else {
        // Use default config with flex columns and wider stock
        setColumnConfigs([
          { id: 'no', label: 'No', key: 'no', width: 30, visible: true, order: 0 },
          { id: 'code', label: 'Code', key: 'code', width: 50, visible: true, order: 1 },
          { id: 'name', label: 'Product Name', key: 'name', width: 0, visible: true, order: 2 }, // width 0 for flex
          { id: 'stock', label: 'Stock', key: 'stock', width: 60, visible: true, order: 3 }, // Increased width to 60
          { id: 'price', label: 'Price', key: 'price', width: 0, visible: true, order: 4 }, // width 0 for flex
        ]);
      }
    } catch (error) {
      console.error('Error loading column configuration:', error);
      // If there's an error, use default config with flex columns and wider stock
      setColumnConfigs([
        { id: 'no', label: 'No', key: 'no', width: 30, visible: true, order: 0 },
        { id: 'code', label: 'Code', key: 'code', width: 50, visible: true, order: 1 },
        { id: 'name', label: 'Product Name', key: 'name', width: 0, visible: true, order: 2 }, // width 0 for flex
        { id: 'stock', label: 'Stock', key: 'stock', width: 60, visible: true, order: 3 }, // Increased width to 60
        { id: 'price', label: 'Price', key: 'price', width: 0, visible: true, order: 4 }, // width 0 for flex
      ]);
    }
  };

  const saveColumnConfig = async (configs: ColumnConfig[]) => {
    try {
      await AsyncStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving column configuration:', error);
    }
  };

  const resetColumnConfig = async () => {
    setColumnConfigs(defaultColumnConfigs);
    await saveColumnConfig(defaultColumnConfigs);
  };

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      let inventoryItems: InventoryItem[] = [];
      
      if (filter === 'low-stock') {
        inventoryItems = await fetchLowStockItems();
      } else {
        inventoryItems = await fetchAllInventoryItems();
      }
      
      // console.log('Test barcode item found:', testItem);
    // console.log('Test barcode item NOT found in loaded data');
    // console.log('First 20 barcodes in data:', barcodes);
      
      setItems(inventoryItems);
      setAllItems(inventoryItems); // Store all items for client-side search
    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (code: string, name: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${name}"?

This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeInventoryItem(code);
              setItems(items.filter(item => item.code !== code));
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const performSearch = async (query: string) => {
    // console.log('Search triggered with query:', query);
    
    try {
      // Don't trigger search if query hasn't changed significantly
      if (query.trim() === '' && items.length === allItems.length) {
        // console.log('Skipping search - no significant change');
        return;
      }
      
      setLoading(true);
      if (query.trim() === '') {
        console.log('Loading all items');
        // Load all items when search is empty
        setItems(allItems);
      } else {
        // Check if this looks like a barcode (numeric)
        const isBarcode = /^\d+$/.test(query);
        console.log('Is barcode:', isBarcode, 'Query length:', query.length);
        
        if (isBarcode) {
          // For barcode searches, try exact match first
          try {
            console.log('Searching for barcode locally');
            // First try to find in local cache
            const localMatch = allItems.find(item => item.code === query || item.sku === query);
            if (localMatch) {
              console.log('Found barcode match locally:', localMatch);
              setItems([localMatch]);
              setLoading(false);
              return;
            }
            
            console.log('Barcode not found locally, trying API search');
            // If not found locally, try API search
            const results = await searchInventory(query);
            console.log('API search results:', results);
            
            // If API returns results, use them
            if (results && results.length > 0) {
              setItems(results);
            } else {
              // If API returns no results, fall back to client-side search
              console.log('API returned no results, falling back to client-side search');
              performClientSideSearch(query);
            }
          } catch (error) {
            console.error('API search failed, falling back to client-side:', error);
            // If API fails, fall back to client-side exact match
            performClientSideSearch(query);
          }
        } else {
          console.log('Performing text search');
          // For regular text searches, use fuzzy search
          const results = await searchInventory(query);
          console.log('Text search results:', results);
          setItems(results);
        }
      }
    } catch (error) {
      console.error('Error searching inventory items:', error);
      // Fallback to client-side search if API fails
      performClientSideSearch(query);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    await performSearch(query);
  };

  const performClientSideSearch = (query: string) => {
    console.log('Performing client-side search with query:', query);
    
    // Check if this looks like a barcode (numeric)
    const isBarcode = /^\d+$/.test(query);
    console.log('Is barcode (client-side):', isBarcode);
    
    // Filter items based on search criteria
    const filteredItems = allItems.filter(item => {
      if (isBarcode) {
        // For barcode searches, do exact match on code or sku
        const match = item.code === query || item.sku === query;
        if (match) console.log('Barcode/SKU match found:', item);
        return match;
      } else {
        // For text searches, do partial match across multiple fields
        const searchTerm = query.toLowerCase().trim();
        
        // Search in product name
        if (item.name && item.name.toLowerCase().includes(searchTerm)) {
          console.log('Name match found:', item.name);
          return true;
        }
        
        // Search in product code
        if (item.code && item.code.toLowerCase().includes(searchTerm)) {
          console.log('Code match found:', item.code);
          return true;
        }
        
        // Search in SKU
        if (item.sku && item.sku.toLowerCase().includes(searchTerm)) {
          console.log('SKU match found:', item.sku);
          return true;
        }
        
        // Search in category
        if (item.category && item.category.toLowerCase().includes(searchTerm)) {
          console.log('Category match found:', item.category);
          return true;
        }
        
        // Search in supplier
        if (item.supplier && item.supplier.toLowerCase().includes(searchTerm)) {
          console.log('Supplier match found:', item.supplier);
          return true;
        }
        
        // Search in description
        if (item.description && item.description.toLowerCase().includes(searchTerm)) {
          console.log('Description match found:', item.description);
          return true;
        }
        
        // Search in price
        if (item.price && item.price.toString().includes(searchTerm)) {
          console.log('Price match found:', item.price);
          return true;
        }
        
        // Search in stock/quantity
        if (item.quantity && item.quantity.toString().includes(searchTerm)) {
          console.log('Quantity match found:', item.quantity);
          return true;
        }
        
        return false;
      }
    });
    
    console.log('Client-side search results count:', filteredItems.length);
    
    // Only update if results are different to prevent flickering
    if (JSON.stringify(items) !== JSON.stringify(filteredItems)) {
      console.log('Updating items with new results');
      setItems(filteredItems);
    } else {
      console.log('Results unchanged, skipping update');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryItems();
    setRefreshing(false);
  };

  const handleSelectItem = (code: string, selected: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (selected) {
      newSelectedItems.add(code);
    } else {
      newSelectedItems.delete(code);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      const allCodes = new Set(items.map(item => item.code));
      setSelectedItems(allCodes);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    
    // Get the items that are selected for display in the confirmation
    const selectedItemsList = items
      .filter(item => selectedItems.has(item.code))
      .map(item => `${item.name} (${item.code})`)
      .join('\n');
    
    const itemText = selectedItems.size === 1 ? 'item' : 'items';
    
    Alert.alert(
      `Delete ${selectedItems.size} Item${selectedItems.size > 1 ? 's' : ''}`,
      `Are you sure you want to delete the following ${itemText}?

${selectedItemsList}

This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all selected items
              const deletePromises = Array.from(selectedItems).map(code => 
                removeInventoryItem(code)
              );
              await Promise.all(deletePromises);
              
              // Update state
              setItems(items.filter(item => !selectedItems.has(item.code)));
              setSelectedItems(new Set());
              setEditMode(false);
              
              Alert.alert('Success', `${selectedItems.size} item(s) deleted successfully`);
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert('Error', 'Failed to delete items');
            }
          }
        }
      ]
    );
  };

  const handleEditSelected = () => {
    if (selectedItems.size === 0) return;
    
    if (selectedItems.size === 1) {
      // Edit single item
      const itemCode = Array.from(selectedItems)[0];
      const item = items.find(i => i.code === itemCode);
      if (item) {
        onEditItem(item);
      }
    } else {
      Alert.alert(
        'Multiple Items Selected',
        'Please select only one item to edit, or delete multiple items.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getColumnWidth = (id: string) => {
    const column = columnConfigs.find(col => col.id === id);
    return column && column.visible ? column.width : 0;
  };

  const isColumnVisible = (id: string) => {
    const column = columnConfigs.find(col => col.id === id);
    return column ? column.visible : true;
  };

  const updateColumnConfig = (newConfigs: ColumnConfig[]) => {
    setColumnConfigs(newConfigs);
    saveColumnConfig(newConfigs);
  };

  const getSortedItems = () => {
    if (!sortConfig) return items;
    
    const sortableItems = [...items];
    sortableItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortConfig.key) {
        case 'no':
          // For 'no' column, we sort by the actual index in the array
          // Since we can't determine the original index here, we'll sort by code instead
          aValue = a.code;
          bValue = b.code;
          break;
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category ? a.category.toLowerCase() : '';
          bValue = b.category ? b.category.toLowerCase() : '';
          break;
        case 'stock':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortableItems;
  };

  const handleItemPress = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleViewLogs = (item: InventoryItem) => {
    // If onViewItemLog is provided, use it to navigate to the external ItemLogScreen
    if (onViewItemLog) {
      onViewItemLog(item);
    } else {
      // Otherwise, use the internal navigation
      setSelectedItem(item);
      setShowItemDetail(false);
      setShowItemLog(true);
    }
  };

  // Fungsi untuk menangani navigasi ke log item dari tampilan detailed
  const handleViewItemLog = (item: InventoryItem) => {
    onViewItemLog(item);
  };

  const renderInventoryItem = ({ item, index }: { item: InventoryItem, index: number }) => (
    viewMode === 'detailed' ? (
      <InventoryItemComponent
        item={item}
        onEdit={() => onEditItem(item)}
        onDelete={() => handleDeleteItem(item.code, item.name)}
        isSelected={selectedItems.has(item.code)}
        onSelect={handleSelectItem}
        editMode={editMode}
        onViewItemLog={onViewItemLog} // Tambahkan prop untuk navigasi ke log item
      />
    ) : (
      <CompactInventoryItem
        item={item}
        index={index}
        isSelected={selectedItems.has(item.code)}
        onSelect={handleSelectItem}
        onItemPress={handleItemPress}
        editMode={editMode}
        columnConfigs={columnConfigs}
      />
    )
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.container}>
        {/* [0] Controls Container Start */}
        <View style={styles.controlsContainer}>
          {/* Combined Filter and View Toggles */}
          <View style={styles.compactToggleSection}>
            {/* Filter Toggles */}
            <View style={styles.toggleGroup}>
              <Text style={styles.toggleLabel}>Filter:</Text>
              <View style={styles.compactToggleButtonGroup}>
                <TouchableOpacity 
                  style={[styles.compactToggleButton, filter === 'all' && styles.compactToggleButtonActive]} 
                  onPress={() => setFilter('all')}
                >
                  <Text style={[styles.compactToggleButtonText, filter === 'all' && styles.compactToggleButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactToggleButton, filter === 'low-stock' && styles.compactToggleButtonActive]} 
                  onPress={() => setFilter('low-stock')}
                >
                  <Text style={[styles.compactToggleButtonText, filter === 'low-stock' && styles.compactToggleButtonTextActive]}>
                    Low
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* View Toggles */}
            <View style={styles.toggleGroup}>
              <Text style={styles.toggleLabel}>View:</Text>
              <View style={styles.compactToggleButtonGroup}>
                <TouchableOpacity 
                  style={[styles.compactToggleButton, viewMode === 'detailed' && styles.compactToggleButtonActive]} 
                  onPress={() => setViewMode('detailed')}
                >
                  <Text style={[styles.compactToggleButtonText, viewMode === 'detailed' && styles.compactToggleButtonTextActive]}>
                    Detail
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactToggleButton, viewMode === 'compact' && styles.compactToggleButtonActive]} 
                  onPress={() => setViewMode('compact')}
                >
                  <Text style={[styles.compactToggleButtonText, viewMode === 'compact' && styles.compactToggleButtonTextActive]}>
                    Compact
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Edit Mode Controls */}
          {editMode ? (
            <View style={styles.compactEditModeSection}>
              <View style={styles.compactBatchActionContainer}>
                <TouchableOpacity 
                  style={[styles.compactBatchActionButton]}
                  onPress={handleEditSelected}
                >
                  <Text style={styles.compactBatchActionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactBatchActionButton, styles.compactDeleteBatchButton]}
                  onPress={handleDeleteSelected}
                >
                  <Text style={styles.compactBatchActionButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.compactCancelButton}
                  onPress={() => {
                    setEditMode(false);
                    setSelectedItems(new Set());
                  }}
                >
                  <Text style={styles.compactCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
        
        {/* Search Section with Select Items Button */}
        <View style={styles.searchSectionContainer}>
          {!editMode && (
            <TouchableOpacity 
              style={styles.compactSelectButton}
              onPress={() => setEditMode(true)}
            >
              <Text style={styles.compactSelectButtonText}>Select Items</Text>
            </TouchableOpacity>
          )}
          <View style={styles.tableSearchContainer}>
            <InventorySearch onSearch={handleSearch} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading inventory items...</Text>
          </View>
        ) : (
          <>
            {viewMode === 'compact' && !editMode && (
              <View style={styles.tableHeader}>
                {columnConfigs
                  .filter(col => col.visible)
                  .sort((a, b) => a.order - b.order)
                  .map(column => {
                    // Determine specific header style based on column id
                    let headerStyle = [styles.headerCell];
                    if (column.id === 'no') headerStyle = [styles.numberHeaderCell];
                    if (column.id === 'name') headerStyle = [styles.nameHeaderCell];
                    if (column.id === 'stock') headerStyle = [styles.stockHeaderCell];
                    if (column.id === 'price') headerStyle = [styles.priceHeaderCell];
                    
                    // Determine style based on column id and whether it uses flex
                    let headerWidthStyle = {};
                    if (column.width > 0) {
                      headerWidthStyle = { width: column.width };
                    } else {
                      // For flex columns (width = 0), use flex properties
                      if (column.id === 'name') {
                        headerWidthStyle = { flex: 2, minWidth: 100 };
                      } else if (column.id === 'price') {
                        headerWidthStyle = { flex: 1, minWidth: 70 };
                      }
                    }
                    
                    return (
                      <TouchableOpacity 
                        key={column.id}
                        style={[headerStyle, headerWidthStyle]}
                        onPress={() => handleSort(column.key)}
                      >
                        <Text style={[styles.headerText, { 
                          textAlign: column.id === 'name' ? 'left' : 'center'
                        }]}>{column.label}</Text>
                        {sortConfig && sortConfig.key === column.key && (
                          <Text style={styles.sortIndicator}>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                }
              </View>
            )}
            {viewMode === 'compact' && editMode && (
              <View style={styles.tableHeader}>
                <TouchableOpacity style={styles.headerCheckboxCell} onPress={handleSelectAll}>
                  <View style={styles.checkbox}>
                    {selectedItems.size === items.length && items.length > 0 && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
                {columnConfigs
                  .filter(col => col.visible)
                  .sort((a, b) => a.order - b.order)
                  .map(column => {
                    // Determine specific header style based on column id
                    let headerStyle = [styles.headerCell];
                    if (column.id === 'no') headerStyle = [styles.numberHeaderCell];
                    if (column.id === 'name') headerStyle = [styles.nameHeaderCell];
                    if (column.id === 'stock') headerStyle = [styles.stockHeaderCell];
                    if (column.id === 'price') headerStyle = [styles.priceHeaderCell];
                    
                    // Determine style based on column id and whether it uses flex
                    let headerWidthStyle = {};
                    if (column.width > 0) {
                      headerWidthStyle = { width: column.width };
                    } else {
                      // For flex columns (width = 0), use flex properties
                      if (column.id === 'name') {
                        headerWidthStyle = { flex: 2, minWidth: 100 };
                      } else if (column.id === 'price') {
                        headerWidthStyle = { flex: 1, minWidth: 70 };
                      }
                    }
                    
                    return (
                      <TouchableOpacity 
                        key={column.id}
                        style={[headerStyle, headerWidthStyle]}
                        onPress={() => handleSort(column.key)}
                      >
                        <Text style={[styles.headerText, { 
                          textAlign: column.id === 'name' ? 'left' : 'center'
                        }]}>{column.label}</Text>
                        {sortConfig && sortConfig.key === column.key && (
                          <Text style={styles.sortIndicator}>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                }
              </View>
            )}
            <FlatList
              data={getSortedItems()}
              keyExtractor={(item) => item.code}
              renderItem={({ item, index }) => renderInventoryItem({ item, index })}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No inventory items found</Text>
                  <Text style={styles.emptySubtext}>Add your first item to get started</Text>
                </View>
              }
            />
          </>
        )}
        {showItemDetail && selectedItem && (
          <ItemDetailModal 
            item={selectedItem} 
            onClose={() => setShowItemDetail(false)}
            onEdit={() => {
              setShowItemDetail(false);
              onEditItem(selectedItem);
            }}
            onViewLogs={() => handleViewLogs(selectedItem)}
          />
        )}
        {showItemLog && selectedItem && (
          <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={showItemLog}
            onRequestClose={() => setShowItemLog(false)}
          >
            <ItemLogScreen
              itemCode={selectedItem.code}
              itemName={selectedItem.name}
              onBack={() => setShowItemLog(false)}
            />
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 30, // Menambahkan padding bawah agar tidak tertutup navbar android
  },
  controlsContainer: {
    flexDirection: 'column',
    paddingVertical: 0,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    gap: 1,
  },
  compactToggleSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 20,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  compactToggleButtonGroup: {
    flexDirection: 'row',
    gap: 3,
  },
  compactToggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactToggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  compactToggleButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  compactToggleButtonTextActive: {
    color: 'white',
  },
  compactEditModeSection: {
    paddingVertical: 3,
  },
  compactBatchActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactBatchActionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDeleteBatchButton: {
    backgroundColor: '#FF3B30',
  },
  compactBatchActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  compactCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  compactActionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 5,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  tableSearchContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchSectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    backgroundColor: 'white',
  },
  compactSelectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  compactSelectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  markerBottomRight: {
    bottom: 5,
    right: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginHorizontal: 5,
    borderRadius: 4,
    alignItems: 'center',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberHeaderCell: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCell: {
    width: 50,
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 3,
    alignItems: 'center',
  },
  nameHeaderCell: {
    flex: 2,
    minWidth: 100,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 5,
    alignItems: 'center',
  },
  stockHeaderCell: {
    width: 60,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 0,
    alignItems: 'center',
  },
  priceHeaderCell: {
    flex: 1,
    minWidth: 70,
    justifyContent: 'center',
    paddingLeft: 2,
    paddingRight: 5,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  sortIndicator: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#007AFF',
    marginLeft: 3,
  },
  headerToggleCell: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCheckboxCell: {
    width: 30,
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
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  }
});

export default InventoryManagement;