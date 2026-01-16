
export interface DocumentItem {
  id: string;
  name: string;
  content: string; // Base64 for images, text for others
  type: 'text' | 'json' | 'markdown' | 'image';
  mimeType?: string;
  timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

export type ModelType = 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
