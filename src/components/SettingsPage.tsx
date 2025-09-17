import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import TabNavigator from "./TabNavigator";
import StoreInfoTab from "./settings/StoreInfoTab";
import PrintingTab from "./settings/PrintingTab";
import DiscountTaxTab from "./settings/DiscountTaxTab";
import DatabaseManagementTab from "./settings/DatabaseManagementTab";
import { SettingsData } from "../models/StoreSettings";

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<SettingsData>({
    name: "TOKO POSman",
    address: "Jl. Contoh No. 123, Jakarta",
    phone: "(021) 123-4567",
    paperSize: "80mm",
    printAuto: false,
    discountEnabled: false,
    taxEnabled: true,
    taxPercentage: 10.0,
    footerMessage: "Terima kasih telah berbelanja di toko kami!",
    bluetoothDevice: "",
    syncEnabled: false,
    lastSync: 0,
  });
  const [activeTab, setActiveTab] = useState("store-info");
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

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
            bluetoothDevice: savedSettings.bluetoothDevice,
            syncEnabled: savedSettings.syncEnabled,
            lastSync: savedSettings.lastSync,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        Alert.alert("Error", "Failed to load settings");
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    // Validate that name is not empty
    if (!settings.name.trim()) {
      Alert.alert("Error", "Store name cannot be empty");
      return;
    }

    // Validate tax percentage
    if (settings.taxEnabled) {
      const taxPercent = parseFloat(settings.taxPercentage.toString());
      if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
        Alert.alert(
          "Invalid Input",
          "Tax percentage must be a number between 0 and 100",
        );
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
        settings.bluetoothDevice,
        settings.syncEnabled,
        settings.lastSync
      );

      Alert.alert("Success", "Settings saved successfully", [
        {
          text: "OK",
          onPress: () => {
            // Call onBack to return to the previous screen
            onBack();
          }
        }
      ]);
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings: " + (error as Error).message);
    }
  };

  const handleScanBluetooth = () => {
    setShowPrinterSetup(true);
  };

  const handlePrinterConnected = (deviceId: string) => {
    setSettings({ ...settings, bluetoothDevice: deviceId });
    setPrinterError(null);
  };

  const handlePrinterDisconnected = () => {
    setSettings({ ...settings, bluetoothDevice: "" });
    setPrinterError(null);
  };

  const tabs = [
    { id: "store-info", title: "Store Info" },
    { id: "printing", title: "Printing" },
    { id: "discount-tax", title: "Discount & Tax" },
    { id: "database", title: "Database" },
  ];

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
          
          <TabNavigator 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          >
            <ScrollView style={styles.content}>
              {activeTab === "store-info" && (
                <StoreInfoTab 
                  settings={settings} 
                  onSettingsChange={setSettings} 
                />
              )}
              
              {activeTab === "printing" && (
                <PrintingTab 
                  settings={settings} 
                  onSettingsChange={setSettings}
                  onShowPrinterSetup={() => setShowPrinterSetup(true)}
                />
              )}
              
              {activeTab === "discount-tax" && (
                <DiscountTaxTab 
                  settings={settings} 
                  onSettingsChange={setSettings} 
                />
              )}
              
              {activeTab === "database" && (
                <DatabaseManagementTab 
                  settings={settings} 
                  onSettingsChange={setSettings} 
                />
              )}
              
              <View style={{ height: insets.bottom }} />
            </ScrollView>
          </TabNavigator>
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
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  modalFooter: {
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SettingsPage;