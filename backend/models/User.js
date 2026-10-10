const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    department: {
      type: String,
      default: 'Product Operations',
      trim: true,
    },
    role: {
      type: String,
      default: 'Team Lead',
      trim: true,
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      priorityReminders: { type: Boolean, default: true },
      followupAlerts: { type: Boolean, default: true },
      contextAutoSave: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

