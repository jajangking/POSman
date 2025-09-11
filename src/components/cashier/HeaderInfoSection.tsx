import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { DEFAULT_POINTS_CONFIG } from '../../utils/pointSystem';
import { Member } from '../../models/Member';
import { findMemberByPhone } from '../../services/MemberService';

interface HeaderInfoSectionProps {
  currentTime: Date;
  currentUser: any;
  receiptNumber: string;
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;
  memberNumber: string;
  setMemberNumber: (number: string) => void;
  pointsToRedeem: string;
  setPointsToRedeem: (points: string) => void;
}

const HeaderInfoSection: React.FC<HeaderInfoSectionProps> = ({
  currentTime,
  currentUser,
  receiptNumber,
  selectedMember,
  setSelectedMember,
  memberNumber,
  setMemberNumber,
  pointsToRedeem,
  setPointsToRedeem
}) => {
  // Handle member check
  const handleMemberCheck = async () => {
    if (memberNumber.trim()) {
      try {
        // In a real implementation, this would check member number in the database
        const member = await findMemberByPhone(memberNumber.trim());
        if (member) {
          setSelectedMember(member);
          setPointsToRedeem('0'); // Reset points to redeem
          Alert.alert(
            'Member Found', 
            `Member: ${member.name}\nTotal Purchases: ${formatCurrency(member.totalPurchases)}\nAvailable Points: ${member.totalPoints} pts`
          );
        } else {
          Alert.alert('Member Not Found', 'No member found with that phone number. Please check the number or add a new member.');
        }
      } catch (error) {
        console.error('Error checking member:', error);
        Alert.alert('Error', 'Failed to check member. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter a member phone number');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.infoSection}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date/Time:</Text>
        <Text style={styles.infoValue}>{currentTime.toLocaleDateString('id-ID')} {currentTime.toLocaleTimeString('id-ID')}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>User:</Text>
        <Text style={styles.infoValue}>{currentUser?.name || currentUser?.username || 'USR'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Receipt:</Text>
        <Text style={styles.infoValue}>{receiptNumber}</Text>
      </View>
      {selectedMember && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member:</Text>
            <Text style={styles.infoValue}>{selectedMember.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Points:</Text>
            <Text style={styles.infoValue}>{selectedMember.totalPoints} pts</Text>
          </View>
          <View style={styles.memberRow}>
            <Text style={styles.infoLabel}>Redeem Points:</Text>
            <View style={styles.memberInputContainer}>
              <TextInput
                style={styles.memberInput}
                placeholder="Enter points to redeem"
                value={pointsToRedeem}
                onChangeText={setPointsToRedeem}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.memberCheckButton} 
                onPress={() => {
                  // Validate points input
                  const points = parseInt(pointsToRedeem) || 0;
                  if (points > selectedMember.totalPoints) {
                    Alert.alert('Error', 'Not enough points available');
                    return;
                  }
                  if (points < DEFAULT_POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION) {
                    Alert.alert('Error', `Minimum ${DEFAULT_POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION} points required for redemption`);
                    return;
                  }
                  setPointsToRedeem(points.toString());
                }}
              >
                <Text style={styles.memberCheckButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      <View style={styles.memberRow}>
        <Text style={styles.infoLabel}>Member Phone:</Text>
        <View style={styles.memberInputContainer}>
          <TextInput
            style={styles.memberInput}
            placeholder="Enter member phone number"
            value={memberNumber}
            onChangeText={setMemberNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.memberCheckButton} onPress={handleMemberCheck}>
            <Text style={styles.memberCheckButtonText}>Check</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: 'white',
    padding: 8,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: '30%',
  },
  infoValue: {
    fontSize: 12,
    color: '#666',
    width: '70%',
    textAlign: 'right',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  memberInputContainer: {
    flexDirection: 'row',
    width: '70%',
  },
  memberInput: {
    flex: 1,
    fontSize: 12,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  memberCheckButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 5,
    justifyContent: 'center',
  },
  memberCheckButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HeaderInfoSection;