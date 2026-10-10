const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { requireAuth } = require('../middleware/auth');
const { prioritizeTasksWithAI, detectCommitmentWithAI } = require('../services/aiService');
const { calculateDeterministicPriority } = require('../services/priorityEngine');

router.use(requireAuth);

// GET /api/ai/recommendation (What should I do now?)
router.get('/recommendation', async (req, res, next) => {
  try {
    const pendingTasks = await Task.find({
      createdBy: req.user._id,
      status: { $in: ['pending', 'in_progress'] },
    });

    if (pendingTasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No pending tasks found. You are all caught up!',
      });
    }

    const prioritized = await prioritizeTasksWithAI(pendingTasks);
    const topRecommendation = prioritized[0];

    // Find the full task object
    const task = pendingTasks.find((t) => String(t._id) === String(topRecommendation.taskId));

    return res.status(200).json({
      success: true,
      data: {
        task,
        priority: topRecommendation.priority,
        reason: topRecommendation.reason,
        score: topRecommendation.score,
        estimatedEffort: topRecommendation.estimatedEffort,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/priority (Prioritize all user tasks)
router.post('/priority', async (req, res, next) => {
  try {
    const tasks = await Task.find({
      createdBy: req.user._id,
      status: { $in: ['pending', 'in_progress'] },
    });

    const prioritized = await prioritizeTasksWithAI(tasks);

    // Update tasks in DB with computed priority & reasons
    for (const item of prioritized) {
      await Task.findOneAndUpdate(
        { _id: item.taskId, createdBy: req.user._id },
        {
          priority: item.priority,
          priorityReason: item.reason,
        }
      );
    }

    await Activity.create({
      type: 'priority_updated',
      description: `AI evaluated and prioritized ${tasks.length} active tasks`,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'AI Task Prioritization completed.',
      data: prioritized,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/commitments (Extract commitments from natural text)
router.post('/commitments', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide text to analyze for commitments.',
      });
    }

    const result = await detectCommitmentWithAI(text);

    if (result.success && result.data) {
      await Activity.create({
        type: 'commitment_detected',
        description: `AI detected commitment for ${result.data.person}: "${result.data.action}"`,
        userId: req.user._id,
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
