// ============================================

// FILE: src/components/RouteOptimizerDialog.js

// ============================================

import React from 'react';

import {

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  Button

} from '@mui/material';

import SyntaxHighlightedTextField from './SyntaxHighlightedTextField';

import RouteMatchStats from './RouteMatchStats';

import { useRouteValidation } from '../hooks/useRouteValidation';

import { TABS } from '../constants/tabs';



function RouteOptimizerDialog({ open, onClose, currentTabId, routeText, onRouteTextChange, onApply, currentDeliveries }) {

  const { error, stats, validateAndApply } = useRouteValidation(routeText, currentDeliveries);



  const handleApply = () => {

    const success = validateAndApply(onApply);

    if (success) {

      onClose();

    }

  };



  const tabLabel = TABS.find(t => t.id === currentTabId)?.label || '';



  return (

    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>

      <DialogTitle>Apply Optimized Route - {tabLabel}</DialogTitle>

      <DialogContent>

        <SyntaxHighlightedTextField

          value={routeText}

          onChange={onRouteTextChange}

          error={error}

        />

        

        {stats && <RouteMatchStats stats={stats} />}

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>Cancel</Button>

        <Button onClick={handleApply} variant="contained" disabled={!routeText.trim()}>

          Apply Sort Order

        </Button>

      </DialogActions>

    </Dialog>

  );

}



export default RouteOptimizerDialog;