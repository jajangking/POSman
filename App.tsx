import React, { useState, useEffect } from 'react';
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
        <InventoryScreen onBack={() => handleNavigate('home')} />
      )}
      {currentView === 'admin' && currentUser?.role === 'admin' && (
        <AdminDashboard onBack={() => handleNavigate('home')} />
      )}
      {currentView === 'stockOpname' && (
        <StockOpname 
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
          onBack={(reportData) => {
            setSoReportData(reportData);
            handleNavigate('soReport');
          }} 
          items={soItems} 
          currentUser={currentUser}
        />
      )}
      {currentView === 'soReport' && (
        <SOReportScreen 
          onBack={() => handleNavigate('soHistory')} 
          reportData={soReportData}
        />
      )}
      {currentView === 'soHistory' && (
        <SOHistoryScreen 
          onBack={() => handleNavigate('home')} 
          onViewReport={() => handleNavigate('soReport')}
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
          onBack={() => handleNavigate('inventory')}
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