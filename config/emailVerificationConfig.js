const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dummyprogramtest@gmail.com",
    pass: process.env.PASS,
  },
});

const mailOptions = (to, subject, html) => ({
  from: "'Nested' <dummyprogramtest@gmail.com>",
  to,
  subject,
  html,
});

const sendEmail = (to, subject, html) => {
  const mail = mailOptions(to, subject, html);

  transporter.sendMail(mail, (error, info) => {
    if (error) {
      console.log("Error occurred: " + error.message);
    } else {
      console.log("Email sent successfully!");
      console.log("Message ID: " + info.messageId);
    }
  });
};

const sendEmailVerification = (user) => {
  const htmlTemplate = `<p>Click the following link to verify your email: <a href="http://localhost:3000/verify/${user.verificationToken}">Verify Email</a></p>`;
  sendEmail(user.email, "Email Verification", htmlTemplate);
};

const sendPasswordResetMail = (user) => {
  const htmlTemplate = `<p>Click the following link to reset your password: <a href="http://localhost:3000/reset-password/${user.passwordResetToken}">Reset Password</a></p>`;
  sendEmail(user.email, "Password Reset", htmlTemplate);
};

module.exports = { sendEmailVerification, sendPasswordResetMail };
