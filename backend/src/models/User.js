import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'owner',
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
export default User;
