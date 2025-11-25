// ============================================
// FILE: src/hooks/useRouteOptimizer.js
// ============================================
import { useState } from 'react';
import { parseOptimizedRoute } from '../services/routeParserService';

export function useRouteOptimizer(deliveries, handleApplySortOrder) {
  // Separate state for each tab
  const [routeTexts, setRouteTexts] = useState({
    'orange-county': '',
    'los-angeles': '',
    'other': ''
  });

  const updateRouteText = (tabId, text) => {
    setRouteTexts(prev => ({
      ...prev,
      [tabId]: text
    }));
  };

  const applyOptimizedRoute = (tabId, routeText) => {
    const sortOrders = parseOptimizedRoute(routeText);
    handleApplySortOrder(tabId, sortOrders);
  };

  return {
    routeTexts,
    updateRouteText,
    applyOptimizedRoute
  };
}