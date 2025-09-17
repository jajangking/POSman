import React, { useState } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SettingsData } from '../../models/StoreSettings';

interface PrintingTabProps {
  settings: SettingsData;
  onSettingsChange: (settings: SettingsData) => void;
  onShowPrinterSetup: () => void;
}

const PrintingTab: React.FC<PrintingTabProps> = ({ 
  settings, 
  onSettingsChange,
  onShowPrinterSetup
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Printing Settings</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Auto Print</Text>
        <Switch
          value={settings.printAuto}
          onValueChange={(value) => onSettingsChange({...settings, printAuto: value})}
        />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Bluetooth Device</Text>
        <View style={styles.bluetoothContainer}>
          <TextInput
            style={[styles.input, styles.bluetoothInput]}
            value={settings.bluetoothDevice || ''}
            onChangeText={(text) => onSettingsChange({...settings, bluetoothDevice: text})}
            placeholder="Enter Bluetooth device ID"
          />
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={onShowPrinterSetup}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  bluetoothContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  bluetoothInput: {
    flex: 1,
    marginRight: 10,
    minWidth: 100,
  },
  scanButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default PrintingTab;