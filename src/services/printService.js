// ============================================
// FILE: src/services/printService.js
// Handles printing invoices by calling Chrome extension background
// ============================================

/**
 * Opens print window with delivery invoices via Chrome extension
 * @param {Array} deliveryIds - Array of delivery IDs to print
 * @param {string} tabName - Name of the tab (for title)
 */
export const openPrintWindow = (deliveryIds, tabName) => {
  if (!deliveryIds || deliveryIds.length === 0) {
    alert('No deliveries to print');
    return false;
  }

  // Check if Chrome extension API is available
  if (!window.chrome || !window.chrome.runtime) {
    alert('Chrome extension is required for printing. Please install the extension.');
    return false;
  }

  try {
    // Send message to background script to handle printing
    chrome.runtime.sendMessage(
      {
        type: 'PRINT_ROUTE',
        data: {
          tabName,
          deliveryIds
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Print error:', chrome.runtime.lastError);
          alert('Failed to open print window: ' + chrome.runtime.lastError.message);
          return;
        }

        if (!response || !response.success) {
          console.error('Print failed:', response?.error);
          alert('Failed to open print window: ' + (response?.error || 'Unknown error'));
          return;
        }

        console.log('Print window opened successfully');
      }
    );

    return true;
  } catch (error) {
    console.error('Error calling print service:', error);
    alert('Failed to print: ' + error.message);
    return false;
  }
};

/**
 * Sort deliveries by sortOrder for printing
 */
export const sortDeliveriesForPrint = (deliveries) => {
  return [...deliveries].sort((a, b) => {
    if (a.sortOrder == null && b.sortOrder == null) return 0;
    if (a.sortOrder == null) return 1;
    if (b.sortOrder == null) return -1;
    return a.sortOrder - b.sortOrder;
  });
};