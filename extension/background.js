/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./extension-src/background/services/dataExtraction.js
// ============================================
// FILE: extension-src/background/services/dataExtraction.js
// Handles data extraction from the deliveries page
// ============================================

/**
 * Handle data extraction request from popup
 */
async function handleDataExtraction(sendResponse) {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tabs.length === 0) {
      sendResponse({
        success: false,
        error: 'No active tab found.'
      });
      return;
    }
    const targetTab = tabs[0];

    // Validate URL
    if (!isValidDeliveriesPage(targetTab.url)) {
      sendResponse({
        success: false,
        error: 'Please navigate to the deliveries page (https://cm.chasunamallny.com/Deliveries) and try again.'
      });
      return;
    }

    // Inject content script
    await chrome.scripting.executeScript({
      target: {
        tabId: targetTab.id
      },
      files: ['content/content.js']
    });

    // Send extraction request
    chrome.tabs.sendMessage(targetTab.id, {
      type: 'EXTRACT_DATA'
    }, response => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({
          success: true
        });
      }
    });
  } catch (error) {
    console.error('Error in handleDataExtraction:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Validate if URL is the correct deliveries page
 */
function isValidDeliveriesPage(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === 'https://cm.chasunamallny.com' && urlObj.pathname === '/Deliveries';
  } catch (e) {
    return false;
  }
}
;// ./extension-src/background/services/dataStorage.js
// ============================================
// FILE: extension-src/background/services/dataStorage.js
// Handles Chrome storage operations for extracted data
// ============================================

const STORAGE_KEY = 'delivery_route_data';

/**
 * Save data to chrome.storage.local
 * Called when React app sends SAVE_DATA message
 * CRITICAL: Only broadcasts on SUCCESS to prevent loops on failure
 */
async function saveData(data, sendResponse) {
  try {
    // Store in chrome.storage.local
    await chrome.storage.local.set({
      [STORAGE_KEY]: data
    });
    console.log('✅ Background saved data to chrome.storage.local:', data);

    // ✅ ONLY notify on success!
    await notifyUIPages(data);
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('❌ Error saving data:', error);

    // ❌ DON'T broadcast on failure - prevents loop!
    // Just tell the sender it failed
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle extracted data from content script
 * (When user clicks "Grab Data" in popup)
 */
async function handleExtractedData(data, sendResponse) {
  try {
    const storageData = {
      version: 1,
      timestamp: new Date().toISOString(),
      deliveries: data
    };

    // Save to chrome.storage.local
    await chrome.storage.local.set({
      [STORAGE_KEY]: storageData
    });
    console.log('✅ Background cached extracted data:', storageData);

    // Notify all open UI pages
    await notifyUIPages(storageData);
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('❌ Error handling extracted data:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get cached data from chrome.storage.local
 */
async function getCachedData(sendResponse) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY] || null;
    console.log('📥 Background retrieved cached data:', data);
    sendResponse({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Error getting cached data:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Clear data from chrome.storage.local
 */
async function clearData(sendResponse) {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log('🗑️ Background cleared storage');

    // Create empty data structure
    const emptyData = {
      version: 1,
      timestamp: new Date().toISOString(),
      deliveries: {
        'ky': [],
        'mcm': [],
        'other': []
      }
    };

    // Notify all UI tabs that data was cleared
    await notifyUIPages(emptyData);
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Notify all open UI tabs about data update
 * This sends DATA_UPDATED message which React will receive
 * ONLY called after successful operations!
 */
async function notifyUIPages(data) {
  try {
    const uiTabs = await chrome.tabs.query({
      url: chrome.runtime.getURL('ui.html')
    });
    console.log("\uD83D\uDCE2 Notifying ".concat(uiTabs.length, " UI tab(s) about data update"));
    for (const tab of uiTabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'DATA_UPDATED',
          data: data
        });
      } catch (err) {
        console.warn("Failed to notify tab ".concat(tab.id, ":"), err);
      }
    }
  } catch (error) {
    console.error('Error notifying UI pages:', error);
  }
}
;// ./extension-src/background/services/printHandler.js
// ============================================
// FILE: extension-src/background/services/printHandler.js
// Handles print window creation and management
// ============================================

/**
 * Handle print route request
 */
async function handlePrintRoute(data, sendResponse) {
  try {
    const {
      tabName,
      deliveryIds
    } = data;
    if (!deliveryIds || deliveryIds.length === 0) {
      sendResponse({
        success: false,
        error: 'No deliveries to print'
      });
      return;
    }

    // Open print window
    const printWindow = await chrome.windows.create({
      url: 'https://cm.chasunamallny.com/',
      type: 'popup',
      width: 800,
      height: 600
    });

    // Wait for tab to load, then inject print script
    await waitForTabAndInject(printWindow.id, tabName, deliveryIds);
    sendResponse({
      success: true
    });
  } catch (error) {
    console.error('Error in handlePrintRoute:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Wait for tab to be ready and inject print script
 */
async function waitForTabAndInject(windowId, tabName, deliveryIds) {
  const checkInterval = setInterval(async () => {
    const tabs = await chrome.tabs.query({
      windowId
    });
    if (tabs.length > 0 && tabs[0].status === 'complete') {
      clearInterval(checkInterval);
      try {
        // Inject print content script
        await chrome.scripting.executeScript({
          target: {
            tabId: tabs[0].id
          },
          files: ['content/print-content.js']
        });

        // Wait for script to load
        setTimeout(() => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'INIT_PRINT',
            data: {
              tabName,
              deliveryIds
            }
          });
        }, 100);
      } catch (error) {
        console.error('Error injecting print script:', error);
      }
    }
  }, 100);

  // Clear interval after timeout
  setTimeout(() => clearInterval(checkInterval), 10000);
}
;// ./extension-src/background/utils/messageRouter.js
// ============================================
// FILE: extension-src/background/utils/messageRouter.js
// Routes messages to appropriate handlers
// UPDATED: Added SAVE_DATA and CLEAR_DATA handlers
// ============================================




/**
 * Main message router for background script
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Background received message:', message.type);
    switch (message.type) {
      // ===== DATA EXTRACTION (from website) =====
      case 'INJECT_AND_GRAB':
        handleDataExtraction(sendResponse);
        return true;
      case 'DATA_EXTRACTED':
        handleExtractedData(message.data, sendResponse);
        return true;

      // ===== DATA STORAGE (from React UI) =====
      case 'SAVE_DATA':
        saveData(message.data, sendResponse);
        return true;
      case 'GET_CACHED_DATA':
        getCachedData(sendResponse);
        return true;
      case 'CLEAR_DATA':
        clearData(sendResponse);
        return true;

      // ===== PRINTING =====
      case 'PRINT_ROUTE':
        handlePrintRoute(message.data, sendResponse);
        return true;
      default:
        console.warn('⚠️ Unknown message type:', message.type);
        sendResponse({
          success: false,
          error: 'Unknown message type'
        });
        return false;
    }
  });
  console.log('✅ Message router initialized');
}
;// ./extension-src/background/background.js
// ============================================
// FILE: extension-src/background/background.js
// Main background script - now just a router
// ============================================


// Setup message routing
setupMessageListener();

// Handle extension icon click
chrome.action.onClicked.addListener(tab => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('ui.html')
  });
});
console.log('Delivery Route Optimizer background script loaded');
/******/ })()
;