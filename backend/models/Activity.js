const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'account_created',
        'login',
        'google_signup',
        'task_created',
        'task_started',
        'task_completed',
        'task_updated',
        'task_deleted',
        'context_saved',
        'context_resumed',
        'context_completed',
        'followup_created',
        'followup_completed',
        'followup_updated',
        'followup_deleted',
        'commitment_detected',
        'priority_updated',
        'meeting_analyzed',
        'plan_generated',
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', activitySchema);
