// Email service using Nodemailer - modular and easy to configure

import nodemailer from "nodemailer";
import { EmailOptions, EmailConfig } from "./email/types";

// Get email configuration from environment variables
const getEmailConfig = (): EmailConfig => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in your environment variables."
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    from: from!,
  };
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }
  return transporter;
};

/**
 * Send an email
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with email result
 */
export const sendEmail = async (options: EmailOptions) => {
  try {
    const config = getEmailConfig();
    const transporter = getTransporter();

    // Convert to array if single recipient
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const mailOptions = {
      from: config.from,
      to: recipients.join(", "),
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      recipients,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: info.messageId,
      recipients,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Send multiple emails (batch)
 * @param emails - Array of email options
 * @returns Promise with results for each email
 */
export const sendBatchEmails = async (emails: EmailOptions[]) => {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`Batch email results: ${successful} sent, ${failed} failed`);

  return results.map((result, index) => ({
    email: emails[index],
    status: result.status,
    data: result.status === "fulfilled" ? result.value : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
};

/**
 * Verify SMTP connection
 * @returns Promise<boolean> - true if connection successful
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection verification failed:", error);
    return false;
  }
};

// Export email templates for easy access
export * from "./email/templates";
export * from "./email/types";
