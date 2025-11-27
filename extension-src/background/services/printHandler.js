// ============================================
// FILE: extension-src/background/services/printHandler.js
// Handles print window creation and management
// ============================================

/**
 * Handle print route request
 */
export async function handlePrintRoute(data, sendResponse) {
  try {
    const { tabName, deliveryIds } = data;

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

    sendResponse({ success: true });

  } catch (error) {
    console.error('Error in handlePrintRoute:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Wait for tab to be ready and inject print script
 */
async function waitForTabAndInject(windowId, tabName, deliveryIds) {
  const checkInterval = setInterval(async () => {
    const tabs = await chrome.tabs.query({ windowId });
    
    if (tabs.length > 0 && tabs[0].status === 'complete') {
      clearInterval(checkInterval);
      
      try {
        // Inject print content script
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content/print-content.js']
        });

        // Wait for script to load
        setTimeout(() => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'INIT_PRINT',
            data: { tabName, deliveryIds }
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