import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    // Keep backward compat - ownerId maps to userId
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual isOverdue: true if pending and dueAt in past
reminderSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && this.dueAt && new Date(this.dueAt) < new Date();
});

reminderSchema.index({ status: 1, dueAt: 1 });
reminderSchema.index({ name: 'text', phone: 'text' });
reminderSchema.index({ userId: 1, status: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
