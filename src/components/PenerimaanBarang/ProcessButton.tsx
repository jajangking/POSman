import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ProcessButtonProps {
  isProcessing: boolean;
  handleProcess: () => void;
}

const ProcessButton: React.FC<ProcessButtonProps> = ({
  isProcessing,
  handleProcess
}) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
        onPress={handleProcess}
        disabled={isProcessing}
      >
        <Text style={styles.processButtonText}>
          {isProcessing ? 'Memproses...' : 'Proses Penerimaan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  processButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  processButtonDisabled: {
    backgroundColor: '#ccc',
  },
  processButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProcessButton;