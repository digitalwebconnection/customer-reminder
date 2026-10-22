import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      default: 'Australia',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Australia/Sydney',
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash by default
    },
    role: {
      type: String,
      enum: ['user', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
    pushSubscriptions: {
      type: [Object],
      default: [],
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    twoFactorCode: {
      type: String,
      default: null,
      select: false,
    },
    twoFactorTempToken: {
      type: String,
      default: null,
      select: false,
    },
    twoFactorExpires: {
      type: Date,
      default: null,
      select: false,
    },
    twoFactorAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    twoFactorLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.twoFactorCode;
        delete ret.twoFactorTempToken;
        delete ret.twoFactorExpires;
        delete ret.twoFactorAttempts;
        delete ret.twoFactorLastSentAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Static method to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Need to explicitly select passwordHash since it's excluded by default
  const user = await this.constructor.findById(this._id).select('+passwordHash');
  if (!user || !user.passwordHash) return false;
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export const User = mongoose.model('User', userSchema);
export default User;
