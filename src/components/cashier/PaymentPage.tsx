import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, BackHandler } from 'react-native';
import { formatRupiah } from '../../models/Inventory';
import { CartItem } from '../../services/CashierService';
import { DEFAULT_POINTS_CONFIG, getCurrentPointSettings } from '../../utils/pointSystem';
import { calculatePointsEarned as calculatePoints } from '../../services/MemberService';

interface PaymentPageProps {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  pointsToRedeem?: string; // Add this prop
  selectedMember?: {
    id: string;
    name: string;
    totalPoints: number;
  } | null;
  onPaymentComplete: (paymentMethod: string, amountPaid: number, change: number) => void;
  onBack: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ 
  cartItems, 
  subtotal, 
  tax, 
  total,
  pointsToRedeem = '0', // Add default value
  selectedMember,
  onPaymentComplete,
  onBack 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'ewallet' | 'onlineshop'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [change, setChange] = useState<number>(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);

  // Calculate discount and points discount
  const discount = 0; // No discount in payment page
  const points = selectedMember ? parseInt(pointsToRedeem) || 0 : 0;
  const pointsDiscount = points * DEFAULT_POINTS_CONFIG.POINTS_REDEMPTION_RATE; // 1 point = 1 Rupiah by default
  // Use the total prop directly instead of calculating

  // Format number with thousands separator
  const formatNumber = (num: string): string => {
    if (!num) return '';
    
    // Remove any existing formatting
    let cleanNum = num.replace(/\./g, '').replace(',', '.');
    
    // If it's a decimal number
    if (cleanNum.includes('.')) {
      const parts = cleanNum.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      
      // Format integer part with thousands separator
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Return with comma as decimal separator
      return formattedInteger + ',' + decimalPart;
    } else {
      // Format integer with thousands separator
      return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  // Parse formatted number back to clean number for calculations
  const parseFormattedNumber = (formattedNum: string): number => {
    // If formattedNum is already a clean number string, parse it directly
    if (/^[0-9.,]+$/.test(formattedNum)) {
      const cleanNum = formattedNum.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleanNum) || 0;
    }
    
    // If it still contains currency symbols, remove them
    const cleanNum = formattedNum.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanNum) || 0;
  };

  // Handle calculator input
  const handleCalculatorInput = (value: string) => {
    if (value === '=') {
      // Close calculator when equals is pressed
      setShowCalculator(false);
    } else if (value === 'C') {
      // Clear the input
      setAmountPaid('');
    } else if (value === '←') {
      // Remove last character
      setAmountPaid(prev => prev.slice(0, -1));
    } else if (value === '✕') {
      // Close calculator
      setShowCalculator(false);
    } else {
      // Add digit or decimal point
      if (value === ',') {
        // Add decimal point if not already present
        if (!amountPaid.includes(',')) {
          setAmountPaid(prev => prev + ',');
        }
      } else {
        // Add digit
        const newInput = amountPaid + value;
        setAmountPaid(newInput);
      }
    }
  };

  // Calculate points earned using the correct point earning rate
  const calculatePointsEarned = (amount: number): number => {
    // Calculate points based on the ratio defined in configuration
    const points = (amount / DEFAULT_POINTS_CONFIG.AMOUNT_SPENT_TO_EARN_POINTS) * DEFAULT_POINTS_CONFIG.POINTS_EARNED_PER_AMOUNT;
    return Math.floor(points);
  };

  // Handle payment confirmation
  const handleConfirmPayment = () => {
    const paidAmount = parseFormattedNumber(amountPaid);
    
    if (paymentMethod === 'cash' && paidAmount < total) {
      Alert.alert('Pembayaran Tidak Cukup', 'Jumlah yang dibayar kurang dari total belanja.');
      return;
    }
    
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tidak ada item dalam keranjang.');
      return;
    }
    
