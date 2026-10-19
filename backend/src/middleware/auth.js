import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

const getJwtSecret = () =>
  process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session';

export const auth = async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  let token = null;

  // 1. Check Authorization Header (supports 'Bearer <token>', 'bearer <token>', or raw token)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    } else if (parts.length === 1 && !parts[0].toLowerCase().startsWith('bearer')) {
      token = parts[0];
    }
  }

  // 2. Fallback to Cookie
  if (!token && req.cookies && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    // Verify user still exists and is active
    if (mongoose.connection.readyState === 1 && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Account not found. Please sign up again.',
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Contact the administrator.',
        });
      }
      // Automatically ensure authorized administrator emails maintain superadmin role
      const superAdminEmail = (process.env.SUPERADMIN_EMAIL || '').toLowerCase();
      const userEmail = (user.email || '').toLowerCase();
      const isAdminEmail =
        userEmail === superAdminEmail ||
        userEmail === 'vaibhavdigitalwebconnection@gmail.com';

      if (isAdminEmail && user.role !== 'superadmin') {
        user.role = 'superadmin';
        await user.save();
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || '').toLowerCase();
  const userEmail = (req.user?.email || '').toLowerCase();
  const isAdminEmail =
    userEmail === superAdminEmail ||
    userEmail === 'vaibhavdigitalwebconnection@gmail.com';

  if (!req.user || (req.user.role !== 'superadmin' && !isAdminEmail)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.',
    });
  }
  next();
};

export default auth;
