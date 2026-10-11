import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { PublicQuoteRequestPage } from './components/public/PublicQuoteRequestPage';
import { InspectionPublicReportPage } from './modules/inspecciones/components/InspectionPublicReportPage';
import { DealershipPublicCatalogPage } from './modules/automotora/components/DealershipPublicCatalogPage';

export const App: React.FC = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const isPublicForm = search.includes('public=presupuesto') || search.includes('public=detailing') || search.includes('public=');
  const isPublicCatalog = search.includes('catalogo=autos') || search.includes('catalogo=true') || search.includes('catalogo=');
  const publicReportToken = search.includes('informe=') ? new URLSearchParams(search).get('informe') : null;

  return (
    <ToastProvider>
      {publicReportToken ? (
        <InspectionPublicReportPage token={publicReportToken} />
      ) : isPublicForm ? (
        <PublicQuoteRequestPage onBackToApp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('public');
          window.location.href = url.pathname + (url.search || '');
        }} />
      ) : isPublicCatalog ? (
        <DealershipPublicCatalogPage onBackToApp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('catalogo');
          window.location.href = url.pathname + (url.search || '');
        }} />
      ) : (
        <AuthProvider>
          <DataProvider>
            <AppLayout />
          </DataProvider>
        </AuthProvider>
      )}
    </ToastProvider>
  );
};

export default App;
