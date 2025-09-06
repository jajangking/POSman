import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import BarcodeScanner from './BarcodeScanner';

interface ScannerModalProps {
  visible: boolean;
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ visible, onBarcodeScanned, onClose }) => {
  const handleBarcodeScanned = (barcode: string) => {
    onBarcodeScanned(barcode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BarcodeScanner 
          onBarcodeScanned={handleBarcodeScanned} 
          onClose={onClose} 
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScannerModal;