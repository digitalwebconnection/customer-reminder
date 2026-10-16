import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema(
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
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      default: null,
    },
    calledAt: {
      type: Date,
      default: Date.now,
    },
    outcome: {
      type: String,
      enum: ['answered', 'no_answer', 'busy', 'callback_requested', 'not_interested'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    nextReminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for chronological timeline queries
callLogSchema.index({ ownerId: 1, customerId: 1, calledAt: -1 });

export const CallLog = mongoose.model('CallLog', callLogSchema);
export default CallLog;
