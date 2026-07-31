export const analyticsData = {
  // Weekly data (last 7 days)
  weekly: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    income: [120, 0, 500, 0, 0, 200, 150],
    expense: [45, 78, 120, 56, 89, 130, 95],
  },
  
  // Monthly data (last 6 months)
  monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    income: [5200, 5500, 6200, 5800, 6500, 7000],
    expense: [3200, 3800, 4235, 3600, 4100, 3900],
  },
  
  // Income vs Expense (current month)
  incomeVsExpense: {
    income: 7000,
    expense: 3900,
    savings: 3100,
  },
  
  // Category breakdown
  categories: [
    { name: 'Food', amount: 1250, percentage: 32, color: '#FF9500', emoji: '🍔' },
    { name: 'Transport', amount: 850, percentage: 22, color: '#007AFF', emoji: '🚗' },
    { name: 'Shopping', amount: 680, percentage: 17, color: '#5856D6', emoji: '🛍️' },
    { name: 'Bills', amount: 780, percentage: 20, color: '#FF3B30', emoji: '📱' },
    { name: 'Entertainment', amount: 340, percentage: 9, color: '#34C759', emoji: '🎮' },
  ],
  
  // Top spending categories (sorted)
  topCategories: [
    { category: 'Food & Dining', emoji: '🍔', amount: 1250, transactions: 45, change: 12.5 },
    { category: 'Transportation', emoji: '🚗', amount: 850, transactions: 28, change: -5.3 },
    { category: 'Bills & Utilities', emoji: '📱', amount: 780, transactions: 12, change: 2.1 },
    { category: 'Shopping', emoji: '🛍️', amount: 680, transactions: 18, change: 8.7 },
    { category: 'Entertainment', emoji: '🎬', amount: 340, transactions: 15, change: -3.2 },
  ],
  
  // Daily average
  dailyAverage: {
    income: 233,
    expense: 130,
    net: 103,
  },
  
  // Trends
  trends: {
    incomeGrowth: 7.8,
    expenseGrowth: -5.1,
    savingsRate: 44.3,
  },
};
