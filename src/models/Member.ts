export interface Member {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  birthday?: string;
  totalPurchases: number;
  totalPoints: number;
  lastTransaction?: string;
  createdAt: string;
  updatedAt: string;
}