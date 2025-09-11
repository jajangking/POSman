import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { searchProducts, getProductByCode, generateReceiptNumber, saveTransaction, CartItem, getAllActiveProducts } from '../services/CashierService';
import { findMemberByPhone, redeemPoints, calculatePointsEarned, updateMemberPoints } from '../services/MemberService';
import { Member } from '../models/Member';
import { DEFAULT_POINTS_CONFIG } from '../utils/pointSystem';
import { InventoryItem, formatRupiah } from '../models/Inventory';
import ScannerModal from './ScannerModal';
import ItemListModal from './ItemListModal';
import { 
  HeaderInfoSection,
  SearchPanel,
  ProductList,
  TotalDetails,
  FunctionButtons,
  PaymentButton,
  CalculatorModal,
  PaymentPage,
  ReceiptPage,
  StoreSettingsModal
} from './cashier';

interface CashierScreenProps {
  onBack: () => void;
  onNavigateToMemberManagement: () => void;
  onNavigateToSettings?: () => void; // Optional prop for navigating to settings
}

const CashierScreen: React.FC<CashierScreenProps> = ({ onBack, onNavigateToMemberManagement, onNavigateToSettings }) => {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [receiptNumber, setReceiptNumber] = useState('');
  const [inputText, setInputText] = useState(''); // Changed from searchQuery to match SO
  const [memberNumber, setMemberNumber] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [calculatorInput, setCalculatorInput] = useState('');
  const [activeInput, setActiveInput] = useState<'search' | 'qty' | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false); // Added scanner visibility state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null); // State for selected member
  const [pointsToRedeem, setPointsToRedeem] = useState('0'); // State for points to redeem
  const [itemListVisible, setItemListVisible] = useState(false); // State for showing inventory list modal
  const [showPaymentPage, setShowPaymentPage] = useState(false); // State for showing payment page
  const [showReceiptPage, setShowReceiptPage] = useState(false); // State for showing receipt page
  const [showSettingsModal, setShowSettingsModal] = useState(false); // State for showing settings modal
  const [storeSettings, setStoreSettings] = useState({
    name: 'TOKO POSman',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '(021) 123-4567',
    paperSize: '80mm' as '80mm' | '58mm', // Default paper size
    footerMessage: 'Terima kasih telah berbelanja di toko kami!'
  }); // State for store settings
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'cash',
    amountPaid: 0,
    change: 0
  }); // State for payment details
  
  // Transaction session key for AsyncStorage
  const TRANSACTION_SESSION_KEY = 'cashier_transaction_session';
  
  // Save transaction session to AsyncStorage
  const saveTransactionSession = async () => {
    try {
      const sessionData = {
        cartItems,
        selectedMember,
        memberNumber,
        pointsToRedeem,
        receiptNumber
      };
      await AsyncStorage.setItem(TRANSACTION_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving transaction session:', error);
    }
  };
  
  // Load transaction session from AsyncStorage
  const loadTransactionSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(TRANSACTION_SESSION_KEY);
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        setCartItems(parsedData.cartItems || []);
        setSelectedMember(parsedData.selectedMember || null);
        setMemberNumber(parsedData.memberNumber || '');
        setPointsToRedeem(parsedData.pointsToRedeem || '0');
        setReceiptNumber(parsedData.receiptNumber || receiptNumber);
        
        // Show alert that session was restored
        Alert.alert(
          'Sesi Dipulihkan', 
          'Transaksi sebelumnya telah dipulihkan.'
        );
      }
    } catch (error) {
      console.error('Error loading transaction session:', error);
    }
  };
  
  // Clear transaction session from AsyncStorage
  const clearTransactionSession = async () => {
    try {
      await AsyncStorage.removeItem(TRANSACTION_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing transaction session:', error);
    }
  };
  
  // Save session when cart items, member, or points change
  useEffect(() => {
    if (cartItems.length > 0 || selectedMember || pointsToRedeem !== '0') {
      saveTransactionSession();
    }
  }, [cartItems, selectedMember, memberNumber, pointsToRedeem]);
  
  // Load session on component mount
  useEffect(() => {
    loadTransactionSession();
  }, []);
  
  const [receiptCartItems, setReceiptCartItems] = useState<CartItem[]>([]); // State for cart items on receipt page
  const [receiptMember, setReceiptMember] = useState<Member | null>(null); // State for member on receipt page
  const [receiptDiscount, setReceiptDiscount] = useState(0); // State for discount on receipt page
  const [receiptPointsRedeemed, setReceiptPointsRedeemed] = useState(0); // State for points redeemed on receipt page
  const [receiptSubtotal, setReceiptSubtotal] = useState(0); // State for subtotal on receipt page
  const [receiptTax, setReceiptTax] = useState(0); // State for tax on receipt page
  const [receiptTotal, setReceiptTotal] = useState(0); // State for total on receipt page

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Handle hardware back button on Android
  const backHandler = BackHandler.addEventListener('hardwareBackPress', async () => {
    // If we're on the payment page, go back to the cashier screen
    if (showPaymentPage) {
      setShowPaymentPage(false);
      return true;
    }
    
    // If we're on the receipt page, go back to the cashier screen
    if (showReceiptPage) {
      setShowReceiptPage(false);
      return true;
    }
    
    // If there's no active transaction (no items in cart and no member selected), 
    // go directly to dashboard without confirmation
    if (cartItems.length === 0 && !selectedMember) {
      // Save session before leaving (in case there's any data to save)
      await saveTransactionSession();
      onBack();
      return true;
    }
    
    // If there's an active transaction (cart has items or member selected), 
    // ask user what to do with it
    Alert.alert(
      'Transaksi Belum Selesai',
      'Anda memiliki transaksi yang belum diselesaikan. Apa yang ingin Anda lakukan?',
      [
        {
          text: 'Lanjutkan Transaksi',
          style: 'cancel'
        },
        {
          text: 'Simpan Sementara & Keluar',
          onPress: async () => {
            // Save current session before leaving
            await saveTransactionSession();
            // Call the original onBack function
            onBack();
          }
        },
        {
          text: 'Hapus & Keluar',
          onPress: async () => {
            // Clear current session
            await clearTransactionSession();
            // Clear cart and member for new transaction
            setCartItems([]);
            setSelectedMember(null);
            setMemberNumber('');
            setPointsToRedeem('0');
            // Call the original onBack function
            onBack();
          },
          style: 'destructive'
        }
      ]
    );
    
    // Return true to indicate we've handled the back press
    return true;
  });
    
    // Load store settings from database
  const loadStoreSettings = async () => {
    try {
      // For now, we'll use default settings since getStoreSettings is not available
      setStoreSettings({
        name: 'TOKO POSman',
        address: 'Jl. Contoh No. 123, Jakarta',
        phone: '(021) 123-4567',
        paperSize: '80mm',
        footerMessage: 'Terima kasih telah berbelanja di toko kami!'
      });
    } catch (error) {
      console.error('Error loading store settings:', error);
    }
  };
    
    loadStoreSettings();
    
    // Generate receipt number with error handling
    const generateReceipt = async () => {
      try {
        // Use first 3 letters of username or default to 'USR'
        const userCode = currentUser?.username ? currentUser.username.substring(0, 3).toUpperCase() : 'USR';
        const newReceiptNumber = await generateReceiptNumber(userCode);
        setReceiptNumber(newReceiptNumber);
      } catch (error) {
        console.error('Error generating receipt number:', error);
        // Use fallback receipt number
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        setReceiptNumber(`USR${hours}${minutes}${seconds}`);
      }
    };
    
    generateReceipt();
    
    // Load transaction session
    loadTransactionSession();
    
    // Cleanup function
    return () => {
      clearInterval(timer);
      backHandler.remove();
    };
  }, [currentUser]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return formatRupiah(amount);
  };

  // Handle search query change (similar to SO)
  const handleSearchChange = async (query: string) => {
    setInputText(query);
    
    // If query is long enough, search for products
    if (query.length > 2) {
      try {
        const products = await searchProducts(query);
        // In a real implementation, you would show these products in a dropdown or search results
        console.log('Found products:', products);
      } catch (error) {
        console.error('Error searching products:', error);
      }
    }
  };

  // Handle scanning (similar to SO)
  const handleScan = () => {
    setScannerVisible(true);
  };

  // Handle barcode scanned (similar to SO)
  const handleBarcodeScanned = (barcode: string) => {
    setInputText(barcode);
    // Automatically add the item after scanning
    handleAddItemByCode(barcode);
  };

  // Handle adding item to cart (similar to SO)
  const handleAdd = () => {
    if (inputText.trim()) {
      handleAddItemByCode(inputText);
    }
  };

  // Handle adding item by code (barcode scanning or manual entry)
  const handleAddItemByCode = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      const product = await getProductByCode(code.trim());
      if (product) {
        // Check if item is already in the cart
        const existingItemIndex = cartItems.findIndex(item => item.code === product.code);
        
        if (existingItemIndex !== -1) {
          // If item exists, increase quantity
          const updatedItems = [...cartItems];
          const existingItem = updatedItems[existingItemIndex];
          const newQty = existingItem.qty + 1;
          updatedItems[existingItemIndex] = { 
            ...existingItem, 
            qty: newQty, 
            subtotal: newQty * existingItem.price 
          };
          setCartItems(updatedItems);
        } else {
          // If item doesn't exist, add new item
          const newItem: CartItem = {
            id: Math.random().toString(36).substring(2, 9),
            code: product.code,
            name: product.name,
            qty: 1,
            price: product.price,
            subtotal: product.price
          };
          
          setCartItems(prev => [...prev, newItem]);
        }
        
        // Clear input after successful add
        setInputText('');
      } else {
        Alert.alert('Product Not Found', 'No product found with that code. Please check the code or scan a valid barcode.');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
    }
  };

  // Parse formatted number back to clean number for calculations
  const parseFormattedNumber = (formattedNum: string): string => {
    return formattedNum.replace(/\./g, '').replace(',', '.');
  };

  // Format number with thousands separator
  const formatNumber = (num: string): string => {
    if (!num) return '';
    
    // Remove any existing formatting
    let cleanNum = num.replace(/\./g, '').replace(',', '.');
    
    // If it's a decimal number
    if (cleanNum.includes('.')) {
      const parts = cleanNum.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      
      // Format integer part with thousands separator
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Return with comma as decimal separator
      return formattedInteger + ',' + decimalPart;
    } else {
      // Format integer with thousands separator
      return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  // Handle calculator input
  const handleShowInventoryList = () => {
    setItemListVisible(true);
  };

  // Handle item selection from the inventory list modal
  const handleItemSelect = (item: InventoryItem) => {
    // Check if item is already in the cart
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.code === item.code);
    
    if (existingItemIndex !== -1) {
      // If item exists, increase quantity
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQty = existingItem.qty + 1;
      updatedItems[existingItemIndex] = { 
        ...existingItem, 
        qty: newQty, 
        subtotal: newQty * existingItem.price 
      };
      setCartItems(updatedItems);
    } else {
      // If item doesn't exist, add new item
      const newItem: CartItem = {
        id: Math.random().toString(36).substring(2, 9),
        code: item.code,
        name: item.name,
        qty: 1,
        price: item.price,
        subtotal: item.price
      };
      
      setCartItems(prev => [...prev, newItem]);
    }
    
    // Close the inventory list modal
    setItemListVisible(false);
  };

  // Handle calculator input
  const handleCalculatorInput = (value: string) => {
    if (value === '=') {
      try {
        // Replace × and ÷ with * and / for evaluation
        let expression = parseFormattedNumber(calculatorInput);
        expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Simple evaluation (in a real app, use a proper expression parser)
        const result = eval(expression);
        
        // Format the result with thousands separator
        if (Number.isInteger(result)) {
          setCalculatorInput(result.toLocaleString('id-ID').replace(/,/g, '.'));
        } else {
          // For decimal numbers, format appropriately
          const formattedResult = parseFloat(result.toFixed(10)).toString().replace('.', ',');
          setCalculatorInput(formatNumber(formattedResult));
        }
      } catch (error) {
        setCalculatorInput('Error');
      }
    } else if (value === 'C') {
      setCalculatorInput('');
    } else if (value === '←') {
      // Remove last character and reformat
      const newInput = calculatorInput.slice(0, -1);
      if (newInput && !['+', '-', '×', '÷'].includes(newInput.slice(-1))) {
        // If the last character is a number, reformat the entire input
        const lastOperatorIndex = Math.max(
          newInput.lastIndexOf('+'),
          newInput.lastIndexOf('-'),
          newInput.lastIndexOf('×'),
          newInput.lastIndexOf('÷')
        );
        
        if (lastOperatorIndex === -1) {
          // No operators, format the whole number
          setCalculatorInput(formatNumber(newInput.replace(/\./g, '').replace(',', '.')));
        } else {
          // Format only the number part after the last operator
          const numberPart = newInput.substring(lastOperatorIndex + 1);
          const operatorPart = newInput.substring(0, lastOperatorIndex + 1);
          if (numberPart) {
            setCalculatorInput(operatorPart + formatNumber(numberPart.replace(/\./g, '').replace(',', '.')));
          } else {
            setCalculatorInput(newInput);
          }
        }
      } else {
        setCalculatorInput(newInput);
      }
    } else if (['+', '-', '×', '÷'].includes(value)) {
      // Add operator directly
      let formattedValue = value;
      if (value === '*') formattedValue = '×';
      if (value === '/') formattedValue = '÷';
      
      setCalculatorInput(calculatorInput + formattedValue);
    } else {
      // Handle digit input with formatting
      const newInput = calculatorInput + value;
      
      // Find the last operator position
      const lastOperatorIndex = Math.max(
        newInput.lastIndexOf('+'),
        newInput.lastIndexOf('-'),
        newInput.lastIndexOf('×'),
        newInput.lastIndexOf('÷')
      );
      
      if (lastOperatorIndex === -1) {
        // No operators, format the whole number
        const cleanNumber = newInput.replace(/\./g, '').replace(',', '.');
        setCalculatorInput(formatNumber(cleanNumber));
      } else {
        // Format only the number part after the last operator
        const operatorPart = newInput.substring(0, lastOperatorIndex + 1);
        const numberPart = newInput.substring(lastOperatorIndex + 1);
        const cleanNumberPart = numberPart.replace(/\./g, '').replace(',', '.');
        
        if (numberPart) {
          setCalculatorInput(operatorPart + formatNumber(cleanNumberPart));
        } else {
          setCalculatorInput(newInput);
        }
      }
    }
  };

  // Handle payment
  const handlePayment = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart before processing payment.');
      return;
    }
    
    // Show payment page instead of directly processing
    setShowPaymentPage(true);
  };
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentMethod: string, amountPaid: number, change: number) => {
    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.1; // 10% tax
      
      // Calculate points to redeem
      const points = parseInt(pointsToRedeem) || 0;
      const pointsDiscount = points * 1000; // Assuming 1 point = Rp 1000 discount
      
      const total = subtotal + tax - pointsDiscount;
      
      // Log data for debugging
      console.log('Payment completion data:', {
        cartItems,
        subtotal,
        tax,
        total,
        paymentMethod,
        amountPaid,
        change,
        points,
        pointsDiscount,
        selectedMember
      });
      
      // Save transaction to database
      if (currentUser) {
        await saveTransaction(cartItems, total, currentUser.id, receiptNumber, selectedMember?.id, points);
        
        // Update member points if member is selected
        if (selectedMember) {
          try {
            // Update member's points in the database
            await updateMemberPoints(selectedMember.id, subtotal);
            console.log(`Member ${selectedMember.name} earned ${calculatePointsEarned(subtotal)} points`);
          } catch (error) {
            console.error('Error updating member points:', error);
            Alert.alert('Error', 'Failed to update member points. Please try again.');
          }
        }
        
        // Update payment details state
        setPaymentDetails({
          paymentMethod,
          amountPaid,
          change
        });
        
        // Hide payment page and show receipt page
        setShowPaymentPage(false);
        // Save cart items, member, discount, points redeemed, and calculated values for receipt page before clearing
        setReceiptCartItems([...cartItems]);
        setReceiptMember(selectedMember);
        setReceiptDiscount(pointsDiscount);
        setReceiptPointsRedeemed(points);
        setReceiptSubtotal(subtotal);
        setReceiptTax(tax);
        setReceiptTotal(total);
        setShowReceiptPage(true);
        
        // Clear cart and member for new transaction
        setCartItems([]);
        setSelectedMember(null);
        setMemberNumber('');
        setPointsToRedeem('0');
        
        // Clear transaction session
        await clearTransactionSession();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    // In a real app, this would connect to a printer
    Alert.alert('Cetak Struk', 'Fungsi pencetakan struk akan diimplementasikan di sini.');
  };
      // Generate new receipt number
      // Handle new transaction
  const handleNewTransaction = async () => {
    try {
      // Generate new receipt number
      if (currentUser) {
        const userCode = currentUser.username ? currentUser.username.substring(0, 3).toUpperCase() : 'USR';
        const newReceiptNumber = await generateReceiptNumber(userCode);
        setReceiptNumber(newReceiptNumber);
      }
      
      // Hide receipt page and show main cashier screen
      setShowReceiptPage(false);
      // Clear receipt cart items, member, discount, points redeemed, and calculated values
      setReceiptCartItems([]);
      setReceiptMember(null);
      setReceiptDiscount(0);
      setReceiptPointsRedeemed(0);
      setReceiptSubtotal(0);
      setReceiptTax(0);
      setReceiptTotal(0);
      
      // Clear transaction session
      await clearTransactionSession();
    } catch (error) {
      console.error('Error generating new receipt number:', error);
      // Use fallback receipt number
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setReceiptNumber(`USR${hours}${minutes}${seconds}`);
      
      // Hide receipt page and show main cashier screen
      setShowReceiptPage(false);
      // Clear receipt cart items, member, discount, points redeemed, and calculated values
      setReceiptCartItems([]);
      setReceiptMember(null);
      setReceiptDiscount(0);
      setReceiptPointsRedeemed(0);
      setReceiptSubtotal(0);
      setReceiptTax(0);
      setReceiptTotal(0);
      
      // Clear transaction session
      await clearTransactionSession();
    }
  };

  // Open settings modal
  const openSettings = () => {
    setShowSettingsModal(true);
  };

  // Close settings modal
  const closeSettings = () => {
    setShowSettingsModal(false);
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);
  
  // For now, we'll use fixed values for discount and tax settings
  // In a real implementation, these would come from app settings
  const discountEnabled = false; // This would come from app settings
  const taxEnabled = true; // This would come from app settings
  const taxPercentage = 10; // This would come from app settings (10%)
  
  // Calculate points discount
  const points = parseInt(pointsToRedeem) || 0;
  const pointsDiscount = points * 1000; // Assuming 1 point = Rp 1000 discount
  
  const discount = discountEnabled ? subtotal * 0.1 : 0; // 10% discount if enabled
  const tax = taxEnabled ? (subtotal - discount - pointsDiscount) * (taxPercentage / 100) : 0;
  const total = subtotal - discount - pointsDiscount + tax;

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {!showPaymentPage && !showReceiptPage && (
            <>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={async () => {
                  // If there's no active transaction (no items in cart and no member selected), 
                  // go directly to dashboard without confirmation
                  if (cartItems.length === 0 && !selectedMember) {
                    // Save session before leaving (in case there's any data to save)
                    await saveTransactionSession();
                    onBack();
                    return;
                  }
                  
                  // If there's an active transaction (cart has items or member selected), 
                  // ask user what to do with it
                  Alert.alert(
                    'Transaksi Belum Selesai',
                    'Anda memiliki transaksi yang belum diselesaikan. Apa yang ingin Anda lakukan?',
                    [
                      {
                        text: 'Lanjutkan Transaksi',
                        style: 'cancel'
                      },
                      {
                        text: 'Simpan Sementara & Keluar',
                        onPress: async () => {
                          // Save current session before leaving
                          await saveTransactionSession();
                          // Call the original onBack function
                          onBack();
                        }
                      },
                      {
                        text: 'Hapus & Keluar',
                        onPress: async () => {
                          // Clear current session
                          await clearTransactionSession();
                          // Clear cart and member for new transaction
                          setCartItems([]);
                          setSelectedMember(null);
                          setMemberNumber('');
                          setPointsToRedeem('0');
                          // Call the original onBack function
                          onBack();
                        },
                        style: 'destructive'
                      }
                    ]
                  );
                }}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Cashier</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Header Info Section */}
              <HeaderInfoSection
                currentTime={currentTime}
                currentUser={currentUser}
                receiptNumber={receiptNumber}
                selectedMember={selectedMember}
                setSelectedMember={setSelectedMember}
                memberNumber={memberNumber}
                setMemberNumber={setMemberNumber}
                pointsToRedeem={pointsToRedeem}
                setPointsToRedeem={setPointsToRedeem}
              />

              {/* Smart Search Panel with Action Buttons */}
              <SearchPanel
                inputText={inputText}
                setInputText={setInputText}
                handleSearchChange={handleSearchChange}
                handleAdd={handleAdd}
                handleScan={handleScan}
                setActiveInput={setActiveInput}
              />

              {/* Product List */}
              <ProductList
                cartItems={cartItems}
                setCartItems={setCartItems}
                formatCurrency={formatCurrency}
              />

              {/* Total Details */}
              <TotalDetails
                subtotal={subtotal}
                tax={tax}
                discount={discount}
                pointsToRedeem={pointsToRedeem}
                total={total}
                formatCurrency={formatCurrency}
                discountEnabled={discountEnabled}
                taxEnabled={taxEnabled}
                taxPercentage={taxPercentage}
              />

              {/* Function Buttons */}
              <FunctionButtons
                handleShowInventoryList={handleShowInventoryList}
                setShowCalculator={setShowCalculator}
                onNavigateToMemberManagement={onNavigateToMemberManagement}
                onOpenSettings={onNavigateToSettings} // Pass the settings navigation function
              />
              
              {/* Payment Button */}
              <PaymentButton handlePayment={handlePayment} />
            </>
          )}

          {/* Payment Page */}
          {showPaymentPage && (
            <PaymentPage
              cartItems={cartItems}
              subtotal={subtotal}
              tax={tax}
              total={total}
              pointsToRedeem={pointsToRedeem} // Add this prop
              selectedMember={selectedMember}
              onPaymentComplete={handlePaymentComplete}
              onBack={() => setShowPaymentPage(false)}
            />
          )}

          {/* Receipt Page */}
          {showReceiptPage && (
            <ReceiptPage
              transactionId={receiptNumber}
              cartItems={receiptCartItems}
              subtotal={receiptSubtotal}
              tax={receiptTax}
              total={receiptTotal}
              paymentMethod={paymentDetails.paymentMethod}
              amountPaid={paymentDetails.amountPaid}
              change={paymentDetails.change}
              pointsEarned={calculatePointsEarned(receiptSubtotal)}
              currentPoints={receiptMember ? receiptMember.totalPoints : 0}
              newPointsBalance={receiptMember ? receiptMember.totalPoints + calculatePointsEarned(receiptSubtotal) : 0}
              memberName={receiptMember ? receiptMember.name : undefined}
              storeSettings={storeSettings}
              discount={receiptDiscount}
              pointsRedeemed={receiptPointsRedeemed}
              onPrint={handlePrintReceipt}
              onNewTransaction={handleNewTransaction}
            />
          )}

          {/* Calculator Modal */}
          <CalculatorModal
            showCalculator={showCalculator}
            setShowCalculator={setShowCalculator}
            calculatorInput={calculatorInput}
            handleCalculatorInput={handleCalculatorInput}
          />

          {/* Item List Modal */}
          <ItemListModal
            visible={itemListVisible}
            onSelectItem={handleItemSelect}
            onClose={() => setItemListVisible(false)}
          />

          {/* Scanner Modal */}
          <ScannerModal
            visible={scannerVisible}
            onBarcodeScanned={handleBarcodeScanned}
            onClose={() => setScannerVisible(false)}
          />
          
          {/* Store Settings Modal */}
              <StoreSettingsModal
                visible={showSettingsModal}
                onClose={closeSettings}
              />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  // Inventory List Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  inventoryListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listNoColumn: {
    width: '8%',
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white', // Keep white for header
  },
  listCodeColumn: {
    width: '15%',
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white', // Keep white for header
  },
  listNameColumn: {
    width: '40%',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingLeft: 5,
    color: 'white', // Keep white for header
  },
  listPriceColumn: {
    width: '22%',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 5,
    color: 'white', // Changed from white to dark gray for better visibility
  },
  // Styles for table cells in rows (not header)
  listItemNoColumn: {
    color: '#333',
    fontWeight: 'normal', // Normal weight for rows
  },
  listItemCodeColumn: {
    color: '#333',
    fontWeight: 'normal', // Normal weight for rows
  },
  listItemNameColumn: {
    color: '#333',
    fontWeight: 'normal', // Normal weight for rows
  },
  listItemPriceColumn: {
    color: '#333',
    fontWeight: 'normal', // Normal weight for rows
  },
  listTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // End of Simple Inventory List Styles
});

export default CashierScreen;