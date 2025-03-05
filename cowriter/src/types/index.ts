export interface HistoryItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  lastModified: number;
  document_type: DocumentType;
}

export type Tab = 'write' | 'configure';

export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ActionButton {
  id: string;
  name: string;
  action: string;
  emoji: string;
}

export interface EvalItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  score?: number;
  result?: string;
}

export interface LLMConfig {
  type: 'openai' | 'llama' | null;
  apiKey?: string;
  host?: string;
  port?: string;
}

export type DocumentType =
  | 'Custom'
  | 'Blog'
  | 'Essay'
  | 'LinkedIn'
  | 'X'
  | 'Threads'
  | 'Reddit'
  | 'Email'
  | 'Newsletter';
