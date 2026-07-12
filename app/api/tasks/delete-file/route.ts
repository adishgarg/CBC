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

    jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

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

    return NextResponse.json(
      {
        message: "File deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Task file delete error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete file from task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
