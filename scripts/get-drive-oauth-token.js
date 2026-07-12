/**
 * Script to generate OAuth refresh token for Google Drive & Sheets
 * 
 * This script generates OAuth tokens for Drive and Sheets access.
 * Use different OAuth credentials from Calendar/Tasks for separation.
 * 
 * Run this once to get your refresh token for .env file
 */

const { google } = require('googleapis');
const readline = require('readline');

require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing OAuth credentials in .env file\n');
  console.error('Required:');
  console.error('- GOOGLE_DRIVE_CLIENT_ID');
  console.error('- GOOGLE_DRIVE_CLIENT_SECRET\n');
  process.exit(1);
}

// Minimal scopes for CBC Dashboard
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force to get refresh token
});

console.log('\n🔐 Generate OAuth Refresh Token for Google Drive & Sheets\n');
console.log('Note: Use DIFFERENT OAuth credentials from Calendar/Tasks for separation.');
console.log('      Create a new OAuth 2.0 Client ID in Google Cloud Console if needed.\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the application');
console.log('3. Copy the code from the URL (after ?code=...)\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.log('\n⚠️ No refresh token returned.');
      console.log('Remove app access from your Google account and retry with prompt: consent\n');
    }
    
    console.log('\n✅ Success! Add these to your .env file:\n');
    console.log('# Google Drive OAuth');
    console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_REDIRECT_URI=${REDIRECT_URI}`);
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
  }
  
  rl.close();
});
