// ============================================
// FILE: src/components/RouteOptimizerDialog.js
// ============================================
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';

function RouteOptimizerDialog({ open, onClose, onApply }) {
  const [optimizedRoute, setOptimizedRoute] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    if (!optimizedRoute.trim()) {
      setError('Please paste the optimized route data');
      return;
    }

    const lines = optimizedRoute.split('\n');
    const validLines = lines.filter(line => /^\[\d+\]:/.test(line));

    if (validLines.length === 0) {
      setError('No valid route entries found. Format should be: [id]: address');
      return;
    }

    onApply(optimizedRoute);
    setOptimizedRoute('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setOptimizedRoute('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Apply Optimized Route</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Paste the optimized route from your external tool. Each line should be in the format:
          <code style={{ display: 'block', margin: '8px 0', padding: '4px', background: '#f5f5f5' }}>
            [id]: address
          </code>
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={12}
          variant="outlined"
          placeholder="[1]: 123 Main St, City, CA 12345&#10;[3]: 456 Oak Ave, City, CA 12345&#10;[2]: 789 Pine St, City, CA 12345"
          value={optimizedRoute}
          onChange={(e) => {
            setOptimizedRoute(e.target.value);
            setError('');
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained">
          Apply Sort Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RouteOptimizerDialog;