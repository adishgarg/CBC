// Email templates - easily add or remove templates as needed

import {
  WelcomeEmailData,
  ProjectCreatedEmailData,
  ProjectUpdateEmailData,
  EmployeeCreatedEmailData,
  PasswordResetEmailData,
  FileUploadEmailData,
  MeetingMinutesEmailData,
  CommentEmailData,
} from "./types";

// Base email wrapper for consistent styling with brand theme
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e7e5e4;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 3px solid #e05d3a;">
              <h2 style="margin: 0; color: #1c1917; font-size: 24px; font-weight: 600;">CBC Dashboard</h2>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #fafaf9; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 4px; color: #78716c; font-size: 12px; line-height: 18px;">© ${new Date().getFullYear()} CBC Dashboard. All rights reserved.</p>
              <p style="margin: 0; color: #a8a29e; font-size: 11px; line-height: 16px;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Welcome email template
export const welcomeEmail = (data: WelcomeEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">Welcome to CBC Dashboard</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      Dear ${data.name},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      Your account has been successfully created. You can now access the CBC Dashboard with the following email address:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0; font-size: 13px; color: #78716c; font-weight: 500;">Email Address</p>
          <p style="margin: 4px 0 0; font-size: 15px; color: #1c1917; font-weight: 600;">${data.email}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #57534e;">
      If you have any questions, please contact the support team.
    </p>
  `;
  
  return {
    subject: "Welcome to CBC Dashboard",
    html: emailWrapper(content),
    text: `Welcome to CBC Dashboard! Hi ${data.name}, Your account has been created successfully with the email: ${data.email}`,
  };
};

// Project created notification
export const projectCreatedEmail = (data: ProjectCreatedEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">New Project Assignment</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      Dear ${data.teamMemberName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      You have been assigned to the following project:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #78716c; font-weight: 500;">Project Name</p>
          <p style="margin: 0 0 16px; font-size: 18px; color: #1c1917; font-weight: 600;">${data.projectName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Client</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #1c1917;">${data.clientName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Start Date</p>
          <p style="margin: 0; font-size: 15px; color: #1c1917;">${data.startDate}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.projectUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">View Project Details →</a>
    </p>
  `;
  
  return {
    subject: `New Project Assignment: ${data.projectName}`,
    html: emailWrapper(content),
    text: `New Project Assignment: ${data.projectName}. Hi ${data.teamMemberName}, You've been added to a new project: ${data.projectName}. Client: ${data.clientName}. Start Date: ${data.startDate}. View details: ${data.projectUrl}`,
  };
};

// Project update notification
export const projectUpdateEmail = (data: ProjectUpdateEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">Project Update</h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      The following project has been updated:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Project Name</p>
          <p style="margin: 0 0 16px; font-size: 18px; color: #1c1917; font-weight: 600;">${data.projectName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Update Details</p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917; line-height: 24px;">${data.updateMessage}</p>
          <p style="margin: 0; font-size: 13px; color: #78716c;">Updated by ${data.updatedBy}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.projectUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">View Project →</a>
    </p>
  `;
  
  return {
    subject: `Project Update: ${data.projectName}`,
    html: emailWrapper(content),
    text: `Project Update: ${data.projectName}. Update: ${data.updateMessage}. Updated by: ${data.updatedBy}. View project: ${data.projectUrl}`,
  };
};

// Employee account created
export const employeeCreatedEmail = (data: EmployeeCreatedEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">Account Created</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      Dear ${data.name},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      Your employee account has been created. Please use the following credentials to log in:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Email</p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917; font-weight: 600; word-break: break-all;">${data.email}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Temporary Password</p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917; font-family: 'Courier New', monospace; font-weight: 600;">${data.password}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Role</p>
          <p style="margin: 0; font-size: 15px; color: #1c1917;">${data.role}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #ef4444; font-weight: 500;">
      Important: Please change your password immediately after your first login.
    </p>
    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.loginUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">Login to Dashboard →</a>
    </p>
  `;
  
  return {
    subject: "Your CBC Dashboard Account",
    html: emailWrapper(content),
    text: `Welcome to the Team! Hi ${data.name}, Your employee account has been created. Email: ${data.email}, Temporary Password: ${data.password}, Role: ${data.role}. Please change your password after first login. Login: ${data.loginUrl}`,
  };
};

// Password reset email
export const passwordResetEmail = (data: PasswordResetEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">Password Reset Request</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      Dear ${data.name},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      We received a request to reset your password. Click the link below to create a new password:
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.resetUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">Reset Password →</a>
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0; font-size: 14px; color: #78716c;">
            This link will expire in <strong style="color: #1c1917;">${data.expiresIn}</strong>
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #57534e;">
      If you did not request a password reset, please ignore this email. Your password will remain unchanged.
    </p>
  `;
  
  return {
    subject: "Password Reset Request - CBC Dashboard",
    html: emailWrapper(content),
    text: `Password Reset Request. Hi ${data.name}, We received a request to reset your password. Reset your password: ${data.resetUrl}. This link will expire in ${data.expiresIn}. If you didn't request this, you can ignore this email.`,
  };
};

