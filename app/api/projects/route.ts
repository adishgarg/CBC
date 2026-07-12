import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import User from "@/models/user";
import ProjectCounter from "@/models/projectcounter";
import { sendBatchEmails, projectCreatedEmail } from "@/lib/email";
import { getOrCreateFolder, createFolder } from "@/lib/drive/googledrive";
import { notifyProjectCreated } from "@/lib/whatsapp";
import { getSheetData } from "@/lib/sheets/googlesheets";
import { appendProjectInputsToStatusSheet } from "@/lib/sheets/projectStatus";

type ProjectStatus = "active" | "completed" | "on hold";
type ProjectType = "architecture" | "interior" | "both";

interface CreateProjectPayload {
  name: string;
  location?: string;
  sheetProjectType?: string;
  description?: string;
  projectType?: ProjectType;
  client?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  clients?: Array<{
    name: string;
    email?: string;
    phoneNumber?: string;
  }>;
  teamMembers: string[];
  status?: ProjectStatus;
  timeline: {
    startDate: string;
    endDate?: string;
  };
  tasks?: string[];
  isVisible?: boolean;
  progress?: number;
}

const VALID_STATUSES: ProjectStatus[] = ["active", "completed", "on hold"];
const VALID_PROJECT_TYPES: ProjectType[] = ["architecture", "interior", "both"];
const DEFAULT_PROJECT_STATUS_SPREADSHEET_ID = "1bayhVCpPAOWUWZTUJ1k-OhFSBM6FC4ow57v_IVRDbw8";
const DEFAULT_PROJECT_STATUS_SHEET_NAME = "Clients";

function parseProjectIdFromSheetCell(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  const directNumber = Number(rawValue);
  if (Number.isInteger(directNumber) && directNumber >= 0) {
    return directNumber;
  }

  const digitsMatch = rawValue.match(/\d+/);
  if (!digitsMatch) {
    return null;
  }

  const parsedNumber = Number(digitsMatch[0]);
  return Number.isInteger(parsedNumber) ? parsedNumber : null;
}

