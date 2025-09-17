import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, BackHandler, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InventoryManagement from './InventoryManagement';
import InventoryForm from './InventoryForm';
import ItemLogScreen from './ItemLogScreen';
import CategoryManagement from './CategoryManagement';
import { InventoryItem } from '../models/Inventory';

interface InventoryScreenProps {
  onBack?: () => void;
  onNavigateToItemLog?: (itemCode: string, itemName: string) => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ onBack, onNavigateToItemLog }) => {
  const [view, setView] = useState<'list' | 'form' | 'log'>('list');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'form') {
        // Check if there are unsaved changes
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Go Back', style: 'destructive', onPress: () => setView('list') }
          ]
        );
        return true; // Prevent default back behavior
      } else {
        // For list or log view, let the parent handle it
        if (onBack) {
          onBack();
          return true;
        }
        return false; // Use default back behavior
      }
    });

    return () => backHandler.remove();
  }, [view, onBack]);

  const handleAddItem = () => {
    setSelectedItem(undefined);
    setView('form');
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setView('form');
  };

  const handleViewItemLog = (item: InventoryItem) => {
    // If onNavigateToItemLog is provided, use it to navigate to the global ItemLogScreen
    if (onNavigateToItemLog) {
      onNavigateToItemLog(item.code, item.name);
    } else {
      // Otherwise, use the internal navigation
      setSelectedItem(item);
      setView('log');
    }
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
            ) : view === 'form' ? (
              <TouchableOpacity 
                style={styles.categoryButton} 
                onPress={() => {
                  console.log('Category button pressed');
                  setShowCategoryManagement(true);
                }}
              >
                <Text style={styles.categoryButtonText}>Categories</Text>
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
            onViewItemLog={handleViewItemLog}
          />
        ) : view === 'form' ? (
          <InventoryForm 
            item={selectedItem} 
            onSave={handleSave} 
            onCancel={handleCancel} 
            onShowCategoryManagement={() => setShowCategoryManagement(true)}
          />
        ) : view === 'log' && selectedItem ? (
          <ItemLogScreen
            itemCode={selectedItem.code}
            itemName={selectedItem.name}
            onBack={() => setView('list')}
          />
        ) : null}
        
        <Modal
          animationType="slide"
          transparent={false} // Mengubah menjadi false agar menutupi layar penuh
          visible={showCategoryManagement}
          onRequestClose={() => {
            console.log('Modal onRequestClose triggered');
            setShowCategoryManagement(false);
          }}
        >
          <View style={styles.fullScreenModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Categories</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => {
                  console.log('Modal close button pressed');
                  setShowCategoryManagement(false);
                }}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            {showCategoryManagement ? <CategoryManagement /> : null}
          </View>
        </Modal>
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
  categoryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007AFF',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default InventoryScreen;