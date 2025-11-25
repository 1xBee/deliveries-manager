// ============================================
// FILE: src/hooks/useRouteValidation.js
// ============================================
import { useState, useEffect } from 'react';
import { parseOptimizedRoute, calculateMatchStats } from '../services/routeParserService';

export function useRouteValidation(routeText, currentDeliveries) {
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!routeText.trim()) {
      setError('');
      setStats(null);
      return;
    }

    const lines = routeText.split('\n');
    const validLines = lines.filter(line => /^\d+:/.test(line));

    if (validLines.length === 0) {
      setError('No valid route entries found. Format should be: id: address');
      setStats(null);
      return;
    }

    setError('');
    
    const sortOrders = parseOptimizedRoute(routeText);
    const calculatedStats = calculateMatchStats(currentDeliveries, sortOrders);
    setStats(calculatedStats);
  }, [routeText, currentDeliveries]);

  const validateAndApply = (onApply) => {
    if (!routeText.trim()) {
      setError('Please paste the optimized route data');
      return false;
    }

    const lines = routeText.split('\n');
    const validLines = lines.filter(line => /^\d+:/.test(line));

    if (validLines.length === 0) {
      setError('No valid route entries found. Format should be: id: address');
      return false;
    }

    onApply(routeText);
    return true;
  };

  return {
    error,
    stats,
    validateAndApply
  };
}