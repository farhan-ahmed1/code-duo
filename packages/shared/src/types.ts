// Core domain types for Code Duo

export type EditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'rust'
  | 'c'
  | 'cpp'
  | 'java'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type SyncStatus = 'synced' | 'syncing';

export interface Room {
  id: string;
  name: string;
  language: EditorLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface UserAwarenessState {
  user: User;
  cursorPosition?: {
    index: number;
    length: number;
  };
}

export interface CreateRoomRequest {
  name: string;
  language?: EditorLanguage;
}

export interface CreateRoomResponse extends Room {
  url: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  activeRooms: number;
  activeConnections: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
