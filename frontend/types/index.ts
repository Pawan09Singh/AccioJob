// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  lastLogin: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Session types
export interface ChatMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ComponentCode {
  jsx: string;
  css: string;
  tsx: string;
  version: number;
  lastModified: string;
}

export interface UIState {
  selectedElement: string | null;
  properties: Record<string, any>;
  viewport: {
    width: number;
    height: number;
  };
  theme: 'light' | 'dark';
}

export interface Session {
  _id: string;
  userId: string;
  title: string;
  description: string;
  chatHistory: ChatMessage[];
  componentCode: ComponentCode;
  uiState: UIState;
  isActive: boolean;
  lastAccessed: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// AI Response types
export interface AIComponentResponse {
  jsx: string;
  css: string;
  tsx: string;
  explanation: string;
}

export interface AIVariationResponse {
  variations: Array<{
    name: string;
    jsx: string;
    css: string;
    description: string;
  }>;
}

export interface AIAnalysisResponse {
  analysis: {
    codeQuality: string;
    performance: string;
    accessibility: string;
    security: string;
    optimizations: string[];
    issues: string[];
    overallScore: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
}

export interface PaginatedResponse<T> {
  sessions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Component Editor types
export interface CodeEditorState {
  jsx: string;
  css: string;
  tsx: string;
  activeTab: 'jsx' | 'css' | 'tsx';
}

export interface ComponentPreviewState {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
}

// Chat types
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// Property Editor types
export interface PropertyEditorState {
  selectedElement: string | null;
  properties: Record<string, any>;
  isVisible: boolean;
}

export interface PropertyControl {
  type: 'text' | 'number' | 'color' | 'select' | 'slider' | 'boolean';
  label: string;
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
}

// Export types
export interface ExportOptions {
  format: 'zip' | 'jsx' | 'tsx' | 'css';
  includeDependencies: boolean;
  includeReadme: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto';

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    message?: string;
  };
  options?: Array<{ label: string; value: any }>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// File types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

// Search and filter types
export interface SearchFilters {
  query: string;
  tags: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'lastAccessed';
  sortOrder: 'asc' | 'desc';
}

// Settings types
export interface UserSettings {
  theme: Theme;
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  codeEditor: {
    fontSize: number;
    theme: string;
    tabSize: number;
    wordWrap: boolean;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
} 