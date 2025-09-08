import { getAllSOHistory } from './SOHistoryService';
import { getAllInventoryItems } from './DatabaseService';

// Interface for item analysis
export interface ItemAnalysis {
  code: string;
  name: string;
  status: string;
  history: string;
  recommendation: string;
  recentTrend: string; // New field for recent trend
}

// Interface for consecutive SO items
export interface ConsecutiveSOItem {
  code: string;
  name: string;
  consecutiveCount: number;
  type: 'minus' | 'plus';
}

// Analyze items based on SO history (only items that were actually counted in SO)
export const analyzeItems = async (currentSoItems: any[]): Promise<ItemAnalysis[]> => {
  try {
    // Get all SO history
    const history = await getAllSOHistory();
    
    // If no history, analyze only current SO items
    if (history.length === 0) {
      return currentSoItems.map(item => ({
        code: item.code,
        name: item.name,
        status: 'Baru Pertama Kali SO',
        history: 'Ini adalah SO pertama untuk item ini',
        recommendation: 'Pantau dalam beberapa SO berikutnya',
        recentTrend: 'Tidak ada riwayat'
      }));
    }
    
    // Create a map of current SO items for quick lookup
    const currentSoItemMap = new Map();
    currentSoItems.forEach(item => {
      currentSoItemMap.set(item.code, item);
    });
    
    // Process history to analyze only items that were counted in current SO
    const itemStats: { [key: string]: { 
      name: string, 
      count: number, 
      minusCount: number, 
      plusCount: number, 
      consecutiveMinus: number, 
      maxConsecutiveMinus: number,
      consecutivePlus: number,
      maxConsecutivePlus: number,
      lastSODate?: string,
      recentMinusCount: number, // Count of minus in recent SOs
      recentPlusCount: number, // Count of plus in recent SOs
      recentNormalCount: number // Count of normal (0 difference) in recent SOs
    } } = {};
    
    // Process each SO history entry (most recent first for trend analysis)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Process each SO history entry
    for (const so of sortedHistory) {
      try {
        // Parse items from JSON string
        const items = JSON.parse(so.items);
        
        // Process only items that are in current SO
        for (const item of items) {
          // Only analyze items that are in current SO
          if (currentSoItemMap.has(item.code)) {
            if (!itemStats[item.code]) {
              itemStats[item.code] = {
                name: item.name,
                count: 0,
                minusCount: 0,
                plusCount: 0,
                consecutiveMinus: 0,
                maxConsecutiveMinus: 0,
                consecutivePlus: 0,
                maxConsecutivePlus: 0,
                lastSODate: so.date,
                recentMinusCount: 0,
                recentPlusCount: 0,
                recentNormalCount: 0
              };
            }
            
            // Update stats
            itemStats[item.code].count++;
            itemStats[item.code].lastSODate = so.date;
            
            // Track recent trends (last 5 SOs)
            if (itemStats[item.code].count <= 5) {
              if (item.difference < 0) {
                itemStats[item.code].recentMinusCount++;
              } else if (item.difference > 0) {
                itemStats[item.code].recentPlusCount++;
              } else {
                itemStats[item.code].recentNormalCount++;
              }
            }
            
            // Track consecutive occurrences
            if (item.difference < 0) {
              itemStats[item.code].minusCount++;
              itemStats[item.code].consecutiveMinus++;
              itemStats[item.code].maxConsecutiveMinus = Math.max(
                itemStats[item.code].maxConsecutiveMinus,
                itemStats[item.code].consecutiveMinus
              );
              itemStats[item.code].consecutivePlus = 0; // Reset consecutive plus counter
            } else if (item.difference > 0) {
              itemStats[item.code].plusCount++;
              itemStats[item.code].consecutivePlus++;
              itemStats[item.code].maxConsecutivePlus = Math.max(
                itemStats[item.code].maxConsecutivePlus,
                itemStats[item.code].consecutivePlus
              );
              itemStats[item.code].consecutiveMinus = 0; // Reset consecutive minus counter
            } else {
              itemStats[item.code].consecutiveMinus = 0; // Reset consecutive minus counter
              itemStats[item.code].consecutivePlus = 0; // Reset consecutive plus counter
            }
          }
        }
      } catch (error) {
        console.error('Error parsing items for SO:', so.id, error);
      }
    }
    
    // Convert to ItemAnalysis array
    const analysis: ItemAnalysis[] = Object.keys(itemStats).map(code => {
      const stat = itemStats[code];
      const minusPercentage = stat.count > 0 ? (stat.minusCount / stat.count) * 100 : 0;
      const plusPercentage = stat.count > 0 ? (stat.plusCount / stat.count) * 100 : 0;
      
      // Determine status based on analysis and recent trends
      let status = '';
      let historyText = '';
      let recommendation = '';
      let recentTrend = '';
      
      if (stat.count === 1) {
        status = 'Baru Pertama Kali SO';
        historyText = 'Ini adalah SO pertama untuk item ini';
        recommendation = 'Pantau dalam beberapa SO berikutnya';
        recentTrend = 'Pertama kali SO';
      } else if (stat.maxConsecutiveMinus >= 3 && stat.recentMinusCount === 0 && stat.recentPlusCount === 0) {
        // Was frequently negative but recently normal
        status = 'Sebelumnya Sering Minus';
        historyText = `Minus ${stat.maxConsecutiveMinus}x berturut-turut dalam riwayat, tetapi ${stat.recentNormalCount} SO terakhir normal`;
        recommendation = 'Barang sudah stabil, pantau secara berkala';
        recentTrend = `Normal ${stat.recentNormalCount}x terakhir, sebelumnya minus ${stat.maxConsecutiveMinus}x berturut-turut`;
      } else if (stat.maxConsecutiveMinus >= 3 && stat.recentPlusCount > 0) {
        // Was frequently negative but now showing positive trend
        status = 'Perubahan Pola - Sebelumnya Minus';
        historyText = `Minus ${stat.maxConsecutiveMinus}x berturut-turut dalam riwayat, tetapi sekarang muncul pola plus`;
        recommendation = 'Perlu pengawasan lebih lanjut terhadap perubahan pola ini';
        recentTrend = `Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x, Minus ${stat.recentMinusCount}x dalam 5 SO terakhir`;
      } else if (stat.maxConsecutiveMinus >= 3) {
        // Still frequently negative
        status = 'Sering Minus';
        historyText = `Minus ${stat.maxConsecutiveMinus}x berturut-turut dalam ${stat.count} SO terakhir`;
        recommendation = 'Perlu pengawasan lebih lanjut';
        recentTrend = `Minus ${stat.recentMinusCount}x dalam 5 SO terakhir`;
      } else if (stat.maxConsecutivePlus >= 3 && stat.recentPlusCount === 0 && stat.recentMinusCount === 0) {
        // Was frequently positive but recently normal
        status = 'Sebelumnya Sering Plus';
        historyText = `Plus ${stat.maxConsecutivePlus}x berturut-turut dalam riwayat, tetapi ${stat.recentNormalCount} SO terakhir normal`;
        recommendation = 'Barang sudah stabil, pantau secara berkala';
        recentTrend = `Normal ${stat.recentNormalCount}x terakhir, sebelumnya plus ${stat.maxConsecutivePlus}x berturut-turut`;
      } else if (stat.maxConsecutivePlus >= 3 && stat.recentMinusCount > 0) {
        // Was frequently positive but now showing negative trend
        status = 'Perubahan Pola - Sebelumnya Plus';
        historyText = `Plus ${stat.maxConsecutivePlus}x berturut-turut dalam riwayat, tetapi sekarang muncul pola minus`;
        recommendation = 'Perlu pengawasan lebih lanjut terhadap perubahan pola ini';
        recentTrend = `Minus ${stat.recentMinusCount}x, Normal ${stat.recentNormalCount}x, Plus ${stat.recentPlusCount}x dalam 5 SO terakhir`;
      } else if (stat.maxConsecutivePlus >= 3) {
        // Still frequently positive
        status = 'Sering Plus';
        historyText = `Plus ${stat.maxConsecutivePlus}x berturut-turut dalam ${stat.count} SO terakhir`;
        recommendation = 'Perlu pengawasan lebih lanjut';
        recentTrend = `Plus ${stat.recentPlusCount}x dalam 5 SO terakhir`;
      } else if (minusPercentage > 50) {
        status = 'Sering Minus';
        historyText = `${stat.minusCount} dari ${stat.count} SO menghasilkan selisih minus (${minusPercentage.toFixed(1)}%)`;
        recommendation = 'Perlu diperiksa penyebab minus yang sering terjadi';
        recentTrend = `Minus ${stat.recentMinusCount}x, Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x dalam 5 SO terakhir`;
      } else if (minusPercentage === 0 && plusPercentage === 0) {
        status = 'Stabil';
        historyText = `Tidak pernah minus atau plus dalam ${stat.count} SO terakhir`;
        recommendation = 'Barang stabil, tidak perlu tindakan khusus';
        recentTrend = 'Selalu stabil (0 selisih)';
      } else if (minusPercentage < 10 && plusPercentage < 10) {
        status = 'Jarang Minus/Plus';
        historyText = `${stat.minusCount} minus, ${stat.plusCount} plus dari ${stat.count} SO`;
        recommendation = 'Barang cukup stabil, pantau secara berkala';
        recentTrend = `Minus ${stat.recentMinusCount}x, Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x dalam 5 SO terakhir`;
      } else if (minusPercentage < 10) {
        status = 'Jarang Minus';
        historyText = `${stat.minusCount} dari ${stat.count} SO menghasilkan selisih minus (${minusPercentage.toFixed(1)}%)`;
        recommendation = 'Barang cukup stabil, pantau secara berkala';
        recentTrend = `Minus ${stat.recentMinusCount}x, Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x dalam 5 SO terakhir`;
      } else if (plusPercentage < 10) {
        status = 'Jarang Plus';
        historyText = `${stat.plusCount} dari ${stat.count} SO menghasilkan selisih plus (${plusPercentage.toFixed(1)}%)`;
        recommendation = 'Barang cukup stabil, pantau secara berkala';
        recentTrend = `Minus ${stat.recentMinusCount}x, Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x dalam 5 SO terakhir`;
      } else {
        status = 'Normal';
        historyText = `${stat.minusCount} minus, ${stat.plusCount} plus dari ${stat.count} SO`;
        recommendation = 'Barang normal, tidak perlu tindakan khusus';
        recentTrend = `Minus ${stat.recentMinusCount}x, Plus ${stat.recentPlusCount}x, Normal ${stat.recentNormalCount}x dalam 5 SO terakhir`;
      }
      
      return {
        code,
        name: stat.name,
        status,
        history: historyText,
        recommendation,
        recentTrend
      };
    });
    
    // Also include items from current SO that have no history
    const itemsWithNoHistory = currentSoItems.filter(item => !itemStats[item.code]);
    const noHistoryAnalysis: ItemAnalysis[] = itemsWithNoHistory.map(item => ({
      code: item.code,
      name: item.name,
      status: 'Baru Pertama Kali SO',
      history: 'Ini adalah SO pertama untuk item ini',
      recommendation: 'Pantau dalam beberapa SO berikutnya',
      recentTrend: 'Pertama kali SO'
    }));
    
    return [...analysis, ...noHistoryAnalysis];
  } catch (error) {
    console.error('Error analyzing items:', error);
    throw error;
  }
};

