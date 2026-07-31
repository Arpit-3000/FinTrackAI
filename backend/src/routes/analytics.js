const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getDetailedAnalytics,
  getMonthlyComparison,
  getTopCategories,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { dateRangeValidator, validate } = require('../middleware/validators');

// All routes are protected
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/detailed', dateRangeValidator, validate, getDetailedAnalytics);
router.get('/comparison', getMonthlyComparison);
router.get('/top-categories', dateRangeValidator, validate, getTopCategories);

module.exports = router;
