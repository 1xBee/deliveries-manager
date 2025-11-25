// ============================================
// FILE: src/components/BulkActionsBar.js
// ============================================
import React, { useState } from 'react';
import { Alert, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';
import { TABS } from '../constants/tabs';

function BulkActionsBar({ selectedCount, selectedIds, currentTabId, onDelete, onMove, onBulkUpdateAddress }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const otherTabs = TABS.filter(tab => tab.id !== currentTabId);

  const handleBulkUpdate = () => {
    if (newAddress.trim()) {
      onBulkUpdateAddress(newAddress);
      setNewAddress('');
      setDialogOpen(false);
    }
  };

  if (selectedCount === 0) {
    return (
      <Box sx={{ height: 56, mb: 2 }} />
    );
  }

  return (
    <>
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              color="inherit"
              startIcon={<EditIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Change Address
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              Delete ({selectedCount})
            </Button>
            {otherTabs.map(tab => (
              <Button
                key={tab.id}
                size="small"
                color="inherit"
                startIcon={<SwapHorizIcon />}
                onClick={() => onMove(tab.id)}
              >
                Move to {tab.label}
              </Button>
            ))}
          </Stack>
        }
      >
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </Alert>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Address for Selected Items</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Address"
            type="text"
            fullWidth
            variant="outlined"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Enter new address for all selected deliveries"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkUpdate} variant="contained" disabled={!newAddress.trim()}>
            Update {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BulkActionsBar;