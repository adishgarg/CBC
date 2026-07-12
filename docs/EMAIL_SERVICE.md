# Email Service Documentation

A modular email system built with Nodemailer for sending transactional emails to users and customers.

## 📋 Features

- **Modular Template System**: Easily add, remove, or modify email templates
- **Batch Email Support**: Send multiple emails efficiently
- **Type-Safe**: Full TypeScript support with proper types
- **Responsive HTML Templates**: Beautiful, mobile-friendly email designs
- **SMTP Configuration**: Works with any SMTP provider (Gmail, SendGrid, AWS SES, etc.)
- **Error Handling**: Comprehensive error handling and logging
- **Connection Verification**: Test SMTP connection before sending

## 🚀 Setup

### 1. Install Dependencies (Already Done)
```bash
yarn add nodemailer
yarn add -D @types/nodemailer
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@CBCdashboard.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. SMTP Provider Setup

#### Gmail
1. Enable 2FA on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`
4. Settings:
   - Host: `smtp.gmail.com`
   - Port: `587`

#### SendGrid
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Password: Your SendGrid API key

#### AWS SES
- Host: `email-smtp.{region}.amazonaws.com`
- Port: `587`
- User: Your SMTP username
- Password: Your SMTP password

## 📁 File Structure

```
lib/
├── email.ts                    # Core email service
└── email/
    ├── types.ts               # TypeScript interfaces
    └── templates.ts           # Email templates

app/api/email/
├── test/route.ts              # Test SMTP connection
├── employee-credentials/      # Send employee credentials
│   └── route.ts
└── project-notification/      # Notify team about projects
    └── route.ts
```

## 📧 Available Email Templates

### 1. Welcome Email
```typescript
import { sendEmail, welcomeEmail } from "@/lib/email";

const emailContent = welcomeEmail({
  name: "John Doe",
  email: "john@example.com",
});

await sendEmail({
  to: "john@example.com",
  subject: emailContent.subject,
  html: emailContent.html,
  text: emailContent.text,
});
```

### 2. Project Created Notification
```typescript
import { sendEmail, projectCreatedEmail } from "@/lib/email";

const emailContent = projectCreatedEmail({
  projectName: "New Website",
  clientName: "Acme Corp",
  teamMemberName: "Jane Smith",
  startDate: "January 15, 2026",
  projectUrl: "http://localhost:3000/dashboard/projects/123",
});

await sendEmail({
  to: "jane@example.com",
  subject: emailContent.subject,
  html: emailContent.html,
  text: emailContent.text,
});
```

### 3. Project Update Notification
```typescript
import { sendEmail, projectUpdateEmail } from "@/lib/email";

const emailContent = projectUpdateEmail({
  projectName: "New Website",
  updateMessage: "Design phase completed. Moving to development.",
  updatedBy: "John Manager",
  projectUrl: "http://localhost:3000/dashboard/projects/123",
});
```

### 4. Employee Account Created
```typescript
import { sendEmail, employeeCreatedEmail } from "@/lib/email";

const emailContent = employeeCreatedEmail({
  name: "New Employee",
  email: "employee@example.com",
  password: "TempPass123!",
  role: "user",
  department: "engineering",
  loginUrl: "http://localhost:3000/login",
});
```

### 5. Password Reset
```typescript
import { sendEmail, passwordResetEmail } from "@/lib/email";

const emailContent = passwordResetEmail({
  name: "John Doe",
  resetUrl: "http://localhost:3000/reset-password?token=abc123",
  expiresIn: "1 hour",
});
```

## 🔧 API Endpoints

### Test SMTP Connection
```bash
# Verify connection
GET /api/email/test

# Send test email
POST /api/email/test
{
  "testEmail": "test@example.com"
}
```

### Send Employee Credentials
```bash
POST /api/email/employee-credentials
{
  "employeeName": "John Doe",
  "employeeEmail": "john@example.com",
  "password": "TempPass123!",
  "role": "user",
  "department": "engineering"
}
```

### Send Project Notifications
```bash
POST /api/email/project-notification
{
  "projectId": "123",
  "projectName": "New Website",
  "clientName": "Acme Corp",
  "startDate": "2026-01-15",
  "teamMemberIds": ["user_id_1", "user_id_2"]
}
```

## 💻 Usage Examples

### Single Email
```typescript
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: "user@example.com",
  subject: "Hello!",
  html: "<h1>Hello World</h1>",
  text: "Hello World",
});
```

### Multiple Recipients
```typescript
await sendEmail({
  to: ["user1@example.com", "user2@example.com"],
  subject: "Team Announcement",
  html: "<p>Important update...</p>",
});
```

### Batch Emails
```typescript
import { sendBatchEmails } from "@/lib/email";

const emails = [
  { to: "user1@example.com", subject: "Hi User 1", html: "..." },
  { to: "user2@example.com", subject: "Hi User 2", html: "..." },
];

const results = await sendBatchEmails(emails);
console.log(results);
```

## ➕ Adding New Email Templates

1. **Define the data interface** in `lib/email/types.ts`:
```typescript
export interface MyCustomEmailData {
  userName: string;
  customField: string;
}
```

2. **Create the template** in `lib/email/templates.ts`:
```typescript
export const myCustomEmail = (data: MyCustomEmailData) => {
  const content = `
    <h1>Hello ${data.userName}</h1>
    <p>${data.customField}</p>
  `;
  
  return {
    subject: "My Custom Email",
    html: emailWrapper(content),
    text: `Hello ${data.userName}. ${data.customField}`,
  };
};

// Add to exports
export const emailTemplates = {
  // ...existing templates
  myCustom: myCustomEmail,
};
```

3. **Use the template**:
```typescript
import { sendEmail, myCustomEmail } from "@/lib/email";

const emailContent = myCustomEmail({
  userName: "John",
  customField: "Your custom message",
});

await sendEmail({
  to: "user@example.com",
  ...emailContent,
});
```

## 🧪 Testing

Test your SMTP configuration:
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-email@example.com"}'
```

## 🔒 Security Notes

- Never commit your `.env` file with real credentials
- Use app-specific passwords for Gmail (not your main password)
- Consider using a dedicated email service like SendGrid or AWS SES for production
- Keep `SMTP_PASSWORD` secure and rotate it regularly
- Use environment variables, never hardcode credentials

## 🐛 Troubleshooting

### "Authentication failed"
- Check your SMTP credentials
- For Gmail, ensure you're using an App Password
- Verify 2FA is enabled (for Gmail)

### "Connection timeout"
- Check your SMTP host and port
- Verify firewall settings
- Try port 587 (TLS) or 465 (SSL)

### "Self-signed certificate"
- For development, you might need to add `tls: { rejectUnauthorized: false }` to the transporter config (not recommended for production)

## 📝 Notes

- Emails are sent asynchronously
- Failed emails are logged to console
- Consider using a queue system (Bull, BullMQ) for high-volume email sending
- Monitor your SMTP provider's rate limits
- Keep email templates mobile-responsive

## 🔄 Integration with Existing Features

### When Creating an Employee
```typescript
// In /app/api/users/route.ts
const result = await sendEmail({
  to: newUser.email,
  ...employeeCreatedEmail({
    name: newUser.name,
    email: newUser.email,
    password: originalPassword,
    role: newUser.role,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  }),
});
```

### When Creating a Project
```typescript
// In /app/api/projects/route.ts
const teamMembers = await User.find({ _id: { $in: project.teamMembers } });
await sendBatchEmails(
  teamMembers.map(member => ({
    to: member.email,
    ...projectCreatedEmail({...}),
  }))
);
```
