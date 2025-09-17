import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { SettingsData } from '../../models/StoreSettings';

interface StoreInfoTabProps {
  settings: SettingsData;
  onSettingsChange: (settings: SettingsData) => void;
}

const StoreInfoTab: React.FC<StoreInfoTabProps> = ({ settings, onSettingsChange }) => {
  return (
    <View>
      {/* Store Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            value={settings.name}
            onChangeText={(text) => onSettingsChange({ ...settings, name: text })}
            placeholder="Enter store name"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={settings.address}
            onChangeText={(text) => onSettingsChange({ ...settings, address: text })}
            placeholder="Enter store address"
            multiline
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={settings.phone}
            onChangeText={(text) => onSettingsChange({ ...settings, phone: text })}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>
        {/* Paper Size Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paper Size</Text>
          <View style={styles.paperSizeContainer}>
            <TouchableOpacity
              style={[
                styles.paperSizeButton,
                settings.paperSize === "58mm" && styles.selectedPaperSize,
              ]}
              onPress={() => onSettingsChange({ ...settings, paperSize: "58mm" })}
            >
              <Text
                style={[
                  styles.paperSizeText,
                  settings.paperSize === "58mm" && styles.selectedPaperSizeText,
                ]}
              >
                58mm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paperSizeButton,
                settings.paperSize === "80mm" && styles.selectedPaperSize,
              ]}
              onPress={() => onSettingsChange({ ...settings, paperSize: "80mm" })}
            >
              <Text
                style={[
                  styles.paperSizeText,
                  settings.paperSize === "80mm" && styles.selectedPaperSizeText,
                ]}
              >
                80mm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Receipt Footer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipt Footer</Text>
        <TextInput
          style={[styles.input, styles.footerInput]}
          value={settings.footerMessage}
          onChangeText={(text) =>
            onSettingsChange({ ...settings, footerMessage: text })
          }
          placeholder="Enter footer message"
          multiline
        />
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
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  paperSizeContainer: {
    flexDirection: "row",
  },
  paperSizeButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedPaperSize: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  paperSizeText: {
    color: "#333",
    fontSize: 14,
  },
  selectedPaperSizeText: {
    color: "white",
  },
  footerInput: {
    height: 80,
    textAlignVertical: "top",
  },
});

export default StoreInfoTab;