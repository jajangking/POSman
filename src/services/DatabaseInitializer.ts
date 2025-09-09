import { openDatabase } from './DatabaseService';

// Initialize database with sample products
export const initializeSampleProducts = async (): Promise<void> => {
  try {
    const database = await openDatabase();
    
    // Check if we have any products
    const result: any = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM inventory_items'
    );
    
    // If no products exist, create sample products
    if (result.count === 0) {
      const sampleProducts = [
        {
          code: 'PRD001',
          name: 'Sample Product 1',
          description: 'This is a sample product for testing',
          category: 'Electronics',
          price: 50000,
          cost: 30000,
          quantity: 100,
          sku: 'SKU001',
          supplier: 'Sample Supplier',
          reorderLevel: 10,
          isActive: 1
        },
        {
          code: 'PRD002',
          name: 'Sample Product 2',
          description: 'This is another sample product for testing',
          category: 'Clothing',
          price: 75000,
          cost: 45000,
          quantity: 50,
          sku: 'SKU002',
          supplier: 'Sample Supplier',
          reorderLevel: 5,
          isActive: 1
        },
        {
          code: 'PRD003',
          name: 'Sample Product 3',
          description: 'This is a third sample product for testing',
          category: 'Food',
          price: 25000,
          cost: 15000,
          quantity: 200,
          sku: 'SKU003',
          supplier: 'Sample Supplier',
          reorderLevel: 20,
          isActive: 1
        }
      ];
      
      const timestamp = new Date().toISOString();
      
      for (const product of sampleProducts) {
        await database.runAsync(
          `INSERT INTO inventory_items 
           (code, name, description, category, price, cost, quantity, sku, supplier, reorderLevel, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.code,
            product.name,
            product.description,
            product.category,
            product.price,
            product.cost,
            product.quantity,
            product.sku,
            product.supplier,
            product.reorderLevel,
            product.isActive,
            timestamp,
            timestamp
          ]
        );
      }
      
      console.log('Sample products created successfully');
    } else {
      console.log('Products already exist in database');
    }
  } catch (error) {
    console.error('Error initializing sample products:', error);
  }
};