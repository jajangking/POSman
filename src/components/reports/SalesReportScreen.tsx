import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { openDatabase } from '../../services/DatabaseService';

interface SalesData {
  id: number;
  date: string;
  sales: number;
  totalReceipts: number;
  soDifference: number;
}

const SalesReportScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchSalesData();
  }, [currentMonth]);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const database = await openDatabase();
      
      // Get the year and month for the current view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Get all days in the month
      const daysInMonth = getDaysInMonth(year, month);
      
      // Get the start of the current month
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      
      // For the end date, we need to consider if we're in the current month
      const today = new Date();
      let endDate;
      
      // If we're viewing the current month, only show up to today
      if (year === today.getFullYear() && month === today.getMonth()) {
        endDate = formatDateToISO(today);
      } else {
        // If we're viewing a different month, show all days in that month
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      }
      
      // Query to get daily sales data
      const result: any[] = await database.getAllAsync(
        `SELECT 
          date(createdAt) as date,
          SUM(price * quantity) as dailySales,
          COUNT(DISTINCT reference) as dailyReceipts
        FROM inventory_transactions 
        WHERE type = 'out' 
        AND date(createdAt) >= ? 
        AND date(createdAt) <= ?
        GROUP BY date(createdAt)
        ORDER BY date(createdAt)`,
        [startDate, endDate]
      );
      
      // For SO difference, we'll need to query the so_history table
      const soResult: any[] = await database.getAllAsync(
        `SELECT 
          date(date) as date,
          SUM(totalRpDifference) as dailySODifference
        FROM so_history 
        WHERE date(date) >= ? 
        AND date(date) <= ?
        GROUP BY date(date)
        ORDER BY date(date)`,
        [startDate, endDate]
      );
      
      // Convert results to maps for easy lookup
      const salesMap = new Map<string, { sales: number; receipts: number }>();
      result.forEach(item => {
        salesMap.set(item.date, {
          sales: parseFloat(item.dailySales) || 0,
          receipts: parseInt(item.dailyReceipts) || 0
        });
      });
      
      const soMap = new Map<string, number>();
      soResult.forEach(item => {
        soMap.set(item.date, parseFloat(item.dailySODifference) || 0);
      });
      
      // Determine the last day to show
      let lastDayToShow;
      if (year === today.getFullYear() && month === today.getMonth()) {
        // If we're in the current month, show up to today
        lastDayToShow = today.getDate();
      } else {
        // If we're in a different month, show all days
        lastDayToShow = daysInMonth;
      }
      
      // Create data for days in the month (1 to lastDayToShow)
      const allDaysData: SalesData[] = [];
      for (let day = 1; day <= lastDayToShow; day++) {
        const date = new Date(year, month, day);
        const isoDate = formatDateToISO(date);
        
        const salesInfo = salesMap.get(isoDate) || { sales: 0, receipts: 0 };
        const soDifference = soMap.get(isoDate) || 0;
        
        // Include days with their actual date number as ID
        allDaysData.push({
          id: day, // Use the actual day number as ID
          date: isoDate,
          sales: salesInfo.sales,
          totalReceipts: salesInfo.receipts,
          soDifference: soDifference
        });
      }
      
      setSalesData(allDaysData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
      // Fallback to sample data in case of error
      const sampleData: SalesData[] = [
        { id: 1, date: '2023-05-01', sales: 15000000, totalReceipts: 45, soDifference: 120000 },
        { id: 2, date: '2023-05-02', sales: 18000000, totalReceipts: 52, soDifference: -75000 },
        { id: 3, date: '2023-05-03', sales: 12500000, totalReceipts: 38, soDifference: 210000 },
        { id: 4, date: '2023-05-04', sales: 21000000, totalReceipts: 61, soDifference: -35000 },
        { id: 5, date: '2023-05-05', sales: 19500000, totalReceipts: 55, soDifference: 95000 },
        { id: 6, date: '2023-05-06', sales: 22500000, totalReceipts: 68, soDifference: -125000 },
        { id: 7, date: '2023-05-07', sales: 17500000, totalReceipts: 49, soDifference: 80000 },
      ];
      setSalesData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSales = () => {
    return salesData.reduce((sum, item) => sum + item.sales, 0);
  };

  const getTotalReceipts = () => {
    return salesData.reduce((sum, item) => sum + item.totalReceipts, 0);
  };

  const getTotalSODifference = () => {
    return salesData.reduce((sum, item) => sum + item.soDifference, 0);
  };

  const getAverageSales = () => {
    if (salesData.length === 0) return 0;
    return Math.round(getTotalSales() / salesData.length);
  };

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Penjualan</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data penjualan...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Penjualan</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>{formatMonthYear(currentMonth)}</Text>
            <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>Detail Penjualan Harian</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, styles.noColumn]}>No</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.salesColumn]}>Sales</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.receiptsColumn]}>Total Struk</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.soColumn]}>Hasil Selisih SO</Text>
            </View>
            {salesData.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.noColumn]}>{item.id}</Text>
                <Text style={[styles.tableCell, styles.salesColumn]}>{formatCurrency(item.sales)}</Text>
                <Text style={[styles.tableCell, styles.receiptsColumn]}>{item.totalReceipts.toLocaleString('id-ID')}</Text>
                <Text style={[styles.tableCell, styles.soColumn, item.soDifference < 0 ? styles.negativeValue : styles.positiveValue]}>
                  {formatCurrency(item.soDifference)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Ringkasan Penjualan</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Penjualan:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(getTotalSales())}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Struk:</Text>
                <Text style={styles.summaryValue}>{getTotalReceipts().toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Selisih SO:</Text>
                <Text style={[styles.summaryValue, getTotalSODifference() < 0 ? styles.negativeValue : styles.positiveValue]}>
                  {formatCurrency(getTotalSODifference())}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rata-rata Penjualan/Hari:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(getAverageSales())}</Text>
              </View>
            </View>
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
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  summarySection: {
    marginBottom: 20,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  positiveValue: {
    color: '#28a745',
  },
  negativeValue: {
    color: '#dc3545',
  },
  tableSection: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    padding: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  headerCell: {
    color: 'white',
    fontWeight: 'bold',
  },
  noColumn: {
    flex: 0.5,
  },
  salesColumn: {
    flex: 2,
  },
  receiptsColumn: {
    flex: 1.5,
  },
  soColumn: {
    flex: 2,
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

export default SalesReportScreen;