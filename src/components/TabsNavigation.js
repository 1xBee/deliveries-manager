// ============================================
// FILE: src/components/TabsNavigation.js
// ============================================
import React from 'react';
import { Paper, Tabs, Tab, Box, Chip } from '@mui/material';
import { TABS } from '../constants/tabs';

function TabsNavigation({ currentTab, onTabChange, deliveries }) {
  return (
    <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        variant="fullWidth"
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.label}
                <Chip
                  label={deliveries[tab.id].length}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
    </Paper>
  );
}

export default TabsNavigation;