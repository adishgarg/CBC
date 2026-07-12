# WhatsApp Notification System Setup

This guide will help you configure the WhatsApp notification system using Meta's WhatsApp Business API.

## Environment Variables

Add the following variables to your `.env.local` file:

```
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
WHATSAPP_ACCESS_TOKEN=<your_access_token>
```

## Getting Your Credentials

### 1. WhatsApp Business Account Phone Number ID
- Go to [Meta Business Manager](https://business.facebook.com)
- Navigate to WhatsApp Manager
- Find your WhatsApp Business Account
- Go to "Phone Numbers" and select your number
- The "Phone Number ID" will be displayed on the phone number details page

### 2. Access Token
- In WhatsApp Manager, go to "API Setup"
- Under "Temporary Access Token", generate a token
- Copy this token and add it to your `.env.local`

**⚠️ Security Note**: Never share your access token. Consider using a long-lived access token for production.

## Notification Events

WhatsApp notifications are sent in the following scenarios:

### 1. Project Creation
- **Recipients**: All clients (from the clients array) and team members
- **Message**: Greeting message with link-based system explanation

### 2. Client Updates
- **Recipients**: Newly added clients and team members
- **Message**: Project update noting the added client details

### 3. File Upload
- **Recipients**: All clients and team members
- **Message**: File name, size, and uploader name

### 4. Meeting Minutes
- **Recipients**: All clients and team members (both on creation and updates)
- **Message**: Meeting date/time, creator name, and content preview

## Phone Number Format

Clients and team members need phone numbers in their profiles:
- **Clients**: Add `phoneNumber` field to client objects (e.g., `+1234567890` or `234567890`)
- **Team Members**: Add `phone` field to user profiles

Phone numbers are automatically sanitized:
- Non-digits are removed
- 10-digit US numbers are assumed to have country code +1
- International numbers should include country code

## Message Customization

To customize messages, edit the `/lib/whatsapp.ts` file:

```typescript
// Project creation greeting message
export async function notifyProjectCreated(
  projectName: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[],
  projectLink: string
): Promise<void> {
  const message = `Your custom message here...`;
  // ...
}

// Update notifications
export async function notifyProjectUpdate(
  projectName: string,
  updateType: "file_uploaded" | "meeting_minutes" | "other",
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[],
  details?: string
): Promise<void> {
  // Messages are customized per update type
}
```

## Troubleshooting

### Messages Not Sending
1. Check that `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are set correctly
2. Verify phone numbers are stored with the correct field names (`phoneNumber` for clients, `phone` for team members)
3. Check server logs for WhatsApp API errors

### Phone Number Issues
- Ensure phone numbers include country code
- Remove formatting characters (spaces, dashes, parentheses)
- Test with your own phone number first

### API Rate Limits
- Meta's WhatsApp API has rate limits
- Notifications are sent asynchronously to avoid blocking
- Check [Meta's documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference) for limits

## Testing

To test the system:

1. Create a test project with phone numbers added to clients
2. Check WhatsApp for incoming messages
3. Upload a file to the project
4. Create meeting minutes
5. Monitor server logs for any errors

## API Reference

### sendWhatsAppMessage(phoneNumber, message)
Sends a single WhatsApp text message.

**Parameters**:
- `phoneNumber` (string): Phone number including country code
- `message` (string): Message text

**Returns**: Promise<boolean> - Success status

### notifyProjectCreated(projectName, clientPhoneNumbers, teamPhoneNumbers, projectLink)
Sends project creation greeting to clients and team.

### notifyProjectUpdate(projectName, updateType, clientPhoneNumbers, teamPhoneNumbers, details)
Sends update notifications for file uploads or meeting minutes.

**Update Types**:
- `"file_uploaded"`: File upload notification
- `"meeting_minutes"`: Meeting minutes notification
- `"other"`: Generic update notification
