// ============================================
// FILE: src/hooks/useDeliveryData.js
// Main hook that combines state, actions, and extension sync
// UPDATED: Passes setDeliveriesFromExtension to sync hook
// ============================================
import { useDeliveryState } from './useDeliveryState';
import { useDeliveryActions } from './useDeliveryActions';
import { useExtensionSync } from './useExtensionSync';

export function useDeliveryData() {
  // State management with extension storage
  const {
    deliveries,
    setDeliveries,
    setDeliveriesFromExtension, // 🔒 Loop-safe setter
    selectedIds,
    setSelectedIds,
    activeTab,
    setActiveTab,
    dataSource,
    setDataSource
  } = useDeliveryState();

  // CRUD operations
  const {
    handleDelete,
    handleMove,
    handleAddCustom,
    handleBulkUpdateAddress,
    handleUpdateRow,
    handleApplySortOrder
  } = useDeliveryActions(deliveries, setDeliveries, setSelectedIds);

  // Chrome extension synchronization - use the loop-safe setter
  useExtensionSync(setDeliveriesFromExtension, setDataSource, activeTab);

  return {
    deliveries,
    selectedIds,
    setSelectedIds,
    handleDelete,
    handleMove,
    handleAddCustom,
    handleBulkUpdateAddress,
    handleUpdateRow,
    handleApplySortOrder,
    activeTab,
    setActiveTab,
    dataSource
  };
}