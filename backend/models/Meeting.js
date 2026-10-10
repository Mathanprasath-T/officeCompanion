const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  person: {
    type: String,
    default: 'Team',
    trim: true,
  },
  deadline: {
    type: String,
    default: 'This week',
    trim: true,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium',
  },
  estimatedTime: {
    type: String,
    default: '45 mins',
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
});

const commitmentSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  person: {
    type: String,
    required: true,
    trim: true,
  },
  dueDate: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'task_commitment',
  },
  confidence: {
    type: Number,
    default: 0.9,
  },
  followUpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FollowUp',
    default: null,
  },
});

const meetingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Team Meeting & Discussion',
    },
    rawNotes: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    decisions: [
      {
        type: String,
        trim: true,
      },
    ],
    actionItems: [actionItemSchema],
    commitments: [commitmentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meeting', meetingSchema);
