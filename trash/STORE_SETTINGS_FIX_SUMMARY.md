# Store Settings Fix Summary

## Problem
The application was encountering a "NOT NULL constraint failed: store_settings.name" error when trying to save store settings. This was happening because:

1. The database schema had changed from using `storeName`, `storeAddress`, `storePhone` to `name`, `address`, `phone`
2. The application code was still using the old property names
3. There was no validation to ensure the name field wasn't empty
4. There was no default value handling for fields that could be NULL

## Changes Made

### 1. Fixed Property Name Mismatches
Updated all files that were using the old property names (`storeName`, `storeAddress`, `storePhone`) to use the correct names (`name`, `address`, `phone`):

- `src/components/SettingsPage.tsx`
- `src/components/SettingsPage.simple.tsx`
- `src/components/CashierScreen.tsx`
- `src/components/CashierPage.tsx`

### 2. Enhanced Database Service Functions
Modified `src/services/DatabaseService.ts` to:

- Add validation in `updateStoreSettings` to ensure the name field is not empty
- Add default values in `updateStoreSettings` for all fields to prevent NULL constraint violations
- Add a check in `initDatabase` to ensure there's always at least one row in the store_settings table
- Add default values in `getStoreSettings` to prevent undefined values

### 3. Added Proper Error Handling
Updated the error handling in SettingsPage.tsx to provide more informative error messages to the user.

## Verification
These changes should resolve the "NOT NULL constraint failed: store_settings.name" error by ensuring that:

1. The name field is always provided when saving settings
2. All fields have appropriate default values when inserting new records
3. The store_settings table always has at least one row with default values
4. All components use the correct property names when accessing store settings

## Testing
To test these changes:

1. Open the Settings page in the application
2. Modify some store settings
3. Save the settings
4. Verify that no errors occur and the settings are properly saved

The issue should now be resolved.