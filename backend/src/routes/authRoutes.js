import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { auth, optionalAuth } from "../middleware/auth.js";
import { validateEmail, validatePhone } from "../utils/validation.js";

const router = express.Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

const getJwtSecret = () =>
  process.env.JWT_SECRET ||
  "super_secret_dev_jwt_key_remindiq_secure_auth_session";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "30d" },
  );
};

const logActivity = async (
  userId,
  action,
  details = "",
  req = null,
  targetUserId = null,
) => {
  try {
    if (!isMongoActive()) return;
    await ActivityLog.create({
      userId,
      action,
      details,
      targetUserId,
      ipAddress: req ? req.headers["x-forwarded-for"] || req.ip || "" : "",
      userAgent: req ? req.headers["user-agent"] || "" : "",
    });
  } catch (err) {
    console.warn("[ActivityLog] Error logging activity:", err.message);
  }
};

// Helper to seed super admin account in MongoDB
export async function ensureOwnerExists() {
  if (!isMongoActive()) return;

  const superAdminEmail = (
    process.env.SUPERADMIN_EMAIL || "vaibhavdigitalwebconnection@gmail.com"
  ).toLowerCase();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "Admin@123";

  try {
    const existing = await User.findOne({ email: superAdminEmail });
    if (!existing) {
      const hash = await User.hashPassword(superAdminPassword);
      await User.create({
        email: superAdminEmail,
        name: "Super Admin",
        passwordHash: hash,
        role: "superadmin",
        isActive: true,
      });
      console.log(`[Auth] Seeded super admin account: ${superAdminEmail}`);
    } else if (existing.role !== "superadmin") {
      // Upgrade existing user to superadmin
      existing.role = "superadmin";
      await existing.save();
      console.log(
        `[Auth] Upgraded existing user to super admin: ${superAdminEmail}`,
      );
    }

    // Ensure only the authorized super admin maintains the superadmin role
    await User.updateMany(
      { email: superAdminEmail },
      { $set: { role: "superadmin", isActive: true } },
    );

    // Strictly downgrade any other unauthorized accounts with superadmin role
    await User.updateMany(
      { role: "superadmin", email: { $ne: superAdminEmail } },
      { $set: { role: "user" } },
    );
  } catch (err) {
    console.warn(`[Auth] Could not seed super admin: ${err.message}`);
  }

  // Migrate any other old 'owner' accounts to 'user' role
  try {
    const ownerCount = await User.countDocuments({ role: "owner" });
    if (ownerCount > 0) {
      await User.updateMany(
        { role: "owner", email: { $ne: superAdminEmail } },
        { $set: { role: "user" } },
      );
      console.log(
        `[Auth] Migrated ${ownerCount} old 'owner' accounts to 'user' role`,
      );
    }
  } catch (err) {
    console.warn(`[Auth] Migration warning: ${err.message}`);
  }
}

