const { openDatabase } = require('expo-sqlite');

async function checkPurchaseRequests() {
  try {
    console.log('Checking purchase requests in database...');
    
    // This won't work in Node.js as expo-sqlite is a React Native library
    console.log('Cannot directly check database from Node.js. expo-sqlite is a React Native library.');
    console.log('Need to check from within the app.');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPurchaseRequests();