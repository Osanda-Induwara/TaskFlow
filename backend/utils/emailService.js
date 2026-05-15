const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM_ADDRESS, // taskflow.ad@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD,  // Gmail App Password
  },
});

// top of emailService.js
console.log('Email config:', {
  user: process.env.EMAIL_FROM_ADDRESS,
  passLength: process.env.EMAIL_APP_PASSWORD?.length
});

const fromName = process.env.EMAIL_FROM_NAME || 'TaskFlow Team';

const sendInviteEmail = async ({ to, inviteLink, boardTitle, inviterName, role }) => {
  const subject = `${inviterName} invited you to a TaskFlow board`;

  const html = `
    <p><strong>${inviterName}</strong> invited you to join the board 
    <strong>${boardTitle}</strong> as a <strong>${role}</strong>.</p>
    <p><a href="${inviteLink}">Accept the invite</a></p>
    <p>If you did not expect this, you can ignore this email.</p>
  `;

  try {
    const result = await transporter.sendMail({
      from: `${fromName} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendInviteEmail };