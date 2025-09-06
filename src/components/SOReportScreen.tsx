import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Format number as Rupiah currency
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

interface SOReportScreenProps {
  reportData: {
    date: string;
    time: string;
    user: string;
    totalItems: number;
    itemsWithDiscrepancies: number;
    totalPlusItems: number;
    totalMinusItems: number;
    totalDiscrepancyQty: number;
    totalDiscrepancyValue: number;
    totalPlusValue: number;
    totalMinusValue: number;
    discrepancyDetails: Array<{
      code: string;
      sku: string;
      name: string;
      physicalQty: number;
      systemQty: number;
      difference: number;
      price: number;
      totalValue: number;
    }>;
    timestamp: string;
  };
  onResumeSO?: () => void;
  onNewSO?: () => void;
}

const SOReportScreen: React.FC<SOReportScreenProps> = ({ reportData, onResumeSO, onNewSO }) => {
  // Temukan item terbesar plus dan minus
  const plusItems = reportData.discrepancyDetails.filter(item => item.difference > 0);
  const minusItems = reportData.discrepancyDetails.filter(item => item.difference < 0);
  
  const largestPlusItem = plusItems.length > 0 
    ? plusItems.reduce((prev, current) => 
        Math.abs(current.difference) > Math.abs(prev.difference) ? current : prev
      )
    : null;
    
  const largestMinusItem = minusItems.length > 0 
    ? minusItems.reduce((prev, current) => 
        Math.abs(current.difference) > Math.abs(prev.difference) ? current : prev
      )
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Stock Opname</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Informasi Umum */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Stock Opname</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal:</Text>
              <Text style={styles.infoValue}>{reportData.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jam:</Text>
              <Text style={styles.infoValue}>{reportData.time}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User:</Text>
              <Text style={styles.infoValue}>{reportData.user}</Text>
            </View>
          </View>

          {/* Ringkasan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Item SO:</Text>
              <Text style={styles.summaryValue}>{reportData.totalItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item dengan Selisih:</Text>
              <Text style={styles.summaryValue}>{reportData.itemsWithDiscrepancies}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Kelebihan (+):</Text>
              <Text style={styles.summaryValue}>{reportData.totalPlusItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Kekurangan (-):</Text>
              <Text style={styles.summaryValue}>{reportData.totalMinusItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Selisih Qty:</Text>
              <Text style={styles.summaryValue}>{reportData.totalDiscrepancyQty}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Nilai Selisih:</Text>
              <Text style={[styles.summaryValue, reportData.totalDiscrepancyValue >= 0 ? styles.positive : styles.negative]}>
                {reportData.totalDiscrepancyValue >= 0 ? '+' : '-'}{formatRupiah(Math.abs(reportData.totalDiscrepancyValue))}
              </Text>
            </View>
          </View>

          {/* Item Terbesar Plus dan Minus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Terbesar</Text>
            
            {largestPlusItem ? (
              <View style={styles.itemCard}>
                <Text style={styles.itemTitle}>Item Kelebihan Terbesar</Text>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Kode:</Text>
                  <Text style={styles.itemValue}>{largestPlusItem.code}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Nama:</Text>
                  <Text style={styles.itemValue}>{largestPlusItem.name}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Sistem:</Text>
                  <Text style={styles.itemValue}>{largestPlusItem.systemQty}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Fisik:</Text>
                  <Text style={styles.itemValue}>{largestPlusItem.physicalQty}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Selisih:</Text>
                  <Text style={[styles.itemValue, styles.positive]}>+{largestPlusItem.difference}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Nilai:</Text>
                  <Text style={[styles.itemValue, styles.positive]}>+{formatRupiah(largestPlusItem.totalValue)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noItemText}>Tidak ada item kelebihan</Text>
            )}
            
            {largestMinusItem ? (
              <View style={styles.itemCard}>
                <Text style={styles.itemTitle}>Item Kekurangan Terbesar</Text>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Kode:</Text>
                  <Text style={styles.itemValue}>{largestMinusItem.code}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Nama:</Text>
                  <Text style={styles.itemValue}>{largestMinusItem.name}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Sistem:</Text>
                  <Text style={styles.itemValue}>{largestMinusItem.systemQty}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Fisik:</Text>
                  <Text style={styles.itemValue}>{largestMinusItem.physicalQty}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Selisih:</Text>
                  <Text style={[styles.itemValue, styles.negative]}>{largestMinusItem.difference}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemLabel}>Nilai:</Text>
                  <Text style={[styles.itemValue, styles.negative]}>-{formatRupiah(Math.abs(largestMinusItem.totalValue))}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noItemText}>Tidak ada item kekurangan</Text>
            )}
          </View>

          {/* Detail Selisih */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detail Selisih</Text>
            {reportData.discrepancyDetails.length > 0 ? (
              reportData.discrepancyDetails.map((item, index) => (
                <View key={item.code} style={styles.detailItem}>
                  <Text style={styles.detailItemNumber}>{index + 1}.</Text>
                  <View style={styles.detailItemInfo}>
                    <Text style={styles.detailItemName}>{item.name}</Text>
                    <Text style={styles.detailItemCode}>Kode: {item.code}</Text>
                  </View>
                  <View style={styles.detailItemValues}>
                    <Text style={styles.detailItemSystem}>Sistem: {item.systemQty}</Text>
                    <Text style={styles.detailItemPhysical}>Fisik: {item.physicalQty}</Text>
                    <Text style={[
                      styles.detailItemDifference,
                      item.difference > 0 ? styles.positive : styles.negative
                    ]}>
                      Selisih: {item.difference > 0 ? '+' : ''}{item.difference}
                    </Text>
                    <Text style={[
                      styles.detailItemValue,
                      item.totalValue > 0 ? styles.positive : styles.negative
                    ]}>
                      Nilai: {item.totalValue > 0 ? '+' : ''}{formatRupiah(Math.abs(item.totalValue))}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noItemText}>Tidak ada selisih</Text>
            )}
          </View>
        </ScrollView>

        {/* Tombol Aksi */}
        <View style={styles.buttonContainer}>
          {onResumeSO && (
            <TouchableOpacity style={styles.resumeButton} onPress={onResumeSO}>
              <Text style={styles.buttonText}>Resume SO</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.newButton} onPress={onNewSO}>
            <Text style={styles.buttonText}>SO Baru</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    width: 80,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemLabel: {
    fontSize: 14,
    color: '#666',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  noItemText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 10,
  },
  detailItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  detailItemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 30,
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detailItemCode: {
    fontSize: 14,
    color: '#666',
  },
  detailItemValues: {
    alignItems: 'flex-end',
  },
  detailItemSystem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  detailItemPhysical: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  detailItemDifference: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  detailItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  newButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SOReportScreen;