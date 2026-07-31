const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStats,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const {
  createTransactionValidator,
  updateTransactionValidator,
  dateRangeValidator,
  validate,
} = require('../middleware/validators');

// All routes are protected
router.use(protect);

// Stats route (must be before /:id)
router.get('/stats/summary', dateRangeValidator, validate, getStats);

// CRUD routes
router
  .route('/')
  .get(dateRangeValidator, validate, getTransactions)
  .post(createTransactionValidator, validate, createTransaction);

router
  .route('/:id')
  .get(getTransaction)
  .put(updateTransactionValidator, validate, updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
