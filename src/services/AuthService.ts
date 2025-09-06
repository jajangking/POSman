import { User, UserRole } from '../models/User';
import { getUserByUsername, updateUserLoginTime, createUser } from './DatabaseService';

// In a real application, passwords should be hashed
// For this example, we'll use plain text for simplicity
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const user = await getUserByUsername(username);
    
    if (user && user.password === password) {
      // Update last login time
      await updateUserLoginTime(user.id);
      return {
        ...user,
        lastLogin: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Create a new user
export const registerUser = async (
  username: string,
  password: string,
  role: UserRole,
  name: string,
  email?: string,
  phone?: string
): Promise<User> => {
  try {
    const newUser = await createUser({
      username,
      password,
      role,
      name,
      email,
      phone
    });
    
    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Check if user has specific role
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

// Create default users if they don't exist
export const createDefaultUsers = async () => {
  try {
    console.log('Setting up default users...');
    
    // In a real application, we would check if these users exist before creating them
    // For now, we'll just log the default credentials for quick login
    console.log('Default users available for quick login:');
    console.log('Admin: username "admin", password "admin123"');
    console.log('Staff: username "staff", password "staff123"');
    console.log('Customer: username "customer", password "customer123"');
    
    return true;
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error;
  }
};