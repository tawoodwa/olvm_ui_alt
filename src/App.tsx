import { Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { VmListView } from './views/VmListView';

export default function App() {
  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        {/* Placeholder for future sidebar */}
        <Box
          component="nav"
          sx={{
            width: 0,
            borderRight: 'none',
          }}
        />

        {/* Main content area */}
        <Box component="main" sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<VmListView />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
}
