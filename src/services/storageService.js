// ============================================
// FILE: src/services/storageService.js
// Handles all Chrome extension storage operations
// ============================================

const STORAGE_KEY = 'delivery_route_data';
const STORAGE_VERSION = 1;

/**
 * Save delivery data via background script
 * This sends a message to background which handles chrome.storage
 */
export const saveToExtensionStorage = async (deliveries) => {
  // Check if we're in extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    console.warn('Not in extension context, cannot save');
    return false;
  }

  try {
    const data = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      deliveries
    };

    // Send to background script to handle storage
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_DATA',
      data: data
    });

    if (response?.success) {
      console.log('Data saved to extension storage via background');
      return true;
    } else {
      console.error('Background failed to save data:', response?.error);
      return false;
    }
  } catch (error) {
    console.error('Failed to send save message:', error);
    return false;
  }
};

/**
 * Load delivery data from extension storage via background
 */
export const loadFromExtensionStorage = async () => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    console.warn('Not in extension context, cannot load');
    return null;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CACHED_DATA'
    });

    if (response?.success && response?.data) {
      console.log('Data loaded from extension storage:', response.data);
      return response.data.deliveries;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load from extension storage:', error);
    return null;
  }
};

/**
 * Clear all delivery data from extension storage
 */
export const clearExtensionStorage = async () => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    console.warn('Not in extension context, cannot clear');
    return false;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_DATA'
    });

    if (response?.success) {
      console.log('Extension storage cleared');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to clear extension storage:', error);
    return false;
  }
};