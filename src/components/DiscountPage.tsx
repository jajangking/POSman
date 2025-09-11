import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DiscountPageProps {
  onBack: () => void;
}

const DiscountPage: React.FC<DiscountPageProps> = ({ onBack }) => {
  const [discountSettings, setDiscountSettings] = useState({
    enabled: false,
    percentage: 10.0,
    minimumAmount: 0,
    memberOnly: false,
    startDate: '',
    endDate: '',
    description: 'Diskon reguler 10%'
  });

  const [discountRules, setDiscountRules] = useState([
    { id: 1, name: 'Diskon Member', percentage: 15, minAmount: 100000, active: true },
    { id: 2, name: 'Diskon Akhir Tahun', percentage: 20, minAmount: 200000, active: false }
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    percentage: 0,
    minAmount: 0
  });

  const handleSave = async () => {
    // Validate discount percentage
    if (discountSettings.enabled) {
      const discountPercent = parseFloat(discountSettings.percentage.toString());
      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        Alert.alert('Invalid Input', 'Discount percentage must be a number between 0 and 100');
        return;
      }
    }

    // Validate minimum amount
    if (discountSettings.minimumAmount < 0) {
      Alert.alert('Invalid Input', 'Minimum amount cannot be negative');
      return;
    }

    try {
      // In a real implementation, this would save to database
      // await saveDiscountSettings(discountSettings);
      Alert.alert('Success', 'Discount settings saved successfully');
    } catch (error) {
      console.error('Error saving discount settings:', error);
      Alert.alert('Error', 'Failed to save discount settings');
    }
  };

  const handleAddRule = () => {
    if (!newRule.name || newRule.percentage <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid rule name and percentage');
      return;
    }

    const rule = {
      id: discountRules.length + 1,
      name: newRule.name,
      percentage: newRule.percentage,
      minAmount: newRule.minAmount,
      active: true
    };

    setDiscountRules([...discountRules, rule]);
    setNewRule({ name: '', percentage: 0, minAmount: 0 });
    Alert.alert('Success', 'Discount rule added successfully');
  };

  const handleToggleRule = (id: number) => {
    setDiscountRules(discountRules.map(rule => 
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  const handleDeleteRule = (id: number) => {
    setDiscountRules(discountRules.filter(rule => rule.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Discount Management</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* General Discount Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Discount Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Discount</Text>
              <Switch
                value={discountSettings.enabled}
                onValueChange={(value) => setDiscountSettings({...discountSettings, enabled: value})}
              />
            </View>
            
            {discountSettings.enabled && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Default Discount Percentage</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={discountSettings.percentage.toString()}
                      onChangeText={(text) => setDiscountSettings({...discountSettings, percentage: parseFloat(text) || 0})}
                      keyboardType="numeric"
                      placeholder="Enter discount percentage"
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Minimum Transaction Amount (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    value={discountSettings.minimumAmount.toString()}
                    onChangeText={(text) => setDiscountSettings({...discountSettings, minimumAmount: parseFloat(text) || 0})}
                    keyboardType="numeric"
                    placeholder="Enter minimum amount"
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Member Only</Text>
                  <Switch
                    value={discountSettings.memberOnly}
                    onValueChange={(value) => setDiscountSettings({...discountSettings, memberOnly: value})}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={discountSettings.description}
                    onChangeText={(text) => setDiscountSettings({...discountSettings, description: text})}
                    placeholder="Enter discount description"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </>
            )}
          </View>

          {/* Discount Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Rules</Text>
            <Text style={styles.sectionDescription}>
              Create special discount rules for specific conditions
            </Text>
            
            {/* Add New Rule Form */}
            <View style={styles.ruleForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rule Name</Text>
                <TextInput
                  style={styles.input}
                  value={newRule.name}
                  onChangeText={(text) => setNewRule({...newRule, name: text})}
                  placeholder="Enter rule name"
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.flexOne]}>
                  <Text style={styles.label}>Percentage</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={newRule.percentage.toString()}
                      onChangeText={(text) => setNewRule({...newRule, percentage: parseFloat(text) || 0})}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                </View>
                
                <View style={[styles.inputGroup, styles.flexOne, styles.marginLeft]}>
                  <Text style={styles.label}>Min Amount (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    value={newRule.minAmount.toString()}
                    onChangeText={(text) => setNewRule({...newRule, minAmount: parseFloat(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.addButton} onPress={handleAddRule}>
                <Text style={styles.addButtonText}>Add Rule</Text>
              </TouchableOpacity>
            </View>
            
            {/* Rules List */}
            {discountRules.map((rule) => (
              <View key={rule.id} style={[styles.ruleItem, !rule.active && styles.inactiveRule]}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleName}>{rule.name}</Text>
                  <Switch
                    value={rule.active}
                    onValueChange={() => handleToggleRule(rule.id)}
                  />
                </View>
                <View style={styles.ruleDetails}>
                  <Text style={styles.ruleDetailText}>Discount: {rule.percentage}%</Text>
                  <Text style={styles.ruleDetailText}>Min Amount: Rp {rule.minAmount.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => handleDeleteRule(rule.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  sectionDescription: {
    fontSize: 14,
    color: '#666',
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
    height: 60,
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
  ruleForm: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
  },
  flexOne: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  ruleItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  inactiveRule: {
    opacity: 0.6,
    borderLeftColor: '#ccc',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ruleDetails: {
    marginBottom: 10,
  },
  ruleDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  deleteButton: {
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});

export default DiscountPage;