# Google Authentication Setup

This document explains the dual OAuth authentication setup for Google APIs in the dashboard.

## Architecture

The dashboard uses **two separate OAuth 2.0 credentials** for different Google services:

### 1. OAuth 2.0 - Calendar & Tasks
- **Used by:** Google Calendar, Google Tasks
- **Purpose:** Access user-specific calendar events and personal tasks
- **Scopes:** `calendar.readonly`, `tasks.readonly` (read-only)
- **Script:** `scripts/get-oauth-token.js`
- **Environment Variables:**
  - `GOOGLE_CALENDAR_CLIENT_ID`
  - `GOOGLE_CALENDAR_CLIENT_SECRET`  
  - `GOOGLE_CALENDAR_REFRESH_TOKEN`

### 2. OAuth 2.0 - Drive & Sheets (DIFFERENT credentials)
- **Used by:** Google Drive, Google Sheets
- **Purpose:** Access files, folders, and spreadsheets
- **Scopes:** `drive`, `spreadsheets.readonly`
- **Script:** `scripts/get-drive-oauth-token.js`
- **Environment Variables:**
  - `GOOGLE_DRIVE_CLIENT_ID`
  - `GOOGLE_DRIVE_CLIENT_SECRET`
  - `GOOGLE_DRIVE_REFRESH_TOKEN`

## Why Separate Credentials?

Using separate OAuth credentials provides:
- **Security isolation:** Calendar/Tasks use minimal read-only scopes
- **Access control:** Different Google accounts can be used for each service
- **Scope separation:** Drive requires broader access which is isolated from Calendar/Tasks
- **Better audit trail:** Separate OAuth consents make it clear which services have which permissions

## Setup Instructions

### Step 1: Set up OAuth 2.0 for Calendar & Tasks

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create or select a project**

3. **Enable APIs:**
   - Navigate to "APIs & Services" → "Library"
   - Search and enable:
     - Google Calendar API
     - Google Tasks API

4. **Create OAuth 2.0 credentials:**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: "Calendar & Tasks Client"
   - Add redirect URI: `http://localhost:3000/oauth2callback`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

5. **Update the script:**
   - Edit `scripts/get-oauth-token.js`
   - Replace `CLIENT_ID` and `CLIENT_SECRET` with your values

6. **Generate refresh token:**
   ```bash
   node scripts/get-oauth-token.js
   ```
   - Open the URL in your browser
   - Authorize the application (sign in with your Google account)
   - Copy the code from the redirect URL
   - Paste it into the terminal
   - Copy the **refresh token** from the output

7. **Add to `.env.local`:**
   ```env
   GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id
   GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
   GOOGLE_CALENDAR_REFRESH_TOKEN=your_calendar_refresh_token
   ```

### Step 2: Set up OAuth 2.0 for Drive & Sheets

1. **In Google Cloud Console** (same or different project)

2. **Enable APIs:**
   - Navigate to "APIs & Services" → "Library"
   - Search and enable:
     - Google Drive API
     - Google Sheets API

3. **Create SEPARATE OAuth 2.0 credentials:**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: "Drive & Sheets Client"
   - Add redirect URI: `http://localhost:3000/oauth2callback`
   - Click "Create"
   - Copy the **Client ID** and **Client Secret** (these will be different from Calendar/Tasks)

4. **Update the script:**
   - Edit `scripts/get-drive-oauth-token.js`
   - Replace `CLIENT_ID` and `CLIENT_SECRET` with your **Drive credentials**

5. **Generate refresh token:**
   ```bash
   node scripts/get-drive-oauth-token.js
   ```
   - Open the URL in your browser
   - Authorize the application (you can use the same or different Google account)
   - Copy the code from the redirect URL
   - Paste it into the terminal
   - Copy the **refresh token** from the output

6. **Add to `.env.local`:**
   ```env
   GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
   GOOGLE_DRIVE_CLIENT_SECRET=your_drive_client_secret
   GOOGLE_DRIVE_REFRESH_TOKEN=your_drive_refresh_token
   ```

## Fallback Behavior

For backward compatibility, the system will fall back to legacy environment variables:

- Calendar/Tasks will try `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` if dedicated vars are not set
- Drive/Sheets will also try the same legacy vars if dedicated vars are not set

## Testing

After setup, check the console logs when the app starts:
- "Using OAuth authentication for Google Calendar"
- "Using OAuth authentication for Google Tasks"
- "Using OAuth authentication for Google Drive"
- "Using OAuth authentication for Google Sheets"

## Scopes

### Calendar & Tasks (Read-only)
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/tasks.readonly`

### Drive & Sheets (Full Drive access + read Sheets)
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/spreadsheets.readonly`

## Troubleshooting

### Calendar/Tasks not showing data
- Verify OAuth credentials are correct for Calendar/Tasks
- Check that refresh token hasn't expired
- Regenerate token with `node scripts/get-oauth-token.js`
- Ensure you're using the correct Google account

### Drive/Sheets access denied
- Verify OAuth credentials are correct for Drive/Sheets
- Check that refresh token is valid
- Regenerate token with `node scripts/get-drive-oauth-token.js`
- Ensure the authorized Google account has access to the files/folders
- Verify you're using DIFFERENT credentials from Calendar/Tasks

### Token expired errors
- OAuth refresh tokens can expire if not used for 6 months
- Regenerate tokens using the respective scripts
- The refresh token will automatically generate new access tokens when needed

### Authentication errors
- Check console logs for specific error messages
- Verify all environment variables are set correctly
- Ensure you're not mixing up the two sets of credentials
- Verify APIs are enabled in Google Cloud Console
- Check that redirect URI matches exactly: `http://localhost:3000/oauth2callback`

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use separate OAuth credentials** for production vs development
3. **Regularly rotate** OAuth credentials in production
4. **Use different Google accounts** for testing sensitive operations
5. **Review OAuth consent screens** to ensure minimal scopes are requested
