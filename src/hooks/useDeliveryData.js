// ============================================
// FILE: src/hooks/useDeliveryData.js
// ============================================
import { useState } from 'react';
import { INITIAL_DATA } from '../constants/initialData';

export function useDeliveryData() {
  const [deliveries, setDeliveries] = useState(INITIAL_DATA);
  const [selectedIds, setSelectedIds] = useState({
    'orange-county': [],
    'los-angeles': [],
    'other': []
  });

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
    handleApplySortOrder
  };
}