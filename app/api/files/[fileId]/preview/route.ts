import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getFileContent } from "@/lib/drive/googledrive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { fileId } = await params;

    const file = await getFileContent(fileId);

    if (!file.mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "File is not an image" }, { status: 400 });
    }

    return new NextResponse(file.buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename=\"${file.name || "image"}\"`,
      },
    });
  } catch (error) {
    console.error("File preview error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load preview";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
