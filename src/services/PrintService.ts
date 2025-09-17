import * as Print from 'expo-print';

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

export const generatePurchaseRequestHTML = (data: PurchaseRequestData): string => {
  // Membuat tabel item
  let itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr>
          <th style="text-align: left; border-bottom: 1px solid #000; padding: 8px;">No</th>
          <th style="text-align: left; border-bottom: 1px solid #000; padding: 8px;">Kode</th>
          <th style="text-align: left; border-bottom: 1px solid #000; padding: 8px;">Nama Barang</th>
          <th style="text-align: right; border-bottom: 1px solid #000; padding: 8px;">Jumlah</th>
          <th style="text-align: right; border-bottom: 1px solid #000; padding: 8px;">Harga</th>
          <th style="text-align: right; border-bottom: 1px solid #000; padding: 8px;">Total</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  data.items.forEach((item, index) => {
    itemsTable += `
      <tr>
        <td style="padding: 8px;">${index + 1}</td>
        <td style="padding: 8px;">${item.code}</td>
        <td style="padding: 8px;">${item.name}</td>
        <td style="text-align: right; padding: 8px;">${item.quantity}</td>
        <td style="text-align: right; padding: 8px;">Rp${item.price.toLocaleString('id-ID')}</td>
        <td style="text-align: right; padding: 8px;">Rp${item.total.toLocaleString('id-ID')}</td>
      </tr>
    `;
  });
  
  itemsTable += `
      </tbody>
    </table>
  `;
  
  // Membuat HTML untuk PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Purchase Request</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .header h2 { color: #666; margin-bottom: 20px; }
        .info { margin-bottom: 30px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-item { margin-bottom: 5px; }
        .info-label { font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 8px; }
        .items-table td { padding: 8px; }
        .text-right { text-align: right; }
        .total { text-align: right; margin-top: 30px; }
        .total-amount { font-size: 18px; font-weight: bold; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; }
        .signature-line { margin-top: 60px; border-top: 1px solid #000; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PURCHASE REQUEST</h1>
        <h2>PERMINTAAN BARANG</h2>
      </div>
      
      <div class="info">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">No. PO:</span> ${data.poNumber}
          </div>
          <div class="info-item">
            <span class="info-label">Tanggal:</span> ${data.date}
          </div>
        </div>
        
        ${data.supplier ? `
          <div class="info-item">
            <span class="info-label">Supplier:</span> ${data.supplier}
          </div>
        ` : ''}
        
        ${data.notes ? `
          <div class="info-item" style="margin-top: 20px;">
            <span class="info-label">Catatan:</span>
            <p>${data.notes}</p>
          </div>
        ` : ''}
      </div>
      
      ${itemsTable}
      
      <div class="total">
        <p class="total-amount">
          <strong>Total: Rp${data.totalAmount.toLocaleString('id-ID')}</strong>
        </p>
      </div>
      
      <div class="signature">
        <div class="signature-box">
          <p>Dibuat Oleh,</p>
          <div class="signature-line">
            (_____________________)
          </div>
        </div>
        <div class="signature-box">
          <p>Disetujui Oleh,</p>
          <div class="signature-line">
            (_____________________)
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return htmlContent;
};

export const printPurchaseRequest = async (data: PurchaseRequestData) => {
  try {
    const htmlContent = generatePurchaseRequestHTML(data);
    
    // Print menggunakan expo-print
    await Print.printAsync({
      html: htmlContent
    });
    
    return true;
  } catch (error) {
    console.error('Error printing purchase request:', error);
    return false;
  }
};

export const savePurchaseRequestPDF = async (data: PurchaseRequestData) => {
  try {
    const htmlContent = generatePurchaseRequestHTML(data);
    
    // Simpan sebagai PDF menggunakan expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    });
    
    return uri;
  } catch (error) {
    console.error('Error saving purchase request as PDF:', error);
    return null;
  }
};