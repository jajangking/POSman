import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../models/User';
import { initDatabase, getAllUsers, createDefaultUsers } from '../services/DatabaseService';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  initializeApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing database...');
      // Initialize database
      await initDatabase();
      console.log('Database initialized');
      
      // Create default users if they don't exist
      console.log('Creating default users...');
      await createDefaultUsers();
      console.log('Default users created');
      
      const users = await getAllUsers();
      console.log(`Found ${users.length} users in database`);
      
      setIsLoading(false);
      console.log('App initialization completed');
    } catch (err) {
      console.error('Error initializing app:', err);
      setError('Failed to initialize application');
      setIsLoading(false);
    }
  };

  const login = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    initializeApp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};