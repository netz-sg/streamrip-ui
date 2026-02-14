type MessageHandler = (data: Record<string, unknown>) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  setUrl(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(data));
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

// Default URL for dev mode (Vite proxy); overridden in production via initWebSocket()
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const defaultUrl = window.location.protocol === 'file:'
  ? 'ws://127.0.0.1:18723/ws'
  : `${wsProtocol}//${window.location.host}/ws`;

export const wsManager = new WebSocketManager(defaultUrl);

// Called from main.tsx after resolving the backend port
export async function initWebSocket(): Promise<void> {
  const isElectron = !!(window as any).electron;
  if (isElectron && window.location.protocol === 'file:') {
    try {
      const port = await (window as any).electron.getBackendPort();
      wsManager.setUrl(`ws://127.0.0.1:${port}/ws`);
    } catch {
      // keep default
    }
  }
}
