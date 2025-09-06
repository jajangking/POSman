import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { User, UserRole } from '../models/User';
import { authenticateUser } from '../services/AuthService';

interface LoginPanelProps {
  onLoginSuccess: (user: User) => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (username: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        // If default user doesn't exist, create a temporary one for demo
        const tempUser: User = {
          id: `${role}-${Math.random().toString(36).substring(2, 15)}`,
          username,
          password,
          role,
          name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          createdAt: new Date()
        };
        onLoginSuccess(tempUser);
      }
    } catch (error) {
      console.error('Quick login error:', error);
      Alert.alert('Error', 'An error occurred during quick login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // For guest login, we can create a temporary guest session
    const guestUser: User = {
      id: 'guest-' + Math.random().toString(36).substring(2, 15),
      username: 'guest',
      password: '',
      role: 'guest',
      name: 'Guest User',
      createdAt: new Date()
    };
    
    onLoginSuccess(guestUser);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>POSman Login</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your username"
          autoCapitalize="none"
          editable={!isLoading}
        />
        
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.quickLoginContainer}>
          <Text style={styles.quickLoginTitle}>Quick Login:</Text>
          <View style={styles.quickLoginButtons}>
            <TouchableOpacity 
              style={[styles.quickButton, styles.adminButton]} 
              onPress={() => handleQuickLogin('admin', 'admin123', 'admin')}
              disabled={isLoading}
            >
              <Text style={styles.quickButtonText}>Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickButton, styles.staffButton]} 
              onPress={() => handleQuickLogin('staff', 'staff123', 'staff')}
              disabled={isLoading}
            >
              <Text style={styles.quickButtonText}>Staff</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickButton, styles.customerButton]} 
              onPress={() => handleQuickLogin('customer', 'customer123', 'customer')}
              disabled={isLoading}
            >
              <Text style={styles.quickButtonText}>Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickButton, styles.guestButton]} 
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              <Text style={styles.quickButtonText}>Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  quickLoginContainer: {
    marginTop: 30,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 10,
  },
  adminButton: {
    backgroundColor: '#FF3B30',
  },
  staffButton: {
    backgroundColor: '#FF9500',
  },
  customerButton: {
    backgroundColor: '#34C759',
  },
  guestButton: {
    backgroundColor: '#5856D6',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginPanel;