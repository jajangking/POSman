# POSman - Point of Sale Manager

## Project Overview

POSman is a React Native mobile application built with Expo, designed as a Point of Sale (POS) system with inventory management capabilities. The application is structured with a clear separation of concerns, utilizing React Context API for state management, SQLite for local data storage, and a component-based UI architecture.

Key features include:
- User authentication with role-based access control (Admin, Staff, Customer, Guest)
- Inventory management with product tracking, categories, and low stock alerts
- Stock opname functionality for inventory reconciliation
- Admin dashboard for user management
- Local database storage using SQLite

## Technologies Used

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (via `expo-sqlite`)
- **State Management**: React Context API
- **Navigation**: React Navigation
- **UI Components**: React Native built-in components with custom styling
- **Additional Libraries**:
  - `@react-native-async-storage/async-storage` for local storage
  - `expo-barcode-scanner` and `expo-camera` for barcode scanning
  - `react-native-svg` and `react-native-qrcode-svg` for QR code generation
  - `react-native-share` and `react-native-view-shot` for sharing features

## Project Structure

```
POSman/
├── App.tsx                 # Main application entry point
├── src/
│   ├── context/            # React Context providers (AuthContext)
│   ├── models/             # Data models (User, Inventory)
│   ├── services/           # Business logic and database operations (DatabaseService)
│   └── components/         # UI components (LoginPanel, HomeDashboard, etc.)
├── assets/                 # Static assets (images)
├── package.json            # Project dependencies and scripts
└── README_AUTH.md          # Documentation for authentication system
```

## Building and Running

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

- Start the Expo development server:
  ```bash
  npm start
  ```
- Run on Android:
  ```bash
  npm run android
  ```
- Run on iOS:
  ```bash
  npm run ios
  ```
- Run on Web:
  ```bash
  npm run web
  ```

## Development Conventions

- **Type Safety**: The project uses TypeScript for type checking throughout the codebase.
- **Component Structure**: Components are organized in the `src/components` directory, with each component in its own file.
- **State Management**: Authentication state is managed using React Context API (`src/context/AuthContext.tsx`).
- **Database Operations**: All database interactions are handled through the `DatabaseService` (`src/services/DatabaseService.ts`).
- **Data Models**: Data structures are defined in the `src/models` directory.
- **Naming Conventions**: 
  - Files and components use PascalCase (e.g., `HomeDashboard.tsx`)
  - Variables and functions use camelCase (e.g., `currentUser`, `handleLoginSuccess`)
  - Constants use UPPER_SNAKE_CASE (e.g., `userRoles`)

## Key Components

### Authentication

- **AuthContext**: Manages global authentication state, user login/logout, and app initialization.
- **LoginPanel**: UI component for user authentication.
- **User Roles**: Supports Admin, Staff, Customer, and Guest roles with different access levels.

### Main Application Flow

- **App.tsx**: Root component that wraps the application with `AuthProvider` and handles navigation between different views.
- **HomeDashboard**: Main dashboard that displays available features based on user role.
- **InventoryScreen**: Interface for managing inventory items.
- **AdminDashboard**: Admin-specific interface for user management.

### Database Schema

The application uses SQLite with the following key tables:
- **users**: Stores user account information (id, username, password, role, etc.)
- **inventory_items**: Stores product information (code, name, price, quantity, etc.)
- **inventory_transactions**: Tracks inventory changes (additions, removals, adjustments)

## Security Notes

This is a demonstration system. For production use, the following security improvements should be implemented:
1. Passwords should be properly hashed and salted
2. Implement proper session management
3. Add input validation and sanitization
4. Implement rate limiting for login attempts
5. Use secure communication protocols

## Aturan Khusus untuk Interaksi

- **Dilarang menjalankan proyek**: Tidak boleh menggunakan perintah apa pun yang berpotensi memulai atau menjalankan aplikasi (seperti `npm start`, `npm run android`, dll.).
- **Tidak ada ringkasan**: Tidak boleh memberikan ringkasan perubahan atau penjelasan tambahan setelah melakukan modifikasi kode, kecuali diminta secara eksplisit.