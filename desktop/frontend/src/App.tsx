import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import DownloadsPage from './pages/DownloadsPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import WishlistPage from './pages/WishlistPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        offset={16}
        toastOptions={{
          style: {
            background: '#141422',
            border: '1px solid #2a2a3d',
            color: '#f1f5f9',
            fontSize: '13px',
            fontFamily: '"DM Sans", sans-serif',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
        theme="dark"
      />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
