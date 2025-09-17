import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginPanel from './src/components/LoginPanel';
import HomeDashboard from './src/components/HomeDashboard';
import InventoryScreen from './src/components/InventoryScreen';
import AdminDashboard from './src/components/AdminDashboard';
import StockOpname from './src/components/StockOpname';
import PartialSO from './src/components/PartialSO';
import GrandSO from './src/components/GrandSO';
import EditSO from './src/components/EditSO';
import SOReportScreen from './src/components/SOReportScreen';
import SOHistoryScreen from './src/components/SOHistoryScreen';
import MonitoringItemsScreen from './src/components/MonitoringItemsScreen';
import ItemLogScreen from './src/components/ItemLogScreen';
import CashierScreen from './src/components/CashierScreen'; // Import CashierScreen
import CashierPage from './src/components/CashierPage'; // Import CashierPage with F4 shortcut
import SettingsPage from './src/components/SettingsPage'; // Import SettingsPage
import MemberManagementScreen from './src/components/MemberManagementScreen'; // Import MemberManagementScreen
import DiscountPage from './src/components/DiscountPage'; // Import DiscountPage
import ReportScreen from './src/components/ReportScreen'; // Import ReportScreen
// Import new report screens
import SalesReportScreen from './src/components/reports/SalesReportScreen';
import ItemReportScreen from './src/components/reports/ItemReportScreen';
import SOBudgetLossReportScreen from './src/components/reports/SOBudgetLossReportScreen';
import ProfitLossReportScreen from './src/components/reports/ProfitLossReportScreen';
import ProfitVsLossReportScreen from './src/components/reports/ProfitVsLossReportScreen';
import DailyTransactionReportScreen from './src/components/reports/DailyTransactionReportScreen';
// Import Stock Minimum screens
import StockMinimumScreen from './src/components/StockMinimumScreen';
import InputBarangMasukScreen from './src/components/InputBarangMasukScreen';
// Import Receipt screens
import ReceiptScreen from './src/components/ReceiptScreen';
import ReceiptHistoryScreen from './src/components/ReceiptHistoryScreen';
import AutomaticPOScreen from './src/components/AutomaticPOScreen'; // Import AutomaticPOScreen
import PermintaanBarangScreen from './src/components/PermintaanBarangScreen'; // Import PermintaanBarangScreen
import SettingMinimalOrderScreen from './src/components/SettingMinimalOrderScreen'; // Import SettingMinimalOrderScreen
import HistoryScreen from './src/components/HistoryScreen'; // Import HistoryScreen
import PenerimaanBarangScreen from './src/components/PenerimaanBarangScreen'; // Import PenerimaanBarangScreen
import SetoranPage from './src/components/SetoranPage'; // Import SetoranPage
import { User } from './src/models/User';
import { getSOHistoryById } from './src/services/SOHistoryService';
import { getCurrentSOSession, upsertSOSession } from './src/services/DatabaseService'; // Import the SO session functions
import { initializeSampleProducts } from './src/services/DatabaseInitializer'; // Import database initializer
import { InventoryItem } from './src/models/Inventory'; // Import InventoryItem

