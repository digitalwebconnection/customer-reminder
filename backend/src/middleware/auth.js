import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
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
    const secret = process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

export default auth;
