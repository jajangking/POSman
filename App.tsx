import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginPanel from './src/components/LoginPanel';
import HomeDashboard from './src/components/HomeDashboard';
import InventoryScreen from './src/components/InventoryScreen';
import AdminDashboard from './src/components/AdminDashboard';
import StockOpnameScreen from './src/components/StockOpnameScreen';
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
  const [currentView, setCurrentView] = useState<'home' | 'inventory' | 'admin' | 'stock-opname'>('home');

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

  const handleNavigate = (view: 'home' | 'inventory' | 'admin' | 'stock-opname') => {
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
      {currentView === 'stock-opname' && (
        <StockOpnameScreen onBack={() => handleNavigate('home')} />
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