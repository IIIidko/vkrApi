export interface ChatRequestBody {
  model: string;
  stream: boolean;
  prompt: string;
}

export interface ChatLastResponse {
  model: string;
  created_at: string; // ISO дата-время
  response: string;
  done: boolean;
  done_reason: string;
  context: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

export interface ChatChunkResponse {
  created_at: string; // ISO дата-время
  response: string;
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

export interface MessagePairs {
  requestMessage: string;
  answer: string;
}
