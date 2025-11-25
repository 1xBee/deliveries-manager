import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import Editor from 'react-simple-code-editor';

const highlightCode = (text) => {
  if (!text) return text;

  return text
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\d+)(:\s*)(.*)$/);
      if (match) {
        const [, id, separator, address] = match;
        return `<span style="color:#0066cc;font-weight:bold">${id}</span><span style="color:#666">${separator}</span><span style="color:#333">${address}</span>`;
      }
      return `<span style="color:#999">${line || ' '}</span>`;
    })
    .join('\n');
};

const editorStyles = {
  width: '100%',
  minHeight: '300px',
  fontFamily: 'Consolas, "Courier New", monospace',
  fontSize: '14px',
  lineHeight: '1.5',
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  resize: 'vertical',
  overflow: 'auto',
  background: '#fff',
  boxSizing: 'border-box',
};


function SyntaxHighlightedTextField({ value, onChange, error }) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Paste the optimized route from your external tool. Each line should be in the format:
        <code style={{ display: 'block', margin: '8px 0', padding: '4px', background: '#f5f5f5' }}>
          id: address
        </code>
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ ...editorStyles, resize: 'vertical' }}>
        <Editor
          value={value}
          onValueChange={onChange} // The library uses onValueChange, we just pass our onChange prop
          highlight={highlightCode}
          placeholder="1: 123 Main St, City, CA 12345&#10;3: 456 Oak Ave, City, CA 12345&#10;2: 789 Pine St, City, CA 12345"
          padding={12}
          style={{
            ...editorStyles,
            border: 'none', // The Box wrapper handles the border
            padding: 0, // The Box wrapper handles the padding
            minHeight: '276px', // Adjust for padding
            resize: 'none',
            overflow: 'visible',
          }}
          // This makes it work like a real textarea
          textareaId="code-editor"
        />
      </Box>
    </>
  );
}

export default SyntaxHighlightedTextField;