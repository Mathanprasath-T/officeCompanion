const express = require('express');
const router = express.Router();
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/followups
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const followups = await FollowUp.find({ userId: req.user._id }).sort({ dueDate: 1 });

    // Compute dynamic status and counts
    const computedFollowups = followups.map((f) => {
      const computedStatus = f.calculateDynamicStatus();
      return {
        ...f.toObject(),
        status: computedStatus,
      };
    });

    let filtered = computedFollowups;
    if (status && status !== 'all') {
      filtered = computedFollowups.filter((f) => f.status === status);
    }

    const counts = {
      total: computedFollowups.length,
      pending: computedFollowups.filter((f) => f.status === 'pending').length,
      due: computedFollowups.filter((f) => f.status === 'due').length,
      overdue: computedFollowups.filter((f) => f.status === 'overdue').length,
      completed: computedFollowups.filter((f) => f.status === 'completed').length,
    };

    return res.status(200).json({
      success: true,
      data: filtered,
      counts,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/followups
router.post('/', async (req, res, next) => {
  try {
    const { title, person, dueDate, source, reminderTime } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Follow-up title/action is required.' });
    }

    if (!person || !person.trim()) {
      return res.status(400).json({ success: false, message: 'Person or counterparty name is required.' });
    }

    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required.' });
    }

    const followUp = await FollowUp.create({
      title: title.trim(),
      person: person.trim(),
      dueDate: new Date(dueDate),
      source: source ? source.trim() : 'AI Commitment Detection',
      reminderTime: reminderTime ? new Date(reminderTime) : undefined,
      userId: req.user._id,
    });

    await Activity.create({
      type: 'followup_created',
      description: `Scheduled follow-up with ${followUp.person}: "${followUp.title}"`,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Follow-up scheduled successfully.',
      data: {
        ...followUp.toObject(),
        status: followUp.calculateDynamicStatus(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/followups/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { title, person, dueDate, source, status } = req.body;

    const followUp = await FollowUp.findOne({ _id: req.params.id, userId: req.user._id });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    if (title !== undefined) followUp.title = title.trim();
    if (person !== undefined) followUp.person = person.trim();
    if (dueDate !== undefined) followUp.dueDate = new Date(dueDate);
    if (source !== undefined) followUp.source = source.trim();
    if (status !== undefined) followUp.status = status;

    await followUp.save();

    await Activity.create({
      type: 'followup_updated',
      description: `Updated follow-up for ${followUp.person}`,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully.',
      data: {
        ...followUp.toObject(),
        status: followUp.calculateDynamicStatus(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/followups/:id/complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, userId: req.user._id });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    followUp.status = 'completed';
    await followUp.save();

    await Activity.create({
      type: 'followup_completed',
      description: `Completed follow-up with ${followUp.person}: "${followUp.title}"`,
      userId: req.user._id,
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Follow-up Completed ✅',
      message: `You marked your commitment to ${followUp.person} as done.`,
      type: 'success',
      link: '/followups',
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as completed.',
      data: followUp,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/followups/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const followUp = await FollowUp.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    await Activity.create({
      type: 'followup_deleted',
      description: `Deleted follow-up for ${followUp.person}`,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up deleted.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
