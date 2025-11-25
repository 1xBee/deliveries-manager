// ============================================
// FILE: src/services/routeParserService.js
// ============================================
export const parseOptimizedRoute = (text) => {
  const lines = text.split('\n');
  const sortOrders = {};
  let order = 1;

  lines.forEach(line => {
    const match = line.match(/^\[(\d+)\]:/);
    if (match) {
      const id = parseInt(match[1], 10);
      sortOrders[id] = order;
      order++;
    }
  });

  return sortOrders;
};

export const applySortOrder = (deliveries, sortOrders) => {
  return deliveries.map(d => ({
    ...d,
    sortOrder: sortOrders[d.id] || null
  }));
};