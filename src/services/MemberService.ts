import { Member } from '../models/Member';
import { createMember, getAllMembers, updateMember, deleteMember, getMemberById, getMemberByPhoneNumber } from './DatabaseService';
import { DEFAULT_POINTS_CONFIG } from '../utils/pointSystem';

// Create a new member
export const addMember = async (memberData: Omit<Member, 'id' | 'totalPurchases' | 'totalPoints' | 'createdAt' | 'updatedAt'>): Promise<Member> => {
  try {
    const newMember = await createMember(memberData);
    return newMember;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

// Get all members
export const fetchAllMembers = async (): Promise<Member[]> => {
  try {
    const members = await getAllMembers();
    return members;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

// Update member
export const modifyMember = async (id: string, memberData: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member> => {
  try {
    const updatedMember = await updateMember(id, memberData);
    return updatedMember;
  } catch (error) {
    console.error('Error modifying member:', error);
    throw error;
  }
};

// Delete member
export const removeMember = async (id: string): Promise<void> => {
  try {
    await deleteMember(id);
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

// Get member by ID
export const getMember = async (id: string): Promise<Member | null> => {
  try {
    const member = await getMemberById(id);
    return member;
  } catch (error) {
    console.error('Error getting member:', error);
    throw error;
  }
};

// Get member by phone number
export const findMemberByPhone = async (phoneNumber: string): Promise<Member | null> => {
  try {
    const member = await getMemberByPhoneNumber(phoneNumber);
    return member;
  } catch (error) {
    console.error('Error finding member by phone:', error);
    throw error;
  }
};

// Calculate points based on the new configuration
const amountSpent = DEFAULT_POINTS_CONFIG.AMOUNT_SPENT_TO_EARN_POINTS;
const pointsEarned = DEFAULT_POINTS_CONFIG.POINTS_EARNED_PER_AMOUNT;

// Calculate points earned (1 point per Rp 1000 spent by default)
export const calculatePointsEarned = (amount: number): number => {
  // Calculate points based on the ratio defined in configuration
  const points = (amount / amountSpent) * pointsEarned;
  return Math.floor(points);
};

// Redeem points (1 point = Rp 1000 by default)
export const redeemPoints = (points: number): number => {
  if (points < DEFAULT_POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION) {
    throw new Error(`Minimum ${DEFAULT_POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION} points required for redemption`);
  }
  
  let redemptionAmount = points * DEFAULT_POINTS_CONFIG.POINTS_REDEMPTION_RATE;
  
  // Ensure redemption amount doesn't exceed maximum allowed
  if (redemptionAmount > DEFAULT_POINTS_CONFIG.MAX_POINTS_REDEMPTION) {
    redemptionAmount = DEFAULT_POINTS_CONFIG.MAX_POINTS_REDEMPTION;
  }
  
  return redemptionAmount;
};

// Update member points after a purchase
export const updateMemberPoints = async (memberId: string, purchaseAmount: number): Promise<Member> => {
  try {
    // Get current member data
    const member = await getMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Calculate points earned from this purchase
    const pointsEarned = calculatePointsEarned(purchaseAmount);
    
    // Update member's total points and purchases
    // Check if the member object has totalPoints and totalPurchases properties
    const updateData: Partial<Member> = {};
    
    if ('totalPoints' in member) {
      updateData.totalPoints = member.totalPoints + pointsEarned;
    }
    
    if ('totalPurchases' in member) {
      updateData.totalPurchases = member.totalPurchases + purchaseAmount;
    }
    
    const updatedMember = await modifyMember(memberId, updateData);
    
    return updatedMember;
  } catch (error) {
    console.error('Error updating member points:', error);
    throw error;
  }
};

// Redeem member points
export const redeemMemberPoints = async (memberId: string, pointsToRedeem: number): Promise<Member> => {
  try {
    // Get current member data
    const member = await getMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Check if member has enough points
    if (member.totalPoints < pointsToRedeem) {
      throw new Error('Insufficient points');
    }
    
    // Update member's total points
    const updatedMember = await modifyMember(memberId, {
      totalPoints: member.totalPoints - pointsToRedeem
    });
    
    return updatedMember;
  } catch (error) {
    console.error('Error redeeming member points:', error);
    throw error;
  }
};