// ============================================
// FILE: popup.js
// ============================================

const extractBtn = document.getElementById('extractBtn');
const openUiBtn = document.getElementById('openUiBtn');
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