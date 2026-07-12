// Email types and interfaces

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Template data types
export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface ProjectCreatedEmailData {
  projectName: string;
  clientName: string;
  teamMemberName: string;
  startDate: string;
  projectUrl: string;
}

export interface ProjectUpdateEmailData {
  projectName: string;
  updateMessage: string;
  updatedBy: string;
  projectUrl: string;
}

export interface EmployeeCreatedEmailData {
  name: string;
  email: string;
  password: string;
  role: string;
  loginUrl: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn: string;
}

export interface FileUploadEmailData {
  projectName: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  projectUrl: string;
}

export interface MeetingMinutesEmailData {
  projectName: string;
  meetingDate: string;
  meetingTime: string;
  createdBy: string;
  projectUrl: string;
  preview: string; // First few lines of the minutes
}

export interface CommentEmailData {
  projectName: string;
  fileName: string;
  comment: string;
  commentBy: string;
  projectUrl: string;
}
