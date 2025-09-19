import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface KitchenScreenProps {
  onBack: () => void;
}

const KitchenScreen: React.FC<KitchenScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Dapur</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manajemen Dapur</Text>
            <Text style={styles.description}>
              Halaman ini digunakan untuk mengelola pesanan dari dapur dan memantau status persiapan makanan.
            </Text>
            
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Fitur Dapur:</Text>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Tampilan pesanan masuk</Text>
                <Text style={styles.featureItem}>• Status persiapan pesanan</Text>
                <Text style={styles.featureItem}>• Notifikasi pesanan baru</Text>
                <Text style={styles.featureItem}>• Riwayat pesanan</Text>
                <Text style={styles.featureItem}>• Kelola menu dapur</Text>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  featureList: {
    paddingLeft: 10,
  },
  featureItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    lineHeight: 22,
  },
});

export default KitchenScreen;