// ============================================
// FILE: src/hooks/useDeliveryActions.js
// Handles all CRUD operations for deliveries
// ============================================

export function useDeliveryActions(deliveries, setDeliveries, setSelectedIds) {
  
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
    handleDelete,
    handleMove,
    handleAddCustom,
    handleBulkUpdateAddress,
    handleUpdateRow,
    handleApplySortOrder
  };
}