// Main app component wrapped with AuthProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// App content that uses authentication
const AppContent: React.FC = () => {
  const authContext = useAuth();
  const { currentUser, isAuthenticated, login, logout, isLoading } = authContext;
  const [currentView, setCurrentView] = useState<'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO' | 'soReport' | 'soHistory' | 'monitoring' | 'itemLog' | 'cashier' | 'cashierPage' | 'memberManagement' | 'settings' | 'discount' | 'report' | 'salesReport' | 'itemReport' | 'soBudgetLossReport' | 'profitLossReport' | 'profitVsLossReport' | 'dailyTransactionReport' | 'stockMinimum' | 'inputBarangMasuk' | 'receipt' | 'receiptHistory' | 'automaticPO' | 'permintaanBarang' | 'settingMinimalOrder' | 'history' | 'penerimaanBarang' | 'setoran'>('home');
  const [navigationStack, setNavigationStack] = useState<Array<'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO' | 'soReport' | 'soHistory' | 'monitoring' | 'itemLog' | 'cashier' | 'cashierPage' | 'memberManagement' | 'settings' | 'discount' | 'report' | 'salesReport' | 'itemReport' | 'soBudgetLossReport' | 'profitLossReport' | 'profitVsLossReport' | 'dailyTransactionReport' | 'stockMinimum' | 'inputBarangMasuk' | 'receipt' | 'receiptHistory' | 'automaticPO' | 'permintaanBarang' | 'settingMinimalOrder' | 'history' | 'penerimaanBarang' | 'setoran'>>(['home']);
  const [soItems, setSoItems] = useState<any[]>([]); // State to hold SO items data
  const [soReportData, setSoReportData] = useState<any>(null); // State to hold SO report data
  const [itemLogData, setItemLogData] = useState<{code: string, name: string} | null>(null); // State to hold item log data
  const [itemLogSource, setItemLogSource] = useState<'inventory' | 'soReport' | null>(null); // State to track where item log was opened from
  const [selectedItemForStockInput, setSelectedItemForStockInput] = useState<InventoryItem | null>(null); // State to hold selected item for stock input
  const [selectedItemForReceipt, setSelectedItemForReceipt] = useState<InventoryItem | null>(null); // State to hold selected item for receipt
  const stockOpnameRef = useRef<{ handleHardwareBackPress: () => void }>(null);
  // Hapus editSORef karena EditSO tidak lagi menggunakan forwardRef
  // Hapus partialSORef karena PartialSO tidak lagi menggunakan forwardRef

  // Initialize database with sample products
  useEffect(() => {
    const init = async () => {
      try {
        await initializeSampleProducts();
      } catch (error) {
        console.error('Error initializing sample products:', error);
      }
    };
    
    if (!isLoading) {
      init();
    }
  }, [isLoading]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on the home screen, show exit confirmation
      if (currentView === 'home') {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the application?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true; // Prevent default behavior
      } 
      // If we're in StockOpname view, delegate to the component
      else if (currentView === 'stockOpname') {
        // Call the StockOpname component's hardware back button handler
        if (stockOpnameRef.current && stockOpnameRef.current.handleHardwareBackPress) {
          stockOpnameRef.current.handleHardwareBackPress();
        } else {
          // Fallback to default behavior if ref is not available
          setCurrentView('home');
        }
        return true; // Prevent default behavior
      }
      // For other views, navigate back using the navigation stack
      else {
        handleBackNavigation();
        return true; // Prevent default behavior
      }
    });

    return () => backHandler.remove();
  }, [currentView]);

  const handleLoginSuccess = (user: User) => {
    login(user);
  };

  // Handle back navigation using the navigation stack
  const handleBackNavigation = () => {
    setNavigationStack(prevStack => {
      if (prevStack.length > 1) {
        // Remove the current view and get the previous one
        const newStack = prevStack.slice(0, -1);
        const previousView = newStack[newStack.length - 1];
        setCurrentView(previousView);
        return newStack;
      } else {
        // If there's only one view in the stack, go to home
        setCurrentView('home');
        return ['home'];
      }
    });
  };

  const handleNavigate = async (view: 'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO' | 'soReport' | 'soHistory' | 'monitoring' | 'itemLog' | 'cashier' | 'cashierPage' | 'memberManagement' | 'settings' | 'discount' | 'report' | 'salesReport' | 'itemReport' | 'soBudgetLossReport' | 'profitLossReport' | 'profitVsLossReport' | 'dailyTransactionReport' | 'stockMinimum' | 'inputBarangMasuk' | 'receipt' | 'receiptHistory' | 'automaticPO' | 'permintaanBarang' | 'settingMinimalOrder' | 'history' | 'penerimaanBarang' | 'setoran') => {
    // Update session data to reflect the current view if we're in an SO session
    if (view === 'partialSO' || view === 'editSO') {
      try {
        const { getCurrentSOSession, upsertSOSession } = require('./src/services/DatabaseService');
        const sessionData = await getCurrentSOSession();
        if (sessionData) {
          // Update the lastView field to reflect the current view
          const updatedSession = {
            ...sessionData,
            lastView: view
          };
          await upsertSOSession(updatedSession);
          console.log('Session updated with last view:', view);
        }
      } catch (error) {
        console.error('Error updating SO session with last view:', error);
      }
    }
    
    // Update navigation stack
    setNavigationStack(prevStack => {
      // If navigating to home, clear the stack and start fresh
      if (view === 'home') {
        return ['home'];
      }
      
      // If navigating to a new view, add it to the stack
      // But first check if we're going back (to avoid duplicates)
      const lastView = prevStack[prevStack.length - 1];
      if (lastView !== view) {
        return [...prevStack, view];
      }
      return prevStack;
    });
    
    setCurrentView(view);
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          {/* Loading indicator would go here */}
        </View>
      </View>
    );
  }

  // Show login panel if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <LoginPanel onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  // Show main app content when authenticated
  return (
    <View style={styles.container}>
      {currentView === 'home' && (
        <HomeDashboard 
          user={currentUser!} 
          onNavigate={handleNavigate}
          onLogout={logout}
        />
      )}
      {currentView === 'inventory' && (
        <InventoryScreen 
          onBack={handleBackNavigation} 
          onNavigateToItemLog={(itemCode, itemName) => {
            setItemLogData({code: itemCode, name: itemName});
            setItemLogSource('inventory');
            handleNavigate('itemLog');
          }}
        />
      )}
      {currentView === 'admin' && currentUser?.role === 'admin' && (
        <AdminDashboard onBack={handleBackNavigation} />
      )}
      {currentView === 'stockOpname' && (
        <StockOpname 
          ref={stockOpnameRef}
          onBack={handleBackNavigation} 
          onNavigate={handleNavigate}
        />
      )}
      {currentView === 'partialSO' && (
        <PartialSO 
          onBack={handleBackNavigation} 
          onNavigateToEditSO={(items) => {
            setSoItems(items);
            handleNavigate('editSO');
          }}
        />
      )}
      {currentView === 'grandSO' && (
        <GrandSO 
          onBack={handleBackNavigation} 
          onNavigateToEditSO={(items) => {
            setSoItems(items);
            handleNavigate('editSO');
          }}
        />
      )}
      {currentView === 'editSO' && (
        <EditSO 
          onBack={(reportData) => {
            // Check if we're exiting without completing the SO process
            if (reportData && reportData.exitWithoutComplete) {
              // Just go back to home without showing the report
              setCurrentView('home');
            } else {
              // Normal completion - show the report
              setSoReportData(reportData);
              setCurrentView('soReport');
            }
          }}
          items={soItems}
          currentUser={currentUser}
        />
      )}
      {currentView === 'soReport' && (
        <SOReportScreen 
          onBack={handleBackNavigation} 
          onNavigateToDashboard={() => handleNavigate('home')}
          reportData={soReportData}
          onNavigateToItemLog={(itemCode, itemName) => {
            setItemLogData({code: itemCode, name: itemName});
            setItemLogSource('soReport');
            handleNavigate('itemLog');
          }}
        />
      )}
      {currentView === 'soHistory' && (
        <SOHistoryScreen 
          onBack={handleBackNavigation} 
          onViewReport={async (reportId) => {
            try {
              // Fetch the specific report data by ID
              const reportData = await getSOHistoryById(reportId);
              if (reportData) {
                // Convert the items from JSON string to object
                const items = JSON.parse(reportData.items);
                setSoReportData({
                  id: reportData.id,
                  totalItems: reportData.totalItems,
                  totalQtyDifference: reportData.totalDifference,
                  totalRpDifference: reportData.totalRpDifference,
                  soDuration: `${Math.floor(reportData.duration / 60)} menit ${reportData.duration % 60} detik`,
                  soUser: reportData.userName,
                  soDate: reportData.date,
                  items: items,
                  // Other fields would need to be populated from the database
                });
              }
              handleNavigate('soReport');
            } catch (error) {
              console.error('Error fetching report data:', error);
              Alert.alert('Error', 'Failed to load report data');
            }
          }}
        />
      )}
      {currentView === 'monitoring' && (
        <MonitoringItemsScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'itemLog' && itemLogData && (
        <ItemLogScreen 
          itemCode={itemLogData.code}
          itemName={itemLogData.name}
          onBack={() => {
            if (itemLogSource === 'soReport') {
              handleBackNavigation();
            } else {
              handleBackNavigation();
            }
          }}
        />
      )}
      {currentView === 'cashier' && (
        <CashierScreen 
          onBack={handleBackNavigation}
          onNavigateToMemberManagement={() => handleNavigate('memberManagement')}
          onNavigateToSettings={() => handleNavigate('settings')}
        />
      )}
      {currentView === 'cashierPage' && (
        <CashierPage 
          onBack={handleBackNavigation}
          onNavigateToMemberManagement={() => handleNavigate('memberManagement')}
          onNavigateToSettings={() => handleNavigate('settings')}
        />
      )}
      {currentView === 'memberManagement' && (
        <MemberManagementScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'settings' && (
        <SettingsPage 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'discount' && (
        <DiscountPage 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'report' && (
        <ReportScreen 
          onBack={handleBackNavigation}
          onNavigateToSalesReport={() => handleNavigate('salesReport')}
          onNavigateToItemReport={() => handleNavigate('itemReport')}
          onNavigateToProfitLossReport={() => handleNavigate('profitLossReport')}
          onNavigateToDailyTransactionReport={() => handleNavigate('dailyTransactionReport')}
        />
      )}
      {currentView === 'salesReport' && (
        <SalesReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'itemReport' && (
        <ItemReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'soBudgetLossReport' && (
        <SOBudgetLossReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'profitLossReport' && (
        <ProfitLossReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'profitVsLossReport' && (
        <ProfitVsLossReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'dailyTransactionReport' && (
        <DailyTransactionReportScreen 
          onBack={handleBackNavigation}
        />
      )}
      
      {currentView === 'stockMinimum' && (
        <StockMinimumScreen 
          onBack={handleBackNavigation}
          onNavigateToInputBarang={(item) => {
            setSelectedItemForStockInput(item);
            handleNavigate('inputBarangMasuk');
          }}
        />
      )}
      {currentView === 'inputBarangMasuk' && selectedItemForStockInput && (
        <InputBarangMasukScreen
          item={selectedItemForStockInput}
          onBack={handleBackNavigation}
          onNavigateToStockMinimum={() => handleNavigate('stockMinimum')}
        />
      )}
      {currentView === 'receipt' && (
        <ReceiptScreen
          onBack={handleBackNavigation}
          onNavigateToReceiptHistory={() => handleNavigate('receiptHistory')}
        />
      )}
      {currentView === 'receiptHistory' && (
        <ReceiptHistoryScreen
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'automaticPO' && (
        <AutomaticPOScreen
          onBack={handleBackNavigation}
          onNavigateToSettingMinimalOrder={() => handleNavigate('settingMinimalOrder')}
          onNavigateToPermintaanBarang={() => handleNavigate('permintaanBarang')}
          onNavigateToHistory={() => handleNavigate('history')}
          onNavigateToPenerimaanBarang={() => handleNavigate('penerimaanBarang')}
        />
      )}
      {currentView === 'penerimaanBarang' && (
        <PenerimaanBarangScreen
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'permintaanBarang' && (
        <PermintaanBarangScreen
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'settingMinimalOrder' && (
        <SettingMinimalOrderScreen
          onBack={handleBackNavigation}
        />
      )}
      {currentView === 'setoran' && (
        <SetoranPage 
          onBack={handleBackNavigation}
          currentUser={currentUser!}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});