// ============================================
// FILE: src/App.js
// Added print dialog integration
// ============================================
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './components/Header';
import TabsNavigation from './components/TabsNavigation';
import BulkActionsBar from './components/BulkActionsBar';
import DeliveryDataGrid from './components/DeliveryDataGrid';
import AddDeliveryDialog from './components/AddDeliveryDialog';
import RouteOptimizerDialog from './components/RouteOptimizerDialog';
import PrintDialog from './components/PrintDialog';
import { useDeliveryData } from './hooks/useDeliveryData';
import { TABS } from './constants/tabs';
import { copyToClipboard, formatRouteForClipboard } from './services/clipboardService';
import { useRouteOptimizer } from './hooks/useRouteOptimizer';

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [routeOptimizerOpen, setRouteOptimizerOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  
  const {
    deliveries,
    selectedIds,
    setSelectedIds,
    handleDelete,
    handleMove,
    handleAddCustom,
    handleBulkUpdateAddress,
    handleUpdateRow,
    handleApplySortOrder,
    setActiveTab
  } = useDeliveryData();

  const {
    routeTexts,
    updateRouteText,
    applyOptimizedRoute
  } = useRouteOptimizer(deliveries, handleApplySortOrder);

  const currentTabId = TABS[currentTab].id;
  const currentTabData = deliveries[currentTabId] || [];
  const currentSelected = selectedIds[currentTabId] || [];

  const handleTabChange = (newTabIndex) => {
    setCurrentTab(newTabIndex);
    const newTabId = TABS[newTabIndex].id;
    setActiveTab(newTabId);
  };

  const handleCopyRoute = async () => {
    const formatted = formatRouteForClipboard(currentTabData);
    return await copyToClipboard(formatted);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
      <Header 
        onAdd={() => setAddDialogOpen(true)}
        onCopyRoute={handleCopyRoute}
        onOpenRouteOptimizer={() => setRouteOptimizerOpen(true)}
        onOpenPrint={() => setPrintDialogOpen(true)}
      />
      
      <TabsNavigation
        currentTab={currentTab}
        onTabChange={handleTabChange}
        deliveries={deliveries}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, minHeight: 0 }}>
        <BulkActionsBar
          selectedCount={currentSelected.length}
          selectedIds={currentSelected}
          currentTabId={currentTabId}
          onDelete={() => handleDelete(currentSelected, currentTabId)}
          onMove={(targetTabId) => handleMove(currentSelected, currentTabId, targetTabId)}
          onBulkUpdateAddress={(newAddress) => handleBulkUpdateAddress(currentSelected, currentTabId, newAddress)}
        />

        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <DeliveryDataGrid
            rows={currentTabData}
            selectedIds={currentSelected}
            onSelectionChange={(newSelection) => {
              setSelectedIds(prev => ({
                ...prev,
                [currentTabId]: newSelection
              }));
            }}
            onDelete={(id) => handleDelete([id], currentTabId)}
            onMove={(id, targetTabId) => handleMove([id], currentTabId, targetTabId)}
            onUpdateRow={(id, field, value) => handleUpdateRow(id, currentTabId, field, value)}
            currentTabId={currentTabId}
          />
        </Box>
      </Box>

      <AddDeliveryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={(delivery) => handleAddCustom(currentTabId, delivery)}
      />

      <RouteOptimizerDialog
        open={routeOptimizerOpen}
        onClose={() => setRouteOptimizerOpen(false)}
        currentTabId={currentTabId}
        routeText={routeTexts[currentTabId]}
        onRouteTextChange={(text) => updateRouteText(currentTabId, text)}
        onApply={(text) => applyOptimizedRoute(currentTabId, text)}
        currentDeliveries={currentTabData}
      />

      <PrintDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        currentTabId={currentTabId}
        currentDeliveries={currentTabData}
        selectedIds={currentSelected}
      />
    </Box>
  );
}

export default App;