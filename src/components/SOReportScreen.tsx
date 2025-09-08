import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeItems, getItemsForMonitoring, getConsecutiveSOItems, getTotalItemsInDatabase } from '../services/SOAnalysisService';
import { getAllSOHistory } from '../services/SOHistoryService';

interface SOReportScreenProps {
  onBack?: () => void;
  onNavigateToDashboard?: () => void;
  reportData?: any;
  onNavigateToItemLog?: (itemCode: string, itemName: string) => void;
}

const SOReportScreen: React.FC<SOReportScreenProps> = ({ onBack, onNavigateToDashboard, reportData, onNavigateToItemLog = () => {} }) => {
  // Use real data if provided, otherwise use mock data
  const data = reportData ? {
    ...reportData,
    // Provide default values for missing fields
    totalItems: reportData.totalItems || 0,
    totalQtyDifference: reportData.totalQtyDifference || reportData.totalDifference || 0,
    totalRpDifference: reportData.totalRpDifference || 0,
    soDuration: reportData.soDuration || '0 menit 0 detik',
    soUser: reportData.soUser || reportData.userName || 'Unknown User',
    soDate: reportData.soDate || reportData.date || new Date().toISOString(),
    largestMinusItem: reportData.largestMinusItem || null,
    largestPlusItem: reportData.largestPlusItem || null,
    consecutiveMinusItems: reportData.consecutiveMinusItems || [],
    consecutivePlusItems: reportData.consecutivePlusItems || [],
    items: reportData.items || [],
    percentageSO: reportData.percentageSO || '0%',
    totalDatabaseItems: reportData.totalDatabaseItems || 0
  } : {
    totalItems: 0,
    totalQtyDifference: 0,
    totalRpDifference: 0,
    soDuration: '0 menit 0 detik',
    soUser: 'Unknown User',
    soDate: new Date().toISOString(),
    largestMinusItem: null,
    largestPlusItem: null,
    consecutiveMinusItems: [],
    consecutivePlusItems: [],
    items: [],
    percentageSO: '0%',
    totalDatabaseItems: 0
  };

  const [itemAnalysis, setItemAnalysis] = useState<any[]>([]);
  const [itemsForMonitoring, setItemsForMonitoring] = useState<any[]>([]);
  const [consecutiveSOItems, setConsecutiveSOItems] = useState<{minusItems: any[], plusItems: any[]}>({minusItems: [], plusItems: []});
  const [soStatistics, setSoStatistics] = useState({
    totalSO: 0,
    avgItemsPerSO: 0,
    avgDuration: '0 menit 0 detik',
    totalDatabaseItems: 0,
    percentageSO: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{code: string, name: string} | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        
        // Load item analysis (only for items in current SO)
        const analysis = await analyzeItems(data.items);
        setItemAnalysis(analysis);
        console.log('Item analysis loaded:', analysis);
        
        // Load items for monitoring (only for items in current SO)
        const monitoring = await getItemsForMonitoring(data.items);
        setItemsForMonitoring(monitoring);
        console.log('Items for monitoring loaded:', monitoring);
        
        // Load consecutive SO items (only for items in current SO)
        const consecutiveItems = await getConsecutiveSOItems(data.items);
        setConsecutiveSOItems(consecutiveItems);
        console.log('Consecutive SO items loaded:', consecutiveItems);
        
        // Load SO statistics
        try {
          const history = await getAllSOHistory();
          console.log('SO history loaded:', history);
          const totalSO = history.length;
          const avgItemsPerSO = totalSO > 0 
            ? Math.round(history.reduce((sum, so) => sum + so.totalItems, 0) / totalSO)
            : 0;
          
          const avgDurationSeconds = totalSO > 0
            ? Math.round(history.reduce((sum, so) => sum + so.duration, 0) / totalSO)
            : 0;
          
          const avgDuration = `${Math.floor(avgDurationSeconds / 60)} menit ${avgDurationSeconds % 60} detik`;
          
          // Get total items in database for percentage calculation
          const totalDatabaseItems = await getTotalItemsInDatabase();
          console.log('Total database items:', totalDatabaseItems);
          const percentageSO = totalDatabaseItems > 0 
            ? `${Math.round((data.items.length / totalDatabaseItems) * 100)}%`
            : '0%';
          
          setSoStatistics({
            totalSO,
            avgItemsPerSO,
            avgDuration,
            totalDatabaseItems,
            percentageSO
          });
          console.log('SO statistics loaded:', { totalSO, avgItemsPerSO, avgDuration, totalDatabaseItems, percentageSO });
        } catch (error) {
          console.error('Error loading SO statistics:', error);
        }
      } catch (error) {
        console.error('Error loading analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Stock Opname</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat analisis dan statistik...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Stock Opname</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.reportContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status SO</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>✅ SO telah diselesaikan</Text>
                <Text style={styles.statusText}>✅ Database qty telah diperbaiki secara otomatis</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detail Item</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.noColumn]}>No</Text>
                <Text style={[styles.tableHeaderText, styles.itemColumn]}>Item</Text>
                <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Sistem</Text>
                <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Fisik</Text>
                <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Selisih</Text>
                <Text style={[styles.tableHeaderText, styles.totalColumn]}>Total</Text>
              </View>
              
              {data.items && data.items.length > 0 ? (
                data.items.map((item: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCellText, styles.noColumn]}>{index + 1}</Text>
                    <View style={[styles.itemColumn, styles.itemContainer]}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemCode} numberOfLines={1}>{item.code}</Text>
                    </View>
                    <Text style={[styles.tableCellText, styles.qtyColumn]}>{item.systemQty}</Text>
                    <Text style={[styles.tableCellText, styles.qtyColumn]}>{item.physicalQty}</Text>
                    <Text style={[styles.tableCellText, styles.qtyColumn, item.difference < 0 ? styles.minusText : item.difference > 0 ? styles.plusText : null]}>
                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                    </Text>
                    <Text style={[styles.tableCellText, styles.totalColumn]}>
                      {item.total > 0 ? 
                        `+Rp ${Math.abs(item.total).toLocaleString('id-ID')}` : 
                        item.total < 0 ? 
                        `-Rp ${Math.abs(item.total).toLocaleString('id-ID')}` : 
                        `Rp ${Math.abs(item.total).toLocaleString('id-ID')}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Detail item akan ditampilkan di sini</Text>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Barang dengan SO Minus Berulang</Text>
              <Text style={styles.sectionDescription}>Jumlah item: {consecutiveSOItems.minusItems.length}</Text>
              {consecutiveSOItems.minusItems.length > 0 ? (
                consecutiveSOItems.minusItems.map((item: any, index: number) => (
                  <View key={index} style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>
                      {item.name} ({item.code})
                    </Text>
                    <Text style={[styles.summaryValue, styles.minusText]}>
                      {item.consecutiveCount} kali berturut-turut
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Tidak ada item dengan SO minus berulang</Text>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Barang dengan SO Plus Berulang</Text>
              <Text style={styles.sectionDescription}>Jumlah item: {consecutiveSOItems.plusItems.length}</Text>
              {consecutiveSOItems.plusItems.length > 0 ? (
                consecutiveSOItems.plusItems.map((item: any, index: number) => (
                  <View key={index} style={styles.summaryRow}>
                    <Text style={styles.summaryValue}>
                      {item.name} ({item.code})
                    </Text>
                    <Text style={[styles.summaryValue, styles.plusText]}>
                      {item.consecutiveCount} kali berturut-turut
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Tidak ada item dengan SO plus berulang</Text>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analisis Per Item</Text>
              <Text style={styles.sectionDescription}>Jumlah item yang dianalisis: {itemAnalysis.length}</Text>
              {itemAnalysis.length > 0 ? (
                itemAnalysis.map((item, index) => (
                  <View key={index} style={styles.analysisItem}>
                    <Text style={styles.analysisItemName}>{item.name} ({item.code})</Text>
                    <Text style={styles.analysisItemStatus}>{item.status}</Text>
                    <Text style={styles.analysisItemHistory}>{item.history}</Text>
                    <Text style={styles.analysisItemRecommendation}>{item.recommendation}</Text>
                    <Text style={styles.detailText}>Tren Terkini: {item.recentTrend}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Tidak ada analisis item</Text>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pemantauan Barang</Text>
              <Text style={styles.sectionDescription}>Jumlah item untuk pemantauan: {itemsForMonitoring.length}</Text>
              <Text style={styles.sectionDescription}>
                Berdasarkan analisis di atas, berikut rekomendasi pemantauan untuk barang yang memerlukan perhatian:
              </Text>
              {itemsForMonitoring.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.monitoringItem}
                  onPress={() => {
                    try {
                      onNavigateToItemLog(item.code, item.name);
                    } catch (error) {
                      console.warn('Failed to navigate to item log:', error);
                    }
                  }}
                >
                  <Text style={styles.monitoringItemName}>{item.name} ({item.code})</Text>
                  <Text style={styles.monitoringItemStatus}>{item.status}</Text>
                  <Text style={styles.monitoringItemRecommendation}>{item.recommendation}</Text>
                </TouchableOpacity>
              ))}
              {itemsForMonitoring.length === 0 && (
                <Text style={styles.sectionDescription}>
                  Tidak ada barang yang memerlukan pemantauan khusus saat ini.
                </Text>
              )}
              <Text style={styles.sectionDescription}>
                Disarankan untuk:
              </Text>
              <Text style={styles.listText}>• Meningkatkan pengawasan terhadap barang yang sering minus</Text>
              <Text style={styles.listText}>• Memeriksa prosedur penyimpanan dan pengeluaran untuk barang bermasalah</Text>
              <Text style={styles.listText}>• Melakukan pelatihan ulang kepada staf yang menangani barang bermasalah</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informasi SO</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ID SO:</Text>
                <Text style={styles.summaryValue}>{data.id || 'N/A'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tanggal SO:</Text>
                <Text style={styles.summaryValue}>{new Date(data.soDate).toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>User SO:</Text>
                <Text style={styles.summaryValue}>{data.soUser}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durasi SO:</Text>
                <Text style={styles.summaryValue}>{data.soDuration}</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ringkasan</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Item SO:</Text>
                <Text style={styles.summaryValue}>{data.totalItems}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Qty Selisih:</Text>
                <Text style={[styles.summaryValue, data.totalQtyDifference < 0 ? styles.minusText : data.totalQtyDifference > 0 ? styles.plusText : null]}>
                  {data.totalQtyDifference > 0 ? `+${data.totalQtyDifference}` : data.totalQtyDifference}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Selisih Rp:</Text>
                <Text style={[styles.summaryValue, data.totalRpDifference < 0 ? styles.minusText : data.totalRpDifference > 0 ? styles.plusText : null]}>
                  {data.totalRpDifference > 0 ? 
                    `+Rp ${Math.abs(data.totalRpDifference).toLocaleString('id-ID')}` : 
                    data.totalRpDifference < 0 ? 
                    `-Rp ${Math.abs(data.totalRpDifference).toLocaleString('id-ID')}` : 
                    `Rp ${Math.abs(data.totalRpDifference).toLocaleString('id-ID')}`}
                </Text>
              </View>
            </View>
            
            {data.largestMinusItem && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Item Terbesar</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Minus Terbesar:</Text>
                  <Text style={[styles.summaryValue, styles.minusText]}>
                    {data.largestMinusItem.name} ({data.largestMinusItem.code})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.minusText, styles.detailText]}>
                    Selisih: {data.largestMinusItem.difference}, Total: {data.largestMinusItem.total < 0 ? '-' : ''}Rp {Math.abs(data.largestMinusItem.total).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            )}
            
            {data.largestPlusItem && (
              <View style={styles.section}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plus Terbesar:</Text>
                  <Text style={[styles.summaryValue, styles.plusText]}>
                    {data.largestPlusItem.name} ({data.largestPlusItem.code})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.plusText, styles.detailText]}>
                    Selisih: +{data.largestPlusItem.difference}, Total: +Rp {Math.abs(data.largestPlusItem.total).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistik SO</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total SO:</Text>
                <Text style={styles.summaryValue}>{soStatistics.totalSO}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rata-rata Item/SO:</Text>
                <Text style={styles.summaryValue}>{soStatistics.avgItemsPerSO}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rata-rata Durasi:</Text>
                <Text style={styles.summaryValue}>{soStatistics.avgDuration}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Persentase Item SO:</Text>
                <Text style={styles.summaryValue}>{soStatistics.percentageSO} dari {soStatistics.totalDatabaseItems} barang</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Dari total {data.totalItems} item yang di SO, sebanyak {soStatistics.percentageSO} dari total barang dalam database telah diperiksa.
              </Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.bottomButtonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.backButton, styles.historyButton]} 
              onPress={onBack}
            >
              <Text style={styles.backButtonText}>History SO</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.backButton, styles.finishButton]} 
              onPress={onNavigateToDashboard || onBack}
            >
              <Text style={styles.backButtonText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  reportContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statusContainer: {
    padding: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#34C759',
    marginBottom: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  plusText: {
    color: '#34C759',
    fontWeight: '600',
  },
  minusText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  tableCellText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  noColumn: {
    width: '5%',
  },
  itemColumn: {
    width: '35%',
  },
  qtyColumn: {
    width: '12%',
  },
  totalColumn: {
    width: '15%',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  itemCode: {
    fontSize: 12,
    color: '#888',
    textAlign: 'left',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 30,
  },
  analysisItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  analysisItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  analysisItemStatus: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  analysisItemHistory: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  analysisItemRecommendation: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  monitoringItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  monitoringItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  monitoringItemStatus: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
    marginBottom: 3,
  },
  monitoringItemRecommendation: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  listText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingBottom: 35,
    paddingTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flex: 1,
    marginHorizontal: 5,
  },
  historyButton: {
    backgroundColor: '#007AFF',
  },
  finishButton: {
    backgroundColor: '#34C759',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SOReportScreen;