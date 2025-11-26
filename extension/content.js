// Constant: Adjust this if the delivery ID link is not in the first column (1-indexed).
const DELIVERY_ID_COLUMN_NUMBER = 1;

console.log('Content script loaded on deliveries page');

// Listen for extraction requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_DATA') {
        console.log('Extract data request received');
        
        extractDeliveryData()
            .then(extractedData => {
                // Send extracted data back to background
                chrome.runtime.sendMessage({
                    type: 'DATA_EXTRACTED',
                    data: extractedData
                }, (response) => {
                    console.log('Data sent to background:', response);
                    sendResponse({ success: true });
                });
            })
            .catch(error => {
                console.error('Error extracting data:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // Keep channel open for async response
    }
});

async function extractDeliveryData() {
    try {
        // --- Step 1: Get all delivery IDs from the table (Scraping) ---
        // FIX 1: Use :nth-child(N) selector to target ONLY the ID column 
        // and prevent double-counting.
        const selector = `.rt-tr .rt-td:nth-child(${DELIVERY_ID_COLUMN_NUMBER}) a`;
        const tableLinks = document.querySelectorAll(selector);
        
        const deliveryIds = new Set();
        
        tableLinks.forEach(link => {
            const idText = link.textContent.trim();
            
            // FIX 2: Normalize scraped text to ensure only digits are used
            const cleanedIdText = idText.replace(/\D/g, ''); 
            
            if (cleanedIdText) {
                deliveryIds.add(parseInt(cleanedIdText, 10));
            }
        });
        
        console.log(`Found ${deliveryIds.size} delivery IDs in table:`, Array.from(deliveryIds));
        
        if (deliveryIds.size === 0) {
            throw new Error('No delivery IDs found in table');
        }
        
        // Step 2: Fetch all deliveries from API
        const response = await fetch('/api/Deliveries/?orderId=&itemId=&pickerFilter=0');
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const allDeliveries = await response.json();
        console.log(`Fetched ${allDeliveries.length} deliveries from API`);
        
        // --- Step 3: Filter deliveries to only those with IDs in our table ---
        const filteredDeliveries = allDeliveries.filter(item => {
            // FIX 3: Safely access the nested ID location: item.delivery.id
            const rawApiId = item.delivery ? item.delivery.id : undefined;

            if (rawApiId === undefined) {
                return false; 
            }
            
            // Normalize the API ID and convert to Number for comparison
            const apiIdString = String(rawApiId);
            const cleanedApiIdText = apiIdString.replace(/\D/g, '');
            
            return deliveryIds.has(Number(cleanedApiIdText));
        });
        
        console.log(`Filtered to ${filteredDeliveries.length} matching deliveries`);
        
        // Step 4: Transform data to required format and categorize by location
        const categorized = {
            'ky': [],
            'mcm': [],
            'other': []
        };
        
        filteredDeliveries.forEach(item => {
            // The item object contains the nested 'delivery' field, 
            // so we access properties from 'item.delivery'
            const delivery = item.delivery || {};

            const transformedDelivery = {
                // Use the ID from the nested delivery object
                id: delivery.id, 
                orderId: delivery.orderId,
                location: delivery.location || '',
                address: delivery.address || '',
                // Note: assuming city/state/zip are also nested in 'delivery'
                city1: delivery.city1 || delivery.cityI || '', 
                state1: delivery.state1 || delivery.stateI || '',
                zip1: delivery.zip1 || delivery.zipI || '',
                customer: item.customers || '', // Assuming customer is flat on the top level 'item'
                sortOrder: null
            };
            
            // Categorize by location
            const location = (transformedDelivery.location || '').toLowerCase();
            if (location === 'ky') {
                categorized.ky.push(transformedDelivery);
            } else if (location === 'mcm') {
                categorized.mcm.push(transformedDelivery);
            } else {
                categorized.other.push(transformedDelivery);
            }
        });
        
        console.log('Categorized deliveries:', {
            ky: categorized.ky.length,
            mcm: categorized.mcm.length,
            other: categorized.other.length
        });
        
        return categorized;
        
    } catch (error) {
        console.error('Error in extractDeliveryData:', error);
        throw error;
    }
}