// Navigation Types
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './navigation';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  pages?: number;
  currentPage?: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Auth Types
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Transaction Types
export interface Transaction {
  _id: string;
  user: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date: string;
  emoji?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'other';
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  summary: {
    income: number;
    expense: number;
    balance: number;
    totalTransactions: number;
  };
  byCategory: Array<{
    _id: {
      type: string;
      category: string;
    };
    total: number;
    count: number;
  }>;
}

export interface CreateTransactionData {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  date?: string;
  emoji?: string;
  paymentMethod?: string;
  tags?: string[];
  notes?: string;
}

// Budget Types
export interface Budget {
  _id: string;
  user: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  emoji?: string;
  color?: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  monthly: {
    total: number;
    spent: number;
    remaining: number;
    percentage: string;
  };
  categories: Array<{
    id: string;
    name: string;
    emoji: string;
    budget: number;
    spent: number;
    remaining: number;
    percentage: string;
    color: string;
    alertThreshold: number;
  }>;
  warnings: Array<{
    id: string;
    category: string;
    emoji: string;
    message: string;
    severity: 'high' | 'medium';
  }>;
  exceeded: Array<{
    id: string;
    category: string;
    spent: number;
    budget: number;
    overspent: number;
  }>;
  topCategories: Array<{
    category: string;
    spent: number;
    budget: number;
    percentage: number;
  }>;
}

export interface CreateBudgetData {
  category: string;
  amount: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  emoji?: string;
  color?: string;
  alertThreshold?: number;
}

// Analytics Types
export interface DashboardData {
  summary: {
    income: number;
    expense: number;
    savings: number;
    savingsRate: string;
  };
  recentTransactions: Transaction[];
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: string;
  }>;
}

export interface MonthlyComparison {
  currentMonth: {
    income: number;
    expense: number;
    savings: number;
  };
  previousMonth: {
    income: number;
    expense: number;
    savings: number;
  };
  changes: {
    income: {
      amount: number;
      percentage: string;
    };
    expense: {
      amount: number;
      percentage: string;
    };
  };
}

export interface TopCategory {
  category: string;
  total: number;
  count: number;
  avgAmount: string;
  percentage: string;
}
