import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Nodemailer transporter to use Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address (e.g., yourgmail@gmail.com)
    pass: process.env.EMAIL_PASS  // Your Gmail app-specific password
  }
});

/**
 * Sends an email notification.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} html - The HTML content of the email.
 */
export const sendEmailNotification = async (to: string, subject: string, html: string) => {
  console.log("Preparing to send email:");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", html);
  try {
    const info = await transporter.sendMail({
      from: `"Ehud Fitness" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully. Message ID:", info.messageId);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
};
