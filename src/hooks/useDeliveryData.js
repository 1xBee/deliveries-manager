// ============================================
// FILE: src/hooks/useDeliveryData.js
// ============================================
import { useState, useEffect, useRef } from 'react';

const EMPTY_DATA = {
  'ky': [],
  'mcm': [],
  'other': []
};

export function useDeliveryData() {
  const [deliveries, setDeliveries] = useState(EMPTY_DATA);
  const [selectedIds, setSelectedIds] = useState({
    'ky': [],
    'mcm': [],
    'other': []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState('none'); // 'none', 'cached', 'live'
  const [activeTab, setActiveTab] = useState('ky');
  
  // Use ref to track if we already requested cached data
  const hasRequestedCache = useRef(false);

  // Listen for Chrome extension messages - ONLY ONCE on mount
  useEffect(() => {
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      
      // Request cached data on mount - ONLY ONCE
      if (!hasRequestedCache.current) {
        hasRequestedCache.current = true;
        chrome.runtime.sendMessage(
          { type: 'GET_CACHED_DATA' },
          (response) => {
            setIsLoading(false);
            if (response && response.success && response.data) {
              setDeliveries(response.data);
              setDataSource('cached');
              console.log('Loaded cached data:', response.data);
            } else {
              console.log('No cached data found');
            }
          }
        );
      }

      // Listen for messages - needs to access current state
      const messageListener = (message, sender, sendResponse) => {
        // Live data updates
        if (message.type === 'DATA_UPDATED') {
          console.log('Received live data update:', message.data);
          setDeliveries(message.data);
          setDataSource('live');
          sendResponse({ success: true });
          return true;
        }

        // Print route request - needs current deliveries and activeTab
        if (message.type === 'GET_PRINT_ROUTE') {
          console.log('Print route requested for tab:', activeTab);
          
          // Access deliveries from the current closure
          setDeliveries(currentDeliveries => {
            setActiveTab(currentActiveTab => {
              const currentTabDeliveries = currentDeliveries[currentActiveTab] || [];
              
              // Sort by sortOrder (1 is first, then higher numbers, then null/undefined)
              const sorted = [...currentTabDeliveries].sort((a, b) => {
                // Handle null/undefined sortOrder
                if (a.sortOrder == null && b.sortOrder == null) return 0;
                if (a.sortOrder == null) return 1;  // null goes to end
                if (b.sortOrder == null) return -1; // null goes to end
                return a.sortOrder - b.sortOrder;    // ascending order
              });

              const deliveryIds = sorted.map(d => d.id);

              sendResponse({ 
                success: true, 
                data: {
                  tabName: currentActiveTab,
                  deliveryIds: deliveryIds
                }
              });

              // Return current state unchanged
              return currentActiveTab;
            });
            return currentDeliveries;
          });

          return true; // Keep channel open for async response
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Cleanup listener on unmount
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    } else {
      // Not in extension context, just stop loading
      setIsLoading(false);
      console.log('Not running in Chrome extension context');
    }
  }, []); // ← FIXED: Empty dependency array - only run once!

  const handleDelete = (ids, tabId) => {
    setDeliveries(prev => ({
      ...prev,
      [tabId]: prev[tabId].filter(d => !ids.includes(d.id))
    }));
    
    setSelectedIds(prev => ({
      ...prev,
      [tabId]: []
    }));
  };

  const handleMove = (ids, fromTabId, toTabId) => {
    const itemsToMove = deliveries[fromTabId].filter(d => ids.includes(d.id));
    
    setDeliveries(prev => ({
      ...prev,
      [fromTabId]: prev[fromTabId].filter(d => !ids.includes(d.id)),
      [toTabId]: [...prev[toTabId], ...itemsToMove]
    }));
    
    setSelectedIds(prev => ({
      ...prev,
      [fromTabId]: []
    }));
  };

  const handleAdd = (tabId) => {
    const allIds = Object.values(deliveries).flat().map(d => d.id);
    const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
    const newDelivery = {
      id: newId,
      customer: `New Customer ${newId}`,
      address: 'Enter address...',
      sortOrder: null
    };
    
    setDeliveries(prev => ({
      ...prev,
      [tabId]: [...prev[tabId], newDelivery]
    }));
  };

  const handleAddCustom = (tabId, delivery) => {
    setDeliveries(prev => ({
      ...prev,
      [tabId]: [...prev[tabId], delivery]
    }));
  };

  const handleBulkUpdateAddress = (ids, tabId, newAddress) => {
    setDeliveries(prev => ({
      ...prev,
      [tabId]: prev[tabId].map(d => 
        ids.includes(d.id) 
          ? { ...d, address: newAddress }
          : d
      )
    }));
  };

  const handleUpdateRow = (id, tabId, field, value) => {
    setDeliveries(prev => ({
      ...prev,
      [tabId]: prev[tabId].map(d => 
        d.id === id ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleApplySortOrder = (tabId, sortOrders) => {
    setDeliveries(prev => ({
      ...prev,
      [tabId]: prev[tabId].map(d => ({
        ...d,
        sortOrder: sortOrders[d.id] || null
      }))
    }));
  };

  return {
    deliveries,
    selectedIds,
    setSelectedIds,
    handleDelete,
    handleMove,
    handleAdd,
    handleAddCustom,
    handleBulkUpdateAddress,
    handleUpdateRow,
    handleApplySortOrder,
    isLoading,
    dataSource,
    activeTab,
    setActiveTab
  };
}