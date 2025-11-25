// ============================================
// FILE: src/components/RouteMatchStats.js
// ============================================
import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

function RouteMatchStats({ stats }) {
  if (!stats || stats.totalInList === 0) {
    return null;
  }

  const hasUnmatched = stats.unmatchedCount > 0;

  return (
    <Alert 
      severity={hasUnmatched ? "warning" : "success"} 
      icon={hasUnmatched ? <WarningIcon /> : <CheckCircleIcon />}
      sx={{ mt: 2 }}
    >
      <Box>
        <Typography variant="body2" fontWeight="bold">
          Route Analysis
        </Typography>
        <Typography variant="body2">
          • Total entries in list: {stats.totalInList}
        </Typography>
        <Typography variant="body2">
          • Matched deliveries: {stats.matchedCount}
        </Typography>
        {hasUnmatched && (
          <Typography variant="body2" color="warning.dark">
            • Unmatched entries: {stats.unmatchedCount} (IDs not found in current tab)
          </Typography>
        )}
      </Box>
    </Alert>
  );
}

export default RouteMatchStats;