export interface SettingsData {
  name: string;
  address: string;
  phone: string;
  paperSize: "80mm" | "58mm";
  printAuto: boolean;
  discountEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
  footerMessage: string;
  bluetoothDevice: string;
  syncEnabled: boolean;
  lastSync: number;
}