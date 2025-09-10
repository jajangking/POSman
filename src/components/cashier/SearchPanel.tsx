import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface SearchPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSearchChange: (query: string) => void;
  handleAdd: () => void;
  handleScan: () => void;
  setActiveInput: (input: 'search' | 'qty' | null) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  inputText,
  setInputText,
  handleSearchChange,
  handleAdd,
  handleScan,
  setActiveInput
}) => {
  const searchInputRef = useRef<TextInput>(null);

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Enter item code / barcode / name"
          value={inputText}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleAdd}
          onFocus={() => setActiveInput('search')}
        />
        <TouchableOpacity style={[styles.primaryButton, styles.scanButton]} onPress={handleScan}>
          <Text style={styles.buttonText}>SCAN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, styles.addButton]} onPress={handleAdd}>
          <Text style={styles.buttonText}>ADD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    padding: 15,
    paddingTop: 5,
    paddingBottom: 5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flex: 1,
    marginRight: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginRight: 10,
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  addButton: {
    backgroundColor: '#34C759',
    marginRight: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchPanel;