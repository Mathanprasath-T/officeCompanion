const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getProductivitySummary,
  getWorkloadOverview,
  getTimeDistribution,
  getProductivityPatterns,
  getWeeklyInsights,
} = require('../services/productivityInsightsService');

router.use(requireAuth);

// GET /api/insights/summary (KPI numbers)
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await getProductivitySummary(req.user._id);
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/workload (7-day workload chart data)
router.get('/workload', async (req, res, next) => {
  try {
    const workload = await getWorkloadOverview(req.user._id);
    return res.status(200).json({
      success: true,
      data: workload,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/distribution (Time distribution categories)
router.get('/distribution', async (req, res, next) => {
  try {
    const distribution = await getTimeDistribution(req.user._id);
    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/activity / patterns
router.get('/activity', async (req, res, next) => {
  try {
    const patterns = await getProductivityPatterns(req.user._id);
    return res.status(200).json({
      success: true,
      data: patterns,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights/weekly (AI weekly observations & suggestions)
router.get('/weekly', async (req, res, next) => {
  try {
    const insights = await getWeeklyInsights(req.user._id);
    return res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
