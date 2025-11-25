// ============================================
// FILE: src/components/Header.js
// ============================================
import React, { useState } from 'react';
import { Toolbar, Typography, Button, Paper, Stack, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RouteIcon from '@mui/icons-material/Route';

function Header({ onAdd, onCopyRoute, onOpenRouteOptimizer }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleCopyRoute = async () => {
    const success = await onCopyRoute();
    if (success) {
      setSnackbar({ open: true, message: 'Route copied to clipboard!' });
    } else {
      setSnackbar({ open: true, message: 'Failed to copy route' });
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ borderRadius: 0 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Delivery Route Manager
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyRoute}
              size="small"
            >
              Copy Route
            </Button>
            <Button
              variant="outlined"
              startIcon={<RouteIcon />}
              onClick={onOpenRouteOptimizer}
              size="small"
            >
              Apply Optimized Route
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
              size="small"
            >
              Add Delivery
            </Button>
          </Stack>
        </Toolbar>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Header;