import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../models/User';

interface HomeDashboardProps {
  user: User;
  onNavigate: (view: 'home' | 'inventory' | 'admin' | 'stockOpname' | 'soHistory' | 'cashier' | 'settings' | 'discount' | 'report' | 'salesReport' | 'itemReport' | 'soBudgetLossReport' | 'profitLossReport' | 'profitVsLossReport' | 'dailyTransactionReport' | 'memberManagement' | 'stockMinimum' | 'inputBarangMasuk' | 'automaticPO' | 'setoran' | 'topping' | 'kitchen') => void;
  onLogout: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const showFeatureComingSoon = (feature: string) => {
    Alert.alert('Fitur Segera Hadir', `Fitur ${feature} akan segera hadir!`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.actionsGrid}>
              {/* Core Business Operations */}
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('cashier')}
              >
                <Text style={styles.actionIcon}>💰</Text>
                <Text style={styles.actionTitle}>Kasir</Text>
                <Text style={styles.actionDescription}>Proses transaksi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('memberManagement')}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionTitle}>Pelanggan</Text>
                <Text style={styles.actionDescription}>Kelola database pelanggan</Text>
              </TouchableOpacity>
              
              {(user.role === 'admin' || user.role === 'staff') && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('inventory')}
                >
                  <Text style={styles.actionIcon}>📦</Text>
                  <Text style={styles.actionTitle}>Inventory</Text>
                  <Text style={styles.actionDescription}>Kelola produk dan stok</Text>
                </TouchableOpacity>
              )}
              
              {(user.role === 'admin' || user.role === 'staff') && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('topping')}
                >
                  <Text style={styles.actionIcon}>🍒</Text>
                  <Text style={styles.actionTitle}>Topping</Text>
                  <Text style={styles.actionDescription}>Kelola topping produk</Text>
                </TouchableOpacity>
              )}
              
              {(user.role === 'admin' || user.role === 'staff') && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('kitchen')}
                >
                  <Text style={styles.actionIcon}>👨‍🍳</Text>
                  <Text style={styles.actionTitle}>Dapur</Text>
                  <Text style={styles.actionDescription}>Monitoring pesanan dapur</Text>
                </TouchableOpacity>
              )}
              
              {/* Financial & Reporting */}
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('report')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionTitle}>Laporan</Text>
                <Text style={styles.actionDescription}>Lihat laporan bisnis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('soHistory')}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionTitle}>Riwayat SO</Text>
                <Text style={styles.actionDescription}>Riwayat dan analisis stok opname</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('setoran')}
              >
                <Text style={styles.actionIcon}>💼</Text>
                <Text style={styles.actionTitle}>Setoran</Text>
                <Text style={styles.actionDescription}>Catat setoran kas harian</Text>
              </TouchableOpacity>
              
              {/* Inventory Management */}
              {(user.role === 'admin' || user.role === 'staff') && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('stockOpname')}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.actionTitle}>Stock Opname</Text>
                  <Text style={styles.actionDescription}>Rekonsiliasi inventaris</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.actionCard} 
                onPress={() => onNavigate('automaticPO')}
              >
                <Text style={styles.actionIcon}>🛒</Text>
                <Text style={styles.actionTitle}>PO Otomatis</Text>
                <Text style={styles.actionDescription}>Purchase Order otomatis</Text>
              </TouchableOpacity>
              
              {/* Admin Functions */}
              {user.role === 'admin' && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('settings')}
                >
                  <Text style={styles.actionIcon}>⚙️</Text>
                  <Text style={styles.actionTitle}>Settings</Text>
                  <Text style={styles.actionDescription}>Konfigurasi pengaturan aplikasi</Text>
                </TouchableOpacity>
              )}
              
              {user.role === 'admin' && (
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => onNavigate('discount')}
                >
                  <Text style={styles.actionIcon}>🏷️</Text>
                  <Text style={styles.actionTitle}>Discount</Text>
                  <Text style={styles.actionDescription}>Kelola aturan dan pengaturan diskon</Text>
                </TouchableOpacity>
              )}
            </View>

            {user.role === 'admin' && (
              <View style={styles.adminSection}>
                <Text style={styles.sectionTitle}>Admin Tools</Text>
                <TouchableOpacity 
                  style={styles.adminCard} 
                  onPress={() => onNavigate('admin')}
                >
                  <Text style={styles.adminIcon}>👤</Text>
                  <View style={styles.adminTextContainer}>
                    <Text style={styles.adminTitle}>User Management</Text>
                    <Text style={styles.adminDescription}>Kelola akun staf dan pelanggan</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>System Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>Today's Date: {new Date().toLocaleDateString()}</Text>
                <Text style={styles.infoText}>Last Login: {user.lastLogin ? user.lastLogin.toLocaleString() : 'First login'}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
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
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  adminSection: {
    marginTop: 30,
  },
  adminCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    alignItems: 'center',
  },
  adminIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  adminDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginTop: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
});

export default HomeDashboard;