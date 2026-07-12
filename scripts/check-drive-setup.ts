import "dotenv/config";
import { google } from "googleapis";

/**
 * Diagnostic script to verify Google Drive configuration
 * This checks if your DRIVE_FOLDER_ID points to a Shared Drive
 */

async function checkDriveSetup() {
  console.log("🔍 Checking Google Drive Configuration...\n");

  // Check environment variables
  const requiredEnvVars = [
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "DRIVE_FOLDER_ID",
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:");
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error("\nPlease add these to your .env file\n");
    process.exit(1);
  }

  console.log("✅ All required environment variables are set\n");

  // Initialize Google Drive
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const impersonateUser = process.env.GOOGLE_IMPERSONATE_USER_EMAIL;
  const driveFolderId = process.env.DRIVE_FOLDER_ID!;

  const auth = impersonateUser
    ? new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
        subject: impersonateUser,
      })
    : new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

  const drive = google.drive({ version: "v3", auth });

  try {
    // Test authentication
    console.log("🔐 Testing authentication...");
    const aboutRes = await drive.about.get({ fields: "user" });
    console.log(`✅ Authenticated as: ${aboutRes.data.user?.emailAddress || clientEmail}\n`);

    // Check the root folder
    console.log(`📁 Checking folder: ${driveFolderId}\n`);
    
    const folderRes = await drive.files.get({
      fileId: driveFolderId,
      fields: "id, name, mimeType, driveId, parents, owners, capabilities",
      supportsAllDrives: true,
    });

    const folder = folderRes.data;

    console.log("Folder Information:");
    console.log(`   Name: ${folder.name}`);
    console.log(`   ID: ${folder.id}`);
    console.log(`   Type: ${folder.mimeType}`);
    console.log(`   Drive ID: ${folder.driveId || "None (Personal Drive)"}`);
    console.log(`   Owners: ${folder.owners?.map(o => o.emailAddress).join(", ") || "Unknown"}\n`);

    // Check if it's on a Shared Drive
    if (folder.driveId) {
      console.log("✅ SUCCESS: This folder is on a Shared Drive!");
      console.log("   File uploads should work correctly.\n");

      // Get Shared Drive info
      try {
        const driveRes = await drive.drives.get({
          driveId: folder.driveId,
        });
        console.log(`   Shared Drive Name: ${driveRes.data.name}`);
      } catch (err) {
        console.log("   (Could not fetch Shared Drive details)\n");
      }

      // Check permissions
      console.log("\n🔑 Checking permissions...");
      if (folder.capabilities?.canAddChildren) {
        console.log("✅ Can create files in this folder");
      } else {
        console.log("⚠️  WARNING: May not have permission to create files");
      }

      if (folder.capabilities?.canListChildren) {
        console.log("✅ Can list files in this folder");
      } else {
        console.log("⚠️  WARNING: May not have permission to list files");
      }

    } else {
      console.log("❌ ERROR: This folder is NOT on a Shared Drive!");
      console.log("\n📝 To fix this:\n");
      console.log("1. Create or access a Shared Drive in Google Drive");
      console.log("2. Create a folder on that Shared Drive");
      console.log("3. Share the Shared Drive with your service account:");
      console.log(`   ${clientEmail}`);
      console.log("4. Update DRIVE_FOLDER_ID in your .env file with the new folder's ID\n");
      console.log("💡 Tip: The folder ID is in the URL when you open it in Drive:");
      console.log("   https://drive.google.com/drive/folders/YOUR_FOLDER_ID\n");
      process.exit(1);
    }

    // Test creating a file
    console.log("\n🧪 Testing file creation...");
    try {
      const testFile = await drive.files.create({
        requestBody: {
          name: `test-${Date.now()}.txt`,
          parents: [driveFolderId],
          mimeType: "text/plain",
        },
        media: {
          mimeType: "text/plain",
          body: "This is a test file from the diagnostic script",
        },
        fields: "id, name, webViewLink",
        supportsAllDrives: true,
      });

      console.log(`✅ Test file created successfully: ${testFile.data.name}`);
      console.log(`   View at: ${testFile.data.webViewLink}`);

      // Clean up test file
      await drive.files.delete({
        fileId: testFile.data.id!,
        supportsAllDrives: true,
      });
      console.log("✅ Test file deleted\n");

    } catch (testErr: any) {
      console.log("❌ Test file creation failed:");
      console.log(`   ${testErr.message}\n`);
    }

    console.log("✨ Drive configuration check complete!\n");

  } catch (error: any) {
    console.error("❌ Error checking Drive setup:");
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes("File not found")) {
      console.error("💡 The DRIVE_FOLDER_ID doesn't exist or is not accessible");
      console.error("   Check that the folder ID is correct and shared with:");
      console.error(`   ${clientEmail}\n`);
    }
    
    process.exit(1);
  }
}

checkDriveSetup();
