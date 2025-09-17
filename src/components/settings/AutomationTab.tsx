import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SettingsData } from '../../models/StoreSettings';

interface AutomationTabProps {
  settings: SettingsData;
  onSettingsChange: (settings: SettingsData) => void;
}

const AutomationTab: React.FC<AutomationTabProps> = ({ settings, onSettingsChange }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>PO Automation</Text>
      <TouchableOpacity 
        style={styles.manageButton}
        onPress={() => {
          // We'll implement navigation to PO automation settings later
          Alert.alert('PO Automation', 'Configure automatic purchase order generation settings');
        }}
      >
        <Text style={styles.manageButtonText}>
          Configure PO Automation →
        </Text>
      </TouchableOpacity>
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
  manageButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  manageButtonText: {
    color: "#007AFF",
    fontWeight: "500",
  },
});

export default AutomationTab;