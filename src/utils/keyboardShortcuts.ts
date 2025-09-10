// Keyboard shortcuts utility for POSman
export const keyboardShortcuts = {
  // F4 shortcut for opening cashier
  CASHIER_SHORTCUT: 'F4',
  
  // Other potential shortcuts
  INVENTORY_SHORTCUT: 'F2',
  STOCK_OPNAME_SHORTCUT: 'F3',
  REPORTS_SHORTCUT: 'F5',
  CUSTOMERS_SHORTCUT: 'F6',
  
  // Check if a key event matches a specific shortcut
  isShortcut: (event: KeyboardEvent, shortcut: string) => {
    return event.key === shortcut;
  },
  
  // Prevent default behavior for handled shortcuts
  preventDefault: (event: KeyboardEvent) => {
    event.preventDefault();
  }
};