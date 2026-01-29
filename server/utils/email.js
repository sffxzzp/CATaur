const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  await tx.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendEmail
};
