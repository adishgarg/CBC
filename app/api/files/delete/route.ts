import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { deleteFile } from "@/lib/drive/googledrive";

export async function DELETE(req: NextRequest) {
  try {
    // Auth
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Get data from request body
    const body = await req.json();
    const { driveFileId } = body;

    if (!driveFileId || !driveFileId.trim()) {
      return NextResponse.json(
        { error: "driveFileId is required" },
        { status: 400 }
      );
    }

    // Delete from Google Drive
    await deleteFile(driveFileId);

    // Files are fetched dynamically from Drive folder - no MongoDB update needed
    
    return NextResponse.json(
      {
        message: "File deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File delete error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
