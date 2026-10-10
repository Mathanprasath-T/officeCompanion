const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me (Update profile and preferences)
router.patch('/me', async (req, res, next) => {
  try {
    const { name, department, role, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) user.name = name.trim();
    if (department !== undefined) user.department = department.trim();
    if (role !== undefined) user.role = role.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile settings updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
        department: user.department,
        role: user.role,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
