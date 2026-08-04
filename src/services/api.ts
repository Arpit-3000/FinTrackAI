import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils';
import type { ApiResponse, ApiError } from '../types';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    console.log('🔧 ApiService initializing with baseURL:', API_BASE_URL);
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Log axios config
    console.log('📡 Axios instance created:', {
      baseURL: this.client.defaults.baseURL,
      timeout: this.client.defaults.timeout,
      headers: this.client.defaults.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log outgoing request
        console.log('📤 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          hasToken: !!token,
        });
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', {
          url: response.config.url,
          status: response.status,
          statusText: response.statusText,
        });
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        // Enhanced error logging
        console.error('❌ API Error Details:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
        });

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle network errors (no response from server)
        if (!error.response) {
          const networkError = {
            success: false,
            message: this.getNetworkErrorMessage(error),
            errorCode: error.code,
            errorType: 'NETWORK_ERROR',
          };
          
          console.error('🚨 Network Error:', networkError);
          return Promise.reject(networkError);
        }

        // Handle 401 Unauthorized
        if (error.response.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // TODO: Implement refresh token endpoint
            // const { data } = await this.client.post('/auth/refresh', { refreshToken });
            // await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

            this.isRefreshing = false;
            this.processQueue(null);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            await this.clearAuthData();
            return Promise.reject(refreshError);
          }
        }

        // Return formatted error
        const formattedError = {
          success: false,
          message: error.response.data?.message || 'An error occurred',
          errors: error.response.data?.errors,
          status: error.response.status,
        };
        
        console.error('⚠️ API Error Response:', formattedError);
        return Promise.reject(formattedError);
      }
    );
  }

  private getNetworkErrorMessage(error: AxiosError): string {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your internet connection.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Unable to reach server. Please check:\n1. Your internet connection\n2. Server is running\n3. API URL is correct';
    }
    if (error.code === 'ENOTFOUND') {
      return 'Server not found. Please check the API URL.';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. Server may be down.';
    }
    return `Network error: ${error.message}. Please check your internet connection and try again.`;
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  private async clearAuthData() {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Get axios instance for direct access if needed
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const api = new ApiService();
