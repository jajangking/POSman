import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { initDatabase, getStoreSettings, updateStoreSettings } from './src/services/DatabaseService';

const TestStoreSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initDatabase();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const savedSettings = await getStoreSettings();
      setSettings(savedSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    setLoading(true);
    try {
      await updateStoreSettings(
        'Test Store',
        '123 Test Street',
        '555-1234',
        '80mm',
        true,
        false,
        true,
        10.0,
        'Thank you for shopping with us!',
        ''
      );
      Alert.alert('Success', 'Settings updated successfully');
      loadSettings(); // Reload to show updated settings
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Store Settings Test</Text>
      
      <Button title="Load Settings" onPress={loadSettings} disabled={loading} />
      <Button title="Update Settings" onPress={updateSettings} disabled={loading} />
      
      {loading && <Text>Loading...</Text>}
      
      {settings && (
        <View style={{ marginTop: 20 }}>
          <Text>Name: {settings.name}</Text>
          <Text>Address: {settings.address}</Text>
          <Text>Phone: {settings.phone}</Text>
          <Text>Paper Size: {settings.paperSize}</Text>
          <Text>Auto Print: {settings.printAuto ? 'Yes' : 'No'}</Text>
          <Text>Tax Enabled: {settings.taxEnabled ? 'Yes' : 'No'}</Text>
          <Text>Tax Percentage: {settings.taxPercentage}%</Text>
        </View>
      )}
    </View>
  );
};

export default TestStoreSettings;