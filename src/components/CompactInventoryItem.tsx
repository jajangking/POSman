import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InventoryItem, formatRupiah } from '../models/Inventory';

// Define column configuration interface
interface ColumnConfig {
  id: string;
  label: string;
  key: string;
  width: number;
  visible: boolean;
  order: number;
}

interface CompactInventoryItemProps {
  item: InventoryItem;
  index: number;
  isSelected?: boolean;
  onSelect?: (code: string, selected: boolean) => void;
  onItemPress?: (item: InventoryItem) => void;
  editMode?: boolean;
  columnConfigs: ColumnConfig[];
}

const CompactInventoryItem: React.FC<CompactInventoryItemProps> = ({ 
  item, 
  index, 
  isSelected = false, 
  onSelect,
  onItemPress,
  editMode = false,
  columnConfigs
}) => {
  const handleSelect = () => {
    if (editMode && onSelect) {
      onSelect(item.code, !isSelected);
    }
  };

  // Get 5 letters for category display
  const getCategoryInitials = (category: string): string => {
    if (!category) return '-';
    
    // Remove extra spaces and get clean category name
    const cleanCategory = category.trim();
    
    // If category is 5 characters or less, use it as is
    if (cleanCategory.length <= 5) {
      return cleanCategory.toUpperCase();
    }
    
    // Split into words
    const words = cleanCategory.split(' ').filter(word => word.length > 0);
    
    // If single word, take first 5 letters
    if (words.length === 1) {
      return words[0].substring(0, 5).toUpperCase();
    }
    
    // If multiple words, try to get initials
    let result = '';
    
    // Take first letter of up to 5 words
    for (let i = 0; i < Math.min(5, words.length); i++) {
      if (words[i].length > 0) {
        result += words[i][0];
      }
    }
    
    // If we still don't have 5 characters, pad with letters from first word
    if (result.length < 5) {
      const firstWord = words[0];
      for (let i = result.length; i < 5 && i < firstWord.length; i++) {
        result += firstWord[i];
      }
    }
    
    return result.substring(0, 5).toUpperCase();
  };

  const renderCell = (column: ColumnConfig) => {
    if (!column.visible) return null;

    // Determine style based on column id and whether it uses flex
    let cellStyle = {};
    if (column.width > 0) {
      cellStyle = { width: column.width };
    } else {
      // For flex columns (width = 0), use flex properties
      if (column.id === 'name') {
        cellStyle = { flex: 2, minWidth: 80 };
      } else if (column.id === 'price') {
        cellStyle = { flex: 1, minWidth: 70 };
      }
    }

    switch (column.id) {
      case 'no':
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.numberCell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={[styles.text, { textAlign: 'center' }]}>{index + 1}</Text>
          </TouchableOpacity>
        );
      case 'code':
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.codeCell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={[styles.text, { textAlign: 'center' }]}>{item.code}</Text>
          </TouchableOpacity>
        );
      case 'name':
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.nameCell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={[styles.text, { textAlign: 'left' }]} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        );
      case 'stock':
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.stockCell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={[styles.text, { textAlign: 'center' }]} numberOfLines={1}>{item.quantity}</Text>
          </TouchableOpacity>
        );
      case 'price':
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.priceCell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={[styles.text, { textAlign: 'right' }]}>{formatRupiah(item.price)}</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity 
            key={column.id}
            style={[styles.cell, cellStyle]}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <Text style={styles.text}>-</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      {editMode ? (
        <TouchableOpacity style={styles.checkboxCell} onPress={handleSelect}>
          <View style={[styles.checkbox, isSelected && styles.checked]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      ) : null}
      
      {columnConfigs
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order)
        .map(column => renderCell(column))
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 5,
    marginVertical: 1,
    borderRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    paddingHorizontal: 3,
    paddingVertical: 6,
    alignItems: 'center',
  },
  cell: {
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 1,
    paddingRight: 0,
  },
  checkboxCell: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
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
  numberCell: {
    width: 30,
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 0,
    alignItems: 'center',
  },
  codeCell: {
    width: 50,
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 8,
    paddingRight: 3,
    alignItems: 'center',
  },
  nameCell: {
    flex: 2,
    minWidth: 100,
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 20,
    paddingRight: 5,
  },
  stockCell: {
    width: 60,
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 20,
    paddingRight: 0,
    alignItems: 'center',
  },
  priceCell: {
    flex: 1,
    minWidth: 70,
    justifyContent: 'center',
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 5,
    alignItems: 'flex-end',
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
});

export default CompactInventoryItem;