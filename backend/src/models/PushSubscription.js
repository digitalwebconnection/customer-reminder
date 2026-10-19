import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'mobile',
    },
    userAgent: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
