const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws';

export interface WebSocketMessage {
  type: 'message' | 'error' | 'status' | 'complete' | 'stream' | 'stream_end';
  content?: string;
  role?: string;
  session_id?: string;
  error?: string;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(sessionId: string, onMessage: (msg: WebSocketMessage) => void, onError?: (error: Event) => void) {
    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}/`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      const token = localStorage.getItem('access_token');
      if (token) {
        this.ws?.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.ws = null;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(sessionId, onMessage, onError);
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  sendMessage(message: string, paperIds: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        query: message,
        paper_ids: paperIds,
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
