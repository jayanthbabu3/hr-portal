import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/config.js';

async function getTransporter() {
  const settings = await prisma.emailSettings.findUnique({
    where: { id: 'default' },
  });
  const host = settings?.smtpHost ?? env.smtp.host;
  const port = settings?.smtpPort ?? env.smtp.port;
  const user = settings?.smtpUser ?? env.smtp.user;
  const pass = settings?.smtpPass ?? env.smtp.pass;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });
}

export async function sendEmailWithAttachment(opts: {
  to: string;
  subject: string;
  html: string;
  attachmentPath: string;
  attachmentName: string;
}) {
  const settings = await prisma.emailSettings.findUnique({
    where: { id: 'default' },
  });
  const fromEmail = settings?.fromEmail ?? env.smtp.fromEmail;
  const fromName = settings?.fromName ?? env.smtp.fromName;

  const transporter = await getTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: [
      {
        filename: opts.attachmentName,
        path: opts.attachmentPath,
      },
    ],
  });
}

export async function testSmtpConnection() {
  const transporter = await getTransporter();
  await transporter.verify();
}
