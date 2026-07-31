import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { Budget, BudgetSummary, CreateBudgetData, ApiResponse } from '../types';

interface GetBudgetsParams {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive?: boolean;
  category?: string;
}

class BudgetService {
  // Get all budgets
  async getBudgets(params?: GetBudgetsParams): Promise<Budget[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_ENDPOINTS.BUDGETS}?${queryParams.toString()}`;
    const response = await api.get<Budget[]>(url);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  }

  // Get single budget
  async getBudget(id: string): Promise<Budget> {
    const response = await api.get<Budget>(`${API_ENDPOINTS.BUDGETS}/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get budget');
  }

  // Create budget
  async createBudget(data: CreateBudgetData): Promise<Budget> {
    const response = await api.post<Budget>(API_ENDPOINTS.BUDGETS, data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create budget');
  }

  // Update budget
  async updateBudget(id: string, data: Partial<CreateBudgetData>): Promise<Budget> {
    const response = await api.put<Budget>(`${API_ENDPOINTS.BUDGETS}/${id}`, data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update budget');
  }

  // Delete budget
  async deleteBudget(id: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.BUDGETS}/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete budget');
    }
  }

  // Get budget summary
  async getBudgetSummary(): Promise<BudgetSummary> {
    const response = await api.get<BudgetSummary>(API_ENDPOINTS.BUDGET_SUMMARY);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get budget summary');
  }
}

export const budgetService = new BudgetService();
