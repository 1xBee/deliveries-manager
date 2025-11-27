// ============================================
// FILE: extension-src/content/content.js
// Main content script - now delegates to modules
// ============================================
import { extractDeliveryIdsFromTable, categorizeDeliveries } from './services/deliveryExtractor.js';
import { fetchAllDeliveries, filterDeliveriesByIds } from './services/apiService.js';

console.log('Content script loaded on deliveries page');

// Listen for extraction requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    console.log('Extract data request received');
    
    extractDeliveryData()
      .then(extractedData => {
        chrome.runtime.sendMessage({
          type: 'DATA_EXTRACTED',
          data: extractedData
        }, (response) => {
          console.log('Data sent to background:', response);
          sendResponse({ success: true });
        });
      })
      .catch(error => {
        console.error('Error extracting data:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

async function extractDeliveryData() {
  try {
    // Step 1: Get delivery IDs from table
    const deliveryIds = extractDeliveryIdsFromTable();
    
    if (deliveryIds.size === 0) {
      throw new Error('No delivery IDs found in table');
    }
    
    // Step 2: Fetch all deliveries from API
    const allDeliveries = await fetchAllDeliveries();
    
    // Step 3: Filter to matching deliveries
    const filteredDeliveries = filterDeliveriesByIds(allDeliveries, deliveryIds);
    console.log(`Filtered to ${filteredDeliveries.length} matching deliveries`);
    
    // Step 4: Categorize by location
    const categorized = categorizeDeliveries(filteredDeliveries);
    
    console.log('Categorized deliveries:', {
      ky: categorized.ky.length,
      mcm: categorized.mcm.length,
      other: categorized.other.length
    });
    
    return categorized;
    
  } catch (error) {
    console.error('Error in extractDeliveryData:', error);
    throw error;
  }
}