// POST /register - Register a new user account
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, country, timezone } =
      req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res
        .status(400)
        .json({ success: false, message: emailCheck.error });
    }
    const trimmedEmail = emailCheck.email;

    // Phone number validation (if provided)
    if (phone && phone.trim()) {
      const phoneCheck = validatePhone(phone, country, false);
      if (!phoneCheck.isValid) {
        return res
          .status(400)
          .json({ success: false, message: phoneCheck.error });
      }
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    if (!isMongoActive()) {
      return res
        .status(503)
        .json({
          success: false,
          message: "Database is unavailable. Please try again later.",
        });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email address already exists. Please sign in.",
      });
    }

    // Determine country and timezone
    const userCountry = (country && country.trim()) || "Australia";
    const userTimezone =
      (timezone && timezone.trim()) ||
      (userCountry === "India" ? "Asia/Kolkata" : "Australia/Sydney");

    // Never allow signup as superadmin
    const hash = await User.hashPassword(password);
    const newUser = await User.create({
      email: trimmedEmail,
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      country: userCountry,
      timezone: userTimezone,
      passwordHash: hash,
      role: "user", // Always 'user' on signup
      isActive: true,
    });

    // Log activity
    await logActivity(
      newUser._id,
      "signup",
      `New user registered: ${trimmedEmail} (${userCountry} / ${userTimezone})`,
      req,
    );

    const token = generateToken(newUser);
    const cookieName = process.env.COOKIE_NAME || "customer_session";
    res.cookie(cookieName, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        country: newUser.country,
        timezone: newUser.timezone,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /login - User / Super Admin Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      return res
        .status(400)
        .json({ success: false, message: emailCheck.error });
    }
    const inputEmail = emailCheck.email;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    if (!isMongoActive()) {
      return res
        .status(503)
        .json({
          success: false,
          message: "Database is unavailable. Please try again later.",
        });
    }

    // Find user with password hash
    const user = await User.findOne({ email: inputEmail }).select(
      "+passwordHash",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please check your credentials.",
      });
    }

    // Check if user is blocked
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Contact the administrator.",
      });
    }

    // Verify password - support both bcrypt and argon2 hashes during migration
    let isValid = false;
    try {
      const bcrypt = (await import("bcrypt")).default;
      isValid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      isValid = false;
    }

    // Fallback: try argon2 for old hashes
    if (!isValid) {
      try {
        const argon2 = (await import("argon2")).default;
        isValid = await argon2.verify(user.passwordHash, password);
        // If argon2 worked, rehash with bcrypt for future logins
        if (isValid) {
          user.passwordHash = await User.hashPassword(password);
          await user.save();
          console.log(`[Auth] Migrated ${inputEmail} from argon2 to bcrypt`);
        }
      } catch (e) {
        // argon2 not available or hash not argon2, skip
      }
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Please check your credentials.",
      });
    }

    // Check if this login is for the Super Admin
    const superAdminEmail = (
      process.env.SUPERADMIN_EMAIL || "vaibhavdigitalwebconnection@gmail.com"
    ).toLowerCase();
    const isSpecialAdmin =
      user.role === "superadmin" ||
      inputEmail === superAdminEmail ||
      inputEmail === "vaibhavdigitalwebconnection@gmail.com";

    if (isSpecialAdmin && user.role !== "superadmin") {
      user.role = "superadmin";
    }

    // Direct Login (Single Factor)
    user.lastLoginAt = new Date();
    await user.save();

    await logActivity(
      user._id,
      "login",
      `${user.role === "superadmin" ? "Super Admin" : "User"} logged in: ${user.email}`,
      req,
    );

    const token = generateToken(user);
    const cookieName = process.env.COOKIE_NAME || "customer_session";
    res.cookie(cookieName, token, getCookieOptions());

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        country: user.country || "Australia",
        timezone: user.timezone || "Australia/Sydney",
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /verify-2fa - High-Security 2FA Verification for Super Admin
router.post("/verify-2fa", async (req, res, next) => {
  try {
    const { tempToken, code } = req.body || {};

    if (!tempToken) {
      return res.status(400).json({
        success: false,
        message: "Security session token is missing. Please sign in again.",
      });
    }

    if (!code || !/^\d{6}$/.test(String(code).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit security code.",
      });
    }

    if (!isMongoActive()) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable. Please try again later.",
      });
    }

    const user = await User.findOne({ twoFactorTempToken: tempToken }).select(
      "+passwordHash +twoFactorCode +twoFactorTempToken +twoFactorExpires +twoFactorAttempts",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired 2FA verification session. Please sign in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Contact the administrator.",
      });
    }

    // Check expiration
    if (!user.twoFactorExpires || user.twoFactorExpires < new Date()) {
      return res.status(400).json({
        success: false,
        codeExpired: true,
        message:
          "Security verification code has expired. Please request a new code.",
      });
    }

    // Check brute force attempts limit
    if ((user.twoFactorAttempts || 0) >= 5) {
      user.twoFactorCode = null;
      user.twoFactorTempToken = null;
      user.twoFactorExpires = null;
      await user.save();

      await logActivity(
        user._id,
        "superadmin_2fa_locked",
        "2FA session terminated after 5 failed attempts.",
        req,
      );

      return res.status(429).json({
        success: false,
        sessionTerminated: true,
        message:
          "Maximum attempts exceeded for this session. Please sign in again.",
      });
    }

    const cleanInputCode = String(code).trim();
    if (cleanInputCode !== String(user.twoFactorCode).trim()) {
      user.twoFactorAttempts = (user.twoFactorAttempts || 0) + 1;
      await user.save();

      const remaining = 5 - user.twoFactorAttempts;
      await logActivity(
        user._id,
        "superadmin_2fa_failed",
        `Incorrect 2FA code entered (${user.twoFactorAttempts}/5 attempts)`,
        req,
      );

      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // 2FA Verification Succeeded!
    user.twoFactorCode = null;
    user.twoFactorTempToken = null;
    user.twoFactorExpires = null;
    user.twoFactorAttempts = 0;
    user.lastLoginAt = new Date();
    user.role = "superadmin";
    await user.save();

    await logActivity(
      user._id,
      "superadmin_2fa_success",
      "Super Admin 2FA verification passed. Session granted.",
      req,
    );

    const token = generateToken(user);
    const cookieName = process.env.COOKIE_NAME || "customer_session";
    res.cookie(cookieName, token, getCookieOptions());

    res.json({
      success: true,
      message: "Super Admin verification successful",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        country: user.country || "Australia",
        timezone: user.timezone || "Australia/Sydney",
        role: "superadmin",
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /resend-2fa - Resend 6-Digit Code for Super Admin
router.post("/resend-2fa", async (req, res, next) => {
  try {
    const { tempToken } = req.body || {};

    if (!tempToken) {
      return res.status(400).json({
        success: false,
        message: "Missing verification session token. Please sign in again.",
      });
    }

    if (!isMongoActive()) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable. Please try again later.",
      });
    }

    const user = await User.findOne({ twoFactorTempToken: tempToken }).select(
      "+twoFactorCode +twoFactorTempToken +twoFactorExpires +twoFactorAttempts +twoFactorLastSentAt",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please sign in again.",
      });
    }

    // Cooldown check (45 seconds)
    if (user.twoFactorLastSentAt) {
      const elapsed = Date.now() - new Date(user.twoFactorLastSentAt).getTime();
      if (elapsed < 45 * 1000) {
        const remainingSeconds = Math.ceil((45 * 1000 - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds}s before requesting another code.`,
          cooldownSeconds: remainingSeconds,
        });
      }
    }

    const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
    user.twoFactorCode = otpCode;
    user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.twoFactorAttempts = 0;
    user.twoFactorLastSentAt = new Date();
    await user.save();

    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    await sendSuperAdmin2FAEmail({
      to: user.email,
      code: otpCode,
      ipAddress,
      userAgent,
    });

    await logActivity(
      user._id,
      "superadmin_2fa_resend",
      `Super Admin 2FA code resent to ${user.email}`,
      req,
    );

    res.json({
      success: true,
      message: `A new 6-digit security code has been sent to ${user.email}.`,
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout - Clear session
router.post("/logout", optionalAuth, async (req, res) => {
  if (req.user?.id) {
    await logActivity(req.user.id, "logout", "User logged out", req);
  }

  const cookieName = process.env.COOKIE_NAME || "customer_session";
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// GET /me - Get Current Authenticated User & Verify Token
router.get("/me", async (req, res) => {
  const cookieName = process.env.COOKIE_NAME || "customer_session";
  let token = null;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    } else if (
      parts.length === 1 &&
      !parts[0].toLowerCase().startsWith("bearer")
    ) {
      token = parts[0];
    }
  }

  if (!token && req.cookies && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      isMongoActive() &&
      decoded.id &&
      mongoose.Types.ObjectId.isValid(decoded.id)
    ) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Account not found" });
      }
      if (!user.isActive) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account has been blocked. Contact the administrator.",
          });
      }

      // Ensure authorized emails maintain superadmin role
      const superAdminEmail = (
        process.env.SUPERADMIN_EMAIL || ""
      ).toLowerCase();
      const userEmail = (user.email || "").toLowerCase();
      const isSpecialAdmin =
        userEmail === superAdminEmail ||
        userEmail === "vaibhavdigitalwebconnection@gmail.com";

      if (isSpecialAdmin && user.role !== "superadmin") {
        user.role = "superadmin";
        await user.save();
      }

      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          phone: user.phone || "",
          country: user.country || "Australia",
          timezone: user.timezone || "Australia/Sydney",
          role: user.role,
        },
      });
    }

    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
        phone: "",
        country: "Australia",
        timezone: "Australia/Sydney",
        role: decoded.role || "user",
      },
    });
  } catch (err) {
    res
      .status(401)
      .json({
        success: false,
        message: "Session expired or invalid. Please sign in again.",
      });
  }
});

// PUT /profile - Update current user's profile
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { name, phone, country, timezone, currentPassword, newPassword } =
      req.body;
    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (country) user.country = country.trim();
    if (timezone) user.timezone = timezone.trim();

    // Password change
    if (currentPassword && newPassword) {
      const bcryptLib = (await import("bcrypt")).default;
      const isMatch = await bcryptLib.compare(
        currentPassword,
        user.passwordHash,
      );
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({
            success: false,
            message: "New password must be at least 6 characters",
          });
      }
      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();
    await logActivity(user._id, "profile_updated", "Profile updated", req);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        country: user.country || "Australia",
        timezone: user.timezone || "Australia/Sydney",
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /forgot-password - Send password reset email
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: user.resetPasswordExpires,
    });

    await logActivity(
      user._id,
      "password_reset_request",
      "Password reset requested",
      req,
    );

    // Send reset email
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")[0]
      .trim();
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const transporter = createTransporter();
    if (transporter) {
      const emailFrom =
        process.env.EMAIL_FROM ||
        `"Customer Reminder" <${process.env.SMTP_USER}>`;
      await transporter.sendMail({
        from: emailFrom,
        to: user.email,
        subject: "🔑 Password Reset - RemindIQ",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 20px 24px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px;">Password Reset Request</h2>
            </div>
            <div style="padding: 24px;">
              <p style="color: #334155;">Hi ${user.name},</p>
              <p style="color: #334155;">You requested a password reset. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>
          </div>
        `,
      });
    } else {
      console.log(`[Auth] Password reset link (no SMTP): ${resetUrl}`);
    }

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
});

// POST /reset-password/:token - Reset password using token
router.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await logActivity(
      user._id,
      "password_reset_complete",
      "Password reset completed",
      req,
    );

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    next(err);
  }
});

export { logActivity };
export default router;
