import React from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SettingsData } from '../../models/StoreSettings';

interface DiscountTaxTabProps {
  settings: SettingsData;
  onSettingsChange: (settings: SettingsData) => void;
}

const DiscountTaxTab: React.FC<DiscountTaxTabProps> = ({ settings, onSettingsChange }) => {
  return (
    <View>
      {/* Discount Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discount Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Discount Enabled</Text>
          <Switch
            value={settings.discountEnabled}
            onValueChange={(value) =>
              onSettingsChange({ ...settings, discountEnabled: value })
            }
          />
        </View>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() =>
            Alert.alert(
              "Advanced Discount Management",
              "For advanced discount rules and management, please go to Discount Management from the main dashboard.",
              [{ text: "OK" }],
            )
          }
        >
          <Text style={styles.manageButtonText}>
            Manage Discount Rules →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tax Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Tax Enabled</Text>
          <Switch
            value={settings.taxEnabled}
            onValueChange={(value) =>
              onSettingsChange({ ...settings, taxEnabled: value })
            }
          />
        </View>
        {settings.taxEnabled && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tax Percentage</Text>
            <View style={styles.taxInputContainer}>
              <TextInput
                style={styles.input}
                value={settings.taxPercentage?.toString() || "10.0"}
                onChangeText={(text) => {
                  const value = parseFloat(text);
                  onSettingsChange({
                    ...settings,
                    taxPercentage: isNaN(value) ? 10.0 : value,
                  });
                }}
                keyboardType="numeric"
                placeholder="Enter tax percentage"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
        )}
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
    flex: 1,
  },
  taxInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentSign: {
    marginLeft: 5,
    fontSize: 16,
    color: "#333",
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

export default DiscountTaxTab;