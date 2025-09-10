import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PaymentButtonProps {
  handlePayment: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ handlePayment }) => {
  return (
    <View style={styles.paymentButtonContainer}>
      <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
        <Text style={styles.paymentButtonText}>PAYMENT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentButtonContainer: {
    padding: 5,
    paddingTop: 0,
    marginTop: -5,
    marginBottom: 30,
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentButton;