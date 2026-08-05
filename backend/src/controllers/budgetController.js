const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res, next) => {
  try {
    const { period, isActive, category } = req.query;

    const query = { user: req.user.id };
    if (period) query.period = period;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      user: req.user.id,
      category: req.body.category,
      period: req.body.period || 'monthly',
      isActive: true,
      startDate: { $lte: req.body.endDate },
      endDate: { $gte: req.body.startDate },
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this category and period',
      });
    }

    const budget = await Budget.create(req.body);

    // Calculate initial spent amount
    const spent = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id,
          category: budget.category,
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

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res, next) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget summary
// @route   GET /api/budgets/summary/overview
// @access  Private
exports.getBudgetSummary = async (req, res, next) => {
  try {
    const budgets = await Budget.find({
      user: req.user.id,
      isActive: true,
    });

    // Calculate real-time spent for each budget from transactions
    for (const budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: req.user.id,
            category: budget.category,
            type: 'expense',
            date: { $gte: budget.startDate, $lte: budget.endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      budget.spent = spent[0]?.total || 0;
      await budget.save();
    }

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Find exceeded budgets
    const exceeded = budgets.filter((b) => b.isExceeded());

    // Find budgets needing alert
    const warnings = budgets.filter((b) => b.shouldAlert() && !b.isExceeded());

    // Top spending categories
    const topCategories = budgets
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((b) => ({
        category: b.category,
        spent: b.spent,
        budget: b.amount,
        percentage: (b.spent / b.amount) * 100,
      }));

    res.status(200).json({
      success: true,
      data: {
        monthly: {
          total: totalBudget,
          spent: totalSpent,
          remaining: totalRemaining,
          percentage: percentage.toFixed(1),
        },
        categories: budgets.map((b) => ({
          id: b._id,
          name: b.category,
          emoji: b.emoji,
          budget: b.amount,
          spent: b.spent,
          remaining: b.remaining,
          percentage: b.percentage.toFixed(1),
          color: b.color,
        })),
        warnings: warnings.map((b) => ({
          id: b._id,
          category: b.category,
          emoji: b.emoji,
          message: `You've spent ${b.percentage.toFixed(1)}% of your budget`,
          severity: b.percentage > 90 ? 'high' : 'medium',
        })),
        exceeded: exceeded.map((b) => ({
          id: b._id,
          category: b.category,
          spent: b.spent,
          budget: b.amount,
          overspent: b.spent - b.amount,
        })),
        topCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
