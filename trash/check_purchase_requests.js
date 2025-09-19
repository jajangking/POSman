import { getAllPurchaseRequests } from './src/services/DatabaseService.js';

async function checkPurchaseRequests() {
  try {
    console.log('Checking purchase requests in database...');
    const requests = await getAllPurchaseRequests();
    console.log('Found', requests.length, 'purchase requests');
    console.log('Requests:', JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error checking purchase requests:', error);
  }
}

checkPurchaseRequests();