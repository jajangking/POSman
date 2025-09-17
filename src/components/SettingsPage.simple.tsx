import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../services/DatabaseService";
import BluetoothPrinterSetup from "./BluetoothPrinterSetup";

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
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
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await getStoreSettings();
        if (savedSettings) {
          setSettings({
            name: savedSettings.name,
            address: savedSettings.address,
            phone: savedSettings.phone,
            paperSize: savedSettings.paperSize,
            printAuto: savedSettings.printAuto,
            discountEnabled: savedSettings.discountEnabled,
            taxEnabled: savedSettings.taxEnabled,
            taxPercentage: savedSettings.taxPercentage,
            footerMessage: savedSettings.footerMessage,
            bluetoothDevice: savedSettings.bluetoothDevice
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Error', 'Failed to load settings');
      }
    };

    loadSettings();
  }, []);

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
      await updateStoreSettings(
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
      );
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handlePrinterConnected = (deviceId: string) => {
    setSettings({...settings, bluetoothDevice: deviceId});
  };

  const handlePrinterDisconnected = () => {
    setSettings({...settings, bluetoothDevice: ''});
  };

  return (
    <>
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
                  style={styles.input}
                  value={settings.address}
                  onChangeText={(text) => setSettings({...settings, address: text})}
                  placeholder="Enter store address"
                  multiline
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
                  <TouchableOpacity 
                    style={styles.scanButton} 
                    onPress={() => setShowPrinterSetup(true)}
                  >
                    <Text style={styles.scanButtonText}>Scan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={{ height: insets.bottom }} />
        </View>
      </SafeAreaView>
      
      {/* Bluetooth Printer Setup Modal */}
      <Modal
        visible={showPrinterSetup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BluetoothPrinterSetup 
          onPrinterConnected={handlePrinterConnected}
          onPrinterDisconnected={handlePrinterDisconnected}
          currentDeviceId={settings.bluetoothDevice}
        />
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowPrinterSetup(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
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
  modalFooter: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SettingsPage;