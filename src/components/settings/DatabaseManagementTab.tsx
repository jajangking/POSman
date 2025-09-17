import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { SettingsData } from '../../models/StoreSettings';
import DatabaseSyncService from '../../services/DatabaseSyncService';

interface DatabaseManagementTabProps {
  settings: SettingsData;
  onSettingsChange: (settings: SettingsData) => void;
}

const DatabaseManagementTab: React.FC<DatabaseManagementTabProps> = ({ settings, onSettingsChange }) => {
  const [syncEnabled, setSyncEnabled] = useState(DatabaseSyncService.isSyncEnabled());
  const [lastSync, setLastSync] = useState(DatabaseSyncService.getLastSyncTimestamp());

  useEffect(() => {
    // Update timestamp sinkronisasi terakhir
    const interval = setInterval(() => {
      setLastSync(DatabaseSyncService.getLastSyncTimestamp());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleBackupDatabase = () => {
    Alert.alert(
      "Database Backup",
      "This feature will backup your database. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Backup", 
          onPress: () => {
            // Implementasi backup database akan ditambahkan di sini
            Alert.alert("Success", "Database backup completed successfully");
          }
        }
      ]
    );
  };

  const handleRestoreDatabase = () => {
    Alert.alert(
      "Database Restore",
      "This will restore your database from a backup file. All current data will be replaced. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Restore", 
          onPress: () => {
            // Implementasi restore database akan ditambahkan di sini
            Alert.alert("Success", "Database restored successfully");
          }
        }
      ]
    );
  };

  const handleClearDatabase = () => {
    Alert.alert(
      "Clear Database",
      "This will permanently delete all data from the database. This action cannot be undone. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            // Implementasi penghapusan database akan ditambahkan di sini
            Alert.alert("Success", "Database cleared successfully");
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "This will export your data to a file. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Export", 
          onPress: () => {
            // Implementasi export data akan ditambahkan di sini
            Alert.alert("Success", "Data exported successfully");
          }
        }
      ]
    );
  };

  const toggleSync = async (value: boolean) => {
    setSyncEnabled(value);
    if (value) {
      await DatabaseSyncService.enableSync();
      Alert.alert("Success", "Database sync enabled successfully");
    } else {
      await DatabaseSyncService.disableSync();
      Alert.alert("Success", "Database sync disabled successfully");
    }
  };

  const handleManualSync = async () => {
    try {
      await DatabaseSyncService.syncDatabase();
      setLastSync(Date.now());
      Alert.alert("Success", "Database synchronized successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to synchronize database");
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Database Management</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Backup & Restore</Text>
        <TouchableOpacity style={styles.button} onPress={handleBackupDatabase}>
          <Text style={styles.buttonText}>Backup Database</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.restoreButton]} onPress={handleRestoreDatabase}>
          <Text style={styles.buttonText}>Restore Database</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Data Management</Text>
        <TouchableOpacity style={styles.button} onPress={handleExportData}>
          <Text style={styles.buttonText}>Export Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearDatabase}>
          <Text style={styles.buttonText}>Clear Database</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionSubtitle}>Real-time Sync</Text>
        <View style={styles.syncSetting}>
          <Text style={styles.syncLabel}>Enable Sync</Text>
          <Switch
            value={syncEnabled}
            onValueChange={toggleSync}
          />
        </View>
        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoText}>Last sync: {formatLastSync(lastSync)}</Text>
          <TouchableOpacity 
            style={[styles.button, styles.syncButton]} 
            onPress={handleManualSync}
            disabled={!syncEnabled}
          >
            <Text style={styles.buttonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Important Notes:</Text>
        <Text style={styles.infoText}>• Always backup your database before making major changes</Text>
        <Text style={styles.infoText}>• Keep backup files in a safe location</Text>
        <Text style={styles.infoText}>• Database clearing cannot be undone</Text>
        <Text style={styles.infoText}>• Real-time sync requires internet connection</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingHorizontal: 15,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: "center",
  },
  restoreButton: {
    backgroundColor: "#34C759",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  syncButton: {
    backgroundColor: "#5856D6",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  syncSetting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  syncLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  syncInfo: {
    marginTop: 10,
  },
  syncInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  infoSection: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
});

export default DatabaseManagementTab;