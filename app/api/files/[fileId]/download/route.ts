import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getFileContent } from "@/lib/drive/googledrive";

function encodeContentDispositionFilename(value: string) {
  return encodeURIComponent(value).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

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
    const fallbackFileName = (file.name || "file")
      .replace(/[^\x20-\x7E]+/g, "_")
      .replace(/"/g, "")
      .trim() || "file";

    return new Response(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `attachment; filename=\"${fallbackFileName}\"; filename*=UTF-8''${encodeContentDispositionFilename(file.name || fallbackFileName)}`,
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to download file";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