async function getRedTimelineProjectIds(): Promise<Set<number>> {
  const spreadsheetId =
    process.env.PROJECT_STATUS_SPREADSHEET_ID || DEFAULT_PROJECT_STATUS_SPREADSHEET_ID;
  const configuredSheetName =
    process.env.PROJECT_STATUS_SHEET_NAME?.trim() || DEFAULT_PROJECT_STATUS_SHEET_NAME;
  const escapedSheetName = configuredSheetName.replace(/'/g, "''");
  const statusRange = `'${escapedSheetName}'!B:Q`;

  const rows = (await getSheetData(spreadsheetId, statusRange, {
    allowFallback: false,
  })) as unknown[][];
  const redProjectIds = new Set<number>();
  const sheetStatusRows: Array<{ projectId: number; rawStatus: string; normalizedStatus: string }> = [];

  for (const row of rows) {
    const projectId = parseProjectIdFromSheetCell(row[0]);
    if (projectId === null) {
      continue;
    }

    const rawStatusInColumnQ = String(row[15] ?? "").trim();
    const normalizedStatusInColumnQ = rawStatusInColumnQ.toLowerCase();
    sheetStatusRows.push({
      projectId,
      rawStatus: rawStatusInColumnQ,
      normalizedStatus: normalizedStatusInColumnQ,
    });

    if (normalizedStatusInColumnQ === "red") {
      redProjectIds.add(projectId);
    }
  }

  sheetStatusRows
    .sort((a, b) => a.projectId - b.projectId)
    .forEach((row) => {
      console.log(
        `[Sheet B-Q] projectId=${row.projectId}, columnQ="${row.rawStatus || "(empty)"}", timelineIsRed=${row.normalizedStatus === "red"}`
      );
    });

  console.log(
    `[Sheet B-Q] Parsed ${sheetStatusRows.length} rows from spreadsheet ${spreadsheetId}, tab ${configuredSheetName}, range ${statusRange}. Red timelines: ${Array.from(redProjectIds).sort((a, b) => a - b).join(", ") || "none"}`
  );

  return redProjectIds;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    const body = (await req.json()) as CreateProjectPayload;

    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Support both client and clients for backward compatibility
    let clientsList: Array<{ name: string; email?: string; phoneNumber?: string }>;
    
    if (body?.clients && Array.isArray(body.clients) && body.clients.length > 0) {
      clientsList = body.clients;
    } else if (body?.client) {
      clientsList = [body.client];
    } else {
      return NextResponse.json(
        { error: "At least one client is required" },
        { status: 400 }
      );
    }

    // Validate clients
    for (const client of clientsList) {
      if (!client?.name?.trim()) {
        return NextResponse.json(
          { error: "Client name is required for all clients" },
          { status: 400 }
        );
      }
    }

    if (!body?.timeline?.startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    }

    if (!Array.isArray(body?.teamMembers) || body.teamMembers.length === 0) {
      return NextResponse.json(
        { error: "At least one team member is required" },
        { status: 400 }
      );
    }

    const status = body.status ?? "active";
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
    }

    const projectType = body.projectType ?? "both";
    if (!VALID_PROJECT_TYPES.includes(projectType)) {
      return NextResponse.json({ error: "Invalid project type" }, { status: 400 });
    }

    await connectDB();

    // Get or create project counter
    let counter = await ProjectCounter.findOne();
    if (!counter) {
      counter = await ProjectCounter.create({ nextNumber: 164 });
    }
    const generatedProjectId = counter.nextNumber;

    // Increment counter for next project
    await ProjectCounter.updateOne(
      { _id: counter._id },
      { nextNumber: generatedProjectId + 1 }
    );

    // Create Google Drive folder structure based on project type
    const clientFolderName = clientsList[0].name.trim().replace(/[/\\?%*:|"<>]/g, '_');
    
    // Create folders based on project type
    let architectureFolderId: string | undefined;
    let interiorFolderId: string | undefined;
    let viewsFolderId: string | undefined;
    
    if (projectType === "architecture" || projectType === "both") {
      architectureFolderId = await createFolder(`${generatedProjectId}_AR_IFC_${clientFolderName}`, process.env.ARCHITECTURE_DRIVE_FOLDER_ID);
    }
    
    if (projectType === "interior" || projectType === "both") {
      interiorFolderId = await createFolder(`${generatedProjectId}_INT_IFC_${clientFolderName}`, process.env.INTERIOR_DRIVE_FOLDER_ID);
    }

    // Create a Views subfolder under Architecture by default, or Interior for interior-only projects
    const viewsParentFolderId =
      projectType === "interior"
        ? interiorFolderId
        : architectureFolderId || interiorFolderId;

    if (viewsParentFolderId) {
      viewsFolderId = await getOrCreateFolder("Views", viewsParentFolderId);
    }

    // Build project data
    const projectData: any = {
      projectId: generatedProjectId,
      name: body.name.trim(),
      location: body.location?.trim() || undefined,
      description: body.description?.trim() || undefined,
      projectType,
      client: {
        name: clientsList[0].name.trim(),
        email: clientsList[0].email?.trim() || undefined,
        phoneNumber: clientsList[0].phoneNumber?.trim() || undefined,
      },
      clients: clientsList.map(client => ({
        name: client.name.trim(),
        email: client.email?.trim() || undefined,
        phoneNumber: client.phoneNumber?.trim() || undefined,
      })),
      teamMembers: body.teamMembers,
      status,
      timeline: {
        startDate: new Date(body.timeline.startDate),
        endDate: body.timeline.endDate ? new Date(body.timeline.endDate) : undefined,
      },
      tasks: Array.isArray(body.tasks) ? body.tasks : [],
      createdBy: decoded.userId,
      isVisible: body.isVisible ?? true,
      progress: 0,
      workflow: {
        currentPhaseId: 1,
        notOptedPhases: [],
        updatedAt: new Date(),
      },
    };

    // Only add folder IDs if they were created
    if (architectureFolderId) {
      projectData.architectureFolderId = architectureFolderId;
    }
    if (interiorFolderId) {
      projectData.interiorFolderId = interiorFolderId;
    }
    if (viewsFolderId) {
      projectData.viewsFolderId = viewsFolderId;
    }

    const project = await Project.create(projectData);

    // Append project input rows to Google Sheets (A-F): timestamp, project ID, client, phone, email, project
    try {
      await appendProjectInputsToStatusSheet({
        projectId: project.projectId,
        projectName: project.name,
        location: body.location?.trim() || project.location,
        projectType: body.sheetProjectType?.trim() || undefined,
        clients: (project.clients || []).map((client: any) => ({
          name: client?.name,
          phoneNumber: client?.phoneNumber,
          email: client?.email,
        })),
      });
      console.log(`[Sheet A-F] Appended project input rows for projectId=${project.projectId}`);
    } catch (sheetWriteError) {
      // Log sheet write error but don't fail project creation
      console.error("Failed to append project input rows to Google Sheets:", sheetWriteError);
    }

    // Send notification emails to team members (non-blocking)
    try {
      const teamMembers = await User.find({ _id: { $in: body.teamMembers } }).select("name email");

      if (teamMembers.length > 0) {
        const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${project._id}`;

        const emails = teamMembers.map((member) => {
          const emailData = {
            projectName: project.name,
            clientName: project.clients?.[0]?.name || "Client",
            teamMemberName: member.name || member.email,
            startDate: new Date(project.timeline.startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            projectUrl,
          };

          const emailContent = projectCreatedEmail(emailData);

          return {
            to: member.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          };
        });

        await sendBatchEmails(emails);
        console.log(`Project notifications sent to ${teamMembers.length} team members`);
      }
    } catch (emailError) {
      // Log email error but don't fail project creation
      console.error("Failed to send project notification emails:", emailError);
    }

    // Send WhatsApp notifications (non-blocking)
    try {
      const clientPhoneNumbers = project.clients
        ?.filter((client: { phoneNumber?: string }) => client.phoneNumber)
        .map((client: { phoneNumber?: string }) => client.phoneNumber!) || [];

      if (clientPhoneNumbers.length > 0 || body.teamMembers.length > 0) {
        const clientProjectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/project/${project._id}`;
        const teamMembers = await User.find({ _id: { $in: body.teamMembers } })
          .select("phoneNumber")
          .lean<{ phoneNumber?: string }[]>();
        const teamPhoneNumbers = teamMembers
          .filter((member) => member.phoneNumber)
          .map((member) => member.phoneNumber)
          .filter((phone): phone is string => Boolean(phone));

        await notifyProjectCreated(project.name, clientPhoneNumbers, teamPhoneNumbers, clientProjectUrl);
        console.log(
          `WhatsApp notifications sent for project ${project.name} to ${clientPhoneNumbers.length + teamPhoneNumbers.length} recipients`
        );
      }
    } catch (whatsappError) {
      // Log WhatsApp error but don't fail project creation
      console.error("Failed to send WhatsApp notifications:", whatsappError);
    }

    return NextResponse.json(
      {
        message: "Project created successfully",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    await connectDB();

    // Fetch only projects where the current user is a team member or creator.
    const projects = await Project.find({
      $or: [{ teamMembers: decoded.userId }, { createdBy: decoded.userId }],
    })
      .populate("teamMembers", "name email")
      .sort({ projectId: -1, createdAt: -1 })
      .lean<Array<{ projectId?: number } & Record<string, unknown>>>();

    let redTimelineProjectIds = new Set<number>();
    try {
      redTimelineProjectIds = await getRedTimelineProjectIds();
    } catch (sheetError) {
      console.error("Failed to read project timeline status from Google Sheets:", sheetError);
    }

    const projectsWithTimelineFlags = projects.map((project) => {
      return {
        ...project,
        timelineIsRed:
          typeof project.projectId === "number" && redTimelineProjectIds.has(project.projectId),
      };
    });

    return NextResponse.json(
      {
        projects: projectsWithTimelineFlags,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
