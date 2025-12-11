// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { VmListView } from './views/VmListView';
import { AppLayout } from './layout/AppLayout';

export default function App() {
  return (
    <>
      <CssBaseline />
      <AppLayout>
        <Routes>
          <Route path="/" element={<VmListView />} />
        </Routes>
      </AppLayout>
    </>
  );
}
