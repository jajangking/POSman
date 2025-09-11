import { getPointSettings } from '../services/DatabaseService';

// Default point system configuration
export const DEFAULT_POINTS_CONFIG = {
  // Amount spent to earn points (Rp)
  AMOUNT_SPENT_TO_EARN_POINTS: 10000, // Rp10,000
  
  // Points earned per amount spent
  POINTS_EARNED_PER_AMOUNT: 100, // 100 points per Rp10,000 spent
  
  // Points redemption rate
  POINTS_REDEMPTION_RATE: 1, // 1 point = 1 currency unit (e.g., 100 points = Rp100)
  
  // Minimum points required for redemption
  MIN_POINTS_FOR_REDEMPTION: 100,
  
  // Maximum points that can be redeemed in a single transaction
  MAX_POINTS_REDEMPTION: 100000, // Rp100,000 worth of points
};

// Function to get current point settings
export const getCurrentPointSettings = async () => {
  try {
    const settings = await getPointSettings();
    if (settings) {
      return {
        AMOUNT_SPENT_TO_EARN_POINTS: settings.amountSpentToEarnPoints,
        POINTS_EARNED_PER_AMOUNT: settings.pointsEarnedPerAmount,
        POINTS_REDEMPTION_RATE: settings.pointsRedemptionRate,
        MIN_POINTS_FOR_REDEMPTION: settings.minPointsForRedemption,
        MAX_POINTS_REDEMPTION: settings.maxPointsRedemption,
      };
    }
  } catch (error) {
    console.error('Error getting point settings:', error);
  }
  
  // Return default settings if no saved settings found or error occurred
  return DEFAULT_POINTS_CONFIG;
};