// Get items that need monitoring based on analysis (only items that were actually counted in SO)
export const getItemsForMonitoring = async (currentSoItems: any[]): Promise<ItemAnalysis[]> => {
  try {
    const analysis = await analyzeItems(currentSoItems);
    
    // Filter items that need monitoring
    return analysis.filter(item => 
      item.status === 'Sering Minus' || 
      item.status === 'Sering Plus' ||
      item.status === 'Baru Pertama Kali SO' ||
      item.status === 'Sebelumnya Sering Minus' || 
      item.status === 'Sebelumnya Sering Plus' ||
      item.status === 'Perubahan Pola - Sebelumnya Minus' || // Monitor items with pattern changes
      item.status === 'Perubahan Pola - Sebelumnya Plus' ||   // Monitor items with pattern changes
      item.status.startsWith('Perubahan Pola') // General pattern change monitoring
    );
  } catch (error) {
    console.error('Error getting items for monitoring:', error);
    throw error;
  }
};

// Get items with consecutive minus or plus in SO history (only for items in current SO)
export const getConsecutiveSOItems = async (currentSoItems: any[]): Promise<{minusItems: ConsecutiveSOItem[], plusItems: ConsecutiveSOItem[]}> => {
  try {
    // Get all SO history
    const history = await getAllSOHistory();
    
    // If no history, return empty arrays
    if (history.length === 0) {
      return { minusItems: [], plusItems: [] };
    }
    
    // Create a map of current SO items for quick lookup
    const currentSoItemMap = new Map();
    currentSoItems.forEach(item => {
      currentSoItemMap.set(item.code, item);
    });
    
    // Track consecutive occurrences for each item
    const consecutiveTracker: { [key: string]: { 
      name: string,
      minusCount: number,
      plusCount: number,
      lastType: 'minus' | 'plus' | null
    } } = {};
    
    // Process history chronologically (oldest first)
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Process each SO history entry
    for (const so of sortedHistory) {
      try {
        // Parse items from JSON string
        const items = JSON.parse(so.items);
        
        // Process only items that are in current SO
        for (const item of items) {
          // Only analyze items that are in current SO
          if (currentSoItemMap.has(item.code)) {
            if (!consecutiveTracker[item.code]) {
              consecutiveTracker[item.code] = {
                name: item.name,
                minusCount: 0,
                plusCount: 0,
                lastType: null
              };
            }
            
            // Update consecutive counts based on difference
            if (item.difference < 0) {
              // Minus case
              if (consecutiveTracker[item.code].lastType === 'minus') {
                // Continue consecutive minus count
                consecutiveTracker[item.code].minusCount++;
              } else {
                // Start new consecutive minus count
                consecutiveTracker[item.code].minusCount = 1;
              }
              consecutiveTracker[item.code].lastType = 'minus';
              consecutiveTracker[item.code].plusCount = 0; // Reset plus count
            } else if (item.difference > 0) {
              // Plus case
              if (consecutiveTracker[item.code].lastType === 'plus') {
                // Continue consecutive plus count
                consecutiveTracker[item.code].plusCount++;
              } else {
                // Start new consecutive plus count
                consecutiveTracker[item.code].plusCount = 1;
              }
              consecutiveTracker[item.code].lastType = 'plus';
              consecutiveTracker[item.code].minusCount = 0; // Reset minus count
            } else {
              // Zero difference - reset both counts
              consecutiveTracker[item.code].minusCount = 0;
              consecutiveTracker[item.code].plusCount = 0;
              consecutiveTracker[item.code].lastType = null;
            }
          }
        }
      } catch (error) {
        console.error('Error parsing items for SO:', so.id, error);
      }
    }
    
    // Extract items with consecutive occurrences >= 2
    const minusItems: ConsecutiveSOItem[] = [];
    const plusItems: ConsecutiveSOItem[] = [];
    
    Object.keys(consecutiveTracker).forEach(code => {
      const tracker = consecutiveTracker[code];
      if (tracker.minusCount >= 2) {
        minusItems.push({
          code,
          name: tracker.name,
          consecutiveCount: tracker.minusCount,
          type: 'minus'
        });
      }
      if (tracker.plusCount >= 2) {
        plusItems.push({
          code,
          name: tracker.name,
          consecutiveCount: tracker.plusCount,
          type: 'plus'
        });
      }
    });
    
    return { minusItems, plusItems };
  } catch (error) {
    console.error('Error getting consecutive SO items:', error);
    throw error;
  }
};

// Get total items in database for percentage calculation
export const getTotalItemsInDatabase = async (): Promise<number> => {
  try {
    const items = await getAllInventoryItems();
    return items.length;
  } catch (error) {
    console.error('Error getting total items in database:', error);
    return 0;
  }
};