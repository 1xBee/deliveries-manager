// ============================================
// FILE: extension-src/background/background.js
// Main background script - now just a router
// ============================================
import { setupMessageListener } from './utils/messageRouter.js';

// Setup message routing
setupMessageListener();

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('ui.html') });
});

console.log('Delivery Route Optimizer background script loaded');