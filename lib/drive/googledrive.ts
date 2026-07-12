import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// Use OAuth for Drive (with separate credentials from Calendar/Tasks)
const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

// Drive uses OAuth authentication
if (!clientId || !clientSecret || !refreshToken) {
  throw new Error(
    "Google Drive authentication not configured. Please set:" +
    "\nGOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN" +
    "\n(or fall back to GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)"
  );
}

console.log("Using OAuth authentication for Google Drive");
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret
);

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

const auth = oauth2Client;

const drive = google.drive({
  version: "v3",
  auth,
});

// Helper function to check if a folder is on a Shared Drive
async function getFileMetadata(fileId: string) {
  try {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, driveId, parents",
      supportsAllDrives: true,
    });
    return res.data;
  } catch (error) {
    throw new Error(`Failed to get file metadata: ${(error as Error).message}`);
  }
}

export async function createFolder(name: string, parentFolderId?: string | null) {
  // If parentFolderId is explicitly null, don't use DRIVE_FOLDER_ID
  const effectiveParent = parentFolderId === null ? undefined : (parentFolderId || process.env.DRIVE_FOLDER_ID);

  const requestBody: drive_v3.Schema$File = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  // Only add parents if effectiveParent exists
  if (effectiveParent) {
    requestBody.parents = [effectiveParent];
  }

  const res = await drive.files.create({
    requestBody,
    fields: "id, name, parents, webViewLink, webContentLink, driveId",
    supportsAllDrives: true,
    supportsTeamDrives: true,
  });

  return res.data.id!;
}

// Helper function to find or create a folder by name (searches in parent or root)
export async function getOrCreateFolder(name: string, parentFolderId?: string | null): Promise<string> {
  // Search for existing folder
  const query = parentFolderId 
    ? `name='${name}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  try {
    const res = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    // Folder doesn't exist, create it
    return await createFolder(name, parentFolderId);
  } catch (error) {
    throw new Error(`Failed to get or create folder: ${(error as Error).message}`);
  }
}

export async function uploadFileToFolder(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  parentFolderId: string
) {
  if (!parentFolderId) {
    throw new Error("parentFolderId is required for file upload");
  }

  let file: drive_v3.Schema$File;
  try {
    const res = (await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [parentFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: "id, name, webViewLink, webContentLink, parents, driveId",
      supportsAllDrives: true,
      supportsTeamDrives: true,
    })) as { data: drive_v3.Schema$File };
    file = res.data;
  } catch (error) {
    const message =
      (error as { message?: string; response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ||
      (error as { message?: string })?.message ||
      "Failed to upload file to Drive";
    throw new Error(message);
  }

  return {
    fileId: file.id,
    name: file.name,
    viewLink: file.webViewLink,
    downloadLink: file.webContentLink,
  };
}

export async function deleteFile(fileId: string) {
  if (!fileId) {
    throw new Error("fileId is required for file deletion");
  }

  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
      supportsTeamDrives: true,
    });
    return { success: true, fileId };
  } catch (error) {
    const message =
      (error as { message?: string; response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ||
      (error as { message?: string })?.message ||
      "Failed to delete file from Drive";
    throw new Error(message);
  }
}

export async function listFilesInFolder(folderId: string) {
  if (!folderId) {
    throw new Error("folderId is required to list files");
  }

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime)",
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true,
    });

    return res.data.files || [];
  } catch (error) {
    const message =
      (error as { message?: string; response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ||
      (error as { message?: string })?.message ||
      "Failed to list files from Drive";
    throw new Error(message);
  }
}

export async function getFileContent(fileId: string) {
  if (!fileId) {
    throw new Error("fileId is required to fetch file content");
  }

  const getExportMimeType = (mimeType: string) => {
    switch (mimeType) {
      case "application/vnd.google-apps.document":
        return "application/pdf";
      case "application/vnd.google-apps.spreadsheet":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "application/vnd.google-apps.presentation":
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "application/vnd.google-apps.drawing":
        return "image/png";
      case "application/vnd.google-apps.form":
        return "application/pdf";
      default:
        return null;
    }
  };

  try {
    const metadataRes = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, modifiedTime",
      supportsAllDrives: true,
    });

    const mimeType = metadataRes.data.mimeType || "application/octet-stream";
    const exportMimeType = getExportMimeType(mimeType);

    const contentRes = exportMimeType
      ? await drive.files.export(
          {
            fileId,
            mimeType: exportMimeType,
          },
          {
            responseType: "arraybuffer",
          }
        )
      : await drive.files.get(
          {
            fileId,
            alt: "media",
            supportsAllDrives: true,
          },
          {
            responseType: "arraybuffer",
          }
        );

    const buffer = Buffer.from(contentRes.data as ArrayBuffer);

    return {
      name: metadataRes.data.name || "",
      mimeType: exportMimeType || mimeType,
      modifiedTime: metadataRes.data.modifiedTime || "",
      buffer,
    };
  } catch (error) {
    const message =
      (error as { message?: string; response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ||
      (error as { message?: string })?.message ||
      "Failed to fetch file content from Drive";
    throw new Error(message);
  }
}
