import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated, Dimensions, PanResponderInstance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define column types
export interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  order: number;
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

const COLUMN_STORAGE_KEY = 'inventory_column_config';

const ColumnManager: React.FC<ColumnManagerProps> = ({ columns, onColumnsChange }) => {
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(columns);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);

  // Load saved column configuration
  useEffect(() => {
    loadColumnConfig();
  }, []);

  // Save column configuration when it changes
  useEffect(() => {
    onColumnsChange(columnConfigs);
    saveColumnConfig();
  }, [columnConfigs]);

  const loadColumnConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(COLUMN_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setColumnConfigs(parsedConfig);
      }
    } catch (error) {
      console.error('Error loading column configuration:', error);
    }
  };

  const saveColumnConfig = async () => {
    try {
      await AsyncStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnConfigs));
    } catch (error) {
      console.error('Error saving column configuration:', error);
    }
  };

  const resetToDefault = () => {
    setColumnConfigs(columns);
  };

  const toggleColumnVisibility = (id: string) => {
    setColumnConfigs(prev => 
      prev.map(col => 
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    const index = columnConfigs.findIndex(col => col.id === id);
    if (index === -1) return;

    const newColumnConfigs = [...columnConfigs];
    if (direction === 'up' && index > 0) {
      [newColumnConfigs[index], newColumnConfigs[index - 1]] = [newColumnConfigs[index - 1], newColumnConfigs[index]];
    } else if (direction === 'down' && index < newColumnConfigs.length - 1) {
      [newColumnConfigs[index], newColumnConfigs[index + 1]] = [newColumnConfigs[index + 1], newColumnConfigs[index]];
    }

    // Update order values
    const updatedColumns = newColumnConfigs.map((col, idx) => ({
      ...col,
      order: idx
    }));

    setColumnConfigs(updatedColumns);
  };

  const updateColumnWidth = (id: string, newWidth: number) => {
    setColumnConfigs(prev => 
      prev.map(col => 
        col.id === id ? { ...col, width: Math.max(30, newWidth) } : col
      )
    );
  };

  const renderColumnItem = (column: ColumnConfig, index: number) => {
    return (
      <View key={column.id} style={styles.columnItem}>
        <TouchableOpacity 
          style={styles.columnToggle}
          onPress={() => toggleColumnVisibility(column.id)}
        >
          <View style={[styles.visibilityIndicator, column.visible && styles.visibleIndicator]} />
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
            disabled={column.order === columnConfigs.length - 1}
          >
            <Text style={[styles.moveButtonText, column.order === columnConfigs.length - 1 && styles.disabledButton]}>↓</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Column Settings</Text>
        <TouchableOpacity onPress={resetToDefault} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.columnList}>
        {columnConfigs
          .sort((a, b) => a.order - b.order)
          .map((column, index) => renderColumnItem(column, index))
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  columnList: {
    gap: 10,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  columnToggle: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibleIndicator: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
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
  widthAdjuster: {
    padding: 5,
  },
  adjusterText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ColumnManager;
export { COLUMN_STORAGE_KEY };