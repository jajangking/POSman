import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, RefreshControl, Modal, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { InventoryItem } from '../models/Inventory';
import { searchInventoryItems, getAllInventoryItems } from '../services/DatabaseService';
import ScannerModal from './ScannerModal';

interface DiscountItem extends InventoryItem {
  discountPercentage: number;
  profitWithDiscount: number;
  isIdeal: boolean;
  suggestion: string;
  campaignStatus: 'none' | 'period' | 'event' | 'bundling' | 'b1g1';
  campaignName?: string;
}

interface DiscountSettings {
  period: {
    startDate: string;
    endDate: string;
    isActive: boolean;
    name: string;
  };
  event: {
    name: string;
    description: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
  };
  bundling: {
    name: string;
    items: string[]; // item codes
    discountPercentage: number;
    isActive: boolean;
  }[];
  b1g1: {
    name: string;
    itemCode: string;
    isActive: boolean;
  }[];
}

const DiscountPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<DiscountItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<DiscountSettings>({
    period: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      isActive: false,
      name: 'Diskon Periodik'
    },
    event: {
      name: '',
      description: '',
      isActive: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    bundling: [],
    b1g1: []
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<Array<{type: string, name: string, startDate: string, endDate: string}>>([]);

  // Load items on component mount
  useEffect(() => {
    loadItems();
    updateActiveCampaigns();
  }, []);

  const updateActiveCampaigns = () => {
    const campaigns = [];
    
    // Check for active period
    if (settings.period.isActive) {
      campaigns.push({
        type: 'period',
        name: settings.period.name,
        startDate: settings.period.startDate,
        endDate: settings.period.endDate
      });
    }
    
    // Check for active event
    if (settings.event.isActive) {
      campaigns.push({
        type: 'event',
        name: settings.event.name,
        startDate: settings.event.startDate,
        endDate: settings.event.endDate
      });
    }
    
    // Check for active bundling
    settings.bundling.forEach(bundle => {
      if (bundle.isActive) {
        campaigns.push({
          type: 'bundling',
          name: bundle.name,
          startDate: '', // Bundles don't have specific dates
          endDate: ''
        });
      }
    });
    
    // Check for active B1G1
    settings.b1g1.forEach(b1g1 => {
      if (b1g1.isActive) {
        campaigns.push({
          type: 'b1g1',
          name: b1g1.name,
          startDate: '', // B1G1 don't have specific dates
          endDate: ''
        });
      }
    });
    
    setActiveCampaigns(campaigns);
  };

  const loadItems = async () => {
    try {
      const inventoryItems = await getAllInventoryItems();
      const itemsWithDiscount: DiscountItem[] = inventoryItems.map(item => {
        const profit = item.price - item.cost;
        const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;
        const discountPercentage = 0;
        const priceAfterDiscount = item.price * (1 - discountPercentage / 100);
        const profitWithDiscount = priceAfterDiscount - item.cost;
        const profitMarginWithDiscount = priceAfterDiscount > 0 ? (profitWithDiscount / priceAfterDiscount) * 100 : 0;
        
        // Determine if discount is ideal (simple logic - can be enhanced with real sales data)
        const isIdeal = profitMarginWithDiscount >= 10; // Minimum 10% margin
        const suggestion = isIdeal 
          ? 'Discount dapat diterapkan' 
          : `Margin terlalu kecil. Pertimbangkan diskon maksimal ${Math.floor(profitMargin - 10)}%`;
        
        // Check if item is part of any active campaign
        let campaignStatus: 'none' | 'period' | 'event' | 'bundling' | 'b1g1' = 'none';
        let campaignName = '';
        
        // Check if item is part of active period
        if (settings.period.isActive) {
          campaignStatus = 'period';
          campaignName = settings.period.name;
        }
        
        // Check if item is part of active event
        if (settings.event.isActive) {
          campaignStatus = 'event';
          campaignName = settings.event.name;
        }
        
        // Check if item is part of active bundling
        for (const bundle of settings.bundling) {
          if (bundle.isActive && bundle.items.includes(item.code)) {
            campaignStatus = 'bundling';
            campaignName = bundle.name;
            break;
          }
        }
        
        // Check if item is part of active B1G1
        for (const b1g1 of settings.b1g1) {
          if (b1g1.isActive && b1g1.itemCode === item.code) {
            campaignStatus = 'b1g1';
            campaignName = b1g1.name;
            break;
          }
        }
        
        return {
          ...item,
          discountPercentage,
          profitWithDiscount,
          isIdeal,
          suggestion,
          campaignStatus,
          campaignName
        };
      });
      setItems(itemsWithDiscount);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    updateActiveCampaigns();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }
    
    try {
      const results = await searchInventoryItems(searchQuery);
      const itemsWithDiscount: DiscountItem[] = results.map(item => {
        const profit = item.price - item.cost;
        const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;
        const discountPercentage = 0;
        const priceAfterDiscount = item.price * (1 - discountPercentage / 100);
        const profitWithDiscount = priceAfterDiscount - item.cost;
        const profitMarginWithDiscount = priceAfterDiscount > 0 ? (profitWithDiscount / priceAfterDiscount) * 100 : 0;
        
        // Determine if discount is ideal
        const isIdeal = profitMarginWithDiscount >= 10;
        const suggestion = isIdeal 
          ? 'Discount dapat diterapkan' 
          : `Margin terlalu kecil. Pertimbangkan diskon maksimal ${Math.floor(profitMargin - 10)}%`;
        
        // Check if item is part of any active campaign
        let campaignStatus: 'none' | 'period' | 'event' | 'bundling' | 'b1g1' = 'none';
        let campaignName = '';
        
        // Check if item is part of active period
        if (settings.period.isActive) {
          campaignStatus = 'period';
          campaignName = settings.period.name;
        }
        
        // Check if item is part of active event
        if (settings.event.isActive) {
          campaignStatus = 'event';
          campaignName = settings.event.name;
        }
        
        // Check if item is part of active bundling
        for (const bundle of settings.bundling) {
          if (bundle.isActive && bundle.items.includes(item.code)) {
            campaignStatus = 'bundling';
            campaignName = bundle.name;
            break;
          }
        }
        
        // Check if item is part of active B1G1
        for (const b1g1 of settings.b1g1) {
          if (b1g1.isActive && b1g1.itemCode === item.code) {
            campaignStatus = 'b1g1';
            campaignName = b1g1.name;
            break;
          }
        }
        
        return {
          ...item,
          discountPercentage,
          profitWithDiscount,
          isIdeal,
          suggestion,
          campaignStatus,
          campaignName
        };
      });
      setItems(itemsWithDiscount);
    } catch (error) {
      console.error('Error searching items:', error);
      Alert.alert('Error', 'Failed to search inventory items');
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
    // Trigger search after setting the barcode
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleScan = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        setShowScanner(true);
      } else {
        Alert.alert('Permission required', 'Camera permission is needed to scan barcodes');
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const updateDiscountForItem = (itemCode: string, discount: number) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.code === itemCode) {
          const priceAfterDiscount = item.price * (1 - discount / 100);
          const profitWithDiscount = priceAfterDiscount - item.cost;
          const profitMarginWithDiscount = priceAfterDiscount > 0 ? (profitWithDiscount / priceAfterDiscount) * 100 : 0;
          
          // Determine if discount is ideal
          const isIdeal = profitMarginWithDiscount >= 10;
          const suggestion = isIdeal 
            ? 'Discount dapat diterapkan' 
            : `Margin terlalu kecil. Pertimbangkan diskon maksimal ${Math.floor((item.price - item.cost) / item.price * 100 - 10)}%`;
          
          return {
            ...item,
            discountPercentage: discount,
            profitWithDiscount,
            isIdeal,
            suggestion
          };
        }
        return item;
      })
    );
  };

  const calculateMixMargin = () => {
    if (items.length === 0) return 0;
    
    const totalProfit = items.reduce((sum, item) => {
      const priceAfterDiscount = item.price * (1 - item.discountPercentage / 100);
      const profit = priceAfterDiscount - item.cost;
      return sum + profit;
    }, 0);
    
    const totalPrice = items.reduce((sum, item) => {
      const priceAfterDiscount = item.price * (1 - item.discountPercentage / 100);
      return sum + priceAfterDiscount;
    }, 0);
    
    return totalPrice > 0 ? (totalProfit / totalPrice) * 100 : 0;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari barang (nama, kode, kategori...)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Cari</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScan}
        >
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      
      {/* Active Campaigns Section */}
      {activeCampaigns.length > 0 && (
        <View style={styles.campaignsSection}>
          <Text style={styles.campaignsTitle}>Campaign Aktif:</Text>
          <View style={styles.campaignsList}>
            {activeCampaigns.map((campaign, index) => (
              <View key={index} style={styles.campaignItem}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <Text style={styles.campaignType}>
                  {campaign.type === 'period' && 'Periode'}
                  {campaign.type === 'event' && 'Event'}
                  {campaign.type === 'bundling' && 'Bundling'}
                  {campaign.type === 'b1g1' && 'B1G1'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.summarySection}>
        <Text style={styles.summaryText}>Total Barang: {items.length}</Text>
        <Text style={styles.summaryText}>Mix Margin: {calculateMixMargin().toFixed(2)}%</Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Simpan Discount</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: DiscountItem }) => {
    const profit = item.price - item.cost;
    const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;
    const priceAfterDiscount = item.price * (1 - item.discountPercentage / 100);
    const profitMarginWithDiscount = priceAfterDiscount > 0 ? (item.profitWithDiscount / priceAfterDiscount) * 100 : 0;
    
    // Determine campaign badge color
    const getCampaignBadgeStyle = () => {
      switch (item.campaignStatus) {
        case 'period': return styles.campaignBadgePeriod;
        case 'event': return styles.campaignBadgeEvent;
        case 'bundling': return styles.campaignBadgeBundling;
        case 'b1g1': return styles.campaignBadgeB1G1;
        default: return styles.campaignBadgeNone;
      }
    };
    
    // Determine campaign badge text
    const getCampaignBadgeText = () => {
      switch (item.campaignStatus) {
        case 'period': return 'PERIODE';
        case 'event': return 'EVENT';
        case 'bundling': return 'BUNDLING';
        case 'b1g1': return 'B1G1';
        default: return 'TIDAK ADA';
      }
    };
    
    return (
      <View style={[styles.itemContainer, !item.isIdeal && styles.itemContainerWarning]}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCode}>{item.code}</Text>
          {item.campaignStatus !== 'none' && (
            <View style={[styles.campaignBadge, getCampaignBadgeStyle()]}>
              <Text style={styles.campaignBadgeText}>{getCampaignBadgeText()}</Text>
              {item.campaignName ? <Text style={styles.campaignNameText}>{item.campaignName}</Text> : null}
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Harga Beli:</Text>
            <Text style={styles.detailValue}>Rp {item.cost.toLocaleString()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Harga Jual:</Text>
            <Text style={styles.detailValue}>Rp {item.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Profit Margin:</Text>
            <Text style={[styles.detailValue, styles.profitMargin]}>
              {profitMargin.toFixed(2)}%
            </Text>
          </View>
          
          <View style={styles.discountRow}>
            <Text style={styles.discountLabel}>Discount:</Text>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={item.discountPercentage.toString()}
                onChangeText={(text) => {
                  const discount = parseFloat(text) || 0;
                  updateDiscountForItem(item.code, Math.min(100, Math.max(0, discount)));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Harga Setelah Discount:</Text>
            <Text style={styles.detailValue}>Rp {priceAfterDiscount.toLocaleString()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Profit dengan Discount:</Text>
            <Text style={[styles.detailValue, item.isIdeal ? styles.profitPositive : styles.profitNegative]}>
              {profitMarginWithDiscount.toFixed(2)}%
            </Text>
          </View>
          
          <View style={styles.suggestionContainer}>
            <Text style={[styles.suggestionText, item.isIdeal ? styles.suggestionPositive : styles.suggestionNegative]}>
              {item.suggestion}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manajemen Discount</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.code}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
        
        {/* Scanner Modal */}
        <ScannerModal
          visible={showScanner}
          onBarcodeScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
        
        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSettings(false)}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => setShowSettings(false)}>
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}> Pengaturan Discount</Text>
                <View style={styles.placeholder} />
              </View>
              
              <ScrollView style={styles.settingsContent}>
                {/* Period Settings */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Periode Discount</Text>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Aktif</Text>
                    <Switch
                      value={settings.period.isActive}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        period: {
                          ...settings.period,
                          isActive: value
                        }
                      })}
                    />
                  </View>
                  
                  {settings.period.isActive && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Periode</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.period.name}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            period: {
                              ...settings.period,
                              name: text
                            }
                          })}
                          placeholder="Masukkan nama periode"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tanggal Mulai</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.period.startDate}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            period: {
                              ...settings.period,
                              startDate: text
                            }
                          })}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tanggal Selesai</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.period.endDate}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            period: {
                              ...settings.period,
                              endDate: text
                            }
                          })}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </>
                  )}
                </View>
                
                {/* Event Settings */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Event Discount</Text>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Aktif</Text>
                    <Switch
                      value={settings.event.isActive}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        event: {
                          ...settings.event,
                          isActive: value
                        }
                      })}
                    />
                  </View>
                  
                  {settings.event.isActive && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Event</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.event.name}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            event: {
                              ...settings.event,
                              name: text
                            }
                          })}
                          placeholder="Masukkan nama event"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Deskripsi</Text>
                        <TextInput
                          style={[styles.input, styles.multilineInput]}
                          value={settings.event.description}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            event: {
                              ...settings.event,
                              description: text
                            }
                          })}
                          placeholder="Masukkan deskripsi event"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tanggal Mulai</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.event.startDate}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            event: {
                              ...settings.event,
                              startDate: text
                            }
                          })}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tanggal Selesai</Text>
                        <TextInput
                          style={styles.input}
                          value={settings.event.endDate}
                          onChangeText={(text) => setSettings({
                            ...settings,
                            event: {
                              ...settings.event,
                              endDate: text
                            }
                          })}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </>
                  )}
                </View>
                
                {/* Bundling Settings */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Bundling Discount</Text>
                  <Text style={styles.sectionDescription}>
                    Buat paket produk dengan diskon khusus
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                      setSettings({
                        ...settings,
                        bundling: [
                          ...settings.bundling,
                          {
                            name: `Bundle ${settings.bundling.length + 1}`,
                            items: [],
                            discountPercentage: 10,
                            isActive: true
                          }
                        ]
                      });
                    }}
                  >
                    <Text style={styles.addButtonText}>Tambah Bundle</Text>
                  </TouchableOpacity>
                  
                  {settings.bundling.map((bundle, index) => (
                    <View key={index} style={styles.bundleItem}>
                      <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>{bundle.name}</Text>
                        <Switch
                          value={bundle.isActive}
                          onValueChange={(value) => {
                            const newBundling = [...settings.bundling];
                            newBundling[index].isActive = value;
                            setSettings({
                              ...settings,
                              bundling: newBundling
                            });
                          }}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Bundle</Text>
                        <TextInput
                          style={styles.input}
                          value={bundle.name}
                          onChangeText={(text) => {
                            const newBundling = [...settings.bundling];
                            newBundling[index].name = text;
                            setSettings({
                              ...settings,
                              bundling: newBundling
                            });
                          }}
                          placeholder="Nama bundle"
                        />
                      </View>
                      
                      <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, styles.flexOne]}>
                          <Text style={styles.label}>Diskon (%)</Text>
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.input}
                              value={bundle.discountPercentage.toString()}
                              onChangeText={(text) => {
                                const newBundling = [...settings.bundling];
                                newBundling[index].discountPercentage = parseFloat(text) || 0;
                                setSettings({
                                  ...settings,
                                  bundling: newBundling
                                });
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                            />
                            <Text style={styles.percentSign}>%</Text>
                          </View>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.deleteButton, styles.smallButton]}
                        onPress={() => {
                          const newBundling = [...settings.bundling];
                          newBundling.splice(index, 1);
                          setSettings({
                            ...settings,
                            bundling: newBundling
                          });
                        }}
                      >
                        <Text style={styles.deleteButtonText}>Hapus Bundle</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {/* B1G1 Settings */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Buy One Get One (B1G1)</Text>
                  <Text style={styles.sectionDescription}>
                    Berikan produk gratis saat pembelian produk tertentu
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                      setSettings({
                        ...settings,
                        b1g1: [
                          ...settings.b1g1,
                          {
                            name: `B1G1 ${settings.b1g1.length + 1}`,
                            itemCode: '',
                            isActive: true
                          }
                        ]
                      });
                    }}
                  >
                    <Text style={styles.addButtonText}>Tambah B1G1</Text>
                  </TouchableOpacity>
                  
                  {settings.b1g1.map((b1g1, index) => (
                    <View key={index} style={styles.bundleItem}>
                      <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>{b1g1.name}</Text>
                        <Switch
                          value={b1g1.isActive}
                          onValueChange={(value) => {
                            const newB1G1 = [...settings.b1g1];
                            newB1G1[index].isActive = value;
                            setSettings({
                              ...settings,
                              b1g1: newB1G1
                            });
                          }}
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nama Promo</Text>
                        <TextInput
                          style={styles.input}
                          value={b1g1.name}
                          onChangeText={(text) => {
                            const newB1G1 = [...settings.b1g1];
                            newB1G1[index].name = text;
                            setSettings({
                              ...settings,
                              b1g1: newB1G1
                            });
                          }}
                          placeholder="Nama promo B1G1"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Kode Produk</Text>
                        <TextInput
                          style={styles.input}
                          value={b1g1.itemCode}
                          onChangeText={(text) => {
                            const newB1G1 = [...settings.b1g1];
                            newB1G1[index].itemCode = text;
                            setSettings({
                              ...settings,
                              b1g1: newB1G1
                            });
                          }}
                          placeholder="Masukkan kode produk"
                        />
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.deleteButton, styles.smallButton]}
                        onPress={() => {
                          const newB1G1 = [...settings.b1g1];
                          newB1G1.splice(index, 1);
                          setSettings({
                            ...settings,
                            b1g1: newB1G1
                          });
                        }}
                      >
                        <Text style={styles.deleteButtonText}>Hapus B1G1</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
              
              <View style={styles.settingsFooter}>
                <TouchableOpacity 
                  style={[styles.saveButton, styles.settingsSaveButton]}
                  onPress={() => {
                    Alert.alert('Berhasil', 'Pengaturan discount telah disimpan');
                    setShowSettings(false);
                    // Refresh items and campaigns when settings are saved
                    loadItems();
                    updateActiveCampaigns();
                  }}
                >
                  <Text style={styles.saveButtonText}>Simpan Pengaturan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
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
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 5,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  placeholder: {
    width: 30,
  },
  listContent: {
    padding: 15,
  },
  headerContainer: {
    marginBottom: 15,
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    backgroundColor: 'white',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    marginRight: 5,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  campaignsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  campaignsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  campaignsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  campaignItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 5,
  },
  campaignName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  campaignType: {
    fontSize: 12,
    color: '#666',
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  itemContainerWarning: {
    borderLeftColor: '#FF9500',
  },
  itemHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  campaignBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  campaignBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  campaignNameText: {
    fontSize: 11,
    color: 'white',
    marginTop: 2,
  },
  campaignBadgePeriod: {
    backgroundColor: '#007AFF',
  },
  campaignBadgeEvent: {
    backgroundColor: '#FF9500',
  },
  campaignBadgeBundling: {
    backgroundColor: '#AF52DE',
  },
  campaignBadgeB1G1: {
    backgroundColor: '#34C759',
  },
  campaignBadgeNone: {
    backgroundColor: '#8E8E93',
  },
  itemDetails: {
    // Details styling
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  profitMargin: {
    color: '#34C759',
  },
  discountLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'white',
  },
  discountInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  percentSign: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 3,
  },
  profitPositive: {
    color: '#34C759',
  },
  profitNegative: {
    color: '#FF3B30',
  },
  suggestionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  suggestionText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  suggestionPositive: {
    color: '#34C759',
  },
  suggestionNegative: {
    color: '#FF9500',
  },
  footer: {
    marginTop: 15,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Settings styles
  settingsContent: {
    flex: 1,
    padding: 15,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  flexOne: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bundleItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    alignSelf: 'flex-end',
  },
  smallButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  settingsFooter: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  settingsSaveButton: {
    backgroundColor: '#007AFF',
  },
});

export default DiscountPage;