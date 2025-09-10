import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { formatRupiah } from '../../models/Inventory';
import { CartItem } from '../../services/CashierService';

interface ReceiptPageProps {
  transactionId: string;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  pointsEarned: number;
  currentPoints: number;
  newPointsBalance: number;
  memberName?: string;
  discount?: number;
  pointsRedeemed?: number;
  onPrint: () => void;
  onNewTransaction: () => void;
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({
  transactionId,
  cartItems,
  subtotal,
  tax,
  total,
  paymentMethod,
  amountPaid,
  change,
  pointsEarned,
  currentPoints,
  newPointsBalance,
  memberName,
  discount,
  pointsRedeemed,
  onPrint,
  onNewTransaction
}) => {
  const [storeSettings, setStoreSettings] = useState({
    name: 'TOKO POSman',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '(021) 123-4567',
    paperSize: '80mm' as '80mm' | '58mm',
    footerMessage: 'Terima kasih telah berbelanja di toko kami!'
  });

  // For now, we're not loading settings from database since getStoreSettings is not available

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paymentMethodLabels: { [key: string]: string } = {
    cash: 'Tunai',
    card: 'Kartu',
    ewallet: 'E-Wallet'
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Receipt Header */}
        <View style={styles.receiptHeader}>
          <Text style={styles.storeName}>{storeSettings.name}</Text>
          <Text style={styles.storeAddress}>{storeSettings.address}</Text>
          <Text style={styles.storePhone}>Telp: {storeSettings.phone}</Text>
        </View>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. Transaksi:</Text>
            <Text style={styles.infoValue}>{transactionId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal:</Text>
            <Text style={styles.infoValue}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}> Kasir:</Text>
            <Text style={styles.infoValue}>Admin</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemsHeaderColumn, styles.itemNameHeader]}>Item</Text>
            <Text style={[styles.itemsHeaderColumn, styles.itemQtyHeader]}>Qty</Text>
            <Text style={[styles.itemsHeaderColumn, styles.itemPriceHeader]}>Harga</Text>
            <Text style={[styles.itemsHeaderColumn, styles.itemSubtotalHeader]}>Subtotal</Text>
          </View>
          <View style={styles.divider} />
          {cartItems && cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={[styles.itemColumn, styles.itemNameColumn]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.itemColumn, styles.itemQtyColumn]}>{item.qty}</Text>
                <Text style={[styles.itemColumn, styles.itemPriceColumn]}>{formatRupiah(item.price)}</Text>
                <Text style={[styles.itemColumn, styles.itemSubtotalColumn]}>{formatRupiah(item.subtotal)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.itemRow}>
              <Text style={[styles.itemColumn, styles.itemNameColumn]}>Tidak ada item</Text>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>{formatRupiah(subtotal)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PPN (10%)</Text>
            <Text style={styles.detailValue}>{formatRupiah(tax)}</Text>
          </View>
          {discount && discount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Diskon</Text>
              <Text style={styles.detailValue}>-{formatRupiah(discount)}</Text>
            </View>
          )}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Metode Bayar</Text>
            <Text style={styles.detailValue}>{paymentMethodLabels[paymentMethod]}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jumlah Bayar</Text>
            <Text style={styles.detailValue}>{formatRupiah(amountPaid)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kembalian</Text>
            <Text style={styles.detailValue}>{formatRupiah(change)}</Text>
          </View>
        </View>

        {/* Points Info */}
        <View style={styles.pointsSection}>
          {memberName && (
            <>
              <Text style={styles.pointsTitle}>Member</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nama Member</Text>
                <Text style={styles.detailValue}>{memberName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Poin Sekarang</Text>
                <Text style={styles.detailValue}>{currentPoints}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Poin Bertambah</Text>
                <Text style={styles.detailValue}>+{pointsEarned}</Text>
              </View>
              {pointsRedeemed && pointsRedeemed > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Poin Digunakan</Text>
                  <Text style={styles.detailValue}>-{pointsRedeemed}</Text>
                </View>
              )}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Poin</Text>
                <Text style={styles.totalValue}>{newPointsBalance}</Text>
              </View>
            </>
          )}
        </View>

        {/* Receipt Footer */}
        <View style={styles.receiptFooter}>
          <Text style={styles.thankYou}>TERIMA KASIH</Text>
          <Text style={styles.footerText}>{storeSettings.footerMessage}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.printButton} onPress={onPrint}>
          <Text style={styles.printButtonText}>Cetak Struk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newTransactionButton} onPress={onNewTransaction}>
          <Text style={styles.newTransactionButtonText}>Transaksi Baru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  storePhone: {
    fontSize: 14,
    color: '#666',
  },
  transactionInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  itemsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  itemsHeaderColumn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemNameHeader: {
    width: '40%',
    textAlign: 'left',
    paddingLeft: 5,
  },
  itemQtyHeader: {
    width: '15%',
    textAlign: 'center',
  },
  itemPriceHeader: {
    width: '25%',
    textAlign: 'right',
  },
  itemSubtotalHeader: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemColumn: {
    fontSize: 14,
    color: '#333',
  },
  itemNameColumn: {
    width: '40%',
    textAlign: 'left',
    paddingLeft: 5,
  },
  itemQtyColumn: {
    width: '15%',
    textAlign: 'center',
  },
  itemPriceColumn: {
    width: '25%',
    textAlign: 'right',
  },
  itemSubtotalColumn: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5,
  },
  paymentDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
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
  pointsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  receiptFooter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYou: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 30,
  },
  printButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newTransactionButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  newTransactionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReceiptPage;