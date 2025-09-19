# POSman - Point of Sale Manager

POSman is a comprehensive Point of Sale (POS) application built with React Native and Expo. It provides inventory management, sales processing, reporting, and more - all in a mobile-friendly interface.

## Features

- User authentication with role-based access control (Admin, Staff)
- Inventory management with product tracking and categories
- Stock opname functionality for inventory reconciliation
- Sales processing with receipt generation
- Customer management
- Reporting dashboard with sales analytics
- Discount and tax configuration
- Database backup and management

## Supabase Integration

This project includes integration with Supabase for cloud database synchronization and backup features.

### Setup Instructions

1. Create a Supabase project at [https://app.supabase.com/](https://app.supabase.com/)
2. Copy `src/config/supabaseConfig.example.ts` to `src/config/supabaseConfig.ts`
3. Update the file with your actual Supabase credentials
4. Create a "backups" bucket in Supabase Storage

For detailed setup instructions, see [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md)

## Technologies Used

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (local) with Supabase (cloud)
- **State Management**: React Context API
- **Navigation**: React Navigation
- **UI Components**: React Native built-in components with custom styling

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

## Security Notes

This is a demonstration system. For production use, the following security improvements should be implemented:
1. Passwords should be properly hashed and salted
2. Implement proper session management
3. Add input validation and sanitization
4. Implement rate limiting for login attempts
5. Use secure communication protocols

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
└── README.md               # This file
```