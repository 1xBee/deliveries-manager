// ============================================
// FILE: src/components/BulkActionsBar.js
// Simplified component with extracted dialog
// ============================================
import React, { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';
import { TABS } from '../constants/tabs';
import BulkAddressDialog from './BulkAddressDialog';

function BulkActionsBar({ selectedCount, selectedIds, currentTabId, onDelete, onMove, onBulkUpdateAddress }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const otherTabs = TABS.filter(tab => tab.id !== currentTabId);
  const isEnabled = selectedCount > 0;

  const handleBulkUpdate = (newAddress) => {
    onBulkUpdateAddress(newAddress, selectedIds);
  };

  return (
    <>
      <Alert
        severity="info"
        sx={{ mb: 2, backgroundColor: '#fff' }}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              color="inherit"
              startIcon={<EditIcon />}
              onClick={() => setDialogOpen(true)}
              disabled={!isEnabled}
            >
              Change Address
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(selectedIds)}
              disabled={!isEnabled}
            >
              Delete ({selectedCount})
            </Button>
            {otherTabs.map(tab => (
              <Button
                key={tab.id}
                size="small"
                color="inherit"
                startIcon={<SwapHorizIcon />}
                onClick={() => onMove(tab.id, selectedIds)}
                disabled={!isEnabled}
              >
                Move to {tab.label}
              </Button>
            ))}
          </Stack>
        }
      >
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </Alert>

      <BulkAddressDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedCount={selectedCount}
        onUpdate={handleBulkUpdate}
      />
    </>
  );
}

export default BulkActionsBar;