// ============================================
// FILE: src/hooks/useDeliveryState.js
// Manages delivery state with extension storage persistence
// FIXED: Only saves when USER makes changes, not when receiving from extension
// ============================================
import { useState, useEffect, useRef } from 'react';
import { saveToExtensionStorage, loadFromExtensionStorage } from '../services/storageService';

const EMPTY_DATA = {
  'ky': [],
  'mcm': [],
  'other': []
};

export function useDeliveryState() {
  const [deliveries, setDeliveries] = useState(EMPTY_DATA);
  const [selectedIds, setSelectedIds] = useState({
    'ky': [],
    'mcm': [],
    'other': []
  });
  const [activeTab, setActiveTab] = useState('ky');
  const [dataSource, setDataSource] = useState('none'); // 'none', 'extension', 'cached', 'live'

  // 🔒 CRITICAL: Track whether the update came from extension or user
  const isExtensionUpdate = useRef(false);

  // Load from extension storage on mount
  useEffect(() => {
    loadFromExtensionStorage().then(stored => {
      if (stored) {
        isExtensionUpdate.current = true; // Mark as extension update
        setDeliveries(stored);
        setDataSource('extension');
        console.log('✅ Loaded from extension storage (no save needed)');
      }
    });
  }, []);

  // Auto-save to extension storage ONLY for user changes
  useEffect(() => {
    // Skip if no data yet
    if (dataSource === 'none') {
      return;
    }

    // 🔒 CRITICAL: Skip save if this update came from extension
    if (isExtensionUpdate.current) {
      console.log('⏭️ Skipping save - data came from extension');
      isExtensionUpdate.current = false; // Reset flag
      return;
    }

    // This is a USER change - save it!
    console.log('💾 User changed data - saving to extension storage');
    saveToExtensionStorage(deliveries);
    
  }, [deliveries, dataSource]);

  // Update deliveries from USER action
  const updateDeliveries = (newDeliveries) => {
    isExtensionUpdate.current = false; // This is a user change
    setDeliveries(newDeliveries);
    if (dataSource === 'none') {
      setDataSource('extension');
    }
  };

  // 🔒 Update deliveries from EXTENSION (don't save back)
  const setDeliveriesFromExtension = (newDeliveries) => {
    console.log('📥 Receiving data from extension (no save needed)');
    isExtensionUpdate.current = true; // Mark as extension update
    setDeliveries(newDeliveries);
    setDataSource('live');
  };

  return {
    deliveries,
    setDeliveries: updateDeliveries,
    setDeliveriesFromExtension,
    selectedIds,
    setSelectedIds,
    activeTab,
    setActiveTab,
    dataSource,
    setDataSource
  };
}