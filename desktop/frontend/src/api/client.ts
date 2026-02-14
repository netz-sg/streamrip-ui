import axios from 'axios';
import type {
  MetadataResponse,
  UrlParseResponse,
  DownloadStatus,
  SearchResponse,
  AppConfig,
  BulkMetadataResponse,
  DownloadHistoryResponse,
  WishlistItem,
  WishlistResponse,
} from './types';

// In production (file://), we need the absolute backend URL.
// In dev mode, Vite proxy handles /api → localhost:18723.
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Resolve backend URL at runtime (called once from main.tsx)
let _initialized = false;
export async function initApiClient(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const isElectron = !!(window as any).electron;
  if (isElectron && window.location.protocol === 'file:') {
    try {
      const port = await (window as any).electron.getBackendPort();
      api.defaults.baseURL = `http://127.0.0.1:${port}/api`;
    } catch {
      // fallback
      api.defaults.baseURL = 'http://127.0.0.1:18723/api';
    }
  }
}

export async function parseUrl(url: string): Promise<UrlParseResponse> {
  const { data } = await api.post('/url/parse', { url });
  return data;
}

export async function fetchMetadata(url: string): Promise<MetadataResponse> {
  const { data } = await api.post('/url/metadata', { url });
  return data;
}

export async function startDownload(url: string): Promise<{ id: string; status: string }> {
  const { data } = await api.post('/download/start', { url });
  return data;
}

export async function getDownloadQueue(): Promise<{ downloads: DownloadStatus[] }> {
  const { data } = await api.get('/download/queue');
  return data;
}

export async function cancelDownload(id: string): Promise<void> {
  await api.delete(`/download/${id}`);
}

export async function search(
  source: string,
  mediaType: string,
  query: string,
  limit = 20,
): Promise<SearchResponse> {
  const { data } = await api.post('/search', {
    source,
    media_type: mediaType,
    query,
    limit,
  });
  return data;
}

export async function getConfig(): Promise<AppConfig> {
  const { data } = await api.get('/config');
  return data;
}

export async function updateConfig(config: Partial<AppConfig>): Promise<void> {
  await api.put('/config', config);
}

export async function getAuthStatus(): Promise<Record<string, boolean>> {
  const { data } = await api.get('/config/auth/status');
  return data;
}

export async function fetchBulkMetadata(urls: string[]): Promise<BulkMetadataResponse> {
  const { data } = await api.post('/url/bulk-metadata', { urls }, { timeout: 120000 });
  return data;
}

// ── History ───────────────────────────────────────────────────────────

export async function getDownloadHistory(
  limit = 500,
  offset = 0,
): Promise<DownloadHistoryResponse> {
  const { data } = await api.get('/download/history', { params: { limit, offset } });
  return data;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await api.delete(`/download/history/${id}`);
}

export async function clearDownloadHistory(): Promise<void> {
  await api.delete('/download/history');
}

// ── Wishlist ──────────────────────────────────────────────────────────

export async function getWishlist(
  limit = 500,
  offset = 0,
): Promise<WishlistResponse> {
  const { data } = await api.get('/wishlist', { params: { limit, offset } });
  return data;
}

export async function addToWishlist(item: {
  url: string;
  title?: string;
  artist?: string;
  cover_url?: string | null;
  source?: string;
  media_type?: string;
  year?: string | null;
}): Promise<WishlistItem> {
  const { data } = await api.post('/wishlist', item);
  return data;
}

export async function removeFromWishlist(id: string): Promise<void> {
  await api.delete(`/wishlist/${id}`);
}

export async function clearWishlist(): Promise<void> {
  await api.delete('/wishlist');
}

// ── Health Check ──────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const baseUrl = api.defaults.baseURL as string;
    // Health endpoint is at the root, not under /api
    const healthUrl = baseUrl.replace(/\/api$/, '/health');
    const { data } = await axios.get(healthUrl, { timeout: 3000 });
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
