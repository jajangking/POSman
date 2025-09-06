export interface StockOpname {
  id: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  type: 'partial' | 'grand';
  status: 'draft' | 'processing' | 'completed';
  createdBy: string;
  createdAt: Date;
}

export interface StockOpnameItem {
  id: string;
  opnameId: string;
  itemCode: string;
  systemQuantity: number;
  actualQuantity?: number;
  difference?: number;
  status?: 'matched' | 'shortage' | 'overage';
  createdAt: Date;
}