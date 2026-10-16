import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'browser_push'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationLogSchema.index({ ownerId: 1, reminderId: 1, channel: 1 });
notificationLogSchema.index({ status: 1, lastAttemptAt: 1 });

export const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);
export default NotificationLog;
