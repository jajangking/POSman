import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openDatabase, getRevenueByPeriod, getCOGSByPeriod, getOperatingExpenses, saveOperatingExpense, updateOperatingExpense, deleteOperatingExpense, OperatingExpense } from '../../services/DatabaseService';

interface ProfitLossReportScreenProps {
  onBack: () => void;
}

interface RevenueItem {
  name: string;
  amount: number;
}

interface ExpenseItem {
  id?: string;
  name: string;
  amount: number;
}

const ProfitLossReportScreen: React.FC<ProfitLossReportScreenProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [newExpense, setNewExpense] = useState<ExpenseItem>({ name: '', amount: 0 });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPeriodDates = () => {
    const today = new Date();
    let startDate, endDate;
    
    switch (timeRange) {
      case 'daily':
        startDate = formatDateToISO(today);
        endDate = startDate;
        break;
      case 'weekly':
        // Get start of week (Monday)
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = formatDateToISO(new Date(today.setDate(diff)));
        endDate = formatDateToISO(new Date(today.setDate(today.getDate() + 6)));
        break;
      case 'monthly':
        startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        break;
    }
    
    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Get period dates
      const { startDate, endDate } = getPeriodDates();
      
      // Fetch revenue data
      const revenueData = await getRevenueByPeriod(startDate, endDate);
      
      // Fetch COGS data
      const cogsData = await getCOGSByPeriod(startDate, endDate);
      
      // Fetch operating expenses
      const operatingExpenses = await getOperatingExpenses(timeRange, startDate, endDate);
      
      // Calculate net profit
      const grossProfit = revenueData.totalRevenue - cogsData.totalCOGS;
      const totalOperatingExpenses = operatingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = grossProfit - totalOperatingExpenses;
      
      // Format period for display
      let periodDisplay = '';
      switch (timeRange) {
        case 'daily':
          periodDisplay = `Harian - ${startDate}`;
          break;
        case 'weekly':
          periodDisplay = `Mingguan - ${startDate} sampai ${endDate}`;
          break;
        case 'monthly':
          const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          periodDisplay = `Bulanan - ${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
          break;
      }
      
      const data = {
        period: periodDisplay,
        revenue: revenueData.totalRevenue,
        costOfGoods: cogsData.totalCOGS,
        grossProfit: grossProfit,
        operatingExpenses: totalOperatingExpenses,
        netProfit: netProfit,
        revenueItems: revenueData.revenueItems,
        expenseItems: [
          { name: 'Harga Pokok Penjualan', amount: cogsData.totalCOGS },
          ...operatingExpenses.map(expense => ({ name: expense.name, amount: expense.amount }))
        ]
      };
      
      setReportData(data);
      setExpenses(operatingExpenses.map(expense => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount
      })));
    } catch (error) {
      console.error('Error fetching profit/loss data:', error);
      Alert.alert('Error', 'Failed to load profit/loss data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) {
      Alert.alert('Error', 'Please enter a valid expense name and amount');
      return;
    }
    
    try {
      const { startDate, endDate } = getPeriodDates();
      const expense = await saveOperatingExpense(
        newExpense.name,
        newExpense.amount,
        timeRange,
        startDate
      );
      
      setExpenses([...expenses, { id: expense.id, name: expense.name, amount: expense.amount }]);
      setNewExpense({ name: '', amount: 0 });
      setShowAddExpenseForm(false);
      fetchReportData(); // Refresh report data
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !editingExpense.id || !editingExpense.name || editingExpense.amount <= 0) {
      Alert.alert('Error', 'Please enter a valid expense name and amount');
      return;
    }
    
    try {
      const { startDate, endDate } = getPeriodDates();
      await updateOperatingExpense(
        editingExpense.id,
        editingExpense.name,
        editingExpense.amount,
        timeRange,
        startDate
      );
      
      setExpenses(expenses.map(expense => 
        expense.id === editingExpense.id ? editingExpense : expense
      ));
      setEditingExpense(null);
      fetchReportData(); // Refresh report data
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteOperatingExpense(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
      fetchReportData(); // Refresh report data
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Laba Rugi</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Memuat data laba rugi...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!reportData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporan Laba Rugi</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Data tidak tersedia</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Laba Rugi</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filter Periode</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'daily' && styles.activeFilterButton]}
                onPress={() => setTimeRange('daily')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'daily' && styles.activeFilterButtonText]}>
                  Harian
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'weekly' && styles.activeFilterButton]}
                onPress={() => setTimeRange('weekly')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'weekly' && styles.activeFilterButtonText]}>
                  Mingguan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, timeRange === 'monthly' && styles.activeFilterButton]}
                onPress={() => setTimeRange('monthly')}
              >
                <Text style={[styles.filterButtonText, timeRange === 'monthly' && styles.activeFilterButtonText]}>
                  Bulanan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Ringkasan Laba Rugi - {reportData.period}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Pendapatan:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.revenue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Harga Pokok Penjualan:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>
                  {formatCurrency(reportData.costOfGoods)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.divider]}>
                <Text style={styles.summaryLabel}>Laba Kotor (Gross Profit):</Text>
                <Text style={styles.summaryValue}>{formatCurrency(reportData.grossProfit)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biaya Operasional:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>
                  {formatCurrency(reportData.operatingExpenses)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Laba Bersih (Net Profit):</Text>
                <Text style={styles.totalValue}>{formatCurrency(reportData.netProfit)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Detail Pendapatan</Text>
            <View style={styles.detailCard}>
              {reportData.revenueItems.map((item: RevenueItem, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Pendapatan</Text>
                <Text style={styles.totalValue}>{formatCurrency(reportData.revenue)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detail Biaya</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddExpenseForm(true)}
              >
                <Text style={styles.addButtonText}>+ Tambah Biaya</Text>
              </TouchableOpacity>
            </View>
            
            {showAddExpenseForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Tambah Biaya Operasional</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nama biaya"
                  value={newExpense.name}
                  onChangeText={(text) => setNewExpense({...newExpense, name: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Jumlah biaya"
                  keyboardType="numeric"
                  value={newExpense.amount > 0 ? newExpense.amount.toString() : ''}
                  onChangeText={(text) => {
                    const amount = parseFloat(text) || 0;
                    setNewExpense({...newExpense, amount});
                  }}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddExpenseForm(false);
                      setNewExpense({ name: '', amount: 0 });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleAddExpense}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {editingExpense && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Edit Biaya Operasional</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nama biaya"
                  value={editingExpense.name}
                  onChangeText={(text) => setEditingExpense({...editingExpense, name: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Jumlah biaya"
                  keyboardType="numeric"
                  value={editingExpense.amount > 0 ? editingExpense.amount.toString() : ''}
                  onChangeText={(text) => {
                    const amount = parseFloat(text) || 0;
                    setEditingExpense({...editingExpense, amount});
                  }}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setEditingExpense(null)}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleUpdateExpense}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.detailCard}>
              {reportData.expenseItems.map((item: ExpenseItem, index: number) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.name}</Text>
                  <View style={styles.expenseActions}>
                    <Text style={[styles.detailValue, styles.negativeValue]}>
                      {formatCurrency(item.amount)}
                    </Text>
                    {item.name !== 'Harga Pokok Penjualan' && (
                      <>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => setEditingExpense({ 
                            id: (expenses.find(exp => exp.name === item.name) || {}).id,
                            name: item.name, 
                            amount: item.amount 
                          })}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => {
                            const expense = expenses.find(exp => exp.name === item.name);
                            if (expense && expense.id) {
                              handleDeleteExpense(expense.id);
                            }
                          }}
                        >
                          <Text style={styles.deleteButtonText}>Hapus</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Biaya</Text>
                <Text style={[styles.totalValue, styles.negativeValue]}>
                  {formatCurrency(reportData.costOfGoods + reportData.operatingExpenses)}
                </Text>
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
  filterSection: {
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#495057',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 5,
    paddingTop: 10,
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
  negativeValue: {
    color: '#FF3B30',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  formCard: {
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
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ProfitLossReportScreen;