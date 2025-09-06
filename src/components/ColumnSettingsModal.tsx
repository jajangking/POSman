import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ColumnConfig {
  id: string;
  label: string;
  key: string;
  width: number;
  visible: boolean;
  order: number;
}

interface ColumnSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  columnConfigs: ColumnConfig[];
  onUpdateColumns: (columns: ColumnConfig[]) => void;
}

const COLUMN_STORAGE_KEY = 'inventory_column_config';

const defaultColumns: ColumnConfig[] = [
  { id: 'no', label: 'No', key: 'no', width: 30, visible: true, order: 0 },
  { id: 'code', label: 'Code', key: 'code', width: 50, visible: true, order: 1 },
  { id: 'name', label: 'Product Name', key: 'name', width: 70, visible: true, order: 2 },
  { id: 'stock', label: 'Stock', key: 'stock', width: 40, visible: true, order: 3 },
  { id: 'price', label: 'Price', key: 'price', width: 80, visible: true, order: 4 },
];

const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({ 
  visible, 
  onClose, 
  columnConfigs, 
  onUpdateColumns 
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(columnConfigs);

  const toggleColumnVisibility = (id: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    const index = columns.findIndex(col => col.id === id);
    if (index === -1) return;

    const newColumns = [...columns];
    if (direction === 'up' && index > 0) {
      [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
    } else if (direction === 'down' && index < newColumns.length - 1) {
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    }

    // Update order values
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }));

    setColumns(updatedColumns);
  };

  const saveSettings = async () => {
    onUpdateColumns(columns);
    try {
      await AsyncStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving column configuration:', error);
    }
    onClose();
  };

  const resetToDefault = async () => {
    setColumns(defaultColumns);
    onUpdateColumns(defaultColumns);
    try {
      await AsyncStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(defaultColumns));
    } catch (error) {
      console.error('Error resetting column configuration:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Column Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <View key={column.id} style={styles.columnItem}>
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => toggleColumnVisibility(column.id)}
                >
                  <View style={[styles.checkbox, column.visible && styles.checked]}>
                    {column.visible && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.columnLabel}>{column.label}</Text>
                
                <View style={styles.controls}>
                  <TouchableOpacity 
                    style={styles.moveButton}
                    onPress={() => moveColumn(column.id, 'up')}
                    disabled={column.order === 0}
                  >
                    <Text style={[styles.moveButtonText, column.order === 0 && styles.disabledButton]}>↑</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.moveButton}
                    onPress={() => moveColumn(column.id, 'down')}
                    disabled={column.order === columns.length - 1}
                  >
                    <Text style={[styles.moveButtonText, column.order === columns.length - 1 && styles.disabledButton]}>↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  visibilityToggle: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  columnLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
  },
  moveButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  moveButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  disabledButton: {
    color: '#ccc',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ColumnSettingsModal;