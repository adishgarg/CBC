import { NextRequest, NextResponse } from "next/server";
import { listFilesInFolder } from "@/lib/drive/googledrive";

export async function GET(req: NextRequest) {
  try {
    // Get folderId from query params
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId || !folderId.trim()) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 }
      );
    }

    // List files from Google Drive
    const files = await listFilesInFolder(folderId);

    // Transform the response to match our frontend structure
    const transformedFiles = files.map((file) => ({
      driveFileId: file.id,
      name: file.name,
      url: file.webViewLink || "",
      size: parseInt(file.size || "0"),
      type: file.mimeType || "application/octet-stream",
      uploadedAt: file.createdTime,
      modifiedAt: file.modifiedTime,
    }));

    return NextResponse.json(
      {
        files: transformedFiles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File list error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list files";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
