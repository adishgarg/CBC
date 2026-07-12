# Google Drive Upload to WhatsApp Webhook Setup

This project exposes a webhook at `/api/drive-webhook` that can turn a Drive upload into a WhatsApp notification. The recommended approach is:

1. Keep project uploads in a dedicated Drive folder.
2. Use Google Apps Script to poll that folder on a timer.
3. When a new file appears, send its metadata to the dashboard webhook.
4. The dashboard looks up the project recipients and sends WhatsApp messages.

## Why polling

Google Apps Script does not provide a dependable instant trigger for every direct Drive upload. A time-driven trigger every 1, 5, or 10 minutes is the simplest reliable option.

## What the webhook expects

The dashboard endpoint expects JSON like this (note: do NOT send a projectId — the dashboard resolves the project using `folderId`):

```json
{
  "folderId": "drive-folder-id",
  "folderName": "Architecture",
  "fileId": "drive-file-id",
  "fileName": "plan.pdf",
  "fileUrl": "https://drive.google.com/file/d/.../view",
  "mimeType": "application/pdf",
  "uploadedAt": "2026-05-23T10:00:00.000Z",
  "note": "Optional note"
}
```

The webhook route in [app/api/drive-webhook/route.ts](/Users/adishgarg/Desktop/CBCdashboard/app/api/drive-webhook/route.ts) validates `folderId`, `fileUrl`, `fileName`, and the shared secret.

## Setup steps

1. Create a Google Sheet to store the watched folders.
2. Add a sheet named `DriveWatchConfig` with these headers in row 1: `enabled`, `projectId`, `folderId`, `projectName`, `note`.
3. Open Apps Script and paste the script from [scripts/google-drive-upload-watcher.js](/Users/adishgarg/Desktop/CBCdashboard/scripts/google-drive-upload-watcher.js).
4. Set these script properties: `WEBHOOK_URL`, `WEBHOOK_SECRET`, `CONFIG_SPREADSHEET_ID`, `CONFIG_SHEET_NAME`.
5. Add one config row per Drive folder.
6. Create a time-driven trigger for `onDriveFolderUploadTrigger`.

## Suggested trigger interval

- 1 minute if you want faster alerts and can tolerate quota usage.
- 5 minutes for a balanced default.
- 10 minutes if the folder is quiet and volume is low.

## Recommended config example

| enabled | projectId | folderId | projectName | note |
| --- | --- | --- | --- | --- |
| TRUE | 101 | 1AbC... | AV Marketing HQ | New direct uploads |

## What happens after a new file is found

The Apps Script sends the payload to the dashboard webhook. The dashboard then:

1. Finds the project by `projectId`.
2. Collects client and team phone numbers.
3. Calls the WhatsApp notifier in [lib/whatsapp.ts](/Users/adishgarg/Desktop/CBCdashboard/lib/whatsapp.ts).

## Operational notes

- The script stores seen file IDs in script properties to avoid duplicate notifications.
- If you move an old file into the watched folder, it may be treated as a new upload the first time the script sees it.
- If you need strict real-time delivery later, move from polling to a Drive API watch service.
