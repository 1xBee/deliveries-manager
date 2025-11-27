// ============================================
// FILE: src/hooks/useExtensionSync.js
// Handles Chrome extension communication
// UPDATED: Uses setDeliveriesFromExtension for loop prevention
// ============================================
import { useEffect, useRef } from 'react';

export function useExtensionSync(setDeliveriesFromExtension, setDataSource, activeTab) {
  const hasRequestedCache = useRef(false);

  useEffect(() => {
    // Check if we're in a Chrome extension context
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      console.log('Not running in Chrome extension context');
      return;
    }

    // Request cached data on mount - ONLY ONCE
    if (!hasRequestedCache.current) {
      hasRequestedCache.current = true;
      chrome.runtime.sendMessage(
        { type: 'GET_CACHED_DATA' },
        (response) => {
          if (response && response.success && response.data) {
            // Use the loop-safe setter
            setDeliveriesFromExtension(response.data.deliveries);
            console.log('Loaded cached extension data:', response.data);
          }
        }
      );
    }

    // Message listener
    const messageListener = (message, sender, sendResponse) => {
      // 🔒 Live data updates from extension (could be from another tab)
      if (message.type === 'DATA_UPDATED') {
        console.log('Received DATA_UPDATED from extension');
        
        // Use the special setter that checks for loops
        setDeliveriesFromExtension(message.data.deliveries);
        
        sendResponse({ success: true });
        return true;
      }

      // Print route request
      if (message.type === 'GET_PRINT_ROUTE') {
        console.log('Print route requested for tab:', activeTab);
        
        // We need access to current deliveries - this requires a callback pattern
        // The parent component should handle this
        sendResponse({ 
          success: true, 
          data: {
            tabName: activeTab,
            // Deliveries will be accessed by parent component
          }
        });

        return true;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [activeTab, setDeliveriesFromExtension, setDataSource]);
}