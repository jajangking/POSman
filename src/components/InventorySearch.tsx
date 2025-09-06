import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ScannerModal from './ScannerModal';

interface InventorySearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const InventorySearch: React.FC<InventorySearchProps> = ({ onSearch, placeholder = 'Search by name, code, or category...' }) => {
  const [query, setQuery] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const prevQuery = useRef('');

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    setQuery(barcode);
    setScannerVisible(false);
    // For barcode scanning, search immediately
    onSearch(barcode);
  };

  // Smart search - trigger search on every keystroke
  useEffect(() => {
    // Prevent duplicate searches
    if (query === prevQuery.current) {
      return;
    }
    
    prevQuery.current = query;
    
    // If this looks like a barcode, search immediately
    const isBarcode = /^\d+$/.test(query);
    if (isBarcode) {
      onSearch(query);
      return;
    }
    
    const delayDebounce = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce for 300ms to avoid too many requests

    return () => clearTimeout(delayDebounce);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
        <Text style={styles.scanButtonText}>Scan</Text>
      </TouchableOpacity>
      
      <ScannerModal
        visible={scannerVisible}
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setScannerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#999',
  },
  scanButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 5,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default InventorySearch;