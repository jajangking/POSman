import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StockOpnameProps {
  onBack?: () => void;
  onNavigate?: (view: 'home' | 'inventory' | 'admin' | 'stockOpname' | 'partialSO' | 'grandSO' | 'editSO') => void;
}

const StockOpname: React.FC<StockOpnameProps> = ({ onBack, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSOType, setSelectedSOType] = useState<'partial' | 'grand' | null>(null);
  
  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleStartSO = () => {
    if (selectedSOType === 'partial' && onNavigate) {
      onNavigate('partialSO');
    } else if (selectedSOType === 'grand' && onNavigate) {
      onNavigate('grandSO');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Stock Opname</Text>
        </View>
        
        <View style={styles.content}>
          {/* Date and Time Display */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>{formatDate(currentTime)}</Text>
            
            <Text style={styles.infoLabel}>Jam</Text>
            <Text style={styles.infoValue}>{formatTime(currentTime)}</Text>
            
            <Text style={styles.infoLabel}>User</Text>
            <Text style={styles.infoValue}>Admin User</Text>
          </View>
          
          {/* SO Type Selection */}
          <View style={styles.selectionContainer}>
            <Text style={styles.sectionTitle}>Tipe Stock Opname</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.selectionButton, 
                  selectedSOType === 'partial' ? styles.selectedButton : styles.unselectedButton
                ]}
                onPress={() => setSelectedSOType('partial')}
              >
                <Text style={[
                  styles.buttonText, 
                  selectedSOType === 'partial' ? styles.selectedButtonText : styles.unselectedButtonText
                ]}>Partial SO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.selectionButton, 
                  selectedSOType === 'grand' ? styles.selectedButton : styles.unselectedButton
                ]}
                onPress={() => setSelectedSOType('grand')}
              >
                <Text style={[
                  styles.buttonText, 
                  selectedSOType === 'grand' ? styles.selectedButtonText : styles.unselectedButtonText
                ]}>Grand SO</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, !selectedSOType && styles.disabledButton]}
              onPress={handleStartSO}
              disabled={!selectedSOType}
            >
              <Text style={styles.actionButtonText}>Start SO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.editButton]}
              onPress={() => onNavigate && onNavigate('editSO')}
            >
              <Text style={styles.editButtonText}>Edit SO</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionContainer: {
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
  },
  unselectedButton: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  selectedButton: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unselectedButtonText: {
    color: '#666',
  },
  selectedButtonText: {
    color: 'white',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StockOpname;