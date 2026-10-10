const mongoose = require('mongoose');

const planItemSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  type: {
    type: String,
    enum: ['task', 'break'],
    default: 'task',
  },
  title: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 30,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'none'],
    default: 'medium',
  },
  reason: {
    type: String,
    default: '',
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const dailyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateString: {
      type: String,
      required: true, // Format: YYYY-MM-DD
    },
    workStartTime: {
      type: String,
      default: '09:00 AM',
    },
    workHours: {
      type: Number,
      default: 8,
    },
    items: [planItemSchema],
    excludedTaskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    customOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  {
    timestamps: true,
  }
);

dailyPlanSchema.index({ userId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('DailyPlan', dailyPlanSchema);
