// ============================================
// FILE: extension-src/content/print-content.js
// CLEAN: MutationObserver approach
// ============================================

let totalCount = 0;
let readyInvoices = new Set(); // Track which invoices are ready

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INIT_PRINT') {
    const { tabName, deliveryIds } = message.data;
    totalCount = deliveryIds.length;
    
    clearAndSetupPage(tabName);
    setupCustomEventListener();
    createInvoiceIframes(deliveryIds);
    
    sendResponse({ success: true });
  }
});

function clearAndSetupPage(tabName) {
  document.body.innerHTML = '';
  document.title = `${tabName.toUpperCase()} - Merge Print`;
  
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
  
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = `
    <h1>Preparing Merge Print</h1>
    <div class="spinner"></div>
    <p id="status">Loading 0 of ${totalCount} invoices...</p>
  `;
  document.body.appendChild(loadingDiv);
  
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'iframeContainer';
  iframeContainer.className = 'iframe-container';
  document.body.appendChild(iframeContainer);
}

function createInvoiceIframes(deliveryIds) {
  const iframeContainer = document.getElementById('iframeContainer');
  
  deliveryIds.forEach((id, index) => {
    const iframe = document.createElement('iframe');
    iframe.src = `/Deliveries/${id}/Invoice?hidePrintFirstPageOnly=false&hideUnavailable=true&hideSkipReturnPolicy=true&hideBackordered=true&hideDeliverable=true`;
    iframe.id = `invoice-${id}`;
    iframe.dataset.deliveryId = id;
    iframe.dataset.index = index;
    iframe.addEventListener('load', () => setupMutationObserver(iframe));
    iframeContainer.appendChild(iframe);
  });
}

function setupMutationObserver(iframe) {
  const deliveryId = iframe.dataset.deliveryId;
  
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const rootApp = iframeDoc.querySelector('#rootApp');
    
    if (!rootApp) {
      console.error(`#rootApp not found for invoice ${deliveryId}`);
      return;
    }
    
    // Check if #invDetails already exists
    if (iframeDoc.querySelector('#invDetails')) {
      console.log(`✅ #invDetails already present for invoice ${deliveryId}`);
      fireInvoiceReadyEvent(iframe, deliveryId);
      return;
    }
    
    // Create MutationObserver to watch for #invDetails
    const observer = new MutationObserver((mutations, obs) => {
      const invDetails = iframeDoc.querySelector('#invDetails');
      
      if (invDetails) {
        console.log(`✅ #invDetails found for invoice ${deliveryId}`);
        obs.disconnect(); // Stop observing
        fireInvoiceReadyEvent(iframe, deliveryId);
      }
    });
    
    // Start observing
    observer.observe(rootApp, {
      childList: true,
      subtree: true
    });
    
    console.log(`👀 Watching for #invDetails in invoice ${deliveryId}`);
    
  } catch (error) {
    console.error(`Error setting up observer for invoice ${deliveryId}:`, error);
  }
}

function fireInvoiceReadyEvent(iframe, deliveryId) {
  // Fire custom event on the main document
  const event = new CustomEvent('invoiceReady', {
    detail: { invoiceId: deliveryId }
  });
  document.dispatchEvent(event);
}

function setupCustomEventListener() {
  document.addEventListener('invoiceReady', (event) => {
    const invoiceId = event.detail.invoiceId;
    
    // Add to set (automatically avoids duplicates)
    readyInvoices.add(invoiceId);
    
    console.log(`📦 Invoice ${invoiceId} ready (${readyInvoices.size}/${totalCount})`);
    
    // Update status
    const statusEl = document.getElementById('status');
    statusEl.textContent = `Loading ${readyInvoices.size} of ${totalCount} invoices...`;
    
    // Check if all are done
    if (readyInvoices.size === totalCount) {
      console.log('🎉 All invoices ready!');
      handleAllReady();
    }
  });
}

function handleAllReady() {
  const loadingEl = document.getElementById('loading');
  const statusEl = document.getElementById('status');
  
  statusEl.textContent = 'All invoices loaded! Printing...';
  
  // 100ms safety interval, then print
  setTimeout(() => {
    loadingEl.style.display = 'none';
    
    console.log('🖨️ Triggering print...');
    window.print();
    
    // Close window after print
    window.addEventListener('afterprint', () => {
      setTimeout(() => {
        window.close();
      }, 500);
    });
  }, 100);
}