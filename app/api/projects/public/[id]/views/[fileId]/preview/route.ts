import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import { getFileContent, listFilesInFolder } from "@/lib/drive/googledrive";

interface PublicProjectViewsLookup {
  _id: string;
  viewsFolderId?: string;
}

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id, fileId } = await params;

    await connectDB();

    const project = await Project.findById(id)
      .select("viewsFolderId")
      .lean<PublicProjectViewsLookup | null>();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.viewsFolderId) {
      return NextResponse.json(
        { error: "Views folder not configured" },
        { status: 404 }
      );
    }

    const files = await listFilesInFolder(project.viewsFolderId);
    const requestedFile = files.find((file) => file.id === fileId);

    if (!requestedFile) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (!(requestedFile.mimeType || "").startsWith("image/")) {
      return NextResponse.json({ error: "File is not an image" }, { status: 400 });
    }

    const file = await getFileContent(fileId);

    return new NextResponse(file.buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "public, max-age=300",
        "Content-Disposition": `inline; filename=\"${file.name || "image"}\"`,
      },
    });
  } catch (error) {
    console.error("Public file preview error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load preview";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
