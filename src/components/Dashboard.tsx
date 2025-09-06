import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../models/User';

interface DashboardProps {
  user: User;
}

const AdminDashboard: React.FC<DashboardProps> = ({ user }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Admin Dashboard</Text>
    <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
    <Text style={styles.roleText}>Role: {user.role}</Text>
    <Text style={styles.infoText}>As an administrator, you have full access to the system.</Text>
    <Text style={styles.infoText}>Use the navigation menu to access different sections.</Text>
  </View>
);

const StaffDashboard: React.FC<DashboardProps> = ({ user }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Staff Dashboard</Text>
    <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
    <Text style={styles.roleText}>Role: {user.role}</Text>
    <Text style={styles.infoText}>As a staff member, you can process transactions and manage inventory.</Text>
    <Text style={styles.infoText}>Use the navigation menu to access different sections.</Text>
  </View>
);

const CustomerDashboard: React.FC<DashboardProps> = ({ user }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Customer Dashboard</Text>
    <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
    <Text style={styles.roleText}>Role: {user.role}</Text>
    <Text style={styles.infoText}>As a customer, you can view products and make purchases.</Text>
    <Text style={styles.infoText}>Use the navigation menu to access different sections.</Text>
  </View>
);

const GuestDashboard: React.FC<DashboardProps> = ({ user }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Guest Access</Text>
    <Text style={styles.welcomeText}>Welcome, Guest!</Text>
    <Text style={styles.roleText}>Role: {user.role}</Text>
    <Text style={styles.infoText}>You are browsing as a guest. Some features may be limited.</Text>
    <Text style={styles.infoText}>Please log in for full access.</Text>
  </View>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'staff':
      return <StaffDashboard user={user} />;
    case 'customer':
      return <CustomerDashboard user={user} />;
    case 'guest':
      return <GuestDashboard user={user} />;
    default:
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Dashboard;