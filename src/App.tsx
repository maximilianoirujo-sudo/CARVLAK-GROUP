import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <AppLayout />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
