# Google Sheets Calendar Integration

This feature allows you to automatically extract dates from a Google Spreadsheet and display them as a calendar on your project detail pages. **Each project can be linked to its own separate Google Sheet**.

## Setup Instructions

### 1. Update OAuth Token (Required for First-Time Setup)

The Google Sheets API requires a new OAuth scope. You need to regenerate your refresh token:

```bash
cd scripts
node get-oauth-token.js
```

Follow the on-screen instructions:
1. Open the provided URL in your browser
2. Authorize the application (you'll see new "View your Google Spreadsheets" permission)
3. Copy the authorization code from the URL
4. Paste it into the terminal
5. Update your `.env` file with the new `GOOGLE_REFRESH_TOKEN`

### 2. Link a Google Sheet to a Project

**Via Project Detail Page UI (Recommended):**
1. Navigate to any project detail page
2. Find the "Project Schedule" section
3. Click the "Link Sheet" button
4. Paste your Google Sheets URL or ID
5. Click "Link Spreadsheet"

**Via API Call (Alternative):**
```javascript
// PATCH /api/projects/:projectId
{
  "spreadsheetId": "1abc123def456..." // The ID from the Google Sheets URL
}
```

**Finding the Spreadsheet ID:**
From a Google Sheets URL like:
```
https://docs.google.com/spreadsheets/d/1abc123def456xyz/edit
```
The spreadsheet ID is: `1abc123def456xyz`

You can paste the entire URL into the UI modal - it will automatically extract the ID.

### 3. Prepare Your Google Sheet

**The system will work with ANY sheet format that has date columns!**

The system automatically detects date columns by looking for these keywords in the header row:
- `date`
- `deadline`
- `due`
- `start`
- `end`
- `scheduled`
- `time`

**Example Sheet Structures (All Work!):**

**Option 1: Simple Project Timeline**
```
| Milestone     | Start Date | End Date   | Status    |
|---------------|------------|------------|-----------|
| Design Phase  | 2024-03-15 | 2024-04-15 | Active    |
| Development   | 2024-04-16 | 2024-06-30 | Upcoming  |
```

**Option 2: Task List**
```
| Task Name     | Assigned To | Due Date   | Priority |
|---------------|-------------|------------|----------|
| Create mockup | John Doe    | 03/20/2024 | High     |
| Review design | Jane Smith  | 03/25/2024 | Medium   |
```

**Option 3: Event Schedule**
```
| Event         | Description      | Scheduled    | Location  |
|---------------|------------------|--------------|-----------|
| Client Review | Present mockups  | Mar 20, 2024 | Zoom      |
| Team Meeting  | Sprint planning  | 25.03.2024   | Office    |
```

**Supported Date Formats:**
- ISO: `2024-03-15`
- US: `03/15/2024` or `3/15/2024`
- European: `15.03.2024` or `15/03/2024`
- Named: `March 15, 2024` or `Mar 15, 2024`

## How It Works

**Each project is linked to its own separate Google Sheet.** The system is flexible and works with your existing spreadsheet format:

1. **Date Extraction**: The system scans all columns in your spreadsheet looking for date-related headers
2. **Intelligent Parsing**: Dates are parsed from multiple formats automatically
3. **Event Creation**: Each date found creates a calendar event with:
   - **Title**: Combines the first column value + the date column name (e.g., "Milestone 1 - Due Date")
   - **Description**: First 3 columns of the row joined together
   - **Date**: The parsed date
   - **Additional Info**: Full row data available in the event modal

4. **Calendar Display**: Events appear on the project detail page in a visual calendar similar to Google Calendar

## Features

- **📊 Multiple Projects**: Each project can have its own separate Google Sheet
- **🔄 Flexible Format**: Works with any spreadsheet structure that has date columns
- **🔍 Automatic Date Detection**: No need to specify which columns contain dates
- **📅 Multiple Format Support**: Works with various date formats commonly used in spreadsheets
- **⚡ Real-Time Updates**: Fetches latest data from Google Sheets when the calendar is loaded
- **🎨 Visual Calendar**: Uses FullCalendar library with month/list views
- **📝 Event Details**: Click on any date to see the full row information
- **✨ Easy Management**: Link, update, or unlink sheets directly from the project page UI
- **📝 Empty State Handling**: Shows helpful message when no spreadsheet is linked or no dates are found

## UI Components

### LinkSpreadsheetModal Component
Located at: `components/projects/LinkSpreadsheetModal.tsx`

A modal dialog for linking, updating, or unlinking Google Sheets from projects:

**Features:**
- Accepts full Google Sheets URL or just the spreadsheet ID
- Automatically extracts ID from pasted URLs
- Shows current linked spreadsheet (if any)
- Unlink functionality
- Validation and error handling
- Success confirmation

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed
- `projectId: string` - The ID of the project
- `currentSpreadsheetId?: string` - Currently linked spreadsheet ID
- `onLinked: () => void` - Callback after successful link/unlink

### ProjectSheetCalendar Component
Located at: `components/projects/ProjectSheetCalendar.tsx`

**Props:**
- `projectId: string` - The ID of the project to load dates for
- `onLinkSpreadsheet?: () => void` - Optional callback to open the link modal

**Usage:**
```tsx
import ProjectSheetCalendar from "@/components/projects/ProjectSheetCalendar";

<ProjectSheetCalendar 
  projectId={project._id}
  onLinkSpreadsheet={() => setIsLinkModalOpen(true)}
/>
```

## Management

### Linking a Spreadsheet

1. **Via UI (Recommended):**
   - Go to the project detail page
   - Click "Link Sheet" button in the "Project Schedule" section
   - Paste your Google Sheets URL or ID
   - Click "Link Spreadsheet"

2. **Via API:**
   ```bash
   curl -X PATCH /api/projects/:projectId \
     -H "Content-Type: application/json" \
     -d '{"spreadsheetId": "1abc123..."}'
   ```

### Updating a Linked Spreadsheet

1. **Via UI:**
   - Click "Manage Link" button
   - Enter new spreadsheet URL/ID
   - Click "Update Link"

2. **Via API:**
   Same as linking - just PATCH with new spreadsheetId

### Unlinking a Spreadsheet

1. **Via UI:**
   - Click "Manage Link" button
   - Click "Unlink" button
   - Confirm action

2. **Via API:**
   ```bash
   curl -X PATCH /api/projects/:projectId \
     -H "Content-Type: application/json" \
     -d '{"spreadsheetId": null}'
   ```

## API Endpoints

### Update Project (Link/Unlink Spreadsheet)
```
PATCH /api/projects/:projectId
```

**Request Body:**
```json
{
  "spreadsheetId": "1abc123def456xyz"  // or null to unlink
}
```

**Response:**
```json
{
  "message": "Project updated successfully",
  "project": { /* updated project data */ }
}
```

### Get Sheet Dates
```
GET /api/projects/:projectId/sheet-dates
```

Returns all dates extracted from the project's linked spreadsheet.

**Response:**
```json
{
  "success": true,
  "dates": [
    {
      "date": "2024-03-15",
      "title": "Milestone 1 - Due Date",
      "description": "Milestone 1 - Complete design - Active",
      "columnName": "Due Date",
      "rowData": ["Milestone 1", "Complete design", "2024-03-15", "Active"]
    }
  ],
  "spreadsheetId": "1abc123def456xyz"
}
```

## Permissions

- The OAuth credentials need `spreadsheets.readonly` scope
- The Google account used for OAuth must have read access to the spreadsheet
- Spreadsheet can be private; no need to make it public

## Troubleshooting

### No dates appearing in the calendar

1. **Check spreadsheet ID**: Make sure the `spreadsheetId` is correctly set on the project
2. **Verify OAuth token**: Ensure you regenerated the token with the Sheets API scope
3. **Check column headers**: Date columns must have keywords like "date", "deadline", "due", etc.
4. **Date format**: Ensure dates are in a recognized format (see supported formats above)
5. **Spreadsheet access**: The OAuth account must have permission to view the spreadsheet

### "Failed to fetch dates" error

- Check that `GOOGLE_REFRESH_TOKEN` is updated in your `.env` file
- Verify the spreadsheet exists and is accessible
- Check server logs for specific Google API errors

### Dates are not recognized

- Make sure the cell contains a date format, not just text
- Use date picker in Google Sheets or enter dates in ISO format (YYYY-MM-DD)
- Check that the column header contains a date-related keyword

## Project Structure

Each project in the database has an optional `spreadsheetId` field:

```typescript
interface Project {
  _id: string;
  name: string;
  // ... other fields
  spreadsheetId?: string;  // Link to project's Google Sheet
}
```

This allows:
- **Separation of Concerns**: Each project maintains its own timeline/schedule
- **Flexibility**: Different projects can use different sheet formats
- **Privacy**: Project teams only see their project's sheet data
- **Scalability**: No limit on number of projects or sheets

## Architecture

```
Project A → Spreadsheet A → Calendar on Project A Page
Project B → Spreadsheet B → Calendar on Project B Page
Project C → (No sheet)    → Empty state with "Link Sheet" button
```

## Future Enhancements

Potential improvements for this feature:
- ~~UI for linking/unlinking spreadsheets directly from the project page~~ ✅ **Implemented**
- Spreadsheet picker/browser (select from your Google Drive)
- Date range filtering
- Support for time values (currently only dates)
- Two-way sync (update sheet from calendar)
- ~~Multiple sheet support per project~~ ✅ **Each project has its own sheet**
- Custom column mapping (manually specify which columns are dates)
- Caching layer for performance optimization
- Webhook notifications when sheet is updated
- Import sheet data into database for offline access
