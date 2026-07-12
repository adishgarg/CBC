import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { uploadFileToFolder } from "@/lib/drive/googledrive";

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

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!folderId || !folderId.trim()) {
      return NextResponse.json(
        { error: "folderId is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive inside the task folder
    const uploadedFile = await uploadFileToFolder(
      file.name,
      file.type || "application/octet-stream",
      buffer,
      folderId
    );

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        file: uploadedFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task file upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file to task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
