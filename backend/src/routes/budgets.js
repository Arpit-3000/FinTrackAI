const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const {
  createBudgetValidator,
  updateBudgetValidator,
  validate,
} = require('../middleware/validators');

// All routes are protected
router.use(protect);

// Summary route (must be before /:id)
router.get('/summary/overview', getBudgetSummary);

// CRUD routes
router
  .route('/')
  .get(getBudgets)
  .post(createBudgetValidator, validate, createBudget);

router
  .route('/:id')
  .get(getBudget)
  .put(updateBudgetValidator, validate, updateBudget)
  .delete(deleteBudget);

module.exports = router;
