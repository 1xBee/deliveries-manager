// ============================================
// FILE: extension-src/background/services/dataExtraction.js
// Handles data extraction from the deliveries page
// ============================================

/**
 * Handle data extraction request from popup
 */
export async function handleDataExtraction(sendResponse) {
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
      target: { tabId: targetTab.id },
      files: ['content/content.js']
    });

    // Send extraction request
    chrome.tabs.sendMessage(targetTab.id, { type: 'EXTRACT_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        });
      } else {
        sendResponse({ success: true });
      }
    });

  } catch (error) {
    console.error('Error in handleDataExtraction:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Validate if URL is the correct deliveries page
 */
function isValidDeliveriesPage(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === 'https://cm.chasunamallny.com' && 
           urlObj.pathname === '/Deliveries';
  } catch (e) {
    return false;
  }
}