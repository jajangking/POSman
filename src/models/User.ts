export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserParams {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdBy: string;
}

export type UserRole = 'admin' | 'staff' | 'customer' | 'guest';

export const userRoles: UserRole[] = ['admin', 'staff', 'customer', 'guest'];

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}