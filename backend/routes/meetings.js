const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Activity = require('../models/Activity');
const { requireAuth } = require('../middleware/auth');
const {
  analyzeMeetingNotes,
  convertActionItemToTask,
  convertCommitmentToFollowUp,
} = require('../services/meetingIntelligenceService');

router.use(requireAuth);

// POST /api/meetings/analyze (Analyze meeting notes & return structured breakdown)
router.post('/analyze', async (req, res, next) => {
  try {
    const rawNotes = req.body.rawNotes || req.body.notes || req.body.text || req.body.content;
    if (!rawNotes || !rawNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please paste your meeting notes or conversation to analyze.',
      });
    }

    const meeting = await analyzeMeetingNotes(req.user._id, rawNotes);

    return res.status(201).json({
      success: true,
      message: 'Meeting notes analyzed and structured successfully.',
      data: meeting,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/meetings (List meeting history for user)
router.get('/', async (req, res, next) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id })
      .populate('actionItems.taskId', 'title status priority')
      .populate('commitments.followUpId', 'title status dueDate')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: meetings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/meetings/:id (Get single meeting details)
router.get('/:id', async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('actionItems.taskId', 'title status priority deadline')
      .populate('commitments.followUpId', 'title status dueDate person');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/meetings/:id/create-task (Convert action item to Task)
router.post('/:id/create-task', async (req, res, next) => {
  try {
    const { actionIndex, customData } = req.body;
    if (actionIndex === undefined || actionIndex === null) {
      return res.status(400).json({
        success: false,
        message: 'actionIndex is required.',
      });
    }

    const result = await convertActionItemToTask(req.user._id, req.params.id, actionIndex, customData);

    return res.status(200).json({
      success: true,
      message: result.alreadyCreated ? 'Task was already created.' : 'Task created successfully in your workspace.',
      data: result.task,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/meetings/:id/create-followup (Convert commitment to Follow-up)
router.post('/:id/create-followup', async (req, res, next) => {
  try {
    const { commitmentIndex, customData } = req.body;
    if (commitmentIndex === undefined || commitmentIndex === null) {
      return res.status(400).json({
        success: false,
        message: 'commitmentIndex is required.',
      });
    }

    const result = await convertCommitmentToFollowUp(req.user._id, req.params.id, commitmentIndex, customData);

    return res.status(200).json({
      success: true,
      message: result.alreadyCreated ? 'Follow-up was already created.' : 'Follow-up created successfully in your workspace.',
      data: result.followUp,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/meetings/:id (Delete meeting record)
router.delete('/:id', async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
