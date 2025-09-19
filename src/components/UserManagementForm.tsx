import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { createStaffUser, createCustomerUser } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';

interface UserManagementFormProps {
  onUserCreated: () => void;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({ onUserCreated }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'staff' | 'customer'>('staff');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in as admin to create users');
      return;
    }

    setIsLoading(true);
    try {
      let result = null;
      
      if (role === 'staff') {
        result = await createStaffUser(currentUser.id, email, password, name);
      } else if (role === 'customer') {
        result = await createCustomerUser(currentUser.id, email, password, name);
      }
      
      if (result) {
        Alert.alert('Success', `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`);
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
        onUserCreated();
      } else {
        Alert.alert('Error', `Failed to create ${role} user`);
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      Alert.alert('Error', error.message || `An error occurred while creating the ${role} user`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New User</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter user's name"
          autoCapitalize="words"
          editable={!isLoading}
        />
        
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter user's email"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter user's password"
          secureTextEntry
          editable={!isLoading}
        />
        
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'staff' && styles.selectedRoleButton]}
            onPress={() => setRole('staff')}
            disabled={isLoading}
          >
            <Text style={[styles.roleButtonText, role === 'staff' && styles.selectedRoleButtonText]}>
              Staff
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.selectedRoleButton]}
            onPress={() => setRole('customer')}
            disabled={isLoading}
          >
            <Text style={[styles.roleButtonText, role === 'customer' && styles.selectedRoleButtonText]}>
              Customer
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleCreateUser}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              Create {role.charAt(0).toUpperCase() + role.slice(1)} User
            </Text>
          )}
        </TouchableOpacity>
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
    fontSize: 24,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
  },
  selectedRoleButton: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedRoleButtonText: {
    color: 'white',
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
});

export default UserManagementForm;