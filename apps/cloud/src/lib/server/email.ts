import 'dotenv/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null = null;

/**
 * Lazily build an SMTP transport from env. Provider-agnostic: point SMTP_* at Mailtrap
 * now, swap to any SMTP provider later with no code change. Returns null if unconfigured.
 */
function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send a transactional email over SMTP. If SMTP isn't configured (local dev), the email
 * is logged to the console so flows like invitations still work.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'no-reply@incognitify.com';
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return;
  }
  await t.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
