// ============================================
// FILE: src/components/PrintDialog.js
// Dialog for printing deliveries with options
// ============================================
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Stack,
  Box
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { openPrintWindow, sortDeliveriesForPrint } from '../services/printService';

function PrintDialog({ open, onClose, currentTabId, currentDeliveries, selectedIds }) {
  const handlePrintAll = () => {
    const sorted = sortDeliveriesForPrint(currentDeliveries);
    const ids = sorted.map(d => d.id);
    const success = openPrintWindow(ids, currentTabId);
    if (success) {
      onClose();
    }
  };

  const handlePrintSelected = () => {
    const selectedDeliveries = currentDeliveries.filter(d => selectedIds.includes(d.id));
    const sorted = sortDeliveriesForPrint(selectedDeliveries);
    const ids = sorted.map(d => d.id);
    const success = openPrintWindow(ids, currentTabId);
    if (success) {
      onClose();
    }
  };

  const hasSelected = selectedIds.length > 0;
  const totalCount = currentDeliveries.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Print Delivery Invoices
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            This will open a new window with all invoice pages ready for printing.
            The window will automatically trigger the print dialog.
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available Options:
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PrintIcon />}
                onClick={handlePrintAll}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                <Box sx={{ textAlign: 'left', flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Print All Deliveries
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalCount} invoice{totalCount !== 1 ? 's' : ''} in {currentTabId.toUpperCase()} tab
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<PrintIcon />}
                onClick={handlePrintSelected}
                disabled={!hasSelected}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 2 }}
              >
                <Box sx={{ textAlign: 'left', flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Print Selected Only
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hasSelected ? `${selectedIds.length} selected` : 'No deliveries selected'}
                  </Typography>
                </Box>
              </Button>
            </Stack>
          </Box>

          {currentDeliveries.some(d => d.sortOrder != null) && (
            <Alert severity="success" icon={false}>
              <Typography variant="body2">
                ✓ Deliveries will be printed in sorted order
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PrintDialog;