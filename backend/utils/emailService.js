const nodemailer = require('nodemailer');

const smtpHost = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
const smtpPort = Number(process.env.EMAIL_PORT || 587);
let primaryTransporterPromise;
let fallbackTransporterPromise;

const getPrimaryTransporter = async () => {
  if (!primaryTransporterPromise) {
    primaryTransporterPromise = (async () => {
      if (!process.env.EMAIL_PASS) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: process.env.EMAIL_USER || 'apikey',
          pass: process.env.EMAIL_PASS
        }
      });
    })();
  }

  return primaryTransporterPromise;
};

const getFallbackTransporter = async () => {
  if (!fallbackTransporterPromise) {
    fallbackTransporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    })();
  }

  return fallbackTransporterPromise;
};

const fromName = process.env.EMAIL_FROM_NAME || 'TaskFlow Team';
const fromEmail = process.env.EMAIL_FROM_EMAIL || 'invite@taskflow.com';

const sendInviteEmail = async ({ to, inviteLink, boardTitle, inviterName, role }) => {
  const subject = `${inviterName} invited you to a TaskFlow board`;
  const text =
    `${inviterName} invited you to join the board "${boardTitle}" as a ${role}.\n\n` +
    `Accept the invite: ${inviteLink}\n\n` +
    `If you did not expect this, you can ignore this email.`;

  const html = `
    <p><strong>${inviterName}</strong> invited you to join the board <strong>${boardTitle}</strong> as a <strong>${role}</strong>.</p>
    <p><a href="${inviteLink}">Accept the invite</a></p>
    <p>If you did not expect this, you can ignore this email.</p>
  `;

  const primaryTransporter = await getPrimaryTransporter();
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html
  };

  if (primaryTransporter) {
    try {
      const info = await primaryTransporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      if (error && error.code !== 'EAUTH') {
        throw error;
      }
      console.warn('Primary email auth failed. Using test email transport.');
    }
  }

  const fallbackTransporter = await getFallbackTransporter();
  const info = await fallbackTransporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Invite email preview: ${previewUrl}`);
  }

  return info;
};

module.exports = {
  sendInviteEmail
};
