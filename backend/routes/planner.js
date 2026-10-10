const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getTodayPlan,
  generateTodayPlan,
  reorderPlan,
  toggleTaskInPlan,
} = require('../services/plannerService');

router.use(requireAuth);

// GET /api/planner/today (Get or create today's plan)
router.get('/today', async (req, res, next) => {
  try {
    const plan = await getTodayPlan(req.user._id, false);
    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/planner/generate (Regenerate today's plan)
router.post('/generate', async (req, res, next) => {
  try {
    const plan = await getTodayPlan(req.user._id, true);
    return res.status(200).json({
      success: true,
      message: "Today's daily plan generated successfully.",
      data: plan,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/planner/reorder (Reorder plan items)
router.put('/reorder', async (req, res, next) => {
  try {
    const { orderedTaskIds } = req.body;
    if (!Array.isArray(orderedTaskIds)) {
      return res.status(400).json({
        success: false,
        message: 'orderedTaskIds array is required.',
      });
    }

    const updatedPlan = await reorderPlan(req.user._id, orderedTaskIds);
    return res.status(200).json({
      success: true,
      message: 'Plan order updated successfully.',
      data: updatedPlan,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/planner/reorder (Alias for PUT)
router.post('/reorder', async (req, res, next) => {
  try {
    const { orderedTaskIds } = req.body;
    if (!Array.isArray(orderedTaskIds)) {
      return res.status(400).json({
        success: false,
        message: 'orderedTaskIds array is required.',
      });
    }

    const updatedPlan = await reorderPlan(req.user._id, orderedTaskIds);
    return res.status(200).json({
      success: true,
      message: 'Plan order updated successfully.',
      data: updatedPlan,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/planner/toggle-task (Include or remove task from today's plan)
router.post('/toggle-task', async (req, res, next) => {
  try {
    const { taskId, include } = req.body;
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'taskId is required.',
      });
    }

    const updatedPlan = await toggleTaskInPlan(req.user._id, taskId, include);
    return res.status(200).json({
      success: true,
      message: include ? 'Task added to plan.' : 'Task removed from plan.',
      data: updatedPlan,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
