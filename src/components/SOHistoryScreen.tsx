import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import SO history service for real data
import { getAllSOHistory, deleteSOHistory } from '../services/SOHistoryService';

interface SOHistoryItem {
  id: string;
  date: string;
  user: string;
  totalItems: number;
  totalDifference: number;
  totalRpDifference: number;
  duration: number; // in seconds
}

interface SOHistoryScreenProps {
  onBack?: () => void;
  onViewReport?: (reportId: string) => void;
}

const SOHistoryScreen: React.FC<SOHistoryScreenProps> = ({ onBack, onViewReport }) => {
  const [soHistory, setSoHistory] = useState<SOHistoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real data from database
  useEffect(() => {
    fetchSOHistory();
  }, []);

  const fetchSOHistory = async () => {
    try {
      setLoading(true);
      const history = await getAllSOHistory();
      // Convert to the format expected by the UI
      const formattedHistory = history.map(item => ({
        id: item.id,
        date: item.date,
        user: item.userName,
        totalItems: item.totalItems,
        totalDifference: item.totalDifference,
        totalRpDifference: item.totalRpDifference,
        duration: item.duration
      }));
      setSoHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching SO history:', error);
      Alert.alert('Error', 'Failed to load SO history');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus ${selectedItems.length} riwayat SO?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSOHistory(selectedItems);
              // Refresh the list
              await fetchSOHistory();
              setSelectedItems([]);
              setIsSelectMode(false);
              Alert.alert('Berhasil', 'Riwayat SO berhasil dihapus');
            } catch (error) {
              console.error('Error deleting SO history:', error);
              Alert.alert('Error', 'Failed to delete SO history');
            }
          }
        }
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} menit ${remainingSeconds} detik`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderHistoryItem = ({ item }: { item: SOHistoryItem }) => {
    return (
      <TouchableOpacity 
        style={[styles.historyItem, selectedItems.includes(item.id) && styles.selectedItem]} 
        onPress={() => {
          if (isSelectMode) {
            toggleItemSelection(item.id);
          } else {
            onViewReport && onViewReport(item.id);
          }
        }}
        onLongPress={() => {
          if (!isSelectMode) {
            setIsSelectMode(true);
            toggleItemSelection(item.id);
          }
        }}
      >
        {isSelectMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, selectedItems.includes(item.id) && styles.checked]}>
              {selectedItems.includes(item.id) && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        )}
        <View style={styles.historyItemContent}>
          <View style={styles.historyItemHeader}>
            <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
            <Text style={styles.historyUser}>{item.user}</Text>
          </View>
          <View style={styles.historyItemDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID SO:</Text>
              <Text style={styles.detailValue}>{item.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Item:</Text>
              <Text style={styles.detailValue}>{item.totalItems}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selisih Qty:</Text>
              <Text style={[styles.detailValue, item.totalDifference < 0 ? styles.minusText : styles.plusText]}>
                {item.totalDifference > 0 ? `+${item.totalDifference}` : item.totalDifference}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selisih Rp:</Text>
              <Text style={[styles.detailValue, item.totalRpDifference < 0 ? styles.minusText : styles.plusText]}>
                {item.totalRpDifference > 0 ? 
                  `+Rp ${Math.abs(item.totalRpDifference).toLocaleString('id-ID')}` : 
                  `-Rp ${Math.abs(item.totalRpDifference).toLocaleString('id-ID')}`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durasi:</Text>
              <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Riwayat Stock Opname</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat riwayat SO...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Stock Opname</Text>
          <View style={styles.headerButtons}>
            {isSelectMode ? (
              <>
                <TouchableOpacity style={styles.headerButton} onPress={deleteSelectedItems}>
                  <Text style={styles.headerButtonText}>Hapus</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={toggleSelectMode}>
                  <Text style={styles.headerButtonText}>Batal</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.headerButton} onPress={toggleSelectMode}>
                <Text style={styles.headerButtonText}>Pilih</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Ringkasan</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total SO:</Text>
                <Text style={styles.summaryValue}>{soHistory.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rata-rata Item/SO:</Text>
                <Text style={styles.summaryValue}>
                  {soHistory.length > 0 ? Math.round(soHistory.reduce((sum, item) => sum + item.totalItems, 0) / soHistory.length) : 0}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Daftar Riwayat SO</Text>
            {soHistory.length > 0 ? (
              <FlatList
                data={soHistory}
                renderItem={renderHistoryItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>Belum ada riwayat Stock Opname</Text>
            )}
          </View>
        </ScrollView>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 10,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
  historySection: {
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  checkboxContainer: {
    justifyContent: 'center',
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyUser: {
    fontSize: 14,
    color: '#666',
  },
  historyItemDetails: {
    // No additional styling needed
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  plusText: {
    color: '#34C759',
  },
  minusText: {
    color: '#FF3B30',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SOHistoryScreen;