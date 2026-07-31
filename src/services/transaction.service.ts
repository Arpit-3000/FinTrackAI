import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { Transaction, TransactionStats, CreateTransactionData, ApiResponse } from '../types';

interface GetTransactionsParams {
  type?: 'income' | 'expense';
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  pages: number;
  currentPage: number;
  data: Transaction[];
}

class TransactionService {
  // Get all transactions with filters
  async getTransactions(params?: GetTransactionsParams): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_ENDPOINTS.TRANSACTIONS}?${queryParams.toString()}`;
    const response = await api.get<Transaction[]>(url);

    return response as unknown as TransactionsResponse;
  }

  // Get single transaction
  async getTransaction(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get transaction');
  }

  // Create transaction
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await api.post<Transaction>(API_ENDPOINTS.TRANSACTIONS, data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create transaction');
  }

  // Update transaction
  async updateTransaction(id: string, data: Partial<CreateTransactionData>): Promise<Transaction> {
    const response = await api.put<Transaction>(`${API_ENDPOINTS.TRANSACTIONS}/${id}`, data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update transaction');
  }

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete transaction');
    }
  }

  // Get transaction statistics
  async getStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const url = `${API_ENDPOINTS.TRANSACTION_STATS}?${queryParams.toString()}`;
    const response = await api.get<TransactionStats>(url);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get statistics');
  }
}

export const transactionService = new TransactionService();
