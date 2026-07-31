// API Configuration
// Update this based on your environment:
// - iOS Simulator: http://localhost:5000/api
// - Android Emulator: http://10.0.2.2:5000/api
// - Physical Device: http://YOUR_IP_ADDRESS:5000/api
// - Production: https://your-api.com/api
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@fintrack_auth_token',
  REFRESH_TOKEN: '@fintrack_refresh_token',
  USER_DATA: '@fintrack_user_data',
} as const;

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
  UPDATE_PROFILE: '/auth/profile',
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTION_STATS: '/transactions/stats/summary',
  
  // Budgets
  BUDGETS: '/budgets',
  BUDGET_SUMMARY: '/budgets/summary/overview',
  
  // Analytics
  ANALYTICS_DASHBOARD: '/analytics/dashboard',
  ANALYTICS_DETAILED: '/analytics/detailed',
  ANALYTICS_COMPARISON: '/analytics/comparison',
  ANALYTICS_TOP_CATEGORIES: '/analytics/top-categories',
} as const;
