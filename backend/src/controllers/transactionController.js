const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const transaction = await Transaction.create(req.body);

    // Update budget if transaction is expense
    if (transaction.type === 'expense') {
      await updateBudgetSpent(req.user.id, transaction.category, transaction.date);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const oldCategory = transaction.category;
    const oldAmount = transaction.amount;
    const oldType = transaction.type;

    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Recalculate budgets if category, amount, or type changed
    if (
      oldType === 'expense' &&
      (oldCategory !== transaction.category || oldAmount !== transaction.amount)
    ) {
      await updateBudgetSpent(req.user.id, oldCategory, transaction.date);
      await updateBudgetSpent(req.user.id, transaction.category, transaction.date);
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const category = transaction.category;
    const date = transaction.date;

    await transaction.deleteOne();

    // Update budget spent if it was an expense
    if (transaction.type === 'expense') {
      await updateBudgetSpent(req.user.id, category, date);
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/summary
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = { user: req.user.id };
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Get totals by type
    const totals = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get category breakdown
    const byCategory = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Calculate summary
    const income = totals.find((t) => t._id === 'income')?.total || 0;
    const expense = totals.find((t) => t._id === 'expense')?.total || 0;
    const balance = income - expense;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          income,
          expense,
          balance,
          totalTransactions: totals.reduce((acc, t) => acc + t.count, 0),
        },
        byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update budget spent
async function updateBudgetSpent(userId, category, transactionDate) {
  const budget = await Budget.findOne({
    user: userId,
    category,
    isActive: true,
    startDate: { $lte: transactionDate },
    endDate: { $gte: transactionDate },
  });

  if (budget) {
    // Recalculate spent amount
    const spent = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          category,
          type: 'expense',
          date: { $gte: budget.startDate, $lte: budget.endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    budget.spent = spent[0]?.total || 0;
    await budget.save();
  }
}

module.exports = exports;
