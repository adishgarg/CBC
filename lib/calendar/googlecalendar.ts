import { google } from "googleapis";

// Use dedicated OAuth 2.0 credentials for Calendar (personal account)
const oauthClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const oauthClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const oauthRefreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks.readonly"
];

// Calendar always uses OAuth 2.0 for personal account access
if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
  throw new Error(
    "Google Calendar authentication not configured. Please set:" +
    "\nGOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN" +
    "\n(or fall back to GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)"
  );
}

console.log("Using OAuth 2.0 authentication for Google Calendar");
const oauth2Client = new google.auth.OAuth2(
  oauthClientId,
  oauthClientSecret,
  "http://localhost:3000/oauth2callback"
);
oauth2Client.setCredentials({
  refresh_token: oauthRefreshToken,
});

const auth = oauth2Client;

const calendar = google.calendar({
  version: "v3",
  auth,
});

/**
 * List calendar events from primary calendar
 */
export async function listCalendarEvents(
  maxResults: number = 50,
  timeMin?: Date,
  timeMax?: Date
) {
  try {
    const now = new Date();
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: (timeMin || now).toISOString(),
      timeMax: timeMax?.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error("Error fetching calendar events:", error.message);
    throw new Error(`Failed to fetch calendar events: ${error.message}`);
  }
}

/**
 * Get a specific calendar event
 */
export async function getCalendarEvent(eventId: string) {
  try {
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching calendar event:", error.message);
    throw new Error(`Failed to fetch calendar event: ${error.message}`);
  }
}
