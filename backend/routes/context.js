const express = require('express');
const router = express.Router();
const WorkSession = require('../models/WorkSession');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { requireAuth } = require('../middleware/auth');
const { generateDefaultChecklist } = require('../services/contextEngine');

router.use(requireAuth);

// GET /api/context/recent (Recent work sessions sorted by lastActiveAt DESC)
router.get('/recent', async (req, res, next) => {
  try {
    const sessions = await WorkSession.find({ userId: req.user._id })
      .populate('taskId')
      .sort({ lastActiveAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/context/start (Start Task / Start Work Session)
router.post('/start', async (req, res, next) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, message: 'taskId is required to start a session.' });
    }

    const task = await Task.findOne({ _id: taskId, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Set task to in_progress if pending
    if (task.status === 'pending') {
      task.status = 'in_progress';
      await task.save();
    }

    // Pause any other active sessions
    await WorkSession.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'paused', lastActiveAt: new Date() }
    );

    // Look for existing active/paused session for this task
    let session = await WorkSession.findOne({
      taskId: task._id,
      userId: req.user._id,
      status: { $in: ['active', 'paused'] },
    });

    if (session) {
      session.status = 'active';
      session.lastActiveAt = new Date();
      await session.save();
    } else {
      const defaults = generateDefaultChecklist(task.title, task.description);
      session = await WorkSession.create({
        taskId: task._id,
        userId: req.user._id,
        startedAt: new Date(),
        lastActiveAt: new Date(),
        completedActions: defaults.completedActions,
        remainingActions: defaults.remainingActions,
        currentContext: defaults.currentContext,
        nextAction: defaults.nextAction,
        status: 'active',
      });
    }

    await Activity.create({
      type: 'task_started',
      description: `Started working on: "${task.title}"`,
      taskId: task._id,
      userId: req.user._id,
    });

    const populatedSession = await WorkSession.findById(session._id).populate('taskId');

    return res.status(200).json({
      success: true,
      message: `Work session started for "${task.title}".`,
      data: populatedSession,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/context/:id (Save/Update work session context)
router.patch('/:id', async (req, res, next) => {
  try {
    const { completedActions, remainingActions, currentContext, nextAction, status } = req.body;

    const session = await WorkSession.findOne({ _id: req.params.id, userId: req.user._id }).populate('taskId');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Work session not found.' });
    }

    if (completedActions !== undefined) session.completedActions = completedActions;
    if (remainingActions !== undefined) session.remainingActions = remainingActions;
    if (currentContext !== undefined) session.currentContext = currentContext;
    if (nextAction !== undefined) session.nextAction = nextAction;
    if (status !== undefined) session.status = status;

    session.lastActiveAt = new Date();
    await session.save();

    await Activity.create({
      type: 'context_saved',
      description: `Saved context for "${session.taskId?.title || 'task'}": Next: "${session.nextAction}"`,
      taskId: session.taskId?._id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Work context saved successfully.',
      data: session,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/context/:id/resume (Resume Work Session)
router.post('/:id/resume', async (req, res, next) => {
  try {
    const session = await WorkSession.findOne({ _id: req.params.id, userId: req.user._id }).populate('taskId');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Work session not found.' });
    }

    // Pause other active sessions
    await WorkSession.updateMany(
      { userId: req.user._id, status: 'active', _id: { $ne: session._id } },
      { status: 'paused', lastActiveAt: new Date() }
    );

    session.status = 'active';
    session.lastActiveAt = new Date();
    await session.save();

    await Activity.create({
      type: 'context_resumed',
      description: `Resumed work on "${session.taskId?.title || 'task'}"`,
      taskId: session.taskId?._id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: `Resumed session for "${session.taskId?.title || 'task'}".`,
      data: session,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
