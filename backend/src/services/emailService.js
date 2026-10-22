import nodemailer from "nodemailer";

export const formatInTimezone = (dateInput, tz = "Asia/Kolkata") => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
};

export const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Send a reminder email to the owner of the reminder.
 * @param {Object} reminder - The reminder document
 * @param {string|null} recipientEmail - The specific user's email (multi-user). Falls back to env defaults.
 */
export async function sendReminderEmail(reminder, recipientEmail = null) {
  if (!recipientEmail) {
    console.log(
      `[Email] Skipping reminder email for ${reminder._id}: no owner email specified. Leaking to other users prevented.`,
    );
    return false;
  }

  const recipient = recipientEmail;
  const tz = reminder.timezone || "Asia/Kolkata";
  const displayTime = formatInTimezone(reminder.dueAt, tz);
  const from = process.env.EMAIL_FROM || `"Customer Reminder" <${recipient}>`;

  const subject = `🔔 Call Reminder: ${reminder.name} (${reminder.phone})`;

  const textContent = `
Customer Call Reminder:
------------------------------------------
Name:     ${reminder.name}
Phone:    ${reminder.phone}
Email:    ${reminder.email || "N/A"}
Address:  ${reminder.address || "N/A"}
Due At:   ${displayTime} (${tz})
Note:     ${reminder.note || "None"}
------------------------------------------
Call now: tel:${reminder.phone}
`.trim();

  const htmlContent = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
    <div style="background: #4f46e5; padding: 20px 24px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Customer Call Reminder</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Scheduled for ${displayTime} (${tz})</p>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 100px;">Customer:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${reminder.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Phone:</td>
          <td style="padding: 8px 0;">
            <a href="tel:${reminder.phone}" style="color: #4f46e5; font-weight: 600; text-decoration: none;">${reminder.phone}</a>
          </td>
        </tr>
        ${
          reminder.email
            ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${reminder.email}" style="color: #4f46e5; text-decoration: none;">${reminder.email}</a></td>
        </tr>`
            : ""
        }
        ${
          reminder.address
            ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Address:</td>
          <td style="padding: 8px 0; color: #334155;">${reminder.address}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Due Time:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #e11d48;">${displayTime}</td>
        </tr>
        ${
          reminder.note
            ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; vertical-align: top;">Note:</td>
          <td style="padding: 8px 0; color: #334155; background: #f8fafc; border-radius: 6px; padding: 10px;">${reminder.note}</td>
        </tr>`
            : ""
        }
      </table>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
        <a href="tel:${reminder.phone}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          📞 Call Customer Directly
        </a>
      </div>
    </div>
  </div>
  `;

  const transporter = createTransporter();
  if (transporter) {
    return await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text: textContent,
      html: htmlContent,
    });
  } else {
    // When SMTP credentials are empty in development, log the email clearly in console
    console.log(`[Email Reminder Simulated] Destination: ${recipient}`);
    console.log(`[Email Subject] ${subject}`);
    console.log(`[Email Details]\n${textContent}`);
    return { messageId: "simulated_" + Date.now() };
  }
}

/**
 * Send 2FA One-Time Passcode (OTP) Email for Super Admin Login
 * @param {Object} options
 * @param {string} options.to - Recipient super admin email
 * @param {string} options.code - 6-digit OTP code
 * @param {string} options.ipAddress - Request IP
 * @param {string} options.userAgent - Client User Agent / Device
 */
export async function sendSuperAdmin2FAEmail({
  to,
  code,
  ipAddress,
  userAgent,
}) {
  const from =
    process.env.EMAIL_FROM ||
    `"RemindIQ Security" <${process.env.SMTP_USER || "no-reply@remindiq.app"}>`;
  const subject = `🛡️ [RemindIQ Security] Your Super Admin 2FA Code: ${code}`;
  const now = new Date();
  const timeIST = formatInTimezone(now, "Asia/Kolkata");
  const timeAEST = formatInTimezone(now, "Australia/Sydney");

  const textContent = `
[REMINDIQ SUPER ADMIN 2FA SECURITY ALERT]
======================================================
Your One-Time 6-Digit Verification Code: ${code}
This code will expire in 10 minutes.
======================================================

A sign-in attempt was detected for the Super Administrator account:
Email:    ${to}
Time:     ${timeIST} (IST) / ${timeAEST} (Sydney)
IP:       ${ipAddress || "Not recorded"}
Browser:  ${userAgent || "Not recorded"}

If you did NOT attempt this login, your credentials may be compromised.
Please change your password immediately.
`.trim();

  const htmlContent = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #09090b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; color: #f4f4f5; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 24px; border-bottom: 1px solid #3f3f46; text-align: center;">
      <div style="display: inline-block; background: #f59e0b; color: #09090b; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px;">
        🛡️ High-Security Verification
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Super Admin 2FA Login</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa;">Two-Factor Authentication is required to access the Super Admin control center.</p>
    </div>

    <div style="padding: 28px 24px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #d4d4d8;">
        Enter the following 6-digit verification code to complete your login:
      </p>

      <!-- 6-digit Code Box -->
      <div style="margin: 20px auto; padding: 18px 24px; background: #18181b; border: 2px dashed #f59e0b; border-radius: 12px; display: inline-block; box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);">
        <span style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #fbbf24;">
          ${code}
        </span>
      </div>

      <p style="margin: 12px 0 24px 0; font-size: 12px; color: #f59e0b; font-weight: 600;">
        ⏱️ This security code is single-use and will expire in 10 minutes.
      </p>

      <!-- Login Metadata -->
      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 12px; color: #a1a1aa;">
        <div style="font-weight: 700; color: #f4f4f5; margin-bottom: 8px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Sign-in Attempt Details</div>
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">Account:</strong> ${to}</div>
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">Time (IST):</strong> ${timeIST}</div>
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">Time (AEST):</strong> ${timeAEST}</div>
        <div style="margin-bottom: 4px;"><strong style="color: #e4e4e7;">IP Address:</strong> ${ipAddress || "Unavailable"}</div>
        <div><strong style="color: #e4e4e7;">Device:</strong> ${userAgent || "Web Browser"}</div>
      </div>

      <!-- Security Notice -->
      <div style="background: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 10px; padding: 14px; text-align: left; font-size: 12px; color: #fda4af;">
        <strong>⚠️ Security Warning:</strong> If you did NOT attempt to sign in to RemindIQ right now, someone may have obtained your password. Please ignore this code and immediately reset your password.
      </div>
    </div>

    <div style="background: #18181b; border-top: 1px solid #27272a; padding: 14px 24px; text-align: center; font-size: 11px; color: #71717a;">
      RemindIQ Security Infrastructure • Automated Notification
    </div>
  </div>
  `;

  // Always log clearly to server console so developer/admin can instantly see code in dev mode
  console.log(
    "\n================================================================",
  );
  console.log(`🔐 [SUPER ADMIN 2FA OTP] Code: ${code} for ${to}`);
  console.log(`📍 IP: ${ipAddress} | Time: ${timeIST}`);
  console.log(
    "================================================================\n",
  );

  const transporter = createTransporter();
  if (transporter) {
    try {
      const result = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(
        `[Email] Super Admin 2FA code successfully dispatched to ${to} (MessageId: ${result?.messageId})`,
      );
      return { success: true, messageId: result?.messageId };
    } catch (err) {
      console.error(
        `[Email Error] Failed to send 2FA email via SMTP to ${to}:`,
        err.message,
      );
      // Return success: false but do not throw so fallback handling continues
      return { success: false, error: err.message };
    }
  } else {
    console.log(
      `[Email] No SMTP transporter configured. 2FA code logged to console above.`,
    );
    return { success: true, messageId: "console_logged_" + Date.now() };
  }
}
