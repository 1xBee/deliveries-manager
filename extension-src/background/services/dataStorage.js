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
export async function saveData(data, sendResponse) {
  try {
    // Store in chrome.storage.local
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    
    console.log('✅ Background saved data to chrome.storage.local:', data);

    // ✅ ONLY notify on success!
    await notifyUIPages(data);

    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    
    // ❌ DON'T broadcast on failure - prevents loop!
    // Just tell the sender it failed
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle extracted data from content script
 * (When user clicks "Grab Data" in popup)
 */
export async function handleExtractedData(data, sendResponse) {
  try {
    const storageData = {
      version: 1,
      timestamp: new Date().toISOString(),
      deliveries: data
    };

    // Save to chrome.storage.local
    await chrome.storage.local.set({ [STORAGE_KEY]: storageData });
    
    console.log('✅ Background cached extracted data:', storageData);

    // Notify all open UI pages
    await notifyUIPages(storageData);

    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Error handling extracted data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get cached data from chrome.storage.local
 */
export async function getCachedData(sendResponse) {
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
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Clear data from chrome.storage.local
 */
export async function clearData(sendResponse) {
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

    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    sendResponse({ success: false, error: error.message });
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
    
    console.log(`📢 Notifying ${uiTabs.length} UI tab(s) about data update`);
    
    for (const tab of uiTabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'DATA_UPDATED',
          data: data
        });
      } catch (err) {
        console.warn(`Failed to notify tab ${tab.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error notifying UI pages:', error);
  }
}