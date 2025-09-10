import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  paperSize: '58mm' | '80mm';
  printAuto: boolean;
  discountEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  footerMessage: string;
  bluetoothDevice?: string;
}

interface StoreSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  visible,
  onClose
}) => {
  const [name, setName] = useState('TOKO POSman');
  const [address, setAddress] = useState('Jl. Contoh No. 123, Jakarta');
  const [phone, setPhone] = useState('(021) 123-4567');
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('80mm');
  const [printAuto, setPrintAuto] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState('10.0');
  const [footerMessage, setFooterMessage] = useState('Terima kasih telah berbelanja di toko kami!');
  const [bluetoothDevice, setBluetoothDevice] = useState('');

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // For now, we'll use default settings since getStoreSettings is not available
        setName('TOKO POSman');
        setAddress('Jl. Contoh No. 123, Jakarta');
        setPhone('(021) 123-4567');
        setPaperSize('80mm');
        setPrintAuto(false);
        setDiscountEnabled(false);
        setTaxEnabled(true);
        setTaxPercentage('10.0');
        setFooterMessage('Terima kasih telah berbelanja di toko kami!');
        setBluetoothDevice('');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama toko tidak boleh kosong');
      return;
    }
    
    // Validate tax percentage
    const taxPercent = parseFloat(taxPercentage);
    if (taxEnabled && (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100)) {
      Alert.alert('Invalid Input', 'Tax percentage must be a number between 0 and 100');
      return;
    }
    
    try {
      // For now, we'll just show an alert since updateStoreSettings is not available
      Alert.alert('Success', 'Settings would be saved in a real implementation');
      onClose();
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

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Pengaturan Toko</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Store Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Toko</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Toko</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama toko"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Masukkan alamat toko"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Telepon</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          {/* Receipt Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengaturan Struk</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ukuran Kertas Struk</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={[styles.radioButton, paperSize === '58mm' && styles.radioButtonSelected]}
                  onPress={() => setPaperSize('58mm')}
                >
                  <Text style={[styles.radioText, paperSize === '58mm' && styles.radioTextSelected]}>58mm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioButton, paperSize === '80mm' && styles.radioButtonSelected]}
                  onPress={() => setPaperSize('80mm')}
                >
                  <Text style={[styles.radioText, paperSize === '80mm' && styles.radioTextSelected]}>80mm</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Footer Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={footerMessage}
                onChangeText={setFooterMessage}
                placeholder="Masukkan pesan footer"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
          
          {/* Printing Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengaturan Cetak</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Cetak Otomatis</Text>
              <Switch
                value={printAuto}
                onValueChange={setPrintAuto}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Perangkat Bluetooth</Text>
              <View style={styles.bluetoothContainer}>
                <TextInput
                  style={[styles.input, styles.bluetoothInput]}
                  value={bluetoothDevice}
                  onChangeText={setBluetoothDevice}
                  placeholder="Masukkan ID perangkat Bluetooth"
                />
                <TouchableOpacity style={styles.scanButton} onPress={handleScanBluetooth}>
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Discount Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengaturan Diskon</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Diskon Aktif</Text>
              <Switch
                value={discountEnabled}
                onValueChange={setDiscountEnabled}
              />
            </View>
          </View>
          
          {/* Tax Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengaturan Pajak</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pajak Aktif</Text>
              <Switch
                value={taxEnabled}
                onValueChange={setTaxEnabled}
              />
            </View>
            
            {taxEnabled && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Persentase Pajak</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={taxPercentage}
                    onChangeText={setTaxPercentage}
                    keyboardType="numeric"
                    placeholder="Masukkan persentase pajak"
                  />
                  <Text style={styles.percentSign}>%</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
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
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  radioTextSelected: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoreSettingsModal;