import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { listFilesInFolder } from "@/lib/drive/googledrive";

export async function GET(req: NextRequest) {
  try {
    // Auth
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 }
      );
    }

    // List files in the task's Drive folder
    const driveFiles = await listFilesInFolder(folderId);

    // Transform to frontend format
    const files = driveFiles.map((file: any) => ({
      driveFileId: file.id,
      name: file.name,
      url: file.webViewLink,
      size: parseInt(file.size || "0"),
      type: file.mimeType,
      uploadedAt: file.createdTime,
      modifiedAt: file.modifiedTime,
    }));

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Task files list error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list task files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
