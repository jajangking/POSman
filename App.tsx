import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
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
import { User } from './src/models/User';
import { getSOHistoryById } from './src/services/SOHistoryService'; // Import the new function

// Main app component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content that uses authentication
const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, login, logout, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO' | 'soReport' | 'soHistory' | 'monitoring' | 'itemLog'>('home');
  const [soItems, setSoItems] = useState<any[]>([]); // State to hold SO items data
  const [soReportData, setSoReportData] = useState<any>(null); // State to hold SO report data
  const [itemLogData, setItemLogData] = useState<{code: string, name: string} | null>(null); // State to hold item log data
  const [itemLogSource, setItemLogSource] = useState<'inventory' | 'soReport' | null>(null); // State to track where item log was opened from
  const stockOpnameRef = useRef<{ handleHardwareBackPress: () => void }>(null);
  const editSORef = useRef<{ handleHardwareBackPress: () => void }>(null);

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
      // If we're in EditSO view, delegate to the component
      else if (currentView === 'editSO') {
        // Call the EditSO component's hardware back button handler
        if (editSORef.current && editSORef.current.handleHardwareBackPress) {
          editSORef.current.handleHardwareBackPress();
        } else {
          // Fallback to default behavior if ref is not available
          setCurrentView('home');
        }
        return true; // Prevent default behavior
      }
      // If we're in other views, go back to home
      else {
        setCurrentView('home');
        return true; // Prevent default behavior
      }
    });

    return () => backHandler.remove();
  }, [currentView]);

  const handleLoginSuccess = (user: User) => {
    login(user);
  };

  const handleNavigate = (view: 'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO' | 'soReport' | 'soHistory' | 'monitoring' | 'itemLog') => {
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
          onBack={() => handleNavigate('home')} 
          onNavigateToItemLog={(itemCode, itemName) => {
            setItemLogData({code: itemCode, name: itemName});
            setItemLogSource('inventory');
            handleNavigate('itemLog');
          }}
        />
      )}
      {currentView === 'admin' && currentUser?.role === 'admin' && (
        <AdminDashboard onBack={() => handleNavigate('home')} />
      )}
      {currentView === 'stockOpname' && (
        <StockOpname 
          ref={stockOpnameRef}
          onBack={() => handleNavigate('home')} 
          onNavigate={handleNavigate}
        />
      )}
      {currentView === 'partialSO' && (
        <PartialSO 
          onBack={() => handleNavigate('home')} 
          onNavigateToEditSO={(items) => {
            setSoItems(items);
            handleNavigate('editSO');
          }}
        />
      )}
      {currentView === 'grandSO' && (
        <GrandSO onBack={() => handleNavigate('home')} />
      )}
      {currentView === 'editSO' && (
        <EditSO 
          ref={editSORef}
          onBack={(reportData) => {
            setSoReportData(reportData);
            setCurrentView('soReport');
          }}
          items={soItems}
          currentUser={currentUser}
        />
      )}
      {currentView === 'soReport' && (
        <SOReportScreen 
          onBack={() => handleNavigate('soHistory')} 
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
          onBack={() => handleNavigate('home')} 
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
          onBack={() => handleNavigate('home')}
        />
      )}
      {currentView === 'itemLog' && itemLogData && (
        <ItemLogScreen 
          itemCode={itemLogData.code}
          itemName={itemLogData.name}
          onBack={() => {
            if (itemLogSource === 'soReport') {
              handleNavigate('soReport');
            } else {
              handleNavigate('inventory');
            }
          }}
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