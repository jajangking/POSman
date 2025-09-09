import { Member } from '../models/Member';
import { createMember, getAllMembers, updateMember, deleteMember, getMemberById, getMemberByPhoneNumber } from './DatabaseService';
import { POINTS_CONFIG } from '../utils/pointSystem';

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

// Calculate points earned from a purchase amount
export const calculatePointsEarned = (amount: number): number => {
  return Math.floor(amount * POINTS_CONFIG.POINTS_PER_CURRENCY);
};

// Redeem points for a discount
export const redeemPoints = (points: number, maxRedemptionAmount?: number): number => {
  // Ensure points meet minimum requirement
  if (points < POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION) {
    return 0;
  }
  
  // Calculate redemption amount
  let redemptionAmount = points * POINTS_CONFIG.POINTS_REDEMPTION_RATE;
  
  // Apply maximum redemption limit if specified
  if (maxRedemptionAmount && redemptionAmount > maxRedemptionAmount) {
    redemptionAmount = maxRedemptionAmount;
  }
  
  // Apply system-wide maximum redemption limit
  if (redemptionAmount > POINTS_CONFIG.MAX_POINTS_REDEMPTION) {
    redemptionAmount = POINTS_CONFIG.MAX_POINTS_REDEMPTION;
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
    
    // Update member's total points
    const updatedMember = await modifyMember(memberId, {
      totalPoints: member.totalPoints + pointsEarned
    });
    
    return updatedMember;
  } catch (error) {
    console.error('Error updating member points:', error);
    throw error;
  }
};