    // Calculate points
    const points = selectedMember ? parseInt(pointsToRedeem) || 0 : 0;
    const pointsDiscount = points * DEFAULT_POINTS_CONFIG.POINTS_REDEMPTION_RATE; // 1 point = 1 Rupiah by default
    const amountAfterPoints = subtotal; // Points are calculated based on subtotal, not amountAfterPoints
    const earnedPoints = calculatePoints(subtotal); // Points are calculated based on subtotal, not amountAfterPoints
    setPointsEarned(earnedPoints);
    // For demo purposes, we'll use a fixed current points value
    // In a real app, this would come from user data
    setCurrentPoints(selectedMember ? selectedMember.totalPoints : 0);
    // For demo purposes, we'll use a fixed current points value
    // In a real app, this would come from user data
    setCurrentPoints(selectedMember ? selectedMember.totalPoints : 0);
    
    // Show payment confirmation dialog
    setShowPaymentConfirmation(true);
  };

  // Confirm payment after showing details
  const confirmPaymentDetails = () => {
    const paidAmount = parseFormattedNumber(amountPaid);
    onPaymentComplete(paymentMethod, paidAmount, change);
  };

  // Cancel payment confirmation
  const cancelPaymentConfirmation = () => {
    setShowPaymentConfirmation(false);
  };

  // Auto-set amount paid when payment method changes to non-cash
  useEffect(() => {
    // Handle hardware back button on Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Go back to the cashier screen
      onBack();
      // Return true to indicate we've handled the back press
      return true;
    });
    
    if (paymentMethod !== 'cash') {
      // Extract only the numeric value from formatted currency
      const numericValue = total.toString();
      setAmountPaid(numericValue);
      setChange(0);
    }
    
    // Cleanup function
    return () => {
      backHandler.remove();
    };
  }, [paymentMethod, total]);

  // Calculate change when amount paid changes
  useEffect(() => {
    if (amountPaid) {
      const paid = parseFloat(amountPaid.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(paid)) {
        setChange(paid - total);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [amountPaid, total]);

  // Get suggested payments based on total amount
  const getSuggestedPayments = (total: number): number[] => {
    // Common denominations in Indonesia
    const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
    
    // Suggested payments
    const suggestions = new Set<number>();
    
    // Always include the exact amount
    suggestions.add(total);
    
    // Round up to nearest convenient amount
    // Round up to nearest 1000 if under 10000
    if (total < 10000) {
      suggestions.add(Math.ceil(total / 1000) * 1000);
    }
    // Round up to nearest 5000 if between 10000 and 50000
    else if (total < 50000) {
      suggestions.add(Math.ceil(total / 5000) * 5000);
    }
    // Round up to nearest 10000 if 50000 or above
    else {
      suggestions.add(Math.ceil(total / 10000) * 10000);
    }
    
    // Add common denominations that are slightly above the total
    for (const denom of denominations) {
      if (denom >= total && denom <= total * 2.5) { // Only show denominations up to 2.5x total
        suggestions.add(denom);
      }
    }
    
    // Add useful combinations of denominations
    // For example, if total is around 65000, suggest 70000 (50k + 20k)
    if (total > 45000 && total <= 65000) {
      suggestions.add(70000); // 50k + 20k
    }
    
    if (total > 65000 && total <= 85000) {
      suggestions.add(100000); // 100k
    }
    
    if (total > 85000 && total <= 110000) {
      suggestions.add(120000); // 100k + 20k
    }
    
    if (total > 110000 && total <= 130000) {
      suggestions.add(150000); // 100k + 50k
    }
    
    // Filter out suggestions that are too far above the total (> 2.5x)
    const filteredSuggestions = Array.from(suggestions).filter(amount => amount <= total * 2.5);
    
    // Convert to array, remove duplicates, and sort
    return filteredSuggestions.sort((a, b) => a - b).slice(0, 8); // Limit to 8 suggestions
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderItems}>
            {cartItems.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.qty}</Text>
                <Text style={styles.itemPrice}>{formatRupiah(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>{formatRupiah(subtotal)}</Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount</Text>
              <Text style={[styles.detailValue, styles.discountValue]}>-{formatRupiah(discount)}</Text>
            </View>
          )}
          
          {tax > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax</Text>
              <Text style={styles.detailValue}>{formatRupiah(tax)}</Text>
            </View>
          )}
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'cash' && styles.selectedPaymentMethod]} 
              onPress={() => setPaymentMethod('cash')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'cash' && styles.selectedPaymentMethodText]}>Cash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'card' && styles.selectedPaymentMethod]} 
              onPress={() => setPaymentMethod('card')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'card' && styles.selectedPaymentMethodText]}>Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'ewallet' && styles.selectedPaymentMethod]} 
              onPress={() => setPaymentMethod('ewallet')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'ewallet' && styles.selectedPaymentMethodText]}>E-Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'onlineshop' && styles.selectedPaymentMethod]} 
              onPress={() => setPaymentMethod('onlineshop')}
            >
              <Text style={[styles.paymentMethodText, paymentMethod === 'onlineshop' && styles.selectedPaymentMethodText]}>Online Shop</Text>
            </TouchableOpacity>
          </View>
          
          {/* Payment Method Information */}
          {paymentMethod === 'card' && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoTitle}>Card Payment Information</Text>
              <Text style={styles.paymentInfoText}>• Swipe, insert, or tap the customer's card</Text>
              <Text style={styles.paymentInfoText}>• Enter the amount: {formatRupiah(total)}</Text>
              <Text style={styles.paymentInfoText}>• Wait for payment authorization</Text>
              <Text style={styles.paymentInfoText}>• Provide receipt to customer</Text>
            </View>
          )}
          
          {paymentMethod === 'ewallet' && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoTitle}>E-Wallet Payment Information</Text>
              <Text style={styles.paymentInfoText}>• Open the customer's E-Wallet app</Text>
              <Text style={styles.paymentInfoText}>• Scan the QR code or enter the amount: {formatRupiah(total)}</Text>
              <Text style={styles.paymentInfoText}>• Wait for payment confirmation</Text>
              <Text style={styles.paymentInfoText}>• Provide receipt to customer</Text>
            </View>
          )}
          
          {paymentMethod === 'onlineshop' && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoTitle}>Online Shop Payment Information</Text>
              <Text style={styles.paymentInfoText}>• Process the order in the respective platform app</Text>
              <Text style={styles.paymentInfoText}>• Amount: {formatRupiah(total)}</Text>
              <Text style={styles.paymentInfoText}>• Wait for payment confirmation from the platform</Text>
              <Text style={styles.paymentInfoText}>• Prepare order for delivery or pickup</Text>
            </View>
          )}
        </View>

        {/* Amount Paid (only for cash) */}
        {paymentMethod === 'cash' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount Paid</Text>
            
            <TouchableOpacity 
              style={styles.amountInputContainer} 
              onPress={() => setShowCalculator(true)}
            >
              <TextInput
                style={styles.amountInput}
                value={amountPaid ? `Rp ${formatNumber(amountPaid)}` : ''}
                placeholder="Enter amount"
                editable={false}
              />
              <Text style={styles.calculatorIcon}>🔢</Text>
            </TouchableOpacity>
            
            {/* Explanation text for amount input */}
            <Text style={styles.inputExplanation}>
              Tap on the input field above to enter custom amount
            </Text>
            
            {/* Change Display */}
            <View style={styles.changeContainer}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text style={[styles.changeValue, change < 0 && styles.negativeChange]}>
                {formatRupiah(Math.abs(change))}
              </Text>
            </View>
            
            {/* Suggested Payments */}
            <View style={styles.suggestedPaymentsContainer}>
              <Text style={styles.suggestedPaymentsTitle}>Suggested Payments:</Text>
              <View style={styles.suggestedPayments}>
                {getSuggestedPayments(total).map((amount, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestedPaymentButton}
                    onPress={() => {
                      setAmountPaid(amount.toString());
                    }}
                  >
                    <Text style={styles.suggestedPaymentText}>{formatRupiah(amount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Fixed Amount Payments */}
            <View style={styles.suggestedPaymentsContainer}>
              <Text style={styles.suggestedPaymentsTitle}>Fixed Amount:</Text>
              <View style={styles.suggestedPayments}>
                {[5000, 10000, 20000, 50000, 100000].map((amount, index) => (
                  <TouchableOpacity
                    key={`fixed-${index}`}
                    style={styles.suggestedPaymentButton}
                    onPress={() => {
                      // Always add to existing amount
                      const currentAmount = amountPaid ? parseFormattedNumber(amountPaid) : 0;
                      const newAmount = currentAmount + amount;
                      setAmountPaid(newAmount.toString());
                    }}
                  >
                    <Text style={styles.suggestedPaymentText}>{formatRupiah(amount)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Calculator Modal */}
        {showCalculator && (
          <View style={styles.modalOverlay}>
            <View style={styles.calculatorModal}>
              <View style={styles.calculatorDisplay}>
                <Text style={styles.calculatorDisplayText}>
                  Rp {amountPaid ? formatNumber(amountPaid) : '0'}
                </Text>
              </View>
              
              {/* Total Amount Display */}
              <View style={styles.totalDisplay}>
                <Text style={styles.totalLabelText}>Total</Text>
                <Text style={styles.totalValueText}>{formatRupiah(total)}</Text>
              </View>
              
              {/* Change/Return Amount Display */}
              <View style={styles.changeDisplay}>
                <Text style={styles.changeLabelText}>Change</Text>
                <Text style={[styles.changeValueText, change < 0 && styles.negativeChange]}>
                  {formatRupiah(Math.abs(change))}
                </Text>
              </View>
              
              <View style={styles.calculatorButtons}>
                {/* Row 1 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('7')}
                  >
                    <Text style={styles.calculatorButtonText}>7</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('8')}
                  >
                    <Text style={styles.calculatorButtonText}>8</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('9')}
                  >
                    <Text style={styles.calculatorButtonText}>9</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calculatorButton, styles.functionButton]}
                    onPress={() => handleCalculatorInput('←')}
                  >
                    <Text style={styles.calculatorButtonText}>←</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Row 2 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('4')}
                  >
                    <Text style={styles.calculatorButtonText}>4</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('5')}
                  >
                    <Text style={styles.calculatorButtonText}>5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('6')}
                  >
                    <Text style={styles.calculatorButtonText}>6</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calculatorButton, styles.functionButton]}
                    onPress={() => handleCalculatorInput('C')}
                  >
                    <Text style={styles.calculatorButtonText}>C</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Row 3 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('1')}
                  >
                    <Text style={styles.calculatorButtonText}>1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('2')}
                  >
                    <Text style={styles.calculatorButtonText}>2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('3')}
                  >
                    <Text style={styles.calculatorButtonText}>3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calculatorButton, styles.functionButton]}
                    onPress={() => setShowCalculator(false)}
                  >
                    <Text style={styles.calculatorButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Row 4 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('00')}
                  >
                    <Text style={styles.calculatorButtonText}>00</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput('0')}
                  >
                    <Text style={styles.calculatorButtonText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calculatorButton}
                    onPress={() => handleCalculatorInput(',')}
                  >
                    <Text style={styles.calculatorButtonText}>.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calculatorButton, styles.equalButton]}
                    onPress={() => handleCalculatorInput('=')}
                  >
                    <Text style={styles.calculatorButtonText}>=</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirm Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPayment}>
          <Text style={styles.confirmButtonText}>
            Confirm Payment
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmation && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.modalTitle}>Konfirmasi Pembayaran</Text>
            
            <View style={styles.confirmationDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Belanja</Text>
                <Text style={styles.detailValue}>{formatRupiah(total)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Metode Pembayaran</Text>
                <Text style={styles.detailValue}>
                  {paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'card' ? 'Kartu' : 'E-Wallet'}
                </Text>
              </View>
              
              {paymentMethod === 'cash' && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jumlah Dibayar</Text>
                    <Text style={styles.detailValue}>{formatRupiah(parseFormattedNumber(amountPaid))}</Text>
                  </View>
                  
                  <View style={[styles.detailRow, styles.changeRow]}>
                    <Text style={styles.changeLabel}>Kembalian</Text>
                    <Text style={styles.changeValue}>{formatRupiah(change)}</Text>
                  </View>
                </>
              )}
              
              {selectedMember && points > 0 && (
                <View style={[styles.detailRow, styles.pointsRow]}>
                  <Text style={styles.pointsLabel}>Poin Digunakan</Text>
                  <Text style={styles.pointsValue}>-{points} Poin (-{formatRupiah(pointsDiscount)})</Text>
                </View>
              )}
              
              {selectedMember && (
                <View style={[styles.detailRow, styles.pointsRow]}>
                  <Text style={styles.pointsLabel}>Poin yang Diperoleh</Text>
                  <Text style={styles.pointsValue}>+{pointsEarned} Poin</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.thankYouText}>Terima kasih atas pembelian Anda!</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelPaymentConfirmation}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton]} 
                onPress={confirmPaymentDetails}
              >
                <Text style={styles.confirmModalButtonText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderItems: {
    marginBottom: 5,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  itemName: {
    flex: 2,
    fontSize: 14,
    color: '#666',
  },
  itemQuantity: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  discountValue: {
    color: '#FF3B30',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 5,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: '#007AFF',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPaymentMethodText: {
    color: 'white',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  calculatorIcon: {
    fontSize: 20,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  suggestedPaymentsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  suggestedPaymentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  suggestedPayments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  suggestedPaymentButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 4,
  },
  suggestedPaymentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  changeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Posisi di tengah
    alignItems: 'center',
    zIndex: 1000,
  },
  calculatorModal: {
    backgroundColor: 'white',
    width: '80%',
    maxWidth: 400,
    borderRadius: 10,
    maxHeight: '80%',
  },
  calculatorDisplay: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'flex-end', // Align text to the right
    justifyContent: 'center',
    minHeight: 80,
  },
  calculatorDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  totalDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  totalLabelText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValueText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  changeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8f4ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  changeLabelText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  changeValueText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  calculatorButtons: {
    flexDirection: 'column',
    padding: 10,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  calculatorButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  functionButton: {
    backgroundColor: '#e0e0e0',
  },
  equalButton: {
    backgroundColor: '#007AFF',
  },
  calculatorButtonText: {
    fontSize: 20,
    color: '#333',
  },
  closeCalculatorButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeCalculatorButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 30, // Added bottom padding to prevent overlap with navbar
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Payment Confirmation Modal Styles
  confirmationModal: {
    backgroundColor: 'white',
    width: '80%',
    maxWidth: 400,
    borderRadius: 10,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationDetails: {
    marginBottom: 20,
  },
  changeRow: {
    backgroundColor: '#e8f4ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  pointsRow: {
    backgroundColor: '#fff8e8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  thankYouText: {
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    paddingBottom: 30, // Match the marginBottom of the payment button in cashier screen
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30, // Match the marginBottom of the payment button in cashier screen
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 18, // Match the fontSize of the payment button text in cashier screen
    fontWeight: 'bold',
  },
  confirmModalButton: {
    backgroundColor: '#34C759',
    marginLeft: 10,
  },
  confirmModalButtonText: {
    color: 'white',
    fontSize: 18, // Match the fontSize of the payment button text in cashier screen
    fontWeight: 'bold',
  },
  inputExplanation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  additionalPaymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  paymentInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  paymentInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
});

export default PaymentPage;