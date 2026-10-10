const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Follow-up title is required'],
      trim: true,
    },
    person: {
      type: String,
      required: [true, 'Person or counterparty is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    source: {
      type: String,
      default: 'Manual / Conversation',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'due', 'overdue', 'completed'],
      default: 'pending',
    },
    reminderTime: {
      type: Date,
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

// Method to compute dynamic status based on due date
followUpSchema.methods.calculateDynamicStatus = function () {
  if (this.status === 'completed') return 'completed';
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return 'overdue';
  } else if (diffHours <= 24) {
    return 'due';
  }
  return 'pending';
};

module.exports = mongoose.model('FollowUp', followUpSchema);
