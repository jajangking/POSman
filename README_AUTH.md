# POSman Authentication System

This document explains the authentication system implemented for the POSman application.

## User Roles

The system supports four user roles:

1. **Admin** - Full system access including user management
2. **Staff** - Access to POS functions and inventory management
3. **Customer** - Access to customer-specific features
4. **Guest** - Limited access for browsing without login

## Database Structure

The system uses SQLite for local data storage with the following table:

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  createdAt TEXT NOT NULL,
  lastLogin TEXT
);
```

## Default Users

For demonstration purposes, the system creates these default users:

- **Admin**: username `admin`, password `admin123`
- **Staff**: username `staff`, password `staff123`
- **Customer**: username `customer`, password `customer123`

## Components

1. **LoginPanel** - UI component for user authentication
2. **UserManagement** - Admin interface for managing users
3. **AuthContext** - Global state management for authentication
4. **DatabaseService** - SQLite database operations
5. **AuthService** - Authentication logic and user registration

## Features

- User authentication with role-based access control
- Local database storage for user data
- Admin user management interface
- Guest access option
- Password storage (note: in a production environment, passwords should be hashed)

## Security Notes

This is a demonstration system. In a production environment:

1. Passwords should be properly hashed and salted
2. Implement proper session management
3. Add input validation and sanitization
4. Implement rate limiting for login attempts
5. Use secure communication protocols