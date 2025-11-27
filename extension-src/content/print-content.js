// ============================================
// FILE: extension-src/content/print-content.js
// This content script runs on https://cm.chasunamallny.com/
// and handles the merge print functionality
// ============================================

let loadedCount = 0;
let totalCount = 0;
let allIframesReady = false;

// Listen for initialization message from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INIT_PRINT') {
    const { tabName, deliveryIds } = message.data;
    
    // Clear the page and set it up for printing
    clearAndSetupPage(tabName);
    
    // Create iframes for each delivery
    createInvoiceIframes(deliveryIds);
    
    sendResponse({ success: true });
  }
});

function clearAndSetupPage(tabName) {
  // Clear all content
  document.body.innerHTML = '';
  
  // Update title
  document.title = `${tabName.toUpperCase()} - Merge Print`;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8fafc;
    }

    .loading {
      text-align: center;
      padding: 40px;
    }

    .loading h1 {
      color: #1e293b;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .loading p {
      color: #64748b;
      font-size: 16px;
    }

    .spinner {
      margin: 20px auto;
      width: 50px;
      height: 50px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .iframe-container {
      position: relative;
    }

    iframe {
      display: none;
      border: none;
      page-break-after: always;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
      }

      .loading {
        display: none;
      }

      .iframe-container {
        display: block;
      }

      iframe {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100vh;
        page-break-after: always;
        page-break-inside: avoid;
      }

      iframe::after {
        content: "";
        display: block;
        page-break-after: always;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add loading UI
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <h1>Preparing Merge Print</h1>
    <div class="spinner"></div>
    <p id="status">Initializing...</p>
  `;
  document.body.appendChild(loadingDiv);
  
  // Add iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'iframeContainer';
  iframeContainer.className = 'iframe-container';
  document.body.appendChild(iframeContainer);
}

function createInvoiceIframes(deliveryIds) {
  const iframeContainer = document.getElementById('iframeContainer');
  const statusEl = document.getElementById('status');
  
  totalCount = deliveryIds.length;
  loadedCount = 0;
  
  statusEl.textContent = `Loading ${deliveryIds.length} invoices...`;

  deliveryIds.forEach((id, index) => {
    const iframe = document.createElement('iframe');
    
    // Use relative path - we're on the same domain!
    iframe.src = `/Deliveries/${id}/Invoice?hidePrintFirstPageOnly=false&hideUnavailable=true&hideSkipReturnPolicy=true&hideBackordered=true&hideDeliverable=true`;
    
    // Set iframe attributes
    iframe.id = `invoice-${id}`;
    iframe.dataset.deliveryId = id;
    iframe.dataset.index = index;
    
    // Add load event listener
    iframe.addEventListener('load', () => handleIframeLoad(iframe));
    
    // Append to container
    iframeContainer.appendChild(iframe);
  });
}

function handleIframeLoad(iframe) {
  const deliveryId = iframe.dataset.deliveryId;
  const statusEl = document.getElementById('status');
  
  console.log(`Iframe loaded for delivery ${deliveryId}`);

  // Wait for React components to render inside iframe
  waitForIframeContent(iframe).then(() => {
    loadedCount++;
    statusEl.textContent = `Loaded ${loadedCount} of ${totalCount} invoices...`;

    console.log(`Iframe ready for delivery ${deliveryId} (${loadedCount}/${totalCount})`);

    // Check if all iframes are loaded
    if (loadedCount === totalCount && !allIframesReady) {
      allIframesReady = true;
      handleAllIframesReady();
    }
  });
}

async function waitForIframeContent(iframe) {
  const maxAttempts = 50; // 5 seconds max
  const checkInterval = 100; // Check every 100ms

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Check if body exists and has content
      if (iframeDoc && iframeDoc.body) {
        const bodyContent = iframeDoc.body.innerHTML;
        
        // Check if there's substantial content (not just loading spinner)
        const hasContent = bodyContent.length > 1000 || 
                          iframeDoc.querySelector('.invoice') ||
                          iframeDoc.querySelector('[class*="invoice"]') ||
                          iframeDoc.querySelector('table');
        
        if (hasContent) {
          // Wait a bit more to ensure React has finished rendering
          await sleep(300);
          return;
        }
      }
    } catch (e) {
      // Cross-origin or other error, wait and retry
      console.log(`Attempt ${attempt + 1}: Waiting for iframe content...`);
    }

    await sleep(checkInterval);
  }

  // Timeout reached, proceed anyway
  console.warn(`Timeout waiting for iframe ${iframe.dataset.deliveryId}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleAllIframesReady() {
  const loadingEl = document.getElementById('loading');
  const statusEl = document.getElementById('status');
  
  console.log('All iframes ready!');
  
  statusEl.textContent = 'All invoices loaded! Preparing to print...';
  
  // Wait a moment for final rendering
  await sleep(500);
  
  // Hide loading screen
  loadingEl.style.display = 'none';
  
  // Wait another moment for layout
  await sleep(300);
  
  // Trigger print dialog
  console.log('Triggering print...');
  window.print();
  
  // Optional: Close window after print
  window.addEventListener('afterprint', () => {
    setTimeout(() => {
      window.close();
    }, 500);
  });
}