/******/ (() => { // webpackBootstrap
// ============================================
// FILE: extension-src/content/print-content.js
// CLEAN: MutationObserver approach
// ============================================

let totalCount = 0;
let readyInvoices = new Set(); // Track which invoices are ready

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INIT_PRINT') {
    const {
      tabName,
      deliveryIds
    } = message.data;
    totalCount = deliveryIds.length;
    clearAndSetupPage(tabName);
    setupCustomEventListener();
    createInvoiceIframes(deliveryIds);
    sendResponse({
      success: true
    });
  }
});
function clearAndSetupPage(tabName) {
  document.body.innerHTML = '';
  document.title = "".concat(tabName.toUpperCase(), " - Merge Print");
  const style = document.createElement('style');
  style.textContent = "\n    body {\n      margin: 0;\n      padding: 20px;\n      font-family: system-ui, -apple-system, sans-serif;\n      background: #f8fafc;\n    }\n\n    .loading {\n      text-align: center;\n      padding: 40px;\n    }\n\n    .loading h1 {\n      color: #1e293b;\n      font-size: 24px;\n      margin-bottom: 10px;\n    }\n\n    .loading p {\n      color: #64748b;\n      font-size: 16px;\n    }\n\n    .spinner {\n      margin: 20px auto;\n      width: 50px;\n      height: 50px;\n      border: 4px solid #e2e8f0;\n      border-top-color: #3b82f6;\n      border-radius: 50%;\n      animation: spin 1s linear infinite;\n    }\n\n    @keyframes spin {\n      to { transform: rotate(360deg); }\n    }\n\n    .iframe-container {\n      position: relative;\n    }\n\n    iframe {\n      display: none;\n      border: none;\n      page-break-after: always;\n    }\n\n    @media print {\n      body {\n        margin: 0;\n        padding: 0;\n        background: white;\n      }\n\n      .loading {\n        display: none;\n      }\n\n      .iframe-container {\n        display: block;\n      }\n\n      iframe {\n        display: block !important;\n        width: 100% !important;\n        height: auto !important;\n        min-height: 100vh;\n        page-break-after: always;\n        page-break-inside: avoid;\n      }\n\n      iframe::after {\n        content: \"\";\n        display: block;\n        page-break-after: always;\n      }\n    }\n  ";
  document.head.appendChild(style);
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  loadingDiv.className = 'loading';
  loadingDiv.innerHTML = "\n    <h1>Preparing Merge Print</h1>\n    <div class=\"spinner\"></div>\n    <p id=\"status\">Loading 0 of ".concat(totalCount, " invoices...</p>\n  ");
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
    iframe.src = "/Deliveries/".concat(id, "/Invoice?hidePrintFirstPageOnly=false&hideUnavailable=true&hideSkipReturnPolicy=true&hideBackordered=true&hideDeliverable=true");
    iframe.id = "invoice-".concat(id);
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
      console.error("#rootApp not found for invoice ".concat(deliveryId));
      return;
    }

    // Check if #invDetails already exists
    if (iframeDoc.querySelector('#invDetails')) {
      console.log("\u2705 #invDetails already present for invoice ".concat(deliveryId));
      fireInvoiceReadyEvent(iframe, deliveryId);
      return;
    }

    // Create MutationObserver to watch for #invDetails
    const observer = new MutationObserver((mutations, obs) => {
      const invDetails = iframeDoc.querySelector('#invDetails');
      if (invDetails) {
        console.log("\u2705 #invDetails found for invoice ".concat(deliveryId));
        obs.disconnect(); // Stop observing
        fireInvoiceReadyEvent(iframe, deliveryId);
      }
    });

    // Start observing
    observer.observe(rootApp, {
      childList: true,
      subtree: true
    });
    console.log("\uD83D\uDC40 Watching for #invDetails in invoice ".concat(deliveryId));
  } catch (error) {
    console.error("Error setting up observer for invoice ".concat(deliveryId, ":"), error);
  }
}
function fireInvoiceReadyEvent(iframe, deliveryId) {
  // Fire custom event on the main document
  const event = new CustomEvent('invoiceReady', {
    detail: {
      invoiceId: deliveryId
    }
  });
  document.dispatchEvent(event);
}
function setupCustomEventListener() {
  document.addEventListener('invoiceReady', event => {
    const invoiceId = event.detail.invoiceId;

    // Add to set (automatically avoids duplicates)
    readyInvoices.add(invoiceId);
    console.log("\uD83D\uDCE6 Invoice ".concat(invoiceId, " ready (").concat(readyInvoices.size, "/").concat(totalCount, ")"));

    // Update status
    const statusEl = document.getElementById('status');
    statusEl.textContent = "Loading ".concat(readyInvoices.size, " of ").concat(totalCount, " invoices...");

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
/******/ })()
;