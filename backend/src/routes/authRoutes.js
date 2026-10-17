import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

const getJwtSecret = () =>
  process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Helper to seed owner accounts in MongoDB
export async function ensureOwnerExists() {
  if (!isMongoActive()) return;

  const defaultOwners = [
    {
      email: (process.env.OWNER_EMAIL || 'admin@reminder.com').toLowerCase(),
      password: process.env.OWNER_PASSWORD || 'Admin@123',
      name: 'System Owner',
    },
    {
      email: 'vaibhavdigitalwebconnection@gmail.com',
      password: 'admin123',
      name: 'Vaibhav Admin',
    },
  ];

  for (const ownerData of defaultOwners) {
    try {
      const existing = await User.findOne({ email: ownerData.email });
      if (!existing) {
        const hash = await argon2.hash(ownerData.password);
        await User.create({
          email: ownerData.email,
          name: ownerData.name,
          passwordHash: hash,
          role: 'owner',
        });
        console.log(`[Auth] Seeded owner account in MongoDB: ${ownerData.email}`);
      }
    } catch (err) {
      console.warn(`[Auth] Could not seed owner ${ownerData.email}: ${err.message}`);
    }
  }
}

// POST /register - Register a new user account
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    let newUser = null;

    if (isMongoActive()) {
      const existing = await User.findOne({ email: trimmedEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }

      const hash = await argon2.hash(password);
      newUser = await User.create({
        email: trimmedEmail,
        name: name ? name.trim() : trimmedEmail.split('@')[0],
        passwordHash: hash,
        role: 'user',
      });
    } else {
      // Offline fallback user object
      newUser = {
        _id: `user_${Date.now()}`,
        email: trimmedEmail,
        name: name ? name.trim() : trimmedEmail.split('@')[0],
        role: 'user',
      };
    }

    // Generate 30-day JWT Token
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    const cookieName = process.env.COOKIE_NAME || 'customer_session';
    res.cookie(cookieName, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /login - User / Owner Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const inputEmail = email.trim().toLowerCase();
    const envOwnerEmail = (process.env.OWNER_EMAIL || 'admin@reminder.com').toLowerCase();
    const envOwnerPassword = process.env.OWNER_PASSWORD || 'Admin@123';
    const fallbackOwnerEmail = 'vaibhavdigitalwebconnection@gmail.com';
    const fallbackOwnerPassword = 'admin123';

    let isValid = false;
    let authenticatedUser = null;

    if (isMongoActive()) {
      let user = await User.findOne({ email: inputEmail });
      if (user) {
        try {
          isValid = await argon2.verify(user.passwordHash, password);
          if (isValid) {
            authenticatedUser = user;
          }
        } catch (e) {
          isValid = false;
        }
      } else {
        // Check if matching initial bootstrap owner credentials
        const isEnvOwner = inputEmail === envOwnerEmail && password === envOwnerPassword;
        const isFallbackOwner = inputEmail === fallbackOwnerEmail && password === fallbackOwnerPassword;

        if (isEnvOwner || isFallbackOwner) {
          const hash = await argon2.hash(password);
          authenticatedUser = await User.create({
            email: inputEmail,
            name: isEnvOwner ? 'System Owner' : 'Vaibhav Admin',
            passwordHash: hash,
            role: 'owner',
          });
          isValid = true;
        }
      }
    } else {
      // Offline fallback: match env owner or fallback owner
      const isEnvOwner = inputEmail === envOwnerEmail && password === envOwnerPassword;
      const isFallbackOwner = inputEmail === fallbackOwnerEmail && password === fallbackOwnerPassword;

      if (isEnvOwner || isFallbackOwner) {
        isValid = true;
        authenticatedUser = {
          _id: 'owner_01',
          email: inputEmail,
          name: isEnvOwner ? 'System Owner' : 'Vaibhav Admin',
          role: 'owner',
        };
      }
    }

    if (!isValid || !authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    // Generate 30-day JWT Token
    const token = jwt.sign(
      {
        id: authenticatedUser._id.toString(),
        email: authenticatedUser.email,
        name: authenticatedUser.name || authenticatedUser.email.split('@')[0],
        role: authenticatedUser.role || 'user',
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    const cookieName = process.env.COOKIE_NAME || 'customer_session';
    res.cookie(cookieName, token, getCookieOptions());

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: authenticatedUser._id.toString(),
        email: authenticatedUser.email,
        name: authenticatedUser.name || authenticatedUser.email.split('@')[0],
        role: authenticatedUser.role || 'user',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout - Clear session
router.post('/logout', (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /me - Get Current Authenticated User & Verify Token
router.get('/me', async (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  let token = null;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    } else if (parts.length === 1 && !parts[0].toLowerCase().startsWith('bearer')) {
      token = parts[0];
    }
  }

  if (!token && req.cookies && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (isMongoActive() && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role,
          },
        });
      }
    }

    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        role: decoded.role || 'user',
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid. Please sign in again.' });
  }
});

export default router;
