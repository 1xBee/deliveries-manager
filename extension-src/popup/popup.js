// ============================================
// FILE: extension-src/popup/popup.js
// ============================================

const extractBtn = document.getElementById('extractBtn');
const openUiBtn = document.getElementById('openUiBtn');
const printRouteBtn = document.getElementById('printRouteBtn');
const statusDiv = document.getElementById('status');

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;
}

// Hide status message
function hideStatus() {
  statusDiv.className = 'status';
}

// Extract data button handler
extractBtn.addEventListener('click', async () => {
  hideStatus();
  extractBtn.disabled = true;
  extractBtn.textContent = 'Extracting...';
  
  showStatus('Looking for delivery data...', 'loading');
  
  try {
    // Send message to background to inject script and grab data
    chrome.runtime.sendMessage(
      { type: 'INJECT_AND_GRAB' },
      (response) => {
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Delivery Data';
        
        if (response.success) {
          showStatus('Data extracted successfully! Open the Route Optimizer to view.', 'success');
        } else {
          showStatus(response.error || 'Failed to extract data', 'error');
        }
      }
    );
  } catch (error) {
    extractBtn.disabled = false;
    extractBtn.textContent = 'Extract Delivery Data';
    showStatus('Error: ' + error.message, 'error');
  }
});

// Open UI button handler
openUiBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('ui.html') });
});

// Print Route button handler
printRouteBtn.addEventListener('click', async () => {
  hideStatus();
  printRouteBtn.disabled = true;
  printRouteBtn.textContent = 'Preparing...';
  
  showStatus('Requesting route data...', 'loading');
  
  try {
    // Find all open UI tabs
    const uiTabs = await chrome.tabs.query({ 
      url: chrome.runtime.getURL('ui.html') 
    });

    if (uiTabs.length === 0) {
      showStatus('Please open the Route Optimizer first', 'error');
      printRouteBtn.disabled = false;
      printRouteBtn.textContent = 'Print Route';
      return;
    }

    // Request route data from the first UI tab
    chrome.tabs.sendMessage(uiTabs[0].id, { type: 'GET_PRINT_ROUTE' }, (response) => {
      printRouteBtn.disabled = false;
      printRouteBtn.textContent = 'Print Route';

      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (!response || !response.success) {
        showStatus(response?.error || 'Failed to get route data', 'error');
        return;
      }

      // Send to background to handle print window creation
      chrome.runtime.sendMessage({
        type: 'PRINT_ROUTE',
        data: response.data
      }, (printResponse) => {
        if (printResponse && printResponse.success) {
          showStatus('Print window opened', 'success');
        } else {
          showStatus('Failed to open print window', 'error');
        }
      });
    });

  } catch (error) {
    printRouteBtn.disabled = false;
    printRouteBtn.textContent = 'Print Route';
    showStatus('Error: ' + error.message, 'error');
  }
});