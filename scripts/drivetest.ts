import "dotenv/config";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

export async function createFolder(
  name: string,
  parentFolderId?: string
) {
  const fileMetadata: any = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    // THIS LINE IS THE CRITICAL ONE
    parents: [parentFolderId || process.env.DRIVE_FOLDER_ID!],
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name, parents",
  });

  console.log("Created folder:", folder.data);
  return folder.data.id;
}

async function testDrive() {
  try {
    console.log("SCRIPT STARTED");
    console.log("DRIVE_FOLDER_ID:", process.env.DRIVE_FOLDER_ID);

    const folderId = await createFolder("VISIBLE_TEST_FOLDER");
    console.log("Final Folder ID:", folderId);
  } catch (error) {
    console.error("Drive Test Error:", error);
  }
}

testDrive();