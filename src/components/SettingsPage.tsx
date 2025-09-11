import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    name: 'TOKO POSman',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '(021) 123-4567',
    paperSize: '80mm' as '80mm' | '58mm',
    printAuto: false,
    discountEnabled: false,
    taxEnabled: true,
    taxPercentage: 10.0,
    footerMessage: 'Terima kasih telah berbelanja di toko kami!',
    bluetoothDevice: ''
  });

  // For now, we're not loading settings from database since getStoreSettings is not available

  const handleSave = async () => {
    // Validate tax percentage
    if (settings.taxEnabled) {
      const taxPercent = parseFloat(settings.taxPercentage.toString());
      if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
        Alert.alert('Invalid Input', 'Tax percentage must be a number between 0 and 100');
        return;
      }
    }

    try {
      /* await updateStoreSettings(
        settings.name,
        settings.address,
        settings.phone,
        settings.paperSize,
        settings.printAuto,
        settings.discountEnabled,
        settings.taxEnabled,
        settings.taxPercentage,
        settings.footerMessage,
        settings.bluetoothDevice
      ); */
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleScanBluetooth = () => {
    // Placeholder for Bluetooth scanning functionality
    Alert.alert(
      'Bluetooth Scanner', 
      'In a real implementation, this would scan for available Bluetooth devices.\n\nFor now, you can manually enter a device ID.',
      [
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Store Settings</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Store Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name</Text>
              <TextInput
                style={styles.input}
                value={settings.name}
                onChangeText={(text) => setSettings({...settings, name: text})}
                placeholder="Enter store name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={settings.address}
                onChangeText={(text) => setSettings({...settings, address: text})}
                placeholder="Enter store address"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={settings.phone}
                onChangeText={(text) => setSettings({...settings, phone: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Receipt Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Paper Size</Text>
              <View style={styles.paperSizeContainer}>
                <TouchableOpacity 
                  style={[styles.paperSizeButton, settings.paperSize === '80mm' && styles.selectedPaperSize]}
                  onPress={() => setSettings({...settings, paperSize: '80mm'})}
                >
                  <Text style={[styles.paperSizeText, settings.paperSize === '80mm' && styles.selectedPaperSizeText]}>80mm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.paperSizeButton, settings.paperSize === '58mm' && styles.selectedPaperSize]}
                  onPress={() => setSettings({...settings, paperSize: '58mm'})}
                >
                  <Text style={[styles.paperSizeText, settings.paperSize === '58mm' && styles.selectedPaperSizeText]}>58mm</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Footer Message</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={settings.footerMessage}
                onChangeText={(text) => setSettings({...settings, footerMessage: text})}
                placeholder="Enter footer message"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Printing Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Printing Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Print</Text>
              <Switch
                value={settings.printAuto}
                onValueChange={(value) => setSettings({...settings, printAuto: value})}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Bluetooth Device</Text>
              <View style={styles.bluetoothContainer}>
                <TextInput
                  style={[styles.input, styles.bluetoothInput]}
                  value={settings.bluetoothDevice || ''}
                  onChangeText={(text) => setSettings({...settings, bluetoothDevice: text})}
                  placeholder="Enter Bluetooth device ID"
                />
                <TouchableOpacity style={styles.scanButton} onPress={handleScanBluetooth}>
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Discount Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Discount Enabled</Text>
              <Switch
                value={settings.discountEnabled}
                onValueChange={(value) => setSettings({...settings, discountEnabled: value})}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.manageButton} 
              onPress={() => Alert.alert(
                'Advanced Discount Management', 
                'For advanced discount rules and management, please go to Discount Management from the main dashboard.',
                [{ text: 'OK' }]
              )}
            >
              <Text style={styles.manageButtonText}>Manage Discount Rules →</Text>
            </TouchableOpacity>
          </View>

          {/* Tax Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Tax Enabled</Text>
              <Switch
                value={settings.taxEnabled}
                onValueChange={(value) => setSettings({...settings, taxEnabled: value})}
              />
            </View>
            
            {settings.taxEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tax Percentage</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={settings.taxPercentage.toString()}
                    onChangeText={(text) => setSettings({...settings, taxPercentage: parseFloat(text) || 0})}
                    keyboardType="numeric"
                    placeholder="Enter tax percentage"
                  />
                  <Text style={styles.percentSign}>%</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentSign: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paperSizeContainer: {
    flexDirection: 'row',
  },
  paperSizeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedPaperSize: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paperSizeText: {
    color: '#333',
    fontSize: 14,
  },
  selectedPaperSizeText: {
    color: 'white',
  },
  bluetoothContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bluetoothInput: {
    flex: 1,
    marginRight: 10,
  },
  scanButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  manageButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  manageButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SettingsPage;