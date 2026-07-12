import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import Task from "@/models/task";
import User from "@/models/user";
import { notifyProjectUpdate } from "@/lib/whatsapp";

type DriveWebhookPayload = {
  folderId?: string;
  folderName?: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  updatedAt?: number | string;
  uploadedAt?: number | string;
  secret?: string;
};

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function uniqueNonEmptyPhoneNumbers(phoneNumbers: Array<string | undefined>): string[] {
  const normalized = phoneNumbers
    .map((phone) => (typeof phone === "string" ? phone.trim() : ""))
    .filter((phone) => phone.length > 0);

  return [...new Set(normalized)];
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseUpdatedAt(value: unknown): Date {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

async function resolveProjectForFolder(folderId: string): Promise<{
  projectId: string;
  projectName: string;
  clientPhoneNumbers: string[];
  teamPhoneNumbers: string[];
  taskTitle?: string;
} | null> {
  const directProject = await Project.findOne({
    $or: [
      { architectureFolderId: folderId },
      { interiorFolderId: folderId },
      { viewsFolderId: folderId },
    ],
  })
    .select("_id name client clients teamMembers")
    .lean<{
      _id: unknown;
      name?: string;
      client?: { phoneNumber?: string };
      clients?: Array<{ phoneNumber?: string }>;
      teamMembers?: string[];
    }>();

  if (directProject) {
    const teamMembers = await User.find({ _id: { $in: directProject.teamMembers || [] } })
      .select("phoneNumber")
      .lean<Array<{ phoneNumber?: string }>>();

    return {
      projectId: String(directProject._id),
      projectName: directProject.name || "Untitled Project",
      clientPhoneNumbers: uniqueNonEmptyPhoneNumbers([
        ...(directProject.clients?.map((client) => client.phoneNumber) || []),
        directProject.client?.phoneNumber,
      ]),
      teamPhoneNumbers: uniqueNonEmptyPhoneNumbers(
        teamMembers.map((member) => member.phoneNumber)
      ),
    };
  }

  const task = await Task.findOne({ driveFolderId: folderId })
    .select("title project driveFolderId")
    .lean<{
      title?: string;
      project?: unknown;
    }>();

  if (!task?.project) {
    return null;
  }

  const linkedProject = await Project.findById(task.project)
    .select("_id name client clients teamMembers")
    .lean<{
      _id: unknown;
      name?: string;
      client?: { phoneNumber?: string };
      clients?: Array<{ phoneNumber?: string }>;
      teamMembers?: string[];
    }>();

  if (!linkedProject) {
    return null;
  }

  const teamMembers = await User.find({ _id: { $in: linkedProject.teamMembers || [] } })
    .select("phoneNumber")
    .lean<Array<{ phoneNumber?: string }>>();

  return {
    projectId: String(linkedProject._id),
    projectName: linkedProject.name || "Untitled Project",
    clientPhoneNumbers: uniqueNonEmptyPhoneNumbers([
      ...(linkedProject.clients?.map((client) => client.phoneNumber) || []),
      linkedProject.client?.phoneNumber,
    ]),
    teamPhoneNumbers: uniqueNonEmptyPhoneNumbers(
      teamMembers.map((member) => member.phoneNumber)
    ),
    taskTitle: task.title,
  };
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      endpoint: "/api/drive-webhook",
      method: "POST",
      message: "Drive webhook route is reachable",
      requiredBody: ["folderId", "fileUrl", "fileName", "updatedAt"],
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DriveWebhookPayload;

    const folderId = normalizeText(body.folderId);
    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    const fileUrl = normalizeText(body.fileUrl);
    if (!fileUrl || !isValidHttpUrl(fileUrl)) {
      return NextResponse.json({ error: "Valid fileUrl is required" }, { status: 400 });
    }

    const fileName = normalizeText(body.fileName);
    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const configuredSecret = process.env.APPS_SCRIPT_WEBHOOK_SECRET?.trim();
    const providedSecret =
      req.headers.get("x-apps-script-secret") ||
      req.headers.get("x-webhook-secret") ||
      normalizeText(body.secret);

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const projectContext = await resolveProjectForFolder(folderId);
    if (!projectContext) {
      return NextResponse.json(
        {
          success: true,
          matched: false,
          message: `No project or task found for folderId ${folderId}`,
        },
        { status: 200 }
      );
    }

    if (
      projectContext.clientPhoneNumbers.length === 0 &&
      projectContext.teamPhoneNumbers.length === 0
    ) {
      return NextResponse.json(
        {
          success: true,
          matched: true,
          message: "No recipient phone numbers found for this project",
          projectId: projectContext.projectId,
        },
        { status: 200 }
      );
    }

    const updatedAt = parseUpdatedAt(body.updatedAt ?? body.uploadedAt);
    const detailsParts = [
      body.folderName ? `Folder: ${normalizeText(body.folderName)}` : `Folder ID: ${folderId}`,
      `File: ${fileName}`,
      `URL: ${fileUrl}`,
      `Updated at: ${updatedAt.toISOString()}`,
    ].filter(Boolean);

    await notifyProjectUpdate(
      projectContext.projectName,
      "file_uploaded",
      projectContext.clientPhoneNumbers,
      projectContext.teamPhoneNumbers,
      detailsParts.join(" | ")
    );

    await Project.findByIdAndUpdate(projectContext.projectId, {
      lastActivityAt: updatedAt,
      lastActivityType: "file_uploaded",
      lastActivityMessage: `Drive upload: ${fileName}`,
      lastActivityFileName: fileName,
    });

    return NextResponse.json(
      {
        success: true,
        matched: true,
        message: "WhatsApp notifications queued",
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        recipients: projectContext.clientPhoneNumbers.length + projectContext.teamPhoneNumbers.length,
        clientRecipients: projectContext.clientPhoneNumbers.length,
        teamRecipients: projectContext.teamPhoneNumbers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Drive webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process drive webhook request" },
      { status: 500 }
    );
  }
}
