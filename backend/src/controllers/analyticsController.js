const Transaction = require('../models/Transaction');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month totals
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = monthlyStats.find((s) => s._id === 'income')?.total || 0;
    const expense = monthlyStats.find((s) => s._id === 'expense')?.total || 0;
    const savings = income - expense;

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    // Get monthly spending for last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          income,
          expense,
          savings,
          savingsRate: income > 0 ? ((savings / income) * 100).toFixed(1) : 0,
        },
        recentTransactions,
        monthlySpending: monthlySpending.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          amount: m.total,
        })),
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          amount: c.total,
          count: c.count,
          percentage: ((c.total / expense) * 100).toFixed(1),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics
// @route   GET /api/analytics/detailed
// @access  Private
exports.getDetailedAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Income vs Expense trends
    const trends = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' },
            },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Category analysis
    const categoryAnalysis = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
          max: { $max: '$amount' },
          min: { $min: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Weekly analysis
    const weeklyAnalysis = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            week: { $week: '$date' },
            year: { $year: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Payment method breakdown
    const paymentMethods = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        trends,
        categoryAnalysis,
        weeklyAnalysis,
        paymentMethods,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly comparison
// @route   GET /api/analytics/comparison
// @access  Private
exports.getMonthlyComparison = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { timeframe = 'month' } = req.query;
    const now = new Date();
    
    let currentStart, currentEnd, previousStart, previousEnd;
    
    if (timeframe === 'week') {
      // Last 7 days
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 7);
      currentStart.setHours(0, 0, 0, 0);
      
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);
      
      // Previous 7 days (7 to 14 days ago)
      previousStart = new Date(now);
      previousStart.setDate(now.getDate() - 14);
      previousStart.setHours(0, 0, 0, 0);
      
      previousEnd = new Date(now);
      previousEnd.setDate(now.getDate() - 7);
      previousEnd.setHours(23, 59, 59, 999);
    } else if (timeframe === 'year') {
      // Last 365 days
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 365);
      currentStart.setHours(0, 0, 0, 0);
      
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);
      
      // Previous 365 days (365 to 730 days ago)
      previousStart = new Date(now);
      previousStart.setDate(now.getDate() - 730);
      previousStart.setHours(0, 0, 0, 0);
      
      previousEnd = new Date(now);
      previousEnd.setDate(now.getDate() - 365);
      previousEnd.setHours(23, 59, 59, 999);
    } else {
      // Default to last 30 days
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 30);
      currentStart.setHours(0, 0, 0, 0);
      
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);
      
      // Previous 30 days (30 to 60 days ago)
      previousStart = new Date(now);
      previousStart.setDate(now.getDate() - 60);
      previousStart.setHours(0, 0, 0, 0);
      
      previousEnd = new Date(now);
      previousEnd.setDate(now.getDate() - 30);
      previousEnd.setHours(23, 59, 59, 999);
    }

    // Current period stats
    const currentPeriod = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Previous period stats
    const previousPeriod = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentIncome = currentPeriod.find((m) => m._id === 'income')?.total || 0;
    const currentExpense = currentPeriod.find((m) => m._id === 'expense')?.total || 0;
    const previousIncome = previousPeriod.find((m) => m._id === 'income')?.total || 0;
    const previousExpense = previousPeriod.find((m) => m._id === 'expense')?.total || 0;

    const incomeChange = previousIncome > 0 ? (((currentIncome - previousIncome) / previousIncome) * 100).toFixed(1) : 0;
    const expenseChange = previousExpense > 0 ? (((currentExpense - previousExpense) / previousExpense) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          income: currentIncome,
          expense: currentExpense,
          savings: currentIncome - currentExpense,
        },
        previousMonth: {
          income: previousIncome,
          expense: previousExpense,
          savings: previousIncome - previousExpense,
        },
        changes: {
          income: {
            amount: currentIncome - previousIncome,
            percentage: incomeChange,
          },
          expense: {
            amount: currentExpense - previousExpense,
            percentage: expenseChange,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top categories
// @route   GET /api/analytics/top-categories
// @access  Private
exports.getTopCategories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type = 'expense', limit = 10, startDate, endDate } = req.query;

    const matchQuery = {
      user: userId,
      type,
    };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const topCategories = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: Number(limit) },
    ]);

    const totalAmount = topCategories.reduce((sum, cat) => sum + cat.total, 0);

    res.status(200).json({
      success: true,
      data: topCategories.map((cat) => ({
        category: cat._id,
        total: cat.total,
        count: cat.count,
        avgAmount: cat.avgAmount.toFixed(2),
        percentage: ((cat.total / totalAmount) * 100).toFixed(1),
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
