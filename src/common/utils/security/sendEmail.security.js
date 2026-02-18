import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from "../../../../config/config.service.js";

export const sendEmail = async ({ to, subject, html } = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `Saraha App <${SMTP_USER}> `,
      to,
      subject,
      html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
