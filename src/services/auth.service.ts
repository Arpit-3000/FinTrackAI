import { api } from './api';
import { storage } from '../utils/storage';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  OTPVerificationFormData,
  ResetPasswordFormData,
} from '../validations';
import type { User, LoginResponse, RegisterResponse, ApiResponse } from '../types';

class AuthService {
  // Register new user
  async register(userData: RegisterFormData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.REGISTER, {
      name: userData.fullName,
      email: userData.email,
      password: userData.password,
    });

    if (response.success && response.data) {
      await this.saveTokens(response.data.token, response.data.refreshToken);
      await this.saveUserData(response.data.user);
      return response.data;
    }

    throw new Error(response.message || 'Registration failed');
  }

  // Login user
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.success && response.data) {
      await this.saveTokens(response.data.token, response.data.refreshToken);
      await this.saveUserData(response.data.user);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  // Get current user
  async getMe(): Promise<User> {
    const response = await api.get<{ user: User }>(API_ENDPOINTS.ME);

    if (response.success && response.data) {
      await this.saveUserData(response.data.user);
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to get user data');
  }

  // Request password reset (send OTP)
  async forgotPassword(data: ForgotPasswordFormData): Promise<void> {
    const response = await api.post<{ otp?: string }>(API_ENDPOINTS.FORGOT_PASSWORD, {
      email: data.email,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to send OTP');
    }

    // In development, the OTP might be returned in response
    if (response.data?.otp) {
      console.log('Development OTP:', response.data.otp);
    }
  }

  // Verify OTP
  async verifyOTP(email: string, otp: string): Promise<void> {
    const response = await api.post(API_ENDPOINTS.VERIFY_OTP, {
      email,
      otp,
    });

    if (!response.success) {
      throw new Error(response.message || 'Invalid OTP');
    }
  }

  // Reset password
  async resetPassword(email: string, otp: string, password: string): Promise<void> {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, {
      email,
      otp,
      password,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  // Update user profile
  async updateProfile(data: { name?: string; phone?: string; avatar?: string }): Promise<User> {
    const response = await api.put<{ user: User }>(API_ENDPOINTS.UPDATE_PROFILE, data);

    if (response.success && response.data) {
      await this.saveUserData(response.data.user);
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to update profile');
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // Token management
  async saveTokens(token: string, refreshToken: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  async getToken(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async clearTokens(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // User data management
  async saveUserData(user: User): Promise<void> {
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<User | null> {
    const data = await storage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  // Check authentication
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Initialize auth state (for persistent login)
  async initializeAuth(): Promise<{ user: User; token: string } | null> {
    try {
      const token = await this.getToken();
      if (!token) return null;

      const user = await this.getUserData();
      if (!user) return null;

      // Verify token is still valid by fetching current user
      const currentUser = await this.getMe();
      return { user: currentUser, token };
    } catch (error) {
      // Token invalid or expired, clear auth data
      await this.clearTokens();
      return null;
    }
  }
}

export const authService = new AuthService();
