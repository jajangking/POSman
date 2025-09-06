import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InventoryManagement from './InventoryManagement';
import InventoryForm from './InventoryForm';
import { InventoryItem } from '../models/Inventory';

interface InventoryScreenProps {
  onBack?: () => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ onBack }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);

  const handleAddItem = () => {
    setSelectedItem(undefined);
    setView('form');
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setView('form');
  };

  const handleSave = () => {
    setView('list');
  };

  const handleCancel = () => {
    setView('list');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {onBack && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              if (view === 'form') {
                // Check if there are unsaved changes
                Alert.alert(
                  'Unsaved Changes',
                  'You have unsaved changes. Are you sure you want to go back?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go Back', style: 'destructive', onPress: () => setView('list') }
                  ]
                );
              } else {
                onBack && onBack();
              }
            }}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Inventory Management</Text>
            {view === 'list' ? (
              <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Text style={styles.addButtonText}>+ Add Item</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} /> // Placeholder untuk menjaga keseimbangan layout
            )}
          </View>
        )}
        
        {view === 'list' ? (
          <InventoryManagement 
            onAddItem={handleAddItem} 
            onEditItem={handleEditItem} 
          />
        ) : (
          <InventoryForm 
            item={selectedItem} 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1, // Memastikan title tidak mengganggu interaksi tombol
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
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
  placeholder: {
    minWidth: 90, // Placeholder dengan ukuran yang sama dengan tombol Add Item
  },
});

export default InventoryScreen;