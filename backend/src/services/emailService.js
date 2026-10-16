import nodemailer from 'nodemailer';

export const formatInTimezone = (dateInput, tz = 'Australia/Sydney') => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    dateStyle: 'full',
    timeStyle: 'short',
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

export async function sendReminderEmail(reminder) {
  const recipient =
    process.env.NOTIFICATION_EMAIL ||
    process.env.OWNER_EMAIL ||
    process.env.SMTP_USER ||
    'vaibhavdigitalwebconnection@gmail.com';

  const tz = reminder.timezone || 'Australia/Sydney';
  const displayTime = formatInTimezone(reminder.dueAt, tz);
  const from = process.env.EMAIL_FROM || `"Customer Reminder" <${recipient}>`;

  const subject = `🔔 Call Reminder: ${reminder.name} (${reminder.phone})`;

  const textContent = `
Customer Call Reminder:
------------------------------------------
Name:     ${reminder.name}
Phone:    ${reminder.phone}
Email:    ${reminder.email || 'N/A'}
Address:  ${reminder.address || 'N/A'}
Due At:   ${displayTime} (${tz})
Note:     ${reminder.note || 'None'}
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
        ${reminder.email ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${reminder.email}" style="color: #4f46e5; text-decoration: none;">${reminder.email}</a></td>
        </tr>` : ''}
        ${reminder.address ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Address:</td>
          <td style="padding: 8px 0; color: #334155;">${reminder.address}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Due Time:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #e11d48;">${displayTime}</td>
        </tr>
        ${reminder.note ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b; vertical-align: top;">Note:</td>
          <td style="padding: 8px 0; color: #334155; background: #f8fafc; border-radius: 6px; padding: 10px;">${reminder.note}</td>
        </tr>` : ''}
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
    return { messageId: 'simulated_' + Date.now() };
  }
}
