import nodemailer from 'nodemailer';
// import { config } from '@vantage/config';

// In production, use environment variables for SMTP config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@vantage.live',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email to ${to}`);
  }
}

export function generatePasswordResetEmail(resetToken: string, userName: string): {
  subject: string;
  html: string;
} {
  const resetLink = `${process.env.WEB_URL || 'https://vantage.live'}/reset-password?token=${resetToken}`;
  
  return {
    subject: 'Reset Your Vantage Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset the password for your Vantage account.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">© 2026 Vantage. All rights reserved.</p>
      </div>
    `,
  };
}

export function generateInvitationEmail(_inviteeEmail: string, inviterName: string, roomName: string, roomLink: string): {
  subject: string;
  html: string;
} {
  return {
    subject: `${inviterName} invited you to "${roomName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to a meeting</h2>
        <p>Hi,</p>
        <p><strong>${inviterName}</strong> has invited you to join a meeting:</p>
        <p style="font-size: 18px; font-weight: bold; color: #1e293b;">${roomName}</p>
        <p>
          <a href="${roomLink}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Join Meeting
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link: <code>${roomLink}</code>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">© 2026 Vantage. All rights reserved.</p>
      </div>
    `,
  };
}
