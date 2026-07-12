import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import MeetingMin from "@/models/meetingmin";
import { listFilesInFolder } from "@/lib/drive/googledrive";
import { getRedTimelineProjectIds } from "@/lib/sheets/projectStatus";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    void MeetingMin;

    // Fetch project with basic information and published meeting minutes
    const project = await Project.findById(id)
      .select('projectId name description clients status timeline projectType architectureFolderId interiorFolderId viewsFolderId progress workflow')
      .lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch only published meeting minutes for this project
    const meetingMins = await MeetingMin.find({
      project: id,
      status: 'published',
    })
      .select('title date time minutes status createdAt')
      .sort({ date: -1 })
      .lean();

    // Fetch files from Google Drive folders
    let architectureFiles: any[] = [];
    let interiorFiles: any[] = [];
    let viewImages: any[] = [];

    try {
      if (project.architectureFolderId) {
        const archFiles = await listFilesInFolder(project.architectureFolderId);
        architectureFiles = archFiles.map((file) => ({
          driveFileId: file.id,
          name: file.name,
          url: file.webViewLink || "",
          size: parseInt(file.size || "0"),
          type: file.mimeType || "application/octet-stream",
          uploadedAt: file.createdTime,
          modifiedAt: file.modifiedTime,
          folder: 'Architecture',
        }));
      }

      if (project.interiorFolderId) {
        const intFiles = await listFilesInFolder(project.interiorFolderId);
        interiorFiles = intFiles.map((file) => ({
          driveFileId: file.id,
          name: file.name,
          url: file.webViewLink || "",
          size: parseInt(file.size || "0"),
          type: file.mimeType || "application/octet-stream",
          uploadedAt: file.createdTime,
          modifiedAt: file.modifiedTime,
          folder: 'Interior',
        }));
      }

      if (project.viewsFolderId) {
        const viewFiles = await listFilesInFolder(project.viewsFolderId);
        viewImages = viewFiles
          .filter((file) => (file.mimeType || "").startsWith("image/"))
          .map((file) => ({
            driveFileId: file.id,
            name: file.name,
            type: file.mimeType || "application/octet-stream",
            size: parseInt(file.size || "0"),
            uploadedAt: file.createdTime,
            modifiedAt: file.modifiedTime,
            viewUrl: file.webViewLink || "",
            previewUrl: `/api/projects/public/${id}/views/${file.id}/preview?v=${encodeURIComponent(file.modifiedTime || file.createdTime || "")}`,
          }));
      }
    } catch (fileError) {
      console.error("Error fetching files for public view:", fileError);
      // Continue even if files fail to load
    }

    let timelineIsRed = false;
    const projectIdValue = (project as { projectId?: unknown }).projectId;
    if (typeof projectIdValue === "number") {
      try {
        const redTimelineProjectIds = await getRedTimelineProjectIds();
        timelineIsRed = redTimelineProjectIds.has(projectIdValue);
      } catch (sheetError) {
        console.error("Failed to read public timeline status from Google Sheets:", sheetError);
      }
    }

    return NextResponse.json(
      {
        project: {
          ...project,
          timelineIsRed,
          meetingMins,
          architectureFiles,
          interiorFiles,
          viewImages,
          allFiles: [...architectureFiles, ...interiorFiles],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Public project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
