import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'signup',
        'logout',
        'password_reset_request',
        'password_reset_complete',
        'user_blocked',
        'user_unblocked',
        'user_deleted',
        'admin_password_reset',
        'reminder_created',
        'reminder_updated',
        'reminder_deleted',
        'customer_created',
        'customer_updated',
        'customer_deleted',
        'profile_updated',
      ],
      index: true,
    },
    details: {
      type: String,
      default: '',
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
