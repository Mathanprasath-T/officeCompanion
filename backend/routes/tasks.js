const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const WorkSession = require('../models/WorkSession');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');
const { calculateDeterministicPriority } = require('../services/priorityEngine');

// All task routes require authentication
router.use(requireAuth);

// GET /api/tasks (with real filters: all, today, upcoming, completed)
router.get('/', async (req, res, next) => {
  try {
    const { filter, search, importance, priority } = req.query;
    const query = { createdBy: req.user._id };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === 'completed') {
      query.status = 'completed';
    } else if (filter === 'today') {
      query.status = { $ne: 'completed' };
      query.deadline = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === 'upcoming') {
      query.status = { $ne: 'completed' };
      query.deadline = { $gt: endOfToday };
    } else {
      // 'all' or default -> return all, or non-completed first
      // If user wants all tasks, we can return active + completed
    }

    if (importance && importance !== 'all') {
      query.importance = importance;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query).sort({ deadline: 1, createdAt: -1 });

    // Compute summary stats for dashboard/headers
    const allUserTasks = await Task.find({ createdBy: req.user._id });
    const urgentCount = allUserTasks.filter(
      (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.importance === 'urgent' || (t.deadline && new Date(t.deadline) < now))
    ).length;

    const todayCount = allUserTasks.filter(
      (t) => t.status !== 'completed' && t.deadline && new Date(t.deadline) >= startOfToday && new Date(t.deadline) <= endOfToday
    ).length;

    const laterCount = allUserTasks.filter(
      (t) => t.status !== 'completed' && t.deadline && new Date(t.deadline) > endOfToday
    ).length;

    const completedCount = allUserTasks.filter((t) => t.status === 'completed').length;

    return res.status(200).json({
      success: true,
      data: tasks,
      counts: {
        total: allUserTasks.length,
        urgent: urgentCount,
        today: todayCount,
        later: laterCount,
        completed: completedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/export/csv (Export AI Predicted Tasks as downloadable CSV)
router.get('/export/csv', async (req, res, next) => {
  try {
    const tasks = await Task.find({ createdBy: req.user._id }).sort({ priority: 1, deadline: 1, createdAt: -1 });

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      'Task ID',
      'Title',
      'AI Predicted Priority',
      'AI Priority Reasoning',
      'User Importance',
      'Status',
      'Estimated Duration',
      'Deadline',
      'Overdue',
      'Description',
      'Created At',
      'Last Updated',
    ];

    const now = new Date();
    const rows = tasks.map((t) => {
      const isOverdue = t.status !== 'completed' && t.deadline && new Date(t.deadline) < now;
      return [
        escapeCsv(t._id),
        escapeCsv(t.title),
        escapeCsv((t.priority || 'medium').toUpperCase()),
        escapeCsv(t.priorityReason || 'Evaluated by OfficeCompanion AI Engine'),
        escapeCsv((t.importance || 'medium').toUpperCase()),
        escapeCsv((t.status || 'pending').replace('_', ' ').toUpperCase()),
        escapeCsv(t.estimatedTime || '45 mins'),
        escapeCsv(t.deadline ? new Date(t.deadline).toISOString() : 'N/A'),
        escapeCsv(isOverdue ? 'YES' : 'NO'),
        escapeCsv(t.description || ''),
        escapeCsv(new Date(t.createdAt).toISOString()),
        escapeCsv(new Date(t.updatedAt).toISOString()),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=OfficeCompanion_AI_Predicted_Tasks_${new Date().toISOString().slice(0, 10)}.csv`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks (Create Task)
router.post('/', async (req, res, next) => {
  try {
    const { title, description, deadline, importance, estimatedTime } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    if (!deadline) {
      return res.status(400).json({ success: false, message: 'Task deadline is required.' });
    }

    // Run priority evaluation
    const analysis = calculateDeterministicPriority({
      title: title.trim(),
      description: description ? description.trim() : '',
      deadline,
      importance: importance || 'medium',
      estimatedTime: estimatedTime || '45 mins',
    });

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      deadline: new Date(deadline),
      importance: importance || 'medium',
      estimatedTime: estimatedTime ? estimatedTime.trim() : '45 mins',
      priority: analysis.priority,
      priorityReason: analysis.reason,
      status: 'pending',
      createdBy: req.user._id,
    });

    // Record Activity
    await Activity.create({
      type: 'task_created',
      description: `Created new task: "${task.title}" (${task.priority.toUpperCase()} priority)`,
      taskId: task._id,
      userId: req.user._id,
    });

    // If urgent, create reminder notification
    if (analysis.priority === 'urgent' || importance === 'urgent') {
      await Notification.create({
        userId: req.user._id,
        title: 'Urgent Task Added ⚠️',
        message: `"${task.title}" is flagged as urgent. ${analysis.reason}`,
        type: 'urgent',
        link: `/tasks/${task._id}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id (Task Details)
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Retrieve active or latest work session for this task
    const latestSession = await WorkSession.findOne({
      taskId: task._id,
      userId: req.user._id,
    }).sort({ lastActiveAt: -1 });

    // Retrieve task specific activities
    const activities = await Activity.find({
      taskId: task._id,
      userId: req.user._id,
    }).sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      data: {
        task,
        latestSession,
        activities,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id (Update Task)
router.patch('/:id', async (req, res, next) => {
  try {
    const { title, description, deadline, importance, estimatedTime, status } = req.body;

    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (deadline !== undefined) task.deadline = new Date(deadline);
    if (importance !== undefined) task.importance = importance;
    if (estimatedTime !== undefined) task.estimatedTime = estimatedTime.trim();
    if (status !== undefined) {
      task.status = status;
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
      }
    }

    // Re-evaluate priority
    const analysis = calculateDeterministicPriority({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      importance: task.importance,
      estimatedTime: task.estimatedTime,
    });

    task.priority = analysis.priority;
    task.priorityReason = analysis.reason;

    await task.save();

    // Record Activity
    await Activity.create({
      type: 'task_updated',
      description: `Updated task: "${task.title}"`,
      taskId: task._id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/complete (Complete Task)
router.post('/:id/complete', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // Mark any active work session completed
    await WorkSession.updateMany(
      { taskId: task._id, userId: req.user._id, status: 'active' },
      { status: 'completed', lastActiveAt: new Date() }
    );

    // Record Activity
    await Activity.create({
      type: 'task_completed',
      description: `Completed task: "${task.title}"`,
      taskId: task._id,
      userId: req.user._id,
    });

    // Send confirmation notification
    await Notification.create({
      userId: req.user._id,
      title: 'Task Completed 🎉',
      message: `Great job! You finished "${task.title}".`,
      type: 'success',
      link: `/tasks/${task._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Task completed.',
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id (Delete Task)
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Clean up related work sessions
    await WorkSession.deleteMany({ taskId: req.params.id, userId: req.user._id });

    // Record Activity
    await Activity.create({
      type: 'task_deleted',
      description: `Deleted task: "${task.title}"`,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
