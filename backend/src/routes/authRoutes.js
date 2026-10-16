import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

// Helper to ensure owner account exists in MongoDB or memory
export async function ensureOwnerExists() {
  const ownerEmail = (process.env.OWNER_EMAIL || 'vaibhavdigitalwebconnection@gmail.com').toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD || 'admin123';

  if (isMongoActive()) {
    try {
      let owner = await User.findOne({ email: ownerEmail });
      if (!owner) {
        const hash = await argon2.hash(ownerPassword);
        owner = await User.create({
          email: ownerEmail,
          passwordHash: hash,
          role: 'owner',
        });
        console.log(`[Auth] Owner seeded in MongoDB: ${ownerEmail}`);
      }
      return owner;
    } catch (err) {
      console.warn(`[Auth] Failed to seed owner in MongoDB: ${err.message}`);
    }
  }
  return null;
}

// POST /login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const inputEmail = email.trim().toLowerCase();
    const envOwnerEmail = (process.env.OWNER_EMAIL || 'vaibhavdigitalwebconnection@gmail.com').toLowerCase();
    const envOwnerPassword = process.env.OWNER_PASSWORD || 'admin123';

    let isValid = false;
    let userId = 'owner_01';

    if (isMongoActive()) {
      let user = await User.findOne({ email: inputEmail });
      if (user) {
        try {
          isValid = await argon2.verify(user.passwordHash, password);
          userId = user._id;
        } catch (e) {
          isValid = false;
        }
      } else if (inputEmail === envOwnerEmail && password === envOwnerPassword) {
        // First login bootstrap
        const hash = await argon2.hash(envOwnerPassword);
        user = await User.create({ email: inputEmail, passwordHash: hash, role: 'owner' });
        isValid = true;
        userId = user._id;
      }
    } else {
      // Offline fallback: match env owner credentials
      if (inputEmail === envOwnerEmail && password === envOwnerPassword) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session';
    const token = jwt.sign({ id: userId, email: inputEmail, role: 'owner' }, secret, {
      expiresIn: '7d',
    });

    const cookieName = process.env.COOKIE_NAME || 'customer_session';
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      token, // Also return in body for environments where cookies are blocked
      user: { email: inputEmail, role: 'owner' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  res.clearCookie(cookieName);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /me
router.get('/me', (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  const token = req.cookies?.[cookieName] || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session');
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired' });
  }
});

export default router;
