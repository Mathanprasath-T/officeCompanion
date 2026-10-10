const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/activity
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, type } = req.query;
    const query = { userId: req.user._id };

    if (type && type !== 'all') {
      query.type = type;
    }

    const activities = await Activity.find(query)
      .populate('taskId', 'title priority status')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
