import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import { getOrCreateFolder, listFilesInFolder } from "@/lib/drive/googledrive";

interface ProjectWithViews {
  _id: string;
  projectType: "architecture" | "interior" | "both";
  architectureFolderId?: string;
  interiorFolderId?: string;
  viewsFolderId?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    const { id } = await params;

    await connectDB();

    const project = await Project.findById(id)
      .select("projectType architectureFolderId interiorFolderId viewsFolderId teamMembers createdBy")
      .lean<ProjectWithViews | null>();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = (project as any).teamMembers?.some(
      (member: any) => member?.toString?.() === decoded.userId
    );
    const isCreator = (project as any).createdBy?.toString?.() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const parentFolderId =
      project.projectType === "interior"
        ? project.interiorFolderId
        : project.architectureFolderId || project.interiorFolderId;

    if (!parentFolderId) {
      return NextResponse.json(
        { error: "No parent project folder configured" },
        { status: 400 }
      );
    }

    let viewsFolderId = project.viewsFolderId;

    if (!viewsFolderId) {
      viewsFolderId = await getOrCreateFolder("Views", parentFolderId);

      await Project.findByIdAndUpdate(id, {
        $set: { viewsFolderId },
      });
    }

    const files = await listFilesInFolder(viewsFolderId);

    const images = files
      .filter((file) => (file.mimeType || "").startsWith("image/"))
      .map((file) => ({
        driveFileId: file.id,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
        size: Number.parseInt(file.size || "0", 10),
        uploadedAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        viewUrl: file.webViewLink || "",
        previewUrl: `/api/files/${file.id}/preview?v=${encodeURIComponent(file.modifiedTime || file.createdTime || "")}`,
      }));

    return NextResponse.json(
      {
        viewsFolderId,
        images,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Project views fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch project views";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
