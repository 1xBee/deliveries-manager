// ============================================
// FILE: extension-src/content/services/deliveryExtractor.js
// Core delivery extraction logic separated from content.js
// ============================================

const DELIVERY_ID_COLUMN_NUMBER = 1;

// Cities that should always go to 'other' category
const EXCLUDED_CITIES = ['brooklyn', 'linden', 'staten island', 'montreal', 'canada', 'toronto', 'quebec'];

/**
 * Extract delivery IDs from the table
 */
export function extractDeliveryIdsFromTable() {
  const selector = `.rt-tr .rt-td:nth-child(${DELIVERY_ID_COLUMN_NUMBER}) a`;
  const tableLinks = document.querySelectorAll(selector);
  
  const deliveryIds = new Set();
  
  tableLinks.forEach(link => {
    const idText = link.textContent.trim();
    const cleanedIdText = idText.replace(/\D/g, '');
    
    if (cleanedIdText) {
      deliveryIds.add(parseInt(cleanedIdText, 10));
    }
  });
  
  console.log(`Found ${deliveryIds.size} delivery IDs in table:`, Array.from(deliveryIds));
  return deliveryIds;
}

/**
 * Check if delivery should be excluded based on city or address
 */
function shouldExcludeDelivery(delivery) {
  const city = (delivery.city1 || '').toLowerCase();
  const address = (delivery.address || '').toLowerCase();
  
  // Check if city matches any excluded city
  if (EXCLUDED_CITIES.some(excludedCity => city.includes(excludedCity))) {
    return true;
  }
  
  // Check if address contains any excluded city name
  if (EXCLUDED_CITIES.some(excludedCity => address.includes(excludedCity))) {
    return true;
  }
  
  return false;
}

/**
 * Categorize deliveries by location
 */
export function categorizeDeliveries(filteredDeliveries) {
  const categorized = {
    'ky': [],
    'mcm': [],
    'other': []
  };
  
  filteredDeliveries.forEach(item => {
    const delivery = item.delivery || {};
    
    const transformedDelivery = {
      id: delivery.id,
      orderId: delivery.orderId,
      location: delivery.location || '',
      address: buildAddress(delivery),
      city1: delivery.city1 || '',
      state1: delivery.state1 || '',
      zip1: delivery.zip1 || '',
      customer: `(${item.customers || ''}) #${delivery.orderId || ''}`,
      sortOrder: null
    };
    
    // Check if delivery should be excluded regardless of location
    if (shouldExcludeDelivery(delivery)) {
      categorized.other.push(transformedDelivery);
      return;
    }
    
    // Otherwise categorize by location
    const location = (transformedDelivery.location || '').toLowerCase();
    if (location === 'ky') {
      categorized.ky.push(transformedDelivery);
    } else if (location === 'mcm') {
      categorized.mcm.push(transformedDelivery);
    } else {
      categorized.other.push(transformedDelivery);
    }
  });
  
  return categorized;
}

/**
 * Build address string from delivery object
 */
function buildAddress(delivery) {
  return [
    delivery.address || '',
    delivery.city1 || '',
    delivery.state1 || '',
    delivery.zip1 || ''
  ].filter(Boolean).join(', ');
}