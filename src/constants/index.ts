// API Configuration
// CRITICAL: Never use localhost in production builds
// Expo environment variables MUST be prefixed with EXPO_PUBLIC_

const getApiBaseUrl = (): string => {
  // Log for debugging
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  console.log('🌐 Environment API URL:', envUrl);
  console.log('🔧 process.env keys:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
  
  // For production, use the Render URL directly
  const PRODUCTION_API_URL = 'https://fintrackai-eow9.onrender.com/api';
  
  // If environment variable exists and is valid, use it
  if (envUrl && envUrl.startsWith('http')) {
    console.log('✅ Using environment API URL:', envUrl);
    return envUrl;
  }
  
  // Otherwise use production URL (NEVER localhost)
  console.log('⚠️ Environment variable not found, using production URL:', PRODUCTION_API_URL);
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Log final URL for debugging
console.log('📡 Final API_BASE_URL:', API_BASE_URL);

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
