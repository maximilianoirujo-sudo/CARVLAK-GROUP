import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { PublicBudgetBuilder } from './modules/detailing/components/public/PublicBudgetBuilder';
import { InspectionPublicReportPage } from './modules/inspecciones/components/InspectionPublicReportPage';
import { DealershipPublicCatalogPage } from './modules/automotora/components/DealershipPublicCatalogPage';
import { DetailingPublicReceiptPage } from './modules/detailing/components/receipts/DetailingPublicReceiptPage';

export const App: React.FC = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

  const isPublicBudget =
    pathname === '/presupuesto' ||
    pathname.startsWith('/presupuesto') ||
    search.includes('public=presupuesto') ||
    search.includes('tab=presupuesto') ||
    search.includes('public=detailing') ||
    search.includes('public=');

  const isPublicCatalog = search.includes('catalogo=autos') || search.includes('catalogo=true') || search.includes('catalogo=');
  const publicReportToken = search.includes('informe=') ? new URLSearchParams(search).get('informe') : null;
  const publicReceiptToken = search.includes('comprobante=') ? new URLSearchParams(search).get('comprobante') : null;

  // Metadatos dinámicos exclusivos para /presupuesto (DetailVlak) sin tocar el resto del hub
  React.useEffect(() => {
    if (isPublicBudget) {
      document.title = 'DetailVlak | Armá tu presupuesto';
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) favicon.href = '/detailvlak-favicon.png';
      const manifest = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifest) manifest.href = '/manifest-detailvlak.json';
    } else {
      document.title = 'CARVLAK Group | Hub Operativo';
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) favicon.href = '/favicon.ico';
      const manifest = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifest) manifest.href = '/manifest.json';
    }
  }, [isPublicBudget]);

  return (
    <ToastProvider>
      {publicReceiptToken ? (
        <DetailingPublicReceiptPage token={publicReceiptToken} />
      ) : publicReportToken ? (
        <InspectionPublicReportPage token={publicReportToken} />
      ) : isPublicBudget ? (
        <PublicBudgetBuilder
          onBackToApp={() => {
            window.location.href = '/?tab=mod-detailing';
          }}
        />
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
