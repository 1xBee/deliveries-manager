// ============================================
// FILE: src/components/AddDeliveryDialog.js
// ============================================
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack
} from '@mui/material';

function AddDeliveryDialog({ open, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    id: '',
    customer: '',
    address: ''
  });

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = () => {
    if (formData.id && formData.customer && formData.address) {
      onAdd({
        id: parseInt(formData.id, 10),
        customer: formData.customer,
        address: formData.address,
        sortOrder: null
      });
      setFormData({ id: '', customer: '', address: '' });
      onClose();
    }
  };

  const isValid = formData.id && formData.customer && formData.address;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Delivery</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="ID"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.id}
            onChange={handleChange('id')}
            autoFocus
          />
          <TextField
            label="Customer Name"
            fullWidth
            variant="outlined"
            value={formData.customer}
            onChange={handleChange('customer')}
          />
          <TextField
            label="Address"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleChange('address')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          Add Delivery
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddDeliveryDialog;