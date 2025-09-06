import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { User, UserRole, userRoles } from '../models/User';
import { getAllUsers, createUser } from '../services/DatabaseService';
import { registerUser } from '../services/AuthService';

interface UserManagementProps {
  onUserAdded: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onUserAdded }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Username, password, and name are required');
      return;
    }

    try {
      const newUser = await registerUser(username, password, role, name, email, phone);
      setUsers([...users, newUser]);
      
      // Reset form
      setUsername('');
      setPassword('');
      setName('');
      setEmail('');
      setPhone('');
      setRole('customer');
      setShowAddForm(false);
      
      Alert.alert('Success', 'User created successfully');
      onUserAdded();
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text>Username: {item.username}</Text>
      <Text>Role: {item.role}</Text>
      {item.email ? <Text>Email: {item.email}</Text> : null}
      {item.phone ? <Text>Phone: {item.phone}</Text> : null}
      <Text>Created: {item.createdAt.toLocaleDateString()}</Text>
      {item.lastLogin ? <Text>Last login: {item.lastLogin.toLocaleDateString()}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>
            {showAddForm ? 'Cancel' : 'Add User'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New User</Text>
          
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
          />
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />
          
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
            placeholder="Enter email (optional)"
            keyboardType="email-address"
          />
          
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone (optional)"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleContainer}>
            {userRoles.filter(r => r !== 'guest').map((roleOption) => (
              <TouchableOpacity
                key={roleOption}
                style={[
                  styles.roleButton,
                  role === roleOption && styles.selectedRoleButton
                ]}
                onPress={() => setRole(roleOption)}
              >
                <Text style={[
                  styles.roleButtonText,
                  role === roleOption && styles.selectedRoleButtonText
                ]}>
                  {roleOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleAddUser}>
            <Text style={styles.saveButtonText}>Create User</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <Text>Loading users...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          ListEmptyComponent={<Text>No users found</Text>}
        />
      )}
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
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  form: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
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
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
});

export default UserManagement;