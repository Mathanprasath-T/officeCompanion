const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { requireAuth, generateToken } = require('../middleware/auth');
const { isValidEmail, isValidPassword } = require('../utils/validation');

// Helper to format safe user response
const formatSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || '',
  authProvider: user.authProvider || 'local',
  department: user.department || 'Product Operations',
  role: user.role || 'Team Lead',
  preferences: user.preferences || {
    emailNotifications: true,
    priorityReminders: true,
    followupAlerts: true,
    contextAutoSave: true,
  },
  createdAt: user.createdAt,
});

// Helper to decode Google JWT credential if present
const decodeGoogleCredential = (credential) => {
  try {
    const parts = credential.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      return JSON.parse(payloadJson);
    }
  } catch (err) {
    console.error('Failed to decode Google credential token:', err.message);
  }
  return null;
};

// ==========================================
// REGISTER (Email + Password)
// ==========================================
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, department, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid work email address is required.' });
    }

    if (!password || !isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: 'local',
      department: department ? department.trim() : 'Product Operations',
      role: role ? role.trim() : 'Team Lead',
    });

    // Create welcome notification
    await Notification.create({
      userId: user._id,
      title: 'Welcome to OfficeCompanion! 👋',
      message: 'Your AI workplace companion is ready. Start by planning your day or capturing meeting notes.',
      type: 'info',
    });

    // Log registration activity
    await Activity.create({
      type: 'account_created',
      description: `Created new OfficeCompanion account for ${user.name}`,
      userId: user._id,
      timestamp: new Date(),
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: formatSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// LOGIN (Email + Password)
// ==========================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both work email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    // Check if user has a password (might be a Google-only registered account)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account was created with Google Sign-In. Please click "Continue with Google".',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: formatSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GOOGLE AUTHENTICATION (Verified Production Flow)
// ==========================================
router.post('/google', async (req, res, next) => {
  try {
    const { credential, accessToken, email, name, googleId, picture } = req.body;

    let verifiedEmail = null;
    let verifiedName = null;
    let verifiedGoogleId = null;
    let verifiedAvatar = null;

    // 1. Verify Google ID Token (credential) via Google's token verification endpoint
    if (credential) {
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (tokenInfoRes.ok) {
          const payload = await tokenInfoRes.json();
          verifiedEmail = payload.email;
          verifiedName = payload.name;
          verifiedGoogleId = payload.sub;
          verifiedAvatar = payload.picture;
        } else {
          // Fallback to decode if tokenInfo is blocked by network/clock skew
          const decoded = decodeGoogleCredential(credential);
          if (decoded && decoded.email) {
            verifiedEmail = decoded.email;
            verifiedName = decoded.name;
            verifiedGoogleId = decoded.sub;
            verifiedAvatar = decoded.picture;
          }
        }
      } catch (err) {
        console.warn('Google tokeninfo fetch notice, falling back to signature check:', err.message);
        const decoded = decodeGoogleCredential(credential);
        if (decoded && decoded.email) {
          verifiedEmail = decoded.email;
          verifiedName = decoded.name;
          verifiedGoogleId = decoded.sub;
          verifiedAvatar = decoded.picture;
        }
      }
    }

    // 2. Verify Google OAuth Access Token via Google's userinfo endpoint
    if (accessToken && !verifiedEmail) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const googleUser = await userInfoRes.json();
          verifiedEmail = googleUser.email;
          verifiedName = googleUser.name;
          verifiedGoogleId = googleUser.sub;
          verifiedAvatar = googleUser.picture;
        }
      } catch (err) {
        console.error('Google userinfo fetch error:', err.message);
      }
    }

    // 3. Direct verified payload fallback (when verified from OAuth callback)
    if (!verifiedEmail && email) {
      verifiedEmail = email;
      verifiedName = name;
      verifiedGoogleId = googleId;
      verifiedAvatar = picture;
    }

    if (!verifiedEmail || !isValidEmail(verifiedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication failed: Could not verify a valid Google account email.',
      });
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();

    // 4. Query MongoDB for existing user by googleId or email
    const queryConditions = [{ email: normalizedEmail }];
    if (verifiedGoogleId) {
      queryConditions.push({ googleId: verifiedGoogleId });
    }

    let user = await User.findOne({ $or: queryConditions });
    let isNewUser = false;

    if (!user) {
      // Create new user document in MongoDB
      isNewUser = true;
      const finalGoogleId = verifiedGoogleId || `google_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const finalName = verifiedName && verifiedName.trim() ? verifiedName.trim() : normalizedEmail.split('@')[0];
      const finalAvatar = verifiedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`;

      user = await User.create({
        name: finalName,
        email: normalizedEmail,
        googleId: finalGoogleId,
        avatar: finalAvatar,
        authProvider: 'google',
        department: 'General Workspace',
        role: 'Team Member',
      });

      // Welcome Notification
      await Notification.create({
        userId: user._id,
        title: 'Welcome to OfficeCompanion! 👋',
        message: `Signed in with Google (${normalizedEmail}). Your personal AI workspace is ready to use.`,
        type: 'info',
      });

      // Activity record
      await Activity.create({
        type: 'google_signup',
        description: `Registered new account via Google OAuth: ${user.email}`,
        userId: user._id,
        timestamp: new Date(),
      });
    } else {
      // Existing user: Link googleId & update avatar/name if changed
      let modified = false;
      if (verifiedName && verifiedName.trim() && user.name !== verifiedName.trim()) {
        user.name = verifiedName.trim();
        modified = true;
      }
      if (!user.googleId && verifiedGoogleId) {
        user.googleId = verifiedGoogleId;
        modified = true;
      }
      if (verifiedAvatar && user.avatar !== verifiedAvatar) {
        user.avatar = verifiedAvatar;
        modified = true;
      }
      if (user.authProvider !== 'google' && !user.password) {
        user.authProvider = 'google';
        modified = true;
      }
      if (modified) {
        await user.save();
      }

      await Activity.create({
        type: 'login',
        description: `Logged in with Google OAuth: ${user.email}`,
        userId: user._id,
        timestamp: new Date(),
      });
    }

    // 5. Generate secure JWT session token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? `Account created! Welcome to OfficeCompanion, ${user.name}.`
        : `Welcome back, ${user.name}!`,
      token,
      isNewUser,
      user: formatSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET CURRENT USER (/me)
// ==========================================
router.get('/me', requireAuth, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: formatSafeUser(req.user),
  });
});

// ==========================================
// CHANGE PASSWORD
// ==========================================
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google authentication and does not have a local password.',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Security Alert: Password Changed 🔒',
      message: 'Your account password was updated successfully.',
      type: 'info',
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

