import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Member } from '../models/Member';
import { addMember, fetchAllMembers, findMemberByPhone, calculatePointsEarned, redeemPoints } from '../services/MemberService';
import { POINTS_CONFIG } from '../utils/pointSystem';

interface MemberManagementScreenProps {
  onBack: () => void;
}

const MemberManagementScreen: React.FC<MemberManagementScreenProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [pointsPerCurrency, setPointsPerCurrency] = useState(POINTS_CONFIG.POINTS_PER_CURRENCY.toString());
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(POINTS_CONFIG.POINTS_REDEMPTION_RATE.toString());

  // Load members from database
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const memberList = await fetchAllMembers();
      setMembers(memberList);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    }
  };

  const handleSaveMember = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter member name');
      return;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter member phone number');
      return;
    }

    try {
      // Check if member with this phone number already exists
      const existingMember = await findMemberByPhone(phoneNumber);
      if (existingMember) {
        Alert.alert('Error', 'Member with this phone number already exists');
        return;
      }
      
      const newMember = await addMember({
        name,
        phoneNumber,
        email,
        birthday
      });
      
      // Add new member to the list
      setMembers(prev => [...prev, newMember]);
      
      // Reset form after saving
      setName('');
      setPhoneNumber('');
      setEmail('');
      setBirthday('');
      
      Alert.alert('Success', 'Member saved successfully');
    } catch (error) {
      console.error('Error saving member:', error);
      Alert.alert('Error', 'Failed to save member');
    }
  };

  const handleSavePointSettings = () => {
    // In a real app, this would save the point settings to the database
    Alert.alert('Success', 'Point settings saved successfully');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format points
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('id-ID').format(points);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Member Management</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Point Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Point Settings</Text>
            
            <Text style={styles.settingLabel}>Points per {formatCurrency(10000)} spent</Text>
            <TextInput
              style={styles.settingInput}
              placeholder="Enter points per 10,000 currency units"
              value={pointsPerCurrency}
              onChangeText={setPointsPerCurrency}
              keyboardType="numeric"
            />
            
            <Text style={styles.settingLabel}>Redemption rate (points per {formatCurrency(10000)})</Text>
            <TextInput
              style={styles.settingInput}
              placeholder="Enter redemption rate"
              value={pointsRedemptionRate}
              onChangeText={setPointsRedemptionRate}
              keyboardType="numeric"
            />
            
            <TouchableOpacity style={styles.saveSettingsButton} onPress={handleSavePointSettings}>
              <Text style={styles.saveSettingsButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
          
          {/* Add Member Section */}
          <View style={styles.memberForm}>
            <Text style={styles.sectionTitle}>Add New Member</Text>
            
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter member name"
              value={name}
              onChangeText={setName}
            />
            
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            
            <Text style={styles.formLabel}>Birthday</Text>
            <TextInput
              style={styles.formInput}
              placeholder="DD/MM/YYYY"
              value={birthday}
              onChangeText={setBirthday}
            />
            
            <View style={styles.memberFormButtons}>
              <TouchableOpacity style={styles.formButton} onPress={handleSaveMember}>
                <Text style={styles.formButtonText}>Save Member</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={onBack}>
                <Text style={styles.formButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Member List Section */}
          <View style={styles.memberList}>
            <Text style={styles.sectionTitle}>Member List</Text>
            {members.map((member) => (
              <View key={member.id} style={styles.memberListItem}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                <Text style={styles.memberDetail}>Total Purchases: {formatCurrency(member.totalPurchases)}</Text>
                <Text style={styles.memberDetail}>Points: {formatPoints(member.totalPoints)}</Text>
                {member.lastTransaction && (
                  <Text style={styles.memberDetail}>Last Transaction: {member.lastTransaction}</Text>
                )}
              </View>
            ))}
            {members.length === 0 && (
              <Text style={styles.noMembersText}>No members found</Text>
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
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
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
  settingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  settingInput: {
    fontSize: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  saveSettingsButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveSettingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberForm: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formInput: {
    fontSize: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  memberFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cancelButton: {
    backgroundColor: '#a6a6a6',
  },
  formButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberList: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  memberListItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  memberPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  memberDetail: {
    fontSize: 12,
    color: '#999',
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});

export default MemberManagementScreen;