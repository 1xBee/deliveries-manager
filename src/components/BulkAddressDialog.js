// ============================================
// FILE: src/components/BulkAddressDialog.js
// Separated dialog for bulk address updates
// ============================================
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

function BulkAddressDialog({ open, onClose, selectedCount, onUpdate }) {
  const [newAddress, setNewAddress] = useState('');

  const handleUpdate = () => {
    if (newAddress.trim()) {
      onUpdate(newAddress);
      setNewAddress('');
      onClose();
    }
  };

  const handleClose = () => {
    setNewAddress('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleUpdate} variant="contained" disabled={!newAddress.trim()}>
          Update {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BulkAddressDialog;