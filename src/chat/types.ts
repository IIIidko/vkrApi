export interface MessageInRequest {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: string;
}

type ResponseChat = MessageInRequest;

export interface ChatRequestBody {
  model: string;
  stream?: boolean;
  messages: MessageInRequest[];
  tools?: string;
  format?: string;
  options?: any;
  keep_alive?: string;
}

export interface ChatChunkResponse {
  created_at: string; // ISO дата-время
  message: ResponseChat;
  done: boolean;
  model: string;
}

export interface HistoryItem {
  id: string;
  historyName: string;
}

export interface MessageData {
  message: string;
  historyId?: string;
  contextId?: string;
}

export interface MessagePair {
  requestMessage: string;
  answer: string;
  pairId: string;
  historyId?: string;
}
