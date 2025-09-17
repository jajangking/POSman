import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';

interface PO {
  id: string;
  poNumber: string;
  date: string;
  supplier: string;
}

interface POSelectionProps {
  usePO: boolean;
  poNumber: string;
  setPoNumber: (poNumber: string) => void;
  isLoadingPO: boolean;
  setIsLoadingPO: (isLoading: boolean) => void;
  setShowPOList: (show: boolean) => void;
  fetchPOData: (poNumber: string) => void;
  fetchAvailablePOs: () => void;
  availablePOs: any[];
  showPOList: boolean;
}

const POSelection: React.FC<POSelectionProps> = ({
  usePO,
  poNumber,
  setPoNumber,
  isLoadingPO,
  setIsLoadingPO,
  setShowPOList,
  fetchPOData,
  fetchAvailablePOs,
  availablePOs,
  showPOList
}) => {
  const handleSelectPO = (po: any) => {
    setPoNumber(po.poNumber);
    setShowPOList(false);
    fetchPOData(po.poNumber);
  };

  return usePO ? (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Informasi PO</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>No. PO</Text>
        <View style={styles.poInputContainer}>
          <TouchableOpacity 
            style={[styles.input, styles.poInput]}
            onPress={() => {
              setShowPOList(true);
              fetchAvailablePOs();
            }}
          >
            <Text style={poNumber ? styles.poNumberText : styles.poPlaceholderText}>
              {poNumber || "Pilih dari daftar PO"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fetchButton, isLoadingPO && styles.fetchButtonDisabled]}
            onPress={() => {
              if (poNumber) {
                fetchPOData(poNumber);
              } else {
                Alert.alert('Error', 'Pilih nomor PO terlebih dahulu');
              }
            }}
            disabled={isLoadingPO}
          >
            <Text style={styles.fetchButtonText}>
              {isLoadingPO ? 'Loading...' : 'Ambil'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Daftar PO yang tersedia */}
      {showPOList && (
        <View style={styles.poListContainer}>
          <View style={styles.poListHeader}>
            <Text style={styles.poListTitle}>Daftar PO Tersedia</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPOList(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingPO ? (
            <View style={styles.loadingContainer}>
              <Text>Loading daftar PO...</Text>
            </View>
          ) : (
            <FlatList
              data={availablePOs}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.poItem}
                  onPress={() => handleSelectPO(item)}
                >
                  <View style={styles.poItemHeader}>
                    <Text style={styles.poItemNumber}>{item.poNumber}</Text>
                    <Text style={styles.poItemDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.poItemSupplier}>Supplier: {item.supplier}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.poList}
            />
          )}
        </View>
      )}
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  poInputContainer: {
    flexDirection: 'row',
  },
  poInput: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  poPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  poNumberText: {
    fontSize: 16,
    color: '#333',
  },
  fetchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  fetchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  fetchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  poListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    maxHeight: 300,
  },
  poListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  poListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poList: {
    maxHeight: 200,
  },
  poItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  poItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  poItemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  poItemDate: {
    fontSize: 14,
    color: '#666',
  },
  poItemSupplier: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  }
});

export default POSelection;