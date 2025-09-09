import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { searchProducts, getProductByCode, generateReceiptNumber, saveTransaction, CartItem, getAllActiveProducts } from '../services/CashierService';
import { findMemberByPhone, redeemPoints } from '../services/MemberService';
import { Member } from '../models/Member';
import { POINTS_CONFIG } from '../utils/pointSystem';
import { InventoryItem } from '../models/Inventory';
import ScannerModal from './ScannerModal';

interface CashierScreenProps {
  onBack: () => void;
  onNavigateToMemberManagement: () => void;
}

const CashierScreen: React.FC<CashierScreenProps> = ({ onBack, onNavigateToMemberManagement }) => {
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
  const [showInventoryList, setShowInventoryList] = useState(false); // State for showing inventory list
  
  useEffect(() => {
    console.log('showInventoryList changed:', showInventoryList);
  }, [showInventoryList]);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]); // State for inventory items
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  
  // Filter inventory items based on search query
  const filteredInventoryItems = useMemo(() => {
    console.log('Filtering inventory items, inventoryItems:', inventoryItems, 'searchQuery:', inventorySearchQuery);
    if (!inventorySearchQuery.trim()) {
      return inventoryItems;
    }
    
    const query = inventorySearchQuery.toLowerCase();
    return inventoryItems.filter(item => 
      item.code.toLowerCase().includes(query) || 
      item.name.toLowerCase().includes(query)
    );
  }, [inventoryItems, inventorySearchQuery]);
  
  const searchInputRef = useRef<TextInput>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
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
    
    return () => clearInterval(timer);
  }, [currentUser]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  // Handle member check
  const handleMemberCheck = async () => {
    if (memberNumber.trim()) {
      try {
        // In a real implementation, this would check member number in the database
        const member = await findMemberByPhone(memberNumber.trim());
        if (member) {
          setSelectedMember(member);
          setPointsToRedeem('0'); // Reset points to redeem
          Alert.alert(
            'Member Found', 
            `Member: ${member.name}
Total Purchases: ${formatCurrency(member.totalPurchases)}
Available Points: ${member.totalPoints}`
          );
        } else {
          Alert.alert('Member Not Found', 'No member found with that phone number. Please check the number or add a new member.');
        }
      } catch (error) {
        console.error('Error checking member:', error);
        Alert.alert('Error', 'Failed to check member. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter a member phone number');
    }
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

  // Parse formatted number back to clean number for calculations
  const parseFormattedNumber = (formattedNum: string): string => {
    return formattedNum.replace(/\./g, '').replace(',', '.');
  };

  // Handle calculator input
  const handleShowInventoryList = async () => {
    try {
      console.log('Loading inventory items...');
      const items = await getAllActiveProducts();
      console.log('Loaded items:', items);
      setInventoryItems(items);
      setShowInventoryList(true);
      console.log('Show inventory list set to true');
    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    }
  };

  // Handle adding item to cart
  const handleAddItemToCart = (item: InventoryItem) => {
    Alert.alert(
      'Add Item to Cart',
      `Add ${item.name} to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: () => {
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
            
            // Close inventory list after adding item
            setShowInventoryList(false);
          }
        }
      ]
    );
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
  const handlePayment = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart before processing payment.');
      return;
    }
    
    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.1; // 10% tax
      const discount = 0; // No discount for now
      
      // Calculate points discount
      const points = parseInt(pointsToRedeem) || 0;
      const pointsDiscount = redeemPoints(points);
      
      const total = subtotal + tax - pointsDiscount;
      
      // Save transaction to database
      if (currentUser) {
        await saveTransaction(cartItems, total, currentUser.id, receiptNumber, selectedMember?.id, points);
        
        // Clear cart and generate new receipt number
        setCartItems([]);
        setSelectedMember(null);
        setMemberNumber('');
        setPointsToRedeem('0');
        try {
          // Use first 3 letters of username or default to 'USR'
          const userCode = currentUser.username ? currentUser.username.substring(0, 3).toUpperCase() : 'USR';
          const newReceiptNumber = await generateReceiptNumber(userCode);
          setReceiptNumber(newReceiptNumber);
        } catch (error) {
          console.error('Error generating new receipt number:', error);
          // Use fallback receipt number
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const seconds = now.getSeconds().toString().padStart(2, '0');
          setReceiptNumber(`USR${hours}${minutes}${seconds}`);
        }
        
        Alert.alert('Payment Successful', `Transaction completed. Receipt: ${receiptNumber}`);
      } else {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.1; // 10% tax
  const discount = 0; // No discount for now
  const total = subtotal + tax - discount;

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Cashier</Text>
            <View style={styles.placeholder} />
          </View>

        {/* Header Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date/Time:</Text>
            <Text style={styles.infoValue}>{currentTime.toLocaleDateString('id-ID')} {currentTime.toLocaleTimeString('id-ID')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User:</Text>
            <Text style={styles.infoValue}>{currentUser?.name || currentUser?.username || 'USR'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receipt:</Text>
            <Text style={styles.infoValue}>{receiptNumber}</Text>
          </View>
          {selectedMember && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member:</Text>
                <Text style={styles.infoValue}>{selectedMember.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Points:</Text>
                <Text style={styles.infoValue}>{selectedMember.totalPoints}</Text>
              </View>
              <View style={styles.memberRow}>
                <Text style={styles.infoLabel}>Redeem Points:</Text>
                <View style={styles.memberInputContainer}>
                  <TextInput
                    style={styles.memberInput}
                    placeholder="Enter points to redeem"
                    value={pointsToRedeem}
                    onChangeText={setPointsToRedeem}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity 
                    style={styles.memberCheckButton} 
                    onPress={() => {
                      // Validate points input
                      const points = parseInt(pointsToRedeem) || 0;
                      if (points > selectedMember.totalPoints) {
                        Alert.alert('Error', 'Not enough points available');
                        return;
                      }
                      if (points < POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION) {
                        Alert.alert('Error', `Minimum ${POINTS_CONFIG.MIN_POINTS_FOR_REDEMPTION} points required for redemption`);
                        return;
                      }
                      setPointsToRedeem(points.toString());
                    }}
                  >
                    <Text style={styles.memberCheckButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          <View style={styles.memberRow}>
            <Text style={styles.infoLabel}>Member Phone:</Text>
            <View style={styles.memberInputContainer}>
              <TextInput
                style={styles.memberInput}
                placeholder="Enter member phone number"
                value={memberNumber}
                onChangeText={setMemberNumber}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.memberCheckButton} onPress={handleMemberCheck}>
                <Text style={styles.memberCheckButtonText}>Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Smart Search Panel with Action Buttons */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Enter item code / barcode / name"
              value={inputText}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleAdd}
              onFocus={() => setActiveInput('search')}
            />
            <TouchableOpacity style={[styles.primaryButton, styles.scanButton]} onPress={handleScan}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, styles.addButton]} onPress={handleAdd}>
              <Text style={styles.buttonText}>ADD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product List */}
        <ScrollView style={styles.productList}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.noColumn]}>No</Text>
            <Text style={[styles.tableCell, styles.codeColumn]}>Code/SKU</Text>
            <Text style={[styles.tableCell, styles.nameColumn]}>Name</Text>
            <Text style={[styles.tableCell, styles.qtyColumn]}>Qty</Text>
            <Text style={[styles.tableCell, styles.priceColumn]}>Price</Text>
          </View>
          
          {cartItems.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.noColumn]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.codeColumn]}>{item.code}</Text>
              <Text style={[styles.tableCell, styles.nameColumn]}>{item.name}</Text>
              <TextInput
                style={[styles.tableCell, styles.qtyColumn, styles.qtyInput]}
                value={item.qty.toString()}
                onChangeText={(text) => {
                  const newQty = parseInt(text) || 0;
                  const updatedItems = [...cartItems];
                  updatedItems[index] = { ...item, qty: newQty, subtotal: newQty * item.price };
                  setCartItems(updatedItems);
                }}
                keyboardType="numeric"
              />
              <Text style={[styles.tableCell, styles.priceColumn]}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Total Details */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (10%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          {parseInt(pointsToRedeem) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Points Discount:</Text>
              <Text style={[styles.totalValue, styles.discountValue]}>-{formatCurrency(redeemPoints(parseInt(pointsToRedeem) || 0))}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Function Buttons */}
        <View style={styles.functionButtons}>
          <TouchableOpacity style={[styles.functionButton, styles.inventoryButton]} onPress={handleShowInventoryList}>
            <Text style={[styles.functionButtonText, styles.inventoryButtonText]}>F1</Text>
            <Text style={[styles.functionButtonLabel, styles.inventoryButtonLabel]}>Daftar Barang</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={() => setShowCalculator(true)}>
            <Text style={styles.functionButtonText}>F2</Text>
            <Text style={styles.functionButtonLabel}>Kalkulator</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton} onPress={onNavigateToMemberManagement}>
            <Text style={styles.functionButtonText}>F3</Text>
            <Text style={styles.functionButtonLabel}>Member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.functionButton}>
            <Text style={styles.functionButtonText}>F4</Text>
            <Text style={styles.functionButtonLabel}>Tahan</Text>
          </TouchableOpacity>
        </View>
        
        {/* Payment Button */}
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Text style={styles.paymentButtonText}>PAYMENT</Text>
          </TouchableOpacity>
        </View>

        {/* Calculator Modal */}
        {showCalculator && (
          <View style={styles.calculatorOverlay}>
            <View style={styles.calculatorContainer}>
              <View style={styles.calculatorHeader}>
                <Text style={styles.calculatorTitle}>Calculator</Text>
                <TouchableOpacity 
                  style={styles.calculatorCloseButton}
                  onPress={() => setShowCalculator(false)}
                >
                  <Text style={styles.calculatorCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.calculatorDisplay}>{calculatorInput || '0'}</Text>
              <View style={styles.calculatorButtons}>
                <View style={styles.calculatorRow}>
                  <TouchableOpacity style={[styles.calculatorButton, styles.clearButton]} onPress={() => handleCalculatorInput('C')}>
                    <Text style={styles.calculatorButtonText}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.clearButton]} onPress={() => handleCalculatorInput('←')}>
                    <Text style={styles.calculatorButtonText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('÷')}>
                    <Text style={styles.calculatorButtonText}>÷</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calculatorRow}>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('7')}>
                    <Text style={styles.calculatorButtonText}>7</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('8')}>
                    <Text style={styles.calculatorButtonText}>8</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('9')}>
                    <Text style={styles.calculatorButtonText}>9</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('×')}>
                    <Text style={styles.calculatorButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calculatorRow}>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('4')}>
                    <Text style={styles.calculatorButtonText}>4</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('5')}>
                    <Text style={styles.calculatorButtonText}>5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('6')}>
                    <Text style={styles.calculatorButtonText}>6</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('-')}>
                    <Text style={styles.calculatorButtonText}>-</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calculatorRow}>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('1')}>
                    <Text style={styles.calculatorButtonText}>1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('2')}>
                    <Text style={styles.calculatorButtonText}>2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('3')}>
                    <Text style={styles.calculatorButtonText}>3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.operatorButton]} onPress={() => handleCalculatorInput('+')}>
                    <Text style={styles.calculatorButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calculatorRow}>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('0')}>
                    <Text style={styles.calculatorButtonText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorInput('.')} >
                    <Text style={styles.calculatorButtonText}>.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculatorButton, styles.equalsButton]} onPress={() => handleCalculatorInput('=')}>
                    <Text style={styles.calculatorButtonText}>=</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Scanner Modal */}
        <ScannerModal
          visible={scannerVisible}
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setScannerVisible(false)}
        />
      </View>
    </SafeAreaView>
  </>
);

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
  infoSection: {
    backgroundColor: 'white',
    padding: 8,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: '30%',
  },
  infoValue: {
    fontSize: 12,
    color: '#666',
    width: '70%',
    textAlign: 'right',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  memberInputContainer: {
    flexDirection: 'row',
    width: '70%',
  },
  memberInput: {
    flex: 1,
    fontSize: 12,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  memberCheckButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 5,
    justifyContent: 'center',
  },
  memberCheckButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchSection: {
    padding: 15,
    paddingTop: 5,
    paddingBottom: 5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flex: 1,
    marginRight: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginRight: 10,
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  addButton: {
    backgroundColor: '#34C759',
    marginRight: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productList: {
    flex: 1,
    margin: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    textAlign: 'center',
    color: '#333', // Added text color for better visibility
  },
  noColumn: {
    width: '10%',
    fontSize: 14,
  },
  codeColumn: {
    width: '20%',
    fontSize: 14,
  },
  nameColumn: {
    width: '35%',
    fontSize: 14,
    textAlign: 'left',
    paddingLeft: 5,
  },
  qtyColumn: {
    width: '15%',
    fontSize: 14,
  },
  qtyInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 5,
    textAlign: 'center',
  },
  priceColumn: {
    width: '20%',
    fontSize: 14,
    textAlign: 'right',
    paddingRight: 5,
  },
  totalSection: {
    backgroundColor: 'white',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  discountValue: {
    color: '#FF3B30', // Red color for discount
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  functionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    marginBottom: 10,
  },
  functionButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  functionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inventoryButton: {
    backgroundColor: '#007AFF',
  },
  inventoryButtonText: {
    color: 'white',
  },
  inventoryButtonLabel: {
    color: 'white',
  },
  functionButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentButtonContainer: {
    padding: 5,
    paddingTop: 0,
    marginTop: -5,
    marginBottom: 30,
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calculatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '70%',
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatorCloseButton: {
    padding: 5,
  },
  calculatorCloseText: {
    fontSize: 24,
    color: '#666',
  },
  calculatorDisplay: {
    fontSize: 24,
    textAlign: 'right',
    padding: 15,
    backgroundColor: '#f5f5f5',
    fontFamily: 'monospace',
    minHeight: 40,
  },
  calculatorButtons: {
    padding: 10,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calculatorButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  operatorButton: {
    backgroundColor: '#ff9500',
    marginHorizontal: 5,
  },
  equalsButton: {
    backgroundColor: '#ff9500',
    flex: 2,
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#a6a6a6',
    flex: 1,
    marginHorizontal: 5,
  },
  calculatorButtonText: {
    fontSize: 18,
    color: '#333',
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
  memberForm: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formInput: {
    fontSize: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  memberFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#a6a6a6',
  },
  formButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  memberList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  memberListItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  memberPhone: {
    fontSize: 12,
    color: '#666',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#f8f8f8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inventorySearchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inventorySearchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#666',
  },
  simpleInventoryListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  simpleModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  simpleModalCloseButton: {
    padding: 5,
  },
  simpleModalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  simpleSearchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  simpleSearchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  simpleInventoryList: {
    flex: 1,
  },
  simpleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  simpleEvenRow: {
    backgroundColor: 'white',
  },
  simpleOddRow: {
    backgroundColor: '#f9f9f9',
  },
  simpleItemInfo: {
    flex: 1,
  },
  simpleItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  simpleItemCode: {
    fontSize: 12,
    color: '#666',
  },
  simpleItemPriceContainer: {
    alignItems: 'flex-end',
  },
  simpleItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3,
  },
  simpleAddText: {
    fontSize: 12,
    color: '#34C759',
  },
  simpleEmptyList: {
    padding: 30,
    alignItems: 'center',
  },
  simpleEmptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // End of Simple Inventory List Styles
});

export default CashierScreen;