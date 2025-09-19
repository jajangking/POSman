import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../models/User';
import { getAllUsers, createUserWithId, deleteUser } from '../services/DatabaseService';
import { signUp } from '../services/SupabaseAuthService';

interface AdminUserManagementProps {
  onUserCreated?: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ onUserCreated }) => {
  const { currentUser, currentTenantId, supabaseRegister } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!currentUser || !currentTenantId) {
      Alert.alert('Error', 'You must be logged in as an admin to create users');
      return;
    }

    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (selectedRole === 'admin') {
      Alert.alert('Error', 'You cannot create another admin account');
      return;
    }

    setIsCreating(true);
    try {
      // Register with Supabase first
      const { user, error: supabaseError } = await signUp(email, password);
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!user) {
        throw new Error('Failed to create user in Supabase');
      }

      // Create local user associated with this tenant
      const username = email.split('@')[0];
      const newUser = await createUserWithId({
        id: user.id,
        username: username,
        password: '', // In a real app, this should be properly handled
        role: selectedRole,
        name: name,
        email: email,
        tenantId: currentTenantId, // Associate with current admin's tenant
      });

      setUsers([...users, newUser]);
      setShowCreateForm(false);
      resetForm();
      
      if (onUserCreated) {
        onUserCreated();
      }
      
      Alert.alert('Success', 'User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!currentUser || !currentTenantId) {
      Alert.alert('Error', 'You must be logged in as an admin to delete users');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              setUsers(users.filter(user => user.id !== userId));
              Alert.alert('Success', 'User deleted successfully!');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setSelectedRole('staff');
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Only administrators can manage users.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createButtonText}>Create User</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text>Loading users...</Text>
      ) : (
        <ScrollView style={styles.userList}>
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>Role: {user.role}</Text>
              {user.username && <Text>Username: {user.username}</Text>}
              <View style={styles.userActions}>
                {currentUser && currentUser.role === 'admin' && user.id !== currentUser.id && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(user.id, user.name)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {users.length === 0 && (
            <Text style={styles.noUsersText}>No users found in your organization.</Text>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New User</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              secureTextEntry
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              {(['staff', 'customer'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    selectedRole === role && styles.selectedRoleButton
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[
                    styles.roleButtonText,
                    selectedRole === role && styles.selectedRoleButtonText
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isCreating && styles.disabledButton]}
              onPress={handleCreateUser}
              disabled={isCreating}
            >
              <Text style={styles.submitButtonText}>
                {isCreating ? 'Creating...' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#888',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 5,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  noUsersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    marginTop: 50,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    flex: 1,
    padding: 20,
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
    backgroundColor: 'white',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedRoleButton: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  selectedRoleButtonText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default AdminUserManagement;