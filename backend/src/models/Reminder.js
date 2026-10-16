import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Follow-up call',
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Australia/Sydney',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedOutcome: {
      type: String,
      default: null,
    },
    notification: {
      emailSentAt: {
        type: Date,
        default: null,
      },
      browserEventCreatedAt: {
        type: Date,
        default: null,
      },
      lastError: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to dynamically calculate whether reminder is overdue
reminderSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && this.dueAt && new Date(this.dueAt) < new Date();
});

// Compound indexes for querying pending, due, and date range reminders
reminderSchema.index({ ownerId: 1, status: 1, dueAt: 1 });
reminderSchema.index({ customerId: 1, dueAt: -1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
