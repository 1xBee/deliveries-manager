// ============================================
// FILE: background.js
// ============================================

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'INJECT_AND_GRAB') {
    // Popup requested data extraction
    handleDataExtraction(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'DATA_EXTRACTED') {
    // Content script sent extracted data
    handleExtractedData(message.data, sendResponse);
    return true;
  }

  if (message.type === 'GET_CACHED_DATA') {
    // UI page requesting cached data
    getCachedData(sendResponse);
    return true;
  }

  if (message.type === 'PRINT_ROUTE') {
    // Popup requested print route
    handlePrintRoute(message.data, sendResponse);
    return true;
  }
});

// Handle data extraction request from popup
async function handleDataExtraction(sendResponse) {
  try {
    // Find the deliveries tab
    const tabs = await chrome.tabs.query({ 
      url: 'https://cm.chasunamallny.com/Deliveries*' 
    });

    if (tabs.length === 0) {
      sendResponse({ 
        success: false, 
        error: 'No deliveries page found. Please open https://cm.chasunamallny.com/Deliveries first.' 
      });
      return;
    }

    // If multiple tabs, use the first one
    const targetTab = tabs[0];

    // Inject the content script if not already injected
    await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      files: ['content.js']
    });

    // Send message to content script to extract data
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

// Handle extracted data from content script
async function handleExtractedData(data, sendResponse) {
  try {
    // Cache the data
    await chrome.storage.local.set({ deliveryData: data });
    
    console.log('Data cached successfully:', data);

    // Notify all open UI pages
    const uiTabs = await chrome.tabs.query({ url: chrome.runtime.getURL('ui.html') });
    uiTabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'DATA_UPDATED',
        data: data
      });
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error handling extracted data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get cached data
async function getCachedData(sendResponse) {
  try {
    const result = await chrome.storage.local.get('deliveryData');
    sendResponse({ 
      success: true, 
      data: result.deliveryData || null 
    });
  } catch (error) {
    console.error('Error getting cached data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle print route request
async function handlePrintRoute(data, sendResponse) {
  try {
    const { tabName, deliveryIds } = data;

    if (!deliveryIds || deliveryIds.length === 0) {
      sendResponse({ 
        success: false, 
        error: 'No deliveries to print' 
      });
      return;
    }

    // Open the cm.chasunamallny.com page in a new window
    const printWindow = await chrome.windows.create({
      url: 'https://cm.chasunamallny.com/',
      type: 'popup',
      width: 800,
      height: 600
    });

    // Wait for the tab to be ready, then inject the print script
    const checkTab = setInterval(async () => {
      const tabs = await chrome.tabs.query({ windowId: printWindow.id });
      if (tabs.length > 0) {
        const tab = tabs[0];
        if (tab.status === 'complete') {
          clearInterval(checkTab);
          
          try {
            // Inject the print content script
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['print-content.js']
            });

            // Wait a bit for script to load
            setTimeout(() => {
              // Send print data to the content script
              chrome.tabs.sendMessage(tab.id, {
                type: 'INIT_PRINT',
                data: {
                  tabName: tabName,
                  deliveryIds: deliveryIds
                }
              });
            }, 100);

          } catch (error) {
            console.error('Error injecting print script:', error);
          }
        }
      }
    }, 100);

    // Clear interval after 10 seconds to prevent infinite loop
    setTimeout(() => clearInterval(checkTab), 10000);

    sendResponse({ success: true });

  } catch (error) {
    console.error('Error in handlePrintRoute:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Listen for extension icon click to open UI
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('ui.html') });
});