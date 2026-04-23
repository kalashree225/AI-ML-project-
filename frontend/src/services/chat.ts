import api from './api';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  paper_ids?: string[];
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  papers: Array<{ id: string; title: string }>;
  messages?: ChatMessage[];
  message_count?: number;
}

export interface SendMessageRequest {
  session_id?: string;
  paper_ids: string[];
  message: string;
}

export interface SendMessageResponse {
  session_id: string;
  message: ChatMessage;
}

export const chatService = {
  sendMessage: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
    const { data } = await api.post('/chat/', request);
    return data;
  },

  getChatSession: async (sessionId: string): Promise<ChatSession> => {
    const { data } = await api.get(`/chat/sessions/${sessionId}/`);
    return data;
  },

  listChatSessions: async (): Promise<ChatSession[]> => {
    const { data } = await api.get('/chat/sessions/');
    return data;
  },

  deleteChatSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}/`);
  },
};
