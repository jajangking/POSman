import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../models/User';
import { getTotalSalesForCashier, getTransactionCountForCashier, getWorkDurationForCashier, getPaymentMethodBreakdownForCashier, saveSetoranToHistory, getSetoranHistory } from '../services/DatabaseService';

interface SetoranPageProps {
  onBack: () => void;
  currentUser: User;
}

const SetoranPage: React.FC<SetoranPageProps> = ({ onBack, currentUser }) => {
  const [step, setStep] = useState(1); // 1: Input fisik uang, 2: Hasil perbandingan
  const [view, setView] = useState<'main' | 'history'>('main'); // main: Setoran form, history: Setoran history
  const [systemSales, setSystemSales] = useState('');
  const [physicalCash, setPhysicalCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [comparisonResult, setComparisonResult] = useState<{
    difference: number;
    status: 'surplus' | 'deficit' | 'balanced';
  } | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [workDuration, setWorkDuration] = useState(0); // in minutes
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [setoranHistory, setSetoranHistory] = useState<any[]>([]); // For storing setoran history
  const [historyLoading, setHistoryLoading] = useState(false); // For history loading state
  
  // Use the current user's username as the cashier name
  const cashierName = currentUser.username;

  // Load the data for the current user when the component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [totalSales, totalCount, duration, paymentBreakdown] = await Promise.all([
          getTotalSalesForCashier(currentUser.id),
          getTransactionCountForCashier(currentUser.id),
          getWorkDurationForCashier(currentUser.id),
          getPaymentMethodBreakdownForCashier(currentUser.id)
        ]);
        
        setSystemSales(totalSales.toString());
        setTransactionCount(totalCount);
        setWorkDuration(duration);
        setPaymentMethodBreakdown(paymentBreakdown);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Gagal memuat data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser.id]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'history') {
        // If viewing history, go back to main setoran view
        setView('main');
        return true;
      }
      
      // Show confirmation dialog before going back
      if (step === 1) {
        // If on step 1, just go back without confirmation
        onBack();
        return true;
      } else {
        // If on step 2, show confirmation dialog
        Alert.alert(
          'Konfirmasi',
          'Apakah Anda yakin ingin kembali? Data setoran yang belum disimpan akan hilang.',
          [
            {
              text: 'Batal',
              style: 'cancel'
            },
            {
              text: 'Ya, Kembali',
              onPress: () => {
                setStep(1);
                // Reset form data when going back to step 1
                setPhysicalCash('');
                setShiftNotes('');
                setComparisonResult(null);
              }
            }
          ]
        );
        return true;
      }
    });

    // Cleanup function
    return () => {
      backHandler.remove();
    };
  }, [step, view, onBack]);

  // Load setoran history
  const loadSetoranHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await getSetoranHistory(currentUser.id);
      setSetoranHistory(history);
    } catch (error) {
      console.error('Error loading setoran history:', error);
      Alert.alert('Error', 'Gagal memuat history setoran. Silakan coba lagi.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format number as currency for display
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return num.toLocaleString('id-ID');
  };

  // Handle physical cash input
  const handlePhysicalCashChange = (text: string) => {
    // Remove all non-numeric characters
    const numericValue = text.replace(/\D/g, '');
    
    // Update state with raw numeric value
    setPhysicalCash(numericValue);
  };

  const handleProcessPhysicalCash = () => {
    if (!physicalCash || parseFloat(physicalCash) < 0) {
      Alert.alert('Error', 'Masukkan jumlah uang fisik yang valid');
      return;
    }

    // Automatically compare when user proceeds to step 2
    handleCompareCash();
    setStep(2);
  };

  const handleCompareCash = () => {
    if (!systemSales || parseFloat(systemSales) < 0) {
      Alert.alert('Error', 'Data pendapatan sistem tidak tersedia');
      return;
    }

    if (!physicalCash || parseFloat(physicalCash) < 0) {
      Alert.alert('Error', 'Masukkan jumlah uang fisik yang valid');
      return;
    }

    const systemAmount = parseFloat(systemSales);
    const physicalAmount = parseFloat(physicalCash);
    const difference = physicalAmount - systemAmount;
    
    let status: 'surplus' | 'deficit' | 'balanced' = 'balanced';
    if (difference > 0) {
      status = 'surplus';
    } else if (difference < 0) {
      status = 'deficit';
    }

    setComparisonResult({
      difference,
      status
    });
  };

  const handleSaveSetoran = () => {
    // Show confirmation dialog before saving
    Alert.alert(
      'Konfirmasi Setoran',
      'Apakah Anda yakin ingin menyimpan setoran ini?',
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Simpan',
          onPress: async () => {
            try {
              // Save to history database
              await saveSetoranToHistory(
                currentUser.id,
                cashierName,
                parseFloat(physicalCash || '0'),
                parseFloat(systemSales || '0'),
                comparisonResult ? comparisonResult.difference : 0,
                comparisonResult ? comparisonResult.status : 'balanced',
                shiftNotes,
                paymentMethodBreakdown
              );
              
              // Show success message
              let message = `Setoran berhasil disimpan:\n\n`;
              message += `Kasir: ${cashierName}\n`;
              message += `Pendapatan Tunai (Disetor): Rp ${formatCurrency(systemSales || 0)}\n`;
              message += `Uang Fisik: Rp ${formatCurrency(physicalCash || 0)}\n`;
              
              if (comparisonResult) {
                if (comparisonResult.status === 'surplus') {
                  message += `Kelebihan: Rp ${formatCurrency(Math.abs(comparisonResult.difference))}\n`;
                } else if (comparisonResult.status === 'deficit') {
                  message += `Kekurangan: Rp ${formatCurrency(Math.abs(comparisonResult.difference))}\n`;
                } else {
                  message += `Balance: Jumlah sesuai\n`;
                }
              }
              
              // Add non-cash payment information
              const totalNonCash = (paymentMethodBreakdown['card'] || 0) + (paymentMethodBreakdown['ewallet'] || 0) + (paymentMethodBreakdown['onlineshop'] || 0);
              if (totalNonCash > 0) {
                message += `\nPendapatan Non-Tunai:\n`;
                if (paymentMethodBreakdown['card']) message += `- Kartu: Rp ${formatCurrency(paymentMethodBreakdown['card'])}\n`;
                if (paymentMethodBreakdown['ewallet']) message += `- E-Wallet: Rp ${formatCurrency(paymentMethodBreakdown['ewallet'])}\n`;
                if (paymentMethodBreakdown['onlineshop']) message += `- Online Shop: Rp ${formatCurrency(paymentMethodBreakdown['onlineshop'])}\n`;
                message += `Total Non-Tunai: Rp ${formatCurrency(totalNonCash)}\n`;
              }
              
              // Add total income
              const totalIncome = parseFloat(systemSales || '0') + totalNonCash;
              message += `\nTotal Pendapatan: Rp ${formatCurrency(totalIncome)}\n`;
              
              if (shiftNotes) {
                message += `\nCatatan: ${shiftNotes}\n`;
              }

              Alert.alert(
                'Sukses',
                message,
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Reset form after saving
                      resetForm();
                      // Go back to main dashboard
                      onBack();
                    } 
                  }
                ]
              );
            } catch (error) {
              console.error('Error saving setoran:', error);
              Alert.alert('Error', 'Gagal menyimpan setoran. Silakan coba lagi.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setStep(1);
    setPhysicalCash('');
    setShiftNotes('');
    setComparisonResult(null);
    setPaymentMethodBreakdown({});
  };

  // Format work duration in hours and minutes
  const formatWorkDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} menit`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} jam`;
    }
    
    return `${hours} jam ${remainingMinutes} menit`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (view === 'history') {
              // If viewing history, go back to main setoran view
              setView('main');
              return;
            }
            
            // Show confirmation dialog before going back
            if (step === 1) {
              // If on step 1, just go back without confirmation
              onBack();
            } else {
              // If on step 2, show confirmation dialog
              Alert.alert(
                'Konfirmasi',
                'Apakah Anda yakin ingin kembali? Data setoran yang belum disimpan akan hilang.',
                [
                  {
                    text: 'Batal',
                    style: 'cancel'
                  },
                  {
                    text: 'Ya, Kembali',
                    onPress: () => {
                      setStep(1);
                      // Reset form data when going back to step 1
                      setPhysicalCash('');
                      setShiftNotes('');
                      setComparisonResult(null);
                    }
                  }
                ]
              );
            }
          }}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{view === 'history' ? 'History Setoran' : 'Setoran'}</Text>
          {view === 'main' ? (
            <TouchableOpacity style={styles.historyButton} onPress={() => {
              setView('history');
              loadSetoranHistory();
            }}>
              <Text style={styles.historyButtonText}>Riwayat</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <ScrollView style={styles.content}>
          {view === 'main' && (
            <>
              {step === 1 && (
                <View style={styles.formContainer}>
                  <Text style={styles.stepTitle}>Langkah 1: Input Setoran Fisik</Text>
                  
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Memuat data sistem...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Kasir:</Text>
                        <Text style={styles.summaryValue}>{cashierName}</Text>
                      </View>

                      <Text style={styles.label}>Uang Fisik (Rp)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Masukkan jumlah uang fisik (tanpa Rp)"
                        value={physicalCash ? formatCurrency(physicalCash) : ''}
                        onChangeText={handlePhysicalCashChange}
                        keyboardType="numeric"
                      />

                      <Text style={styles.label}>Catatan Shift (Opsional)</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Masukkan catatan shift (jika ada)"
                        value={shiftNotes}
                        onChangeText={setShiftNotes}
                        multiline
                        numberOfLines={3}
                      />

                      <TouchableOpacity style={styles.nextButton} onPress={handleProcessPhysicalCash}>
                        <Text style={styles.nextButtonText}>Proses & Lanjutkan</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {step === 2 && (
                <View style={styles.formContainer}>
                  <Text style={styles.stepTitle}>Hasil Perbandingan</Text>
                  
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Kasir:</Text>
                    <Text style={styles.summaryValue}>{cashierName}</Text>
                    
                    <Text style={styles.summaryLabel}>Total Struk:</Text>
                    <Text style={styles.summaryValue}>{transactionCount} struk</Text>
                    
                    <Text style={styles.summaryLabel}>Durasi Kerja:</Text>
                    <Text style={styles.summaryValue}>{formatWorkDuration(workDuration)}</Text>
                  </View>

                  {comparisonResult && (
                    <View style={[
                      styles.resultBox, 
                      comparisonResult.status === 'surplus' ? styles.surplusBox : 
                      comparisonResult.status === 'deficit' ? styles.deficitBox : 
                      styles.balancedBox
                    ]}>
                      <Text style={styles.resultTitle}>Selisih Setoran</Text>
                      
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Pendapatan Sistem:</Text>
                        <Text style={styles.resultValue}>Rp {formatCurrency(systemSales || 0)}</Text>
                      </View>
                      
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Uang Fisik:</Text>
                        <Text style={styles.resultValue}>Rp {formatCurrency(physicalCash || 0)}</Text>
                      </View>
                      
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Selisih:</Text>
                        <Text style={[
                          styles.resultValue,
                          comparisonResult.status === 'surplus' ? styles.surplusText : 
                          comparisonResult.status === 'deficit' ? styles.deficitText : 
                          styles.balancedText
                        ]}>
                          {comparisonResult.status === 'surplus' ? '+' : comparisonResult.status === 'deficit' ? '-' : ''}
                          Rp {formatCurrency(Math.abs(comparisonResult.difference))}
                        </Text>
                      </View>
                      
                      <View style={styles.resultStatusRow}>
                        <Text style={styles.resultStatusLabel}>Status:</Text>
                        <Text style={[
                          styles.resultStatusValue,
                          comparisonResult.status === 'surplus' ? styles.surplusText : 
                          comparisonResult.status === 'deficit' ? styles.deficitText : 
                          styles.balancedText
                        ]}>
                          {comparisonResult.status === 'surplus' ? 'Kelebihan Uang' : 
                           comparisonResult.status === 'deficit' ? 'Kekurangan Uang' : 
                           'Balance'}
                        </Text>
                      </View>
                      
                      <View style={styles.resultDetail}>
                        {comparisonResult.status === 'surplus' && (
                          <Text style={styles.resultDetailText}>
                            Terdapat kelebihan uang sebesar Rp {formatCurrency(Math.abs(comparisonResult.difference))}. 
                            Silakan periksa kembali transaksi dan uang tunai.
                          </Text>
                        )}
                        {comparisonResult.status === 'deficit' && (
                          <Text style={styles.resultDetailText}>
                            Terdapat kekurangan uang sebesar Rp {formatCurrency(Math.abs(comparisonResult.difference))}. 
                            Silakan periksa kembali transaksi dan uang tunai.
                          </Text>
                        )}
                        {comparisonResult.status === 'balanced' && (
                          <Text style={styles.resultDetailText}>
                            Jumlah uang fisik sesuai dengan pendapatan sistem. Transaksi shift berjalan dengan baik.
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.paymentMethodsBox}>
                    <Text style={styles.paymentMethodsTitle}>Rincian Pendapatan</Text>
                    <Text style={styles.paymentMethodsInfo}>
                      Hanya pendapatan tunai yang perlu disetor secara fisik. 
                      Pembayaran melalui metode lain (kartu, e-wallet, online shop) 
                      tidak perlu disetor karena dana sudah masuk secara elektronik.
                    </Text>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>Tunai:</Text>
                      <Text style={styles.paymentMethodValue}>Rp {formatCurrency(systemSales || 0)}</Text>
                    </View>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>Kartu Kredit/Debit:</Text>
                      <Text style={styles.paymentMethodValue}>Rp {formatCurrency(paymentMethodBreakdown['card'] || 0)}</Text>
                    </View>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>E-Wallet:</Text>
                      <Text style={styles.paymentMethodValue}>Rp {formatCurrency(paymentMethodBreakdown['ewallet'] || 0)}</Text>
                    </View>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>Online Shop:</Text>
                      <Text style={styles.paymentMethodValue}>Rp {formatCurrency(paymentMethodBreakdown['onlineshop'] || 0)}</Text>
                    </View>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>Total Non-Tunai:</Text>
                      <Text style={[styles.paymentMethodValue, styles.totalNonCash]}>
                        Rp {formatCurrency((paymentMethodBreakdown['card'] || 0) + (paymentMethodBreakdown['ewallet'] || 0) + (paymentMethodBreakdown['onlineshop'] || 0))}
                      </Text>
                    </View>
                    <View style={[styles.paymentMethodRow, styles.totalRow]}>
                      <Text style={[styles.paymentMethodLabel, styles.totalLabel]}>Total Pendapatan:</Text>
                      <Text style={[styles.paymentMethodValue, styles.totalValue]}>
                        Rp {formatCurrency(parseFloat(systemSales || '0') + (paymentMethodBreakdown['card'] || 0) + (paymentMethodBreakdown['ewallet'] || 0) + (paymentMethodBreakdown['onlineshop'] || 0))}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.shiftInfoBox}>
                    <Text style={styles.shiftInfoTitle}>Informasi Shift</Text>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Total Struk:</Text>
                      <Text style={styles.shiftInfoValue}>{transactionCount} struk</Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Durasi Kerja:</Text>
                      <Text style={styles.shiftInfoValue}>{formatWorkDuration(workDuration)}</Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Rata-rata per Struk:</Text>
                      <Text style={styles.shiftInfoValue}>
                        Rp {transactionCount > 0 ? formatCurrency(Math.round(parseFloat(systemSales || '0') / transactionCount)) : formatCurrency(0)}
                      </Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Pendapatan Tunai (Disetor):</Text>
                      <Text style={styles.shiftInfoValue}>Rp {formatCurrency(systemSales || 0)}</Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Pendapatan Non-Tunai:</Text>
                      <Text style={styles.shiftInfoValue}>Rp {formatCurrency((paymentMethodBreakdown['card'] || 0) + (paymentMethodBreakdown['ewallet'] || 0) + (paymentMethodBreakdown['onlineshop'] || 0))}</Text>
                    </View>
                    <View style={[styles.shiftInfoRow, styles.totalSalesRow]}>
                      <Text style={[styles.shiftInfoLabel, styles.totalSalesLabel]}>Total Pendapatan:</Text>
                      <Text style={[styles.shiftInfoValue, styles.totalSalesValue]}>
                        Rp {formatCurrency(parseFloat(systemSales || '0') + (paymentMethodBreakdown['card'] || 0) + (paymentMethodBreakdown['ewallet'] || 0) + (paymentMethodBreakdown['onlineshop'] || 0))}
                      </Text>
                    </View>
                    <View style={styles.shiftInfoRow}>
                      <Text style={styles.shiftInfoLabel}>Uang Fisik:</Text>
                      <Text style={styles.shiftInfoValue}>Rp {formatCurrency(physicalCash || 0)}</Text>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={handleSaveSetoran}
                    >
                      <Text style={styles.saveButtonText}>Simpan Setoran</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {view === 'history' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>History Setoran</Text>
              
              {historyLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Memuat history setoran...</Text>
                </View>
              ) : (
                <>
                  {setoranHistory.length === 0 ? (
                    <Text style={styles.noHistoryText}>Belum ada history setoran</Text>
                  ) : (
                    <View style={styles.historyList}>
                      {setoranHistory.map((record) => (
                        <View key={record.id} style={styles.historyItem}>
                          <View style={styles.historyItemHeader}>
                            <Text style={styles.historyDate}>{record.date} {record.time}</Text>
                            <Text style={styles.historyCashier}>{record.cashierName}</Text>
                          </View>
                          <View style={styles.historyItemDetails}>
                            <View style={styles.historyDetailRow}>
                              <Text style={styles.historyDetailLabel}>Uang Fisik:</Text>
                              <Text style={styles.historyDetailValue}>Rp {formatCurrency(record.cashAmount)}</Text>
                            </View>
                            <View style={styles.historyDetailRow}>
                              <Text style={styles.historyDetailLabel}>Pendapatan Sistem:</Text>
                              <Text style={styles.historyDetailValue}>Rp {formatCurrency(record.systemSales)}</Text>
                            </View>
                            <View style={styles.historyDetailRow}>
                              <Text style={styles.historyDetailLabel}>Selisih:</Text>
                              <Text style={[
                                styles.historyDetailValue,
                                record.difference > 0 ? styles.surplusText : 
                                record.difference < 0 ? styles.deficitText : 
                                styles.balancedText
                              ]}>
                                {record.difference > 0 ? '+' : record.difference < 0 ? '-' : ''}Rp {formatCurrency(Math.abs(record.difference))}
                              </Text>
                            </View>
                            <View style={styles.historyDetailRow}>
                              <Text style={styles.historyDetailLabel}>Status:</Text>
                              <Text style={[
                                styles.historyDetailValue,
                                record.status === 'surplus' ? styles.surplusText : 
                                record.status === 'deficit' ? styles.deficitText : 
                                styles.balancedText
                              ]}>
                                {record.status === 'surplus' ? 'Kelebihan' : 
                                 record.status === 'deficit' ? 'Kekurangan' : 
                                 'Balance'}
                              </Text>
                            </View>
                            {record.notes ? (
                              <View style={styles.historyDetailRow}>
                                <Text style={styles.historyDetailLabel}>Catatan:</Text>
                                <Text style={styles.historyDetailValue}>{record.notes}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Informasi Setoran</Text>
            <Text style={styles.infoText}>
              Halaman ini digunakan untuk mencatat setoran kas harian dengan alur:
            </Text>
            <Text style={styles.infoText}>
              1. Sistem secara otomatis mendeteksi kasir, total pendapatan, dan durasi kerja
            </Text>
            <Text style={styles.infoText}>
              2. Kasir menginput jumlah uang fisik yang ada
            </Text>
            <Text style={styles.infoText}>
              3. Sistem secara otomatis membandingkan dan menampilkan selisih
            </Text>
            <Text style={styles.infoText}>
              4. Jika ada selisih (kelebihan/kekurangan), sistem akan menampilkannya
            </Text>
            <Text style={styles.infoText}>
              5. Informasi shift mencakup total struk dan durasi kerja
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20, // Add padding for bottom inset
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
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 30,
  },
  historyButton: {
    padding: 10,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  systemSalesValue: {
    fontSize: 18,
    color: '#007AFF',
  },
  compareButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  compareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultBox: {
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  surplusBox: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  deficitBox: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  balancedBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  resultStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultStatusLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  resultStatusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  surplusText: {
    color: '#4CAF50',
  },
  deficitText: {
    color: '#F44336',
  },
  balancedText: {
    color: '#2196F3',
  },
  resultDetail: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultDetailText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shiftInfoBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  shiftInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  shiftInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shiftInfoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  shiftInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalSalesRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
    marginTop: 10,
  },
  totalSalesLabel: {
    color: '#1976D2',
  },
  totalSalesValue: {
    color: '#1976D2',
  },
  paymentMethodsBox: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  paymentMethodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethodsInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentMethodLabel: {
    fontSize: 16,
    color: '#333',
  },
  paymentMethodValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalNonCash: {
    color: '#1976D2',
    fontSize: 18,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  historyButton: {
    padding: 10,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  noHistoryText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  historyList: {
    marginTop: 10,
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 10,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  historyCashier: {
    fontSize: 14,
    color: '#6c757d',
  },
  historyItemDetails: {
    // No additional styling needed
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDetailLabel: {
    fontSize: 14,
    color: '#495057',
  },
  historyDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
});

export default SetoranPage;