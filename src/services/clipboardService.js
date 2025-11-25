// ============================================
// FILE: src/services/clipboardService.js
// ============================================
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const formatRouteForClipboard = (deliveries) => {
  return deliveries
    .map(d => `${d.id}: ${d.address}`)
    .join('\n');
};