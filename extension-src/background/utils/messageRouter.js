// ============================================
// FILE: extension-src/background/utils/messageRouter.js
// Routes messages to appropriate handlers
// UPDATED: Added SAVE_DATA and CLEAR_DATA handlers
// ============================================
import { handleDataExtraction } from '../services/dataExtraction.js';
import { 
  handleExtractedData, 
  getCachedData, 
  saveData, 
  clearData 
} from '../services/dataStorage.js';
import { handlePrintRoute } from '../services/printHandler.js';

/**
 * Main message router for background script
 */
export function setupMessageListener() {
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
        sendResponse({ success: false, error: 'Unknown message type' });
        return false;
    }
  });

  console.log('✅ Message router initialized');
}