const nodemailer = require('nodemailer');

const smtpHost = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
const smtpPort = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER || 'apikey',
    pass: process.env.EMAIL_PASS
  }
});

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

  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html
  });
};

module.exports = {
  sendInviteEmail
};
