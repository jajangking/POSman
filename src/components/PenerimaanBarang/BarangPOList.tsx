import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

interface BarangPO {
  id: string;
  code: string;
  name: string;
  quantityOrdered: number;
  quantityReceived: number;
  isChecked: boolean;
}

interface BarangPOListProps {
  barangPO: BarangPO[];
  toggleBarangPOCheck: (id: string) => void;
  handleQuantityReceivedChange: (id: string, value: string) => void;
}

const BarangPOList: React.FC<BarangPOListProps> = ({
  barangPO,
  toggleBarangPOCheck,
  handleQuantityReceivedChange
}) => {
  // Render item barang PO
  const renderBarangPO = ({ item }: { item: BarangPO }) => (
    <View style={styles.barangCard}>
      <View style={styles.barangHeader}>
        <TouchableOpacity 
          style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}
          onPress={() => toggleBarangPOCheck(item.id)}
        >
          {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.barangInfo}>
          <Text style={styles.barangName}>{item.name}</Text>
          <Text style={styles.barangCode}>{item.code}</Text>
        </View>
      </View>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>Dipesan: {item.quantityOrdered}</Text>
        <View style={styles.quantityInputContainer}>
          <Text style={styles.quantityInputLabel}>Diterima:</Text>
          <View style={styles.quantityInputWrapper}>
            <Text style={styles.quantityValue}>{item.quantityReceived}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return barangPO.length > 0 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Daftar Barang PO</Text>
      <FlatList
        data={barangPO}
        renderItem={renderBarangPO}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  barangCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  barangHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  barangInfo: {
    flex: 1,
  },
  barangName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  barangCode: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInputLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  quantityInputWrapper: {
    width: 60,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  quantityValue: {
    fontSize: 14,
    color: '#333',
  },
});

export default BarangPOList;