import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Step1 from './PenerimaanBarang/Step1';
import Step2 from './PenerimaanBarang/Step2';
import { getAllInventoryItems, getInventoryItemByCode, updateInventoryItem, createInventoryTransaction } from '../services/DatabaseService';
import { updatePurchaseRequestStatus } from '../services/DatabaseService';
import { InventoryItem } from '../models/Inventory';
import { saveAutomaticPOSession, saveLastView } from '../services/AutomaticPOSessionService';

interface BarangPO {
  id: string;
  code: string;
  sku: string;
  name: string;
  quantityOrdered: number;
  quantityReceived: number;
  newCost: number;
  isChecked: boolean;
  hasIssue: boolean;
  issueNote: string;
}

interface PenerimaanBarangScreenProps {
  onBack: () => void;
}

const PenerimaanBarangScreen: React.FC<PenerimaanBarangScreenProps> = ({ onBack }) => {
  // State for step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for PO/manual selection
  const [usePO, setUsePO] = useState(true);
  const [poNumber, setPoNumber] = useState('');
  
  // State for barang PO
  const [barangPO, setBarangPO] = useState<BarangPO[]>([]);
  
  // State for processing
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle Android back button
  useEffect(() => {
    // Save session when component mounts
    saveAutomaticPOSession({ lastView: 'penerimaanBarang' });
    saveLastView('penerimaanBarang');
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep === 1) {
        // If on step 1, confirm exit
        Alert.alert(
          'Konfirmasi',
          'Apakah Anda yakin ingin keluar dari halaman penerimaan barang?',
          [
            {
              text: 'Batal',
              onPress: () => {},
              style: 'cancel'
            },
            {
              text: 'Keluar',
              onPress: () => onBack()
            }
          ]
        );
      } else {
        // If on step 2, go back to step 1
        setCurrentStep(1);
      }
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [currentStep]);

  // Handle process
  const handleProcess = async () => {
    setIsProcessing(true);
    
    try {
      // Validate input
      if (usePO && !poNumber) {
        Alert.alert('Error', 'Pilih nomor PO terlebih dahulu');
        setIsProcessing(false);
        return;
      }
      
      const checkedItems = barangPO.filter(item => item.isChecked);
      if (checkedItems.length === 0) {
        Alert.alert('Error', 'Centang minimal satu barang untuk diproses');
        setIsProcessing(false);
        return;
      }
      
      // Check for items with issues
      const itemsWithIssues = checkedItems.filter(item => item.hasIssue);
      if (itemsWithIssues.length > 0) {
        const issueDetails = itemsWithIssues.map(item => 
          `${item.name} (${item.code}): ${item.issueNote || 'Tidak ada catatan'}`
        ).join('\n');
        
        Alert.alert(
          'Barang Bermasalah',
          `Ada ${itemsWithIssues.length} barang yang bermasalah:\n${issueDetails}\n\nApakah Anda yakin ingin melanjutkan proses penerimaan?`,
          [
            { text: 'Batal', onPress: () => setIsProcessing(false) },
            { 
              text: 'Lanjutkan', 
              onPress: () => processReceipt()
            }
          ]
        );
        return;
      }
      
      // Process normally
      processReceipt();
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Gagal memproses penerimaan barang');
      setIsProcessing(false);
    }
  };
  
  // Actual processing function
  const processReceipt = async () => {
    try {
      // Process each checked item
      const checkedItems = barangPO.filter(item => item.isChecked);
      
      for (const item of checkedItems) {
        try {
          // Get current item from database
          const currentItem = await getInventoryItemByCode(item.code);
          
          if (currentItem) {
            // Calculate new quantity
            const quantityToAdd = item.hasIssue ? item.quantityReceived : item.quantityOrdered;
            const newQuantity = currentItem.quantity + quantityToAdd;
            
            // Update inventory item
            await updateInventoryItem(currentItem.code, {
              cost: item.newCost || currentItem.cost, // Use new cost if provided
              quantity: newQuantity,
              updatedAt: new Date()
            });
            
            // Add inventory transaction
            await createInventoryTransaction({
              itemCode: item.code,
              type: 'in',
              quantity: quantityToAdd,
              price: item.newCost,
              reason: usePO ? `Penerimaan PO ${poNumber}` : 'Penerimaan Manual',
              reference: usePO ? poNumber : 'Manual',
              createdBy: 'System'
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item.code}:`, error);
          // Continue with other items even if one fails
        }
      }
      
      // Mark PO as processed (in a real implementation, you would update the PO status in database)
      if (usePO && poNumber) {
        try {
          await updatePurchaseRequestStatus(poNumber, 'processed');
        } catch (error) {
          console.error('Error updating PO status:', error);
        }
      }
      
      const poStatusMessage = usePO ? `PO ${poNumber} telah diproses` : 'Penerimaan manual telah diproses';
      
      Alert.alert(
        'Sukses',
        `Penerimaan barang berhasil diproses\n${poStatusMessage}`,
        [{ text: 'OK', onPress: () => {
          setIsProcessing(false);
          onBack();
        }}]
      );
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Gagal memproses penerimaan barang');
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              Alert.alert(
                'Konfirmasi',
                'Apakah Anda yakin ingin keluar dari halaman penerimaan barang?',
                [
                  {
                    text: 'Batal',
                    onPress: () => {},
                    style: 'cancel'
                  },
                  {
                    text: 'Keluar',
                    onPress: () => onBack()
                  }
                ]
              );
            }}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Penerimaan Barang</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {currentStep === 1 && (
          <Step1
            usePO={usePO}
            setUsePO={setUsePO}
            poNumber={poNumber}
            setPoNumber={setPoNumber}
            setBarangPO={setBarangPO}
            setCurrentStep={setCurrentStep}
          />
        )}
        
        {currentStep === 2 && (
          <Step2
            usePO={usePO}
            poNumber={poNumber}
            barangPO={barangPO}
            setBarangPO={setBarangPO}
            setCurrentStep={setCurrentStep}
            handleProcess={handleProcess}
            isProcessing={isProcessing}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PenerimaanBarangScreen;