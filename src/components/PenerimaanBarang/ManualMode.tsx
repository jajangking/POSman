import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ManualModeProps {
  manualMode: boolean;
}

const ManualMode: React.FC<ManualModeProps> = ({ manualMode }) => {
  return manualMode ? (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Mode Manual</Text>
      <Text style={styles.infoText}>
        Anda akan menambahkan barang secara manual tanpa mengacu pada PO.
      </Text>
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
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default ManualMode;