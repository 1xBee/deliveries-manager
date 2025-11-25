// ============================================
// FILE: src/components/DeliveryDataGrid.js
// ============================================
import React from 'react';
import { Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ActionsColumn from './ActionsColumn';

function DeliveryDataGrid({ 
  rows, 
  selectedIds, 
  onSelectionChange, 
  onDelete, 
  onMove,
  onUpdateRow,
  currentTabId 
}) {
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70,
      editable: false,
      valueFormatter: (params) => params.value
    },
    { 
      field: 'customer', 
      headerName: 'Customer', 
      width: 200,
      flex: 1,
      editable: true
    },
    { 
      field: 'address', 
      headerName: 'Address', 
      width: 400,
      flex: 2,
      editable: true
    },
    {
      field: 'sortOrder',
      headerName: 'Sort Order',
      width: 100,
      type: 'number',
      editable: false,
      hide: true
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      editable: false,
      renderCell: (params) => (
        <ActionsColumn
          row={params.row}
          onDelete={onDelete}
          onMove={onMove}
          currentTabId={currentTabId}
        />
      )
    }
  ];

  const handleProcessRowUpdate = (newRow) => {
    onUpdateRow(newRow.id, 'customer', newRow.customer);
    onUpdateRow(newRow.id, 'address', newRow.address);
    return newRow;
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (a.sortOrder === null && b.sortOrder === null) return 0;
    if (a.sortOrder === null) return 1;
    if (b.sortOrder === null) return -1;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <Paper sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={sortedRows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={onSelectionChange}
        processRowUpdate={handleProcessRowUpdate}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          columns: {
            columnVisibilityModel: {
              sortOrder: false
            }
          }
        }}
        sx={{ border: 0 }}
      />
    </Paper>
  );
}

export default DeliveryDataGrid;