import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import type { DashboardData, MonthlyComparison, TopCategory, ApiResponse } from '../types';

interface DetailedAnalytics {
  trends: any[];
  categoryAnalysis: any[];
  weeklyAnalysis: any[];
  paymentMethods: any[];
}

class AnalyticsService {
  // Get dashboard data
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<DashboardData>(API_ENDPOINTS.ANALYTICS_DASHBOARD);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get dashboard data');
  }

  // Get detailed analytics
  async getDetailedAnalytics(startDate?: string, endDate?: string): Promise<DetailedAnalytics> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const url = `${API_ENDPOINTS.ANALYTICS_DETAILED}?${queryParams.toString()}`;
    const response = await api.get<DetailedAnalytics>(url);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get detailed analytics');
  }

  // Get comparison
  async getMonthlyComparison(timeframe?: 'week' | 'month' | 'year'): Promise<MonthlyComparison> {
    const url = timeframe 
      ? `${API_ENDPOINTS.ANALYTICS_COMPARISON}?timeframe=${timeframe}`
      : API_ENDPOINTS.ANALYTICS_COMPARISON;
    const response = await api.get<MonthlyComparison>(url);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get comparison');
  }

  // Get top categories
  async getTopCategories(
    type: 'income' | 'expense' = 'expense',
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopCategory[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    queryParams.append('limit', String(limit));
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const url = `${API_ENDPOINTS.ANALYTICS_TOP_CATEGORIES}?${queryParams.toString()}`;
    const response = await api.get<TopCategory[]>(url);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  }
}

export const analyticsService = new AnalyticsService();
