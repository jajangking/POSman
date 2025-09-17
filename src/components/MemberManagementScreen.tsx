import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Keyboard, LayoutAnimation, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Member } from '../models/Member';
import { addMember, fetchAllMembers, findMemberByPhone, calculatePointsEarned, redeemPoints, removeMember } from '../services/MemberService';
import { DEFAULT_POINTS_CONFIG } from '../utils/pointSystem';
import { savePointSettings, getPointSettings } from '../services/DatabaseService';
import { formatRupiah } from '../models/Inventory';

interface MemberManagementScreenProps {
  onBack: () => void;
}

const MemberManagementScreen: React.FC<MemberManagementScreenProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [pointsPerCurrency, setPointsPerCurrency] = useState(DEFAULT_POINTS_CONFIG.AMOUNT_SPENT_TO_EARN_POINTS.toString());
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(DEFAULT_POINTS_CONFIG.POINTS_EARNED_PER_AMOUNT.toString());
  const [activeTab, setActiveTab] = useState<'manage' | 'list'>('manage');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const birthdayInputRef = useRef<TextInput>(null);

  // Load members from database
  useEffect(() => {
    loadMembers();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Scroll to bottom when keyboard shows
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load point settings on component mount
  useEffect(() => {
    const loadPointSettings = async () => {
      try {
        const settings = await getPointSettings();
        if (settings) {
          setPointsPerCurrency(settings.amountSpentToEarnPoints.toString());
          setPointsRedemptionRate(settings.pointsEarnedPerAmount.toString());
        }
      } catch (error) {
        console.error('Error loading point settings:', error);
      }
    };
    loadPointSettings();
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
    Keyboard.dismiss();
    
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

  // Handle text input focus to ensure it's visible above keyboard
  const handleInputFocus = (ref: React.RefObject<TextInput>) => {
    // For the last input (birthday), scroll to the very end of the scrollview
    if (ref === birthdayInputRef) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } else {
      // For other inputs, add extra padding to ensure visibility
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }, 300);
    }
  };

  // Handle delete member with confirmation
  const handleDeleteMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete member "${memberName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(memberId);
              setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
              Alert.alert('Success', 'Member deleted successfully');
            } catch (error) {
              console.error('Error deleting member:', error);
              Alert.alert('Error', 'Failed to delete member');
            }
          }
        }
      ]
    );
  };

  const handleSavePointSettings = async () => {
    const amountSpent = parseFloat(pointsPerCurrency) || 0;
    const pointsEarned = parseFloat(pointsRedemptionRate) || 0;
    
    if (amountSpent <= 0 || pointsEarned <= 0) {
      Alert.alert('Error', 'Please enter valid values for both fields');
      return;
    }
    
    try {
      // Save the point settings to the database
      await savePointSettings({
        amountSpentToEarnPoints: amountSpent,
        pointsEarnedPerAmount: pointsEarned,
        pointsRedemptionRate: DEFAULT_POINTS_CONFIG.POINTS_REDEMPTION_RATE,
        minPointsForRedemption: DEFAULT_POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION,
        maxPointsRedemption: DEFAULT_POINTS_CONFIG.MAX_POINTS_REDEMPTION
      });
      
      Alert.alert(
        'Success', 
        `Point settings saved successfully!

Members will earn ${pointsEarned} points for every ${formatRupiah(amountSpent)} spent.`
      );
    } catch (error) {
      console.error('Error saving point settings:', error);
      Alert.alert('Error', 'Failed to save point settings. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return formatRupiah(amount);
  };

  // Format points
  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Member Management</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
            onPress={() => setActiveTab('manage')}
          >
            <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
              Manage Members
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
              Member List
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          ref={scrollViewRef as React.RefObject<ScrollView>}
          keyboardShouldPersistTaps="handled"
        >
          {/* Point Settings Section */}
          {activeTab === 'manage' && (
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Point Settings</Text>
              
              <Text style={styles.settingLabel}>Amount spent to earn points (Rp)</Text>
              <TextInput
                style={styles.settingInput}
                value={pointsPerCurrency}
                onChangeText={setPointsPerCurrency}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
              
              <Text style={styles.settingLabel}>Points earned per amount spent</Text>
              <TextInput
                style={styles.settingInput}
                value={pointsRedemptionRate}
                onChangeText={setPointsRedemptionRate}
                keyboardType="numeric"
                placeholder="Enter points"
              />
              
              <Text style={styles.settingDescription}>
                Example: If you want to earn 100 points for every {formatRupiah(10000)} spent, 
                set "Amount spent to earn points" to 10000 and "Points earned per amount spent" to 100.
              </Text>
              
              <TouchableOpacity style={styles.saveSettingsButton} onPress={handleSavePointSettings}>
                <Text style={styles.saveSettingsButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add Member Section */}
          {activeTab === 'manage' && (
            <View style={styles.memberForm}>
              <Text style={styles.sectionTitle}>Add New Member</Text>
              
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                ref={nameInputRef as React.RefObject<TextInput>}
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter member name"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                blurOnSubmit={false}
                onFocus={() => handleInputFocus(nameInputRef)}
              />
              
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                ref={phoneInputRef as React.RefObject<TextInput>}
                style={styles.formInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                blurOnSubmit={false}
                onFocus={() => handleInputFocus(phoneInputRef)}
              />
              
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                ref={emailInputRef as React.RefObject<TextInput>}
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                onSubmitEditing={() => birthdayInputRef.current?.focus()}
                blurOnSubmit={false}
                onFocus={() => handleInputFocus(emailInputRef)}
              />
              
              <Text style={styles.formLabel}>Birthday</Text>
              <TextInput
                ref={birthdayInputRef as React.RefObject<TextInput>}
                style={styles.formInput}
                value={birthday}
                onChangeText={setBirthday}
                placeholder="YYYY-MM-DD"
                onSubmitEditing={handleSaveMember}
                onFocus={() => {
                  // Special handling for the last input - scroll to very bottom
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 500);
                }}
              />
              
              <View style={styles.memberFormButtons}>
                <TouchableOpacity style={styles.formButton} onPress={handleSaveMember}>
                  <Text style={styles.formButtonText}>Save Member</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.formButton, styles.cancelButton]} 
                  onPress={() => {
                    setName('');
                    setPhoneNumber('');
                    setEmail('');
                    setBirthday('');
                  }}
                >
                  <Text style={styles.formButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {/* Extra padding to ensure last input is visible above keyboard */}
              <View style={{ height: 250 }} />
            </View>
          )}

          {/* Member List Section */}
          {activeTab === 'list' && (
            <View style={styles.memberList}>
              <Text style={styles.sectionTitle}>Member List</Text>
              
              {members.map((member) => (
                <View key={member.id} style={styles.memberListItem}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteMember(member.id, member.name)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
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
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 15,
    paddingBottom: 20, // Reduce padding to prevent content from being pushed too far down
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
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
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
    marginBottom: 40, // Increase margin at the bottom to avoid navbar overlap
  },
  memberListItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});

export default MemberManagementScreen;