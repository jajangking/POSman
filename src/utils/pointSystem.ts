// Point system configuration
export const POINTS_CONFIG = {
  // Points earned per currency unit spent
  POINTS_PER_CURRENCY: 0.01, // 1 point per 100 currency units (e.g., 1 point per Rp100)
  
  // Points redemption rate
  POINTS_REDEMPTION_RATE: 1, // 1 point = 1 currency unit (e.g., 100 points = Rp100)
  
  // Minimum points required for redemption
  MIN_POINTS_FOR_REDEMPTION: 100,
  
  // Maximum points that can be redeemed in a single transaction
  MAX_POINTS_REDEMPTION: 100000, // Rp100,000 worth of points
};