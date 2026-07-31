const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide a budget amount'],
      min: [0, 'Budget amount cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    emoji: {
      type: String,
      default: '💰',
    },
    color: {
      type: String,
      default: '#007AFF',
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      lastSent: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
budgetSchema.index({ user: 1, category: 1 });
budgetSchema.index({ user: 1, isActive: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function () {
  return this.amount - this.spent;
});

// Virtual for percentage spent
budgetSchema.virtual('percentage').get(function () {
  return this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
});

// Method to check if budget exceeded
budgetSchema.methods.isExceeded = function () {
  return this.spent > this.amount;
};

// Method to check if alert threshold reached
budgetSchema.methods.shouldAlert = function () {
  const percentage = (this.spent / this.amount) * 100;
  return percentage >= this.alertThreshold;
};

// Ensure virtuals are included in JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
