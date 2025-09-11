import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { redeemPoints } from '../../services/MemberService';

interface TotalDetailsProps {
  subtotal: number;
  pointsToRedeem: string;
  total: number;
  formatCurrency: (amount: number) => string;
  tax?: number;
  discount?: number;
  discountEnabled?: boolean;
  taxEnabled?: boolean;
  taxPercentage?: number;
}

const TotalDetails: React.FC<TotalDetailsProps> = ({
  subtotal,
  pointsToRedeem,
  total,
  formatCurrency,
  tax = 0,
  discount = 0,
  discountEnabled = false,
  taxEnabled = true,
  taxPercentage = 10
}) => {
  // Calculate points discount
  const points = parseInt(pointsToRedeem) || 0;
  const pointsDiscount = points * 1000; // Assuming 1 point = Rp 1000 discount
  
  // For now, we'll use fixed values for discount and tax settings
  // In a real implementation, these would come from app settings
  const finalDiscount = discountEnabled ? (discount || subtotal * 0.1) : 0; // 10% discount if enabled
  const finalTax = taxEnabled ? (tax || (subtotal - finalDiscount - pointsDiscount) * (taxPercentage / 100)) : 0;
  const finalTotal = subtotal - finalDiscount - pointsDiscount + finalTax;

  return (
    <View style={styles.totalSection}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
      </View>
      {discountEnabled && finalDiscount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount:</Text>
          <Text style={[styles.totalValue, styles.discountValue]}>-{formatCurrency(finalDiscount)}</Text>
        </View>
      )}
      {taxEnabled && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({taxPercentage}%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(finalTax)}</Text>
        </View>
      )}
      {points > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Points Discount:</Text>
          <Text style={[styles.totalValue, styles.discountValue]}>-{formatCurrency(pointsDiscount)}</Text>
        </View>
      )}
      <View style={[styles.totalRow, styles.grandTotalRow]}>
        <Text style={styles.grandTotalLabel}>Total:</Text>
        <Text style={styles.grandTotalValue}>{formatCurrency(finalTotal)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  totalSection: {
    backgroundColor: 'white',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  discountValue: {
    color: '#FF3B30',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default TotalDetails;