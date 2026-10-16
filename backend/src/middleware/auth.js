import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || 'customer_session';
  const token = req.cookies?.[cookieName] || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_jwt_key_remindiq_secure_auth_session');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};
