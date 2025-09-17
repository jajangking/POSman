import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

interface BarangSusulan {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

interface BarangSusulanListProps {
  barangSusulan: BarangSusulan[];
  handleRemoveBarangSusulan: (id: string) => void;
}

const BarangSusulanList: React.FC<BarangSusulanListProps> = ({
  barangSusulan,
  handleRemoveBarangSusulan
}) => {
  // Render item barang susulan
  const renderBarangSusulan = ({ item }: { item: BarangSusulan }) => (
    <View style={styles.barangCard}>
      <View style={styles.barangHeader}>
        <View style={styles.barangInfo}>
          <Text style={styles.barangName}>{item.name}</Text>
          <Text style={styles.barangCode}>{item.code}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveBarangSusulan(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>Jumlah: {item.quantity}</Text>
      </View>
    </View>
  );

  return barangSusulan.length > 0 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Barang Susulan</Text>
      <FlatList
        data={barangSusulan}
        renderItem={renderBarangSusulan}
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
  removeButton: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default BarangSusulanList;