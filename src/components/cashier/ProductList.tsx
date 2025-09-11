import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { CartItem } from '../../services/CashierService';

interface ProductListProps {
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  formatCurrency: (amount: number) => string;
}

const ProductList: React.FC<ProductListProps> = ({
  cartItems,
  setCartItems,
  formatCurrency
}) => {
  return (
    <View style={styles.productList}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.noColumn]}>No</Text>
        <Text style={[styles.tableCell, styles.codeColumn]}>Code/SKU</Text>
        <Text style={[styles.tableCell, styles.nameColumn]}>Name</Text>
        <Text style={[styles.tableCell, styles.qtyColumn]}>Qty</Text>
        <Text style={[styles.tableCell, styles.priceColumn]}>Price</Text>
      </View>
      
      <ScrollView style={styles.tableBody}>
        {cartItems.map((item, index) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.noColumn]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.codeColumn]}>{item.code}</Text>
            <Text style={[styles.tableCell, styles.nameColumn]}>{item.name}</Text>
            <TextInput
              style={[styles.tableCell, styles.qtyColumn, styles.qtyInput]}
              value={item.qty.toString()}
              onChangeText={(text) => {
                const newQty = parseInt(text) || 0;
                const updatedItems = [...cartItems];
                updatedItems[index] = { ...item, qty: newQty, subtotal: newQty * item.price };
                setCartItems(updatedItems);
              }}
              keyboardType="numeric"
            />
            <Text style={[styles.tableCell, styles.priceColumn]}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  productList: {
    flex: 1,
    margin: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    textAlign: 'center',
    color: '#333',
  },
  noColumn: {
    width: '10%',
    fontSize: 14,
  },
  codeColumn: {
    width: '20%',
    fontSize: 14,
  },
  nameColumn: {
    width: '35%',
    fontSize: 14,
    textAlign: 'left',
    paddingLeft: 5,
  },
  qtyColumn: {
    width: '15%',
    fontSize: 14,
  },
  qtyInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 5,
    textAlign: 'center',
  },
  priceColumn: {
    width: '20%',
    fontSize: 14,
    textAlign: 'right',
    paddingRight: 5,
  },
});

export default ProductList;