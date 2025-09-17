import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { 
  connectToPrinter, 
  disconnectPrinter, 
  scanForDevices, 
  testPrinterConnection, 
  getConnectionStatus, 
  reconnectToLastPrinter
} from '../services/PrinterService';

interface BluetoothDevice {
  id: string;
  name: string;
}

interface BluetoothPrinterSetupProps {
  onPrinterConnected?: (deviceId: string) => void;
  onPrinterDisconnected?: () => void;
  currentDeviceId?: string;
}

const BluetoothPrinterSetup: React.FC<BluetoothPrinterSetupProps> = ({ 
  onPrinterConnected, 
  onPrinterDisconnected,
  currentDeviceId 
}) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(currentDeviceId || null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'disconnecting'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Update connection status
  useEffect(() => {
    const { status, error } = getConnectionStatus();
    setConnectionStatus(status);
    setConnectionError(error);
  }, []);

  // Scan for Bluetooth devices
  const handleScanDevices = async () => {
    setScanning(true);
    try {
      const foundDevices = await scanForDevices();
      setDevices(foundDevices);
    } catch (error) {
      console.error('Error scanning for devices:', error);
      Alert.alert('Scan Error', 'Failed to scan for Bluetooth devices.');
    } finally {
      setScanning(false);
    }
  };

  // Connect to a device
  const handleConnectToDevice = async (deviceId: string) => {
    setConnecting(true);
    try {
      const connected = await connectToPrinter(deviceId);
      if (connected) {
        setSelectedDevice(deviceId);
        setConnectionStatus('connected');
        setConnectionError(null);
        if (onPrinterConnected) {
          onPrinterConnected(deviceId);
        }
        Alert.alert('Success', 'Successfully connected to the printer.');
      } else {
        setConnectionStatus('disconnected');
        Alert.alert('Connection Failed', 'Could not connect to the selected printer.');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      setConnectionStatus('disconnected');
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Connection Error', 'Failed to connect to the printer.');
    } finally {
      setConnecting(false);
    }
  };

  // Test connection to a device
  const handleTestConnection = async (deviceId: string) => {
    setConnecting(true);
    try {
      const success = await testPrinterConnection(deviceId);
      if (success) {
        Alert.alert('Test Successful', 'Printer connection test passed!');
      } else {
        Alert.alert('Test Failed', 'Printer connection test failed.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert('Test Error', 'Failed to test printer connection.');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from current device
  const handleDisconnect = async () => {
    try {
      await disconnectPrinter();
      setSelectedDevice(null);
      setConnectionStatus('disconnected');
      setConnectionError(null);
      if (onPrinterDisconnected) {
        onPrinterDisconnected();
      }
      Alert.alert('Disconnected', 'Successfully disconnected from the printer.');
    } catch (error) {
      console.error('Error disconnecting:', error);
      Alert.alert('Disconnect Error', 'Failed to disconnect from the printer.');
    }
  };

  // Reconnect to last used printer
  const handleReconnect = async () => {
    if (!currentDeviceId) {
      Alert.alert('No Device', 'No previous printer configured.');
      return;
    }
    
    setConnecting(true);
    try {
      const connected = await reconnectToLastPrinter();
      if (connected) {
        setSelectedDevice(currentDeviceId);
        setConnectionStatus('connected');
        setConnectionError(null);
        if (onPrinterConnected) {
          onPrinterConnected(currentDeviceId);
        }
        Alert.alert('Success', 'Successfully reconnected to the printer.');
      } else {
        setConnectionStatus('disconnected');
        Alert.alert('Connection Failed', 'Could not reconnect to the printer.');
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      setConnectionStatus('disconnected');
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Connection Error', 'Failed to reconnect to the printer.');
    } finally {
      setConnecting(false);
    }
  };

  // Render device item
  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <View style={styles.deviceActions}>
        {selectedDevice === item.id ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.testButton]} 
            onPress={() => handleTestConnection(item.id)}
            disabled={connecting}
          >
            <Text style={styles.actionButtonText}>Test</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.connectButton]} 
            onPress={() => handleConnectToDevice(item.id)}
            disabled={connecting}
          >
            <Text style={styles.actionButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Printer Setup</Text>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScanDevices}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>Scan Devices</Text>
          )}
        </TouchableOpacity>
      </View>

      {selectedDevice && (
        <View style={styles.connectedDevice}>
          <Text style={styles.connectedText}>Connected to printer</Text>
          <TouchableOpacity 
            style={[styles.actionButton, styles.disconnectButton]} 
            onPress={handleDisconnect}
          >
            <Text style={styles.actionButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        style={styles.deviceList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {scanning ? 'Scanning for devices...' : 'No devices found. Tap "Scan Devices" to search.'}
            </Text>
          </View>
        }
      />

      {connecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Connecting to printer...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  connectedDevice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  connectedText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  deviceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  connectButton: {
    backgroundColor: '#34C759',
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});

export default BluetoothPrinterSetup;
