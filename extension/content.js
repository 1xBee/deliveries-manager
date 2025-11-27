/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./extension-src/content/services/deliveryExtractor.js
// ============================================
// FILE: extension-src/content/services/deliveryExtractor.js
// Core delivery extraction logic separated from content.js
// ============================================

const DELIVERY_ID_COLUMN_NUMBER = 1;

// Cities that should always go to 'other' category
const EXCLUDED_CITIES = ['brooklyn', 'linden', 'staten island', 'montreal', 'canada', 'toronto', 'quebec'];

/**
 * Extract delivery IDs from the table
 */
function extractDeliveryIdsFromTable() {
  const selector = ".rt-tr .rt-td:nth-child(".concat(DELIVERY_ID_COLUMN_NUMBER, ") a");
  const tableLinks = document.querySelectorAll(selector);
  const deliveryIds = new Set();
  tableLinks.forEach(link => {
    const idText = link.textContent.trim();
    const cleanedIdText = idText.replace(/\D/g, '');
    if (cleanedIdText) {
      deliveryIds.add(parseInt(cleanedIdText, 10));
    }
  });
  console.log("Found ".concat(deliveryIds.size, " delivery IDs in table:"), Array.from(deliveryIds));
  return deliveryIds;
}

/**
 * Check if delivery should be excluded based on city or address
 */
function shouldExcludeDelivery(delivery) {
  const city = (delivery.city1 || '').toLowerCase();
  const address = (delivery.address || '').toLowerCase();

  // Check if city matches any excluded city
  if (EXCLUDED_CITIES.some(excludedCity => city.includes(excludedCity))) {
    return true;
  }

  // Check if address contains any excluded city name
  if (EXCLUDED_CITIES.some(excludedCity => address.includes(excludedCity))) {
    return true;
  }
  return false;
}

/**
 * Categorize deliveries by location
 */
function categorizeDeliveries(filteredDeliveries) {
  const categorized = {
    'ky': [],
    'mcm': [],
    'other': []
  };
  filteredDeliveries.forEach(item => {
    const delivery = item.delivery || {};
    const transformedDelivery = {
      id: delivery.id,
      orderId: delivery.orderId,
      location: delivery.location || '',
      address: buildAddress(delivery),
      city1: delivery.city1 || '',
      state1: delivery.state1 || '',
      zip1: delivery.zip1 || '',
      customer: "(".concat(item.customers || '', ") #").concat(delivery.orderId || ''),
      sortOrder: null
    };

    // Check if delivery should be excluded regardless of location
    if (shouldExcludeDelivery(delivery)) {
      categorized.other.push(transformedDelivery);
      return;
    }

    // Otherwise categorize by location
    const location = (transformedDelivery.location || '').toLowerCase();
    if (location === 'ky') {
      categorized.ky.push(transformedDelivery);
    } else if (location === 'mcm') {
      categorized.mcm.push(transformedDelivery);
    } else {
      categorized.other.push(transformedDelivery);
    }
  });
  return categorized;
}

/**
 * Build address string from delivery object
 */
function buildAddress(delivery) {
  return [delivery.address || '', delivery.city1 || '', delivery.state1 || '', delivery.zip1 || ''].filter(Boolean).join(', ');
}
;// ./extension-src/content/services/apiService.js
// ============================================
// FILE: extension-src/content/services/apiService.js
// Handles API communication for delivery data
// ============================================

/**
 * Fetch all deliveries from API
 */
async function fetchAllDeliveries() {
  const response = await fetch('/api/Deliveries/?orderId=&itemId=&pickerFilter=0');
  if (!response.ok) {
    throw new Error("API request failed: ".concat(response.status));
  }
  const allDeliveries = await response.json();
  console.log("Fetched ".concat(allDeliveries.length, " deliveries from API"));
  return allDeliveries;
}

/**
 * Filter deliveries by ID set
 */
function filterDeliveriesByIds(allDeliveries, deliveryIds) {
  return allDeliveries.filter(item => {
    const rawApiId = item.delivery ? item.delivery.id : undefined;
    if (rawApiId === undefined) {
      return false;
    }
    const apiIdString = String(rawApiId);
    const cleanedApiIdText = apiIdString.replace(/\D/g, '');
    return deliveryIds.has(Number(cleanedApiIdText));
  });
}
;// ./extension-src/content/content.js
// ============================================
// FILE: extension-src/content/content.js
// Main content script - now delegates to modules
// ============================================


console.log('Content script loaded on deliveries page');

// Listen for extraction requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    console.log('Extract data request received');
    extractDeliveryData().then(extractedData => {
      chrome.runtime.sendMessage({
        type: 'DATA_EXTRACTED',
        data: extractedData
      }, response => {
        console.log('Data sent to background:', response);
        sendResponse({
          success: true
        });
      });
    }).catch(error => {
      console.error('Error extracting data:', error);
      sendResponse({
        success: false,
        error: error.message
      });
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
    console.log("Filtered to ".concat(filteredDeliveries.length, " matching deliveries"));

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
/******/ })()
;