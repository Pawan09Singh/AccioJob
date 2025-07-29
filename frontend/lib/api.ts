import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Session, 
  ChatMessage, 
  ComponentCode, 
  UIState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AIComponentResponse,
  AIVariationResponse,
  AIAnalysisResponse,
  ApiResponse,
  PaginatedResponse
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      if (this.token) {
        this.setAuthToken(this.token);
      }
    }

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register', credentials);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.clearAuthToken();
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.client.get('/auth/profile');
    return response.data.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.client.put('/auth/profile', data);
    return response.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.put('/auth/change-password', { currentPassword, newPassword });
  }

  // Session endpoints
  async getSessions(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Session>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    
    const response: AxiosResponse<PaginatedResponse<Session>> = await this.client.get(`/sessions?${params}`);
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response: AxiosResponse<{ session: Session }> = await this.client.get(`/sessions/${sessionId}`);
    return response.data.session;
  }

  async createSession(data: { title: string; description?: string; tags?: string[] }): Promise<Session> {
    const response: AxiosResponse<{ session: Session }> = await this.client.post('/sessions', data);
    return response.data.session;
  }

  async updateSession(sessionId: string, data: { title?: string; description?: string; tags?: string[] }): Promise<Session> {
    const response: AxiosResponse<{ session: Session }> = await this.client.put(`/sessions/${sessionId}`, data);
    return response.data.session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/sessions/${sessionId}`);
  }

  async addChatMessage(sessionId: string, message: Omit<ChatMessage, '_id' | 'timestamp'>): Promise<void> {
    await this.client.post(`/sessions/${sessionId}/chat`, message);
  }

  async updateComponentCode(sessionId: string, code: { jsx?: string; css?: string; tsx?: string }): Promise<ComponentCode> {
    const response: AxiosResponse<{ componentCode: ComponentCode }> = await this.client.put(`/sessions/${sessionId}/code`, code);
    return response.data.componentCode;
  }

  async updateUIState(sessionId: string, uiState: Partial<UIState>): Promise<UIState> {
    const response: AxiosResponse<{ uiState: UIState }> = await this.client.put(`/sessions/${sessionId}/ui-state`, uiState);
    return response.data.uiState;
  }

  async getSessionStats(sessionId: string): Promise<any> {
    const response: AxiosResponse<{ stats: any }> = await this.client.get(`/sessions/${sessionId}/stats`);
    return response.data.stats;
  }

  // AI endpoints
  async generateComponent(data: {
    prompt: string;
    sessionId?: string;
    existingCode?: ComponentCode;
    chatHistory?: ChatMessage[];
  }): Promise<AIComponentResponse> {
    const response: AxiosResponse<ApiResponse<AIComponentResponse>> = await this.client.post('/ai/generate', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate component');
    }
    return response.data.data!;
  }

  async refineComponent(data: {
    prompt: string;
    currentCode: ComponentCode;
    sessionId?: string;
  }): Promise<AIComponentResponse> {
    const response: AxiosResponse<ApiResponse<AIComponentResponse>> = await this.client.post('/ai/refine', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refine component');
    }
    return response.data.data!;
  }

  async generateVariations(data: {
    baseCode: ComponentCode;
    count?: number;
  }): Promise<AIVariationResponse> {
    const response: AxiosResponse<ApiResponse<AIVariationResponse>> = await this.client.post('/ai/variations', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate variations');
    }
    return response.data.data!;
  }

  async analyzeComponent(data: { code: ComponentCode }): Promise<AIAnalysisResponse> {
    const response: AxiosResponse<ApiResponse<AIAnalysisResponse>> = await this.client.post('/ai/analyze', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to analyze component');
    }
    return response.data.data!;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response: AxiosResponse<{ status: string; timestamp: string }> = await this.client.get('/health');
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export default apiClient; 