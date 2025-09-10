import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface FunctionButtonsProps {
  handleShowInventoryList: () => void;
  setShowCalculator: (show: boolean) => void;
  onNavigateToMemberManagement: () => void;
  onOpenSettings?: () => void; // Make onOpenSettings optional
}

const FunctionButtons: React.FC<FunctionButtonsProps> = ({
  handleShowInventoryList,
  setShowCalculator,
  onNavigateToMemberManagement,
  onOpenSettings
}) => {
  const handleInventoryListPress = () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin membuka daftar barang?',
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Ya',
          onPress: handleShowInventoryList
        }
      ]
    );
  };

  const handleSettingsPress = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      // Fallback if onOpenSettings is not provided
      Alert.alert('Settings', 'Settings feature is not available in this context');
    }
  };

  return (
    <View style={styles.functionButtons}>
      <TouchableOpacity style={[styles.functionButton, styles.inventoryButton]} onPress={handleInventoryListPress}>
        <Text style={[styles.functionButtonText, styles.inventoryButtonText]}>F1</Text>
        <Text style={[styles.functionButtonLabel, styles.inventoryButtonLabel]}>Daftar Barang</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.functionButton, styles.calculatorButton]} onPress={() => setShowCalculator(true)}>
        <Text style={[styles.functionButtonText, styles.calculatorButtonText]}>F2</Text>
        <Text style={[styles.functionButtonLabel, styles.calculatorButtonLabel]}>Kalkulator</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.functionButton, styles.memberButton]} onPress={onNavigateToMemberManagement}>
        <Text style={[styles.functionButtonText, styles.memberButtonText]}>F3</Text>
        <Text style={[styles.functionButtonLabel, styles.memberButtonLabel]}>Member</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.functionButton, styles.holdButton]} onPress={handleSettingsPress}>
        <Text style={[styles.functionButtonText, styles.holdButtonText]}>F4</Text>
        <Text style={[styles.functionButtonLabel, styles.holdButtonLabel]}>Setting</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  functionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    marginBottom: 10,
  },
  functionButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  functionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // F1 - Inventory Button
  inventoryButton: {
    backgroundColor: '#007AFF',
  },
  inventoryButtonText: {
    color: 'white',
  },
  inventoryButtonLabel: {
    color: 'white',
  },
  // F2 - Calculator Button
  calculatorButton: {
    backgroundColor: '#34C759',
  },
  calculatorButtonText: {
    color: 'white',
  },
  calculatorButtonLabel: {
    color: 'white',
  },
  // F3 - Member Button
  memberButton: {
    backgroundColor: '#FF9500',
  },
  memberButtonText: {
    color: 'white',
  },
  memberButtonLabel: {
    color: 'white',
  },
  // F4 - Hold Button (now Settings)
  holdButton: {
    backgroundColor: '#5856D6',
  },
  holdButtonText: {
    color: 'white',
  },
  holdButtonLabel: {
    color: 'white',
  },
  functionButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default FunctionButtons;