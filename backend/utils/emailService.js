const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const fromName = process.env.EMAIL_FROM_NAME || 'TaskFlow Team';
const fromAddress = process.env.RESEND_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
const emailSendTimeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 8000;

const withTimeout = (promise, timeoutMs) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    reject(new Error('Email send timeout'));
  }, timeoutMs);

  promise
    .then((result) => {
      clearTimeout(timer);
      resolve(result);
    })
    .catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
});

const sendInviteEmail = async ({ to, inviteLink, boardTitle, inviterName, role }) => {
  const subject = `${inviterName} invited you to a TaskFlow board`;

  const html = `
    <p><strong>${inviterName}</strong> invited you to join the board 
    <strong>${boardTitle}</strong> as a <strong>${role}</strong>.</p>
    <p><a href="${inviteLink}">Accept the invite</a></p>
    <p>If you did not expect this, you can ignore this email.</p>
  `;

  if (!resend) {
    throw new Error('RESEND_API_KEY is not set');
  }

  if (!fromAddress) {
    throw new Error('RESEND_FROM_ADDRESS or EMAIL_FROM_ADDRESS must be set');
  }

  try {
    const result = await withTimeout(resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject,
      html,
    }), emailSendTimeoutMs);

    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendInviteEmail };