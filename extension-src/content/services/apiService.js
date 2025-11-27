// ============================================
// FILE: extension-src/content/services/apiService.js
// Handles API communication for delivery data
// ============================================

/**
 * Fetch all deliveries from API
 */
export async function fetchAllDeliveries() {
  const response = await fetch('/api/Deliveries/?orderId=&itemId=&pickerFilter=0');
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const allDeliveries = await response.json();
  console.log(`Fetched ${allDeliveries.length} deliveries from API`);
  
  return allDeliveries;
}

/**
 * Filter deliveries by ID set
 */
export function filterDeliveriesByIds(allDeliveries, deliveryIds) {
  return allDeliveries.filter(item => {
    const rawApiId = item.delivery ? item.delivery.id : undefined;
    
    if (rawApiId === undefined) {
      return false;
    }
    
    const apiIdString = String(rawApiId);
    const cleanedApiIdText = apiIdString.replace(/\D/g, '');
    
    return deliveryIds.has(Number(cleanedApiIdText));
  });
}