
export interface DocumentItem {
  id: string;
  name: string;
  content: string; // Base64 for images/pdfs, text for others
  type: 'text' | 'json' | 'markdown' | 'image' | 'pdf' | 'csv';
  mimeType?: string;
  timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatAttachment {
  type: 'image';
  mimeType: string;
  data: string; // Base64
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  attachments?: ChatAttachment[];
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

export type ModelType = 'gemini-3-pro-preview' | 'gemini-3-flash-preview';