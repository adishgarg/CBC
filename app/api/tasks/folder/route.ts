import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createFolder } from "@/lib/drive/googledrive";

export async function POST(req: NextRequest) {
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
    const { taskName, parentFolderId } = body;

    if (!taskName || !taskName.trim()) {
      return NextResponse.json(
        { error: "taskName is required" },
        { status: 400 }
      );
    }

    if (!parentFolderId || !parentFolderId.trim()) {
      return NextResponse.json(
        { error: "parentFolderId is required" },
        { status: 400 }
      );
    }

    // Create folder in Google Drive
    const folderName = `Task - ${taskName}`;
    const folderId = await createFolder(folderName, parentFolderId);

    return NextResponse.json(
      {
        message: "Task folder created successfully",
        folderId: folderId,
        folderName: folderName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task folder creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create task folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
