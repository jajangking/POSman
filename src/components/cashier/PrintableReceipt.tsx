import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatRupiah } from '../../models/Inventory';
import { CartItem } from '../../services/CashierService';

interface PrintableReceiptProps {
  transactionId: string;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  currentPoints: number;
  memberName?: string;
  discount?: number;
  pointsRedeemed?: number;
  storeSettings?: {
    name: string;
    address: string;
    phone: string;
    paperSize: '80mm' | '58mm';
    footerMessage: string;
    taxEnabled?: boolean;
    taxPercentage?: number;
  };
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  transactionId,
  cartItems,
  subtotal,
  tax,
  total,
  paymentMethod,
  amountPaid,
  change,
  currentPoints,
  memberName,
  discount = 0,
  pointsRedeemed,
  storeSettings,
}) => {
  const paperWidth = storeSettings?.paperSize === '58mm' ? 250 : 300;
  const fontSize = storeSettings?.paperSize === '58mm' ? 12 : 14;
  const headerFontSize = storeSettings?.paperSize === '58mm' ? 16 : 20;
  const smallFontSize = storeSettings?.paperSize === '58mm' ? 12 : 14;

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

  // Payment method labels
  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash': return 'Tunai';
      case 'card': return 'Kartu';
      case 'ewallet': return 'E-Wallet';
      case 'onlineshop': return 'Online Shop';
      default: return method;
    }
  };

  return (
    <View style={[styles.container, { width: paperWidth }]}>
      {/* Receipt Header */}
      <View style={styles.receiptHeader}>
        <Text style={[styles.storeName, { fontSize: headerFontSize }]}>{storeSettings?.name || 'TOKO POSman'}</Text>
        <Text style={[styles.storeAddress, { fontSize }]}>{storeSettings?.address || 'Jl. Contoh No. 123, Jakarta'}</Text>
        <Text style={[styles.storePhone, { fontSize }]}>{storeSettings?.phone || '(021) 123-4567'}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Transaction Info */}
      <View style={styles.transactionInfo}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { fontSize }]}>No. Transaksi:</Text>
          <Text style={[styles.infoValue, { fontSize }]}>{transactionId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { fontSize }]}>Tanggal:</Text>
          <Text style={[styles.infoValue, { fontSize }]}>{formatDate(new Date())}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { fontSize }]}> Kasir:</Text>
          <Text style={[styles.infoValue, { fontSize }]}>Admin</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Items Header */}
      <View style={styles.itemsHeader}>
        <Text style={[styles.itemsHeaderColumn, styles.itemNameHeader, { fontSize }]}>Item</Text>
        <Text style={[styles.itemsHeaderColumn, styles.itemQtyHeader, { fontSize }]}>Qty</Text>
        <Text style={[styles.itemsHeaderColumn, styles.itemPriceHeader, { fontSize }]}>Harga</Text>
        <Text style={[styles.itemsHeaderColumn, styles.itemSubtotalHeader, { fontSize }]}>Subtotal</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsContainer}>
        {cartItems && cartItems.length > 0 ? (
          cartItems.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemColumn, styles.itemNameColumn, { fontSize }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.itemColumn, styles.itemQtyColumn, { fontSize }]}>{item.qty}</Text>
              <Text style={[styles.itemColumn, styles.itemPriceColumn, { fontSize }]}>{formatRupiah(item.price)}</Text>
              <Text style={[styles.itemColumn, styles.itemSubtotalColumn, { fontSize }]}>{formatRupiah(item.subtotal)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.itemRow}>
            <Text style={[styles.itemColumn, styles.itemNameColumn, { fontSize }]}>Tidak ada item</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Payment Details */}
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { fontSize }]}>Subtotal</Text>
          <Text style={[styles.detailValue, { fontSize }]}>{formatRupiah(subtotal)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { fontSize }]}>
            {storeSettings?.taxEnabled ? `PPN (${storeSettings.taxPercentage}%)` : 'PPN'}
          </Text>
          <Text style={[styles.detailValue, { fontSize }]}>{formatRupiah(tax)}</Text>
        </View>
        {/* Tampilkan Diskon hanya jika tidak ada poin yang digunakan */}
        {discount && discount > 0 && (!pointsRedeemed || pointsRedeemed <= 0) ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize }]}>Diskon</Text>
            <Text style={[styles.detailValue, { fontSize }]}>-{formatRupiah(discount)}</Text>
          </View>
        ) : null}
        {/* Tampilkan Potong Poin jika ada poin yang digunakan */}
        {pointsRedeemed && pointsRedeemed > 0 ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize }]}>Potong Poin</Text>
            <Text style={[styles.detailValue, { fontSize }]}>-{formatRupiah(pointsRedeemed)}</Text>
          </View>
        ) : null}
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { fontSize: storeSettings?.paperSize === '58mm' ? 14 : 16 }]}>Total</Text>
          <Text style={[styles.totalValue, { fontSize: storeSettings?.paperSize === '58mm' ? 14 : 16 }]}>{formatRupiah(total)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { fontSize }]}>Metode Bayar</Text>
          <Text style={[styles.detailValue, { fontSize }]}>{getPaymentMethodLabel(paymentMethod)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { fontSize }]}>Jumlah Bayar</Text>
          <Text style={[styles.detailValue, { fontSize }]}>{formatRupiah(amountPaid)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { fontSize }]}>Kembalian</Text>
          <Text style={[styles.detailValue, { fontSize }]}>{formatRupiah(change)}</Text>
        </View>
      </View>

      {/* Points Info */}
      {memberName && (
        <>
          {/* Divider */}
          <View style={styles.divider} />
          
          <View style={styles.pointsSection}>
            <Text style={[styles.pointsTitle, { fontSize: storeSettings?.paperSize === '58mm' ? 14 : 16 }]}>Member</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize }]}>Nama Member</Text>
              <Text style={[styles.detailValue, { fontSize }]}>{memberName}</Text>
            </View>
          </View>
        </>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Receipt Footer */}
      <View style={styles.receiptFooter}>
        <Text style={[styles.thankYou, { fontSize: storeSettings?.paperSize === '58mm' ? 18 : 20 }]}>TERIMA KASIH</Text>
        <Text style={[styles.footerText, { fontSize: smallFontSize }]}>{storeSettings?.footerMessage || 'Terima kasih telah berbelanja di toko kami!'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 10,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  storeName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  storeAddress: {
    color: '#666',
    marginBottom: 1,
  },
  storePhone: {
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 5,
  },
  transactionInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingVertical: 3,
    backgroundColor: '#f0f0f0',
  },
  itemsHeaderColumn: {
    fontWeight: 'bold',
    color: '#333',
  },
  itemNameHeader: {
    width: '40%',
    textAlign: 'left',
    paddingLeft: 3,
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
    paddingRight: 3,
  },
  itemsContainer: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemColumn: {
    color: '#333',
  },
  itemNameColumn: {
    width: '40%',
    textAlign: 'left',
    paddingLeft: 3,
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
    paddingRight: 3,
  },
  paymentDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 3,
    paddingTop: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  pointsSection: {
    marginBottom: 10,
  },
  pointsTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  receiptFooter: {
    alignItems: 'center',
    marginBottom: 10,
  },
  thankYou: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  footerText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 1,
  },
});

export default PrintableReceipt;