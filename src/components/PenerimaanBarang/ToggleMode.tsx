import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ToggleModeProps {
  usePO: boolean;
  manualMode: boolean;
  toggleUsePO: () => void;
  toggleManualMode: () => void;
}

const ToggleMode: React.FC<ToggleModeProps> = ({
  usePO,
  manualMode,
  toggleUsePO,
  toggleManualMode
}) => {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity 
        style={[styles.toggleButton, usePO && styles.toggleButtonActive]}
        onPress={toggleUsePO}
      >
        <Text style={[styles.toggleButtonText, usePO && styles.toggleButtonTextActive]}>
          Gunakan PO
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.toggleButton, manualMode && styles.toggleButtonActive]}
        onPress={toggleManualMode}
      >
        <Text style={[styles.toggleButtonText, manualMode && styles.toggleButtonTextActive]}>
          Manual
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
});

export default ToggleMode;