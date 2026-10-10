const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline is required'],
    },
    importance: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    estimatedTime: {
      type: String,
      default: '45 mins',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    priorityReason: {
      type: String,
      default: 'Evaluated based on deadline and impact.',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if overdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed' || !this.deadline) return false;
  return new Date(this.deadline) < new Date();
});

module.exports = mongoose.model('Task', taskSchema);