// File upload notification
export const fileUploadEmail = (data: FileUploadEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">New File Uploaded</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      A new file has been uploaded to your project:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #78716c; font-weight: 500;">Project</p>
          <p style="margin: 0 0 16px; font-size: 18px; color: #1c1917; font-weight: 600;">${data.projectName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">File Name</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #1c1917; word-break: break-all;">${data.fileName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">File Size</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #1c1917;">${data.fileSize}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Uploaded By</p>
          <p style="margin: 0; font-size: 15px; color: #1c1917;">${data.uploadedBy}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.projectUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">View Project Files →</a>
    </p>
  `;
  
  return {
    subject: `New File: ${data.fileName} - ${data.projectName}`,
    html: emailWrapper(content),
    text: `New File Uploaded: ${data.fileName} (${data.fileSize}) has been uploaded to ${data.projectName} by ${data.uploadedBy}. View project: ${data.projectUrl}`,
  };
};

// Meeting minutes notification
export const meetingMinutesEmail = (data: MeetingMinutesEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">New Meeting Minutes</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      New meeting minutes have been added to your project:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #78716c; font-weight: 500;">Project</p>
          <p style="margin: 0 0 16px; font-size: 18px; color: #1c1917; font-weight: 600;">${data.projectName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Meeting Date & Time</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #1c1917;">${data.meetingDate} at ${data.meetingTime}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Created By</p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917;">${data.createdBy}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Preview</p>
          <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 22px;">${data.preview}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.projectUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">View Full Meeting Minutes →</a>
    </p>
  `;
  
  return {
    subject: `New Meeting Minutes - ${data.projectName}`,
    html: emailWrapper(content),
    text: `New Meeting Minutes for ${data.projectName}. Date: ${data.meetingDate} at ${data.meetingTime}. Created by: ${data.createdBy}. Preview: ${data.preview}. View full minutes: ${data.projectUrl}`,
  };
};

// Comment/remark notification
export const commentEmail = (data: CommentEmailData) => {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1c1917;">New Comment</h1>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #44403c;">
      A new comment has been added to a file in your project:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background-color: #fafaf9; border: 1px solid #e7e5e4;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #78716c; font-weight: 500;">Project</p>
          <p style="margin: 0 0 16px; font-size: 18px; color: #1c1917; font-weight: 600;">${data.projectName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">File</p>
          <p style="margin: 0 0 12px; font-size: 15px; color: #1c1917; word-break: break-all;">${data.fileName}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Comment By</p>
          <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917;">${data.commentBy}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c; font-weight: 500;">Comment</p>
          <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 22px; white-space: pre-wrap;">${data.comment}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #44403c;">
      <a href="${data.projectUrl}" style="color: #e05d3a; text-decoration: none; font-weight: 500;">View All Comments →</a>
    </p>
  `;
  
  return {
    subject: `New Comment on ${data.fileName} - ${data.projectName}`,
    html: emailWrapper(content),
    text: `New Comment on ${data.projectName}. File: ${data.fileName}. Comment by ${data.commentBy}: ${data.comment}. View project: ${data.projectUrl}`,
  };
};

// Export all templates as a map for easy access
export const emailTemplates = {
  welcome: welcomeEmail,
  projectCreated: projectCreatedEmail,
  projectUpdate: projectUpdateEmail,
  employeeCreated: employeeCreatedEmail,
  passwordReset: passwordResetEmail,
  fileUpload: fileUploadEmail,
  meetingMinutes: meetingMinutesEmail,
  comment: commentEmail,
};
