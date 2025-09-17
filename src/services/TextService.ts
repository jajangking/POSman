interface PurchaseRequestItem {
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PurchaseRequestData {
  poNumber: string;
  date: string;
  items: PurchaseRequestItem[];
  totalAmount: number;
  supplier?: string;
  notes?: string;
}

export const generatePurchaseRequestText = (data: PurchaseRequestData): string => {
  // Membuat header
  let content = `PURCHASE REQUEST - PERMINTAAN BARANG
`;
  content += `=====================================

`;
  
  // Informasi dasar
  content += `No. PO: ${data.poNumber}
`;
  content += `Tanggal: ${data.date}
`;
  if (data.supplier) {
    content += `Supplier: ${data.supplier}
`;
  }
  content += `

`;
  
  // Catatan jika ada
  if (data.notes) {
    content += `Catatan: ${data.notes}

`;
  }
  
  // Header tabel
  content += `No.  Kode        Nama Barang                 Jumlah   Harga        Total
`;
  content += `---- ----------- --------------------------  ------   -----------  -----------

`;
  
  // Item-item
  data.items.forEach((item, index) => {
    const no = (index + 1).toString().padStart(4, ' ');
    const code = item.code.padEnd(11, ' ');
    const name = item.name.length > 26 ? item.name.substring(0, 23) + '...' : item.name.padEnd(26, ' ');
    const quantity = item.quantity.toString().padStart(6, ' ');
    const price = `Rp${item.price.toLocaleString()}`.padStart(11, ' ');
    const total = `Rp${item.total.toLocaleString()}`.padStart(11, ' ');
    
    content += `${no}  ${code} ${name}  ${quantity}   ${price}  ${total}
`;
  });
  
  // Total
  content += `

`;
  content += `TOTAL: Rp${data.totalAmount.toLocaleString()}

`;
  
  // Tanda tangan
  content += `Dibuat Oleh,

`;
  content += `_______________

`;
  content += `Disetujui Oleh,

`;
  content += `_______________

`;
  
  return content;
};