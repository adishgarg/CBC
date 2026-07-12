# CBC Dashboard - Scripts

This folder contains utility scripts for the CBC Dashboard.

## Available Scripts

### 1. OAuth Token Generation - Calendar & Tasks

Generates OAuth refresh token for Google Calendar and Tasks API access.

**File:** `get-oauth-token.js`

**Usage:**
```bash
node scripts/get-oauth-token.js
```

**Scopes:**
- `calendar.readonly` - Read calendar events
- `tasks.readonly` - Read tasks

**Environment Variables Set:**
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REFRESH_TOKEN`

### 2. OAuth Token Generation - Drive & Sheets

Generates OAuth refresh token for Google Drive and Sheets API access (with different credentials).

**File:** `get-drive-oauth-token.js`

**Usage:**
```bash
node scripts/get-drive-oauth-token.js
```

**Scopes:**
- `drive` - Full access to Google Drive
- `spreadsheets.readonly` - Read Google Sheets

**Environment Variables Set:**
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`

### 3. Seed Script

Seeds the database with test users.

**File:** `seed.js`

**Usage:**
```bash
yarn seed
# or
npm run seed
```

## Setup

1. Install dependencies:
```bash
yarn install
# or
npm install
```

2. Create a `.env.local` file with your MongoDB connection:
```bash
MONGODB_URI=mongodb://localhost:27017/CBCdashboard
JWT_SECRET=your-secret-key
```

## Run Seed Script

```bash
yarn seed
# or
npm run seed
```

## Default Users

After seeding, you can login with:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

**Regular User:**
- Email: `user@example.com`
- Password: `user123`

## Notes

- The script will skip users that already exist
- Passwords are hashed using bcrypt before storing
- Safe to run multiple times

---

### 2. Google Drive OAuth Token Generator

**For Personal Gmail Accounts** - Generates a refresh token for OAuth 2.0 authentication.

#### Why Use This?

Personal Gmail accounts cannot use service accounts to upload files, even to shared folders. You need to use OAuth 2.0 with your personal credentials instead.

#### Prerequisites

1. **Create OAuth 2.0 Credentials:**
   - Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Choose **"Web application"**
   - Add authorized redirect URI: `http://localhost:3000/oauth2callback`
   - Click **Create** and save the **Client ID** and **Client Secret**

2. **Configure OAuth Consent Screen:**
   - Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - Choose **"External"** and click **Create**
   - Fill in App name, User support email, Developer contact email
   - Click **Save and Continue** through all pages
   - Under **Test users**, add your Gmail address
   - Click **Save**

#### Setup

1. Open `scripts/get-oauth-token.js`
2. Replace `YOUR_CLIENT_ID_HERE` with your OAuth Client ID
3. Replace `YOUR_CLIENT_SECRET_HERE` with your OAuth Client Secret

#### Run OAuth Setup

```bash
node scripts/get-oauth-token.js
```

#### Follow the prompts

1. The script will show you a URL - open it in your browser
2. Sign in with your Google account
3. Authorize the application
4. Copy the code from the redirect URL (after `?code=...`)
5. Paste it into the terminal
6. The script will output your refresh token

#### Add to .env

Copy the output and add to your `.env` or `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
DRIVE_FOLDER_ID=your-folder-id
```

**Remove these if you're switching from service account:**
```env
# Remove or comment out:
# GOOGLE_CLIENT_EMAIL=...
# GOOGLE_PRIVATE_KEY=...
# GOOGLE_IMPERSONATE_USER_EMAIL=...
```

---

### 3. Google Drive Setup Checker

Diagnostic tool to verify your Google Drive configuration and ensure files can be uploaded.

#### Why Use This?

Service accounts require files to be stored on **Shared Drives** (not personal drives) because service accounts don't have storage quota. This script helps you verify your setup is correct.

#### Required Environment Variables

```bash
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DRIVE_FOLDER_ID=your-shared-drive-folder-id

# Optional: For domain-wide delegation
GOOGLE_IMPERSONATE_USER_EMAIL=admin@yourdomain.com
```

#### Run Drive Check

```bash
yarn check-drive
# or
npm run check-drive
```

#### What It Checks

- ✅ Environment variables are configured
- ✅ Service account authentication works
- ✅ Folder exists and is accessible
- ✅ Folder is on a Shared Drive (required!)
- ✅ Permissions to create/list files
- ✅ Test file upload and deletion

#### Common Issues

**Error: "Service Accounts do not have storage quota"**
- Your `DRIVE_FOLDER_ID` points to a folder in the service account's personal drive
- **Solution**: Create a folder on a Shared Drive and update `DRIVE_FOLDER_ID`

**Error: "File not found"**
- The folder ID is incorrect or not shared with the service account
- **Solution**: Share the Shared Drive with your service account email

#### Setting Up a Shared Drive

1. In Google Drive, create or access a Shared Drive
2. Create a folder inside that Shared Drive
3. Click "Share" on the Shared Drive (not just the folder)
4. Add your service account email with "Content Manager" or "Manager" access
5. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
6. Set `DRIVE_FOLDER_ID=FOLDER_ID` in your `.env` file
