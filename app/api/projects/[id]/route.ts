import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import User from "@/models/user";
import Task from "@/models/task";
import MeetingMin from "@/models/meetingmin";
import { notifyClientsAdded } from "@/lib/whatsapp";
import {
  appendProjectInputsToStatusSheet,
  getRedTimelineProjectIds,
} from "@/lib/sheets/projectStatus";

function normalizePhoneForComparison(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "");
}

function getProjectClientPhones(projectDoc: {
  clients?: Array<{ phoneNumber?: string }>;
  client?: { phoneNumber?: string };
}): string[] {
  const phoneNumbers = [
    ...(projectDoc.clients || []).map((client) => client?.phoneNumber),
    projectDoc.client?.phoneNumber,
  ]
    .filter((phone): phone is string => typeof phone === "string" && phone.trim().length > 0)
    .map((phone) => phone.trim());

  return [...new Set(phoneNumbers)];
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

    // Ensure models are registered for population
    void User;
    void Task;
    void MeetingMin;

    // Fetch project and populate team members, tasks, and meeting minutes
    const project = await Project.findById(id)
      .populate("teamMembers", "name email role")
      .populate({
        path: "tasks",
        populate: {
          path: "assignedTo",
          select: "name email"
        }
      })
      .populate({
        path: "meetingMins",
        populate: {
          path: "createdBy",
          select: "name email"
        },
        options: { sort: { date: -1 } }
      })
      .lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = (project as any).teamMembers?.some(
      (member: any) => member?._id?.toString?.() === decoded.userId || member?.toString?.() === decoded.userId
    );
    const isCreator = (project as any).createdBy?.toString?.() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let timelineIsRed = false;
    const projectIdValue = (project as { projectId?: unknown }).projectId;
    if (typeof projectIdValue === "number") {
      try {
        const redTimelineProjectIds = await getRedTimelineProjectIds();
        timelineIsRed = redTimelineProjectIds.has(projectIdValue);
      } catch (sheetError) {
        console.error("Failed to read timeline status from Google Sheets:", sheetError);
      }
    }

    return NextResponse.json(
      {
        project: {
          ...project,
          timelineIsRed,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { id } = await params;
    const body = await req.json();
    const sheetProjectType =
      typeof body.sheetProjectType === "string" ? body.sheetProjectType.trim() : undefined;

    await connectDB();

    // Find the project first
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is authorized (team member or creator)
    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to update this project" },
        { status: 403 }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "location",
      "status",
      "description",
      "timeline",
      "spreadsheetId",
      "sheetName",
      "client",
      "clients",
    ];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Normalize and validate name if provided
    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
      if (!updates.name) {
        return NextResponse.json({ error: "Project name cannot be empty" }, { status: 400 });
      }
    }

    if (typeof updates.location === "string") {
      updates.location = updates.location.trim();
    }

    // Validate clients/client if provided
    if (updates.clients) {
      if (!Array.isArray(updates.clients) || updates.clients.length === 0) {
        return NextResponse.json({ error: "At least one client is required" }, { status: 400 });
      }
      for (const client of updates.clients) {
        if (!client?.name?.trim()) {
          return NextResponse.json({ error: "Client name is required" }, { status: 400 });
        }
      }
      // Normalize client data
      updates.clients = updates.clients.map((c: any) => ({
        name: c.name.trim(),
        email: c.email?.trim() || undefined,
        phoneNumber: c.phoneNumber?.trim() || undefined,
      }));
      // Also set client to first client for backward compatibility
      updates.client = {
        name: updates.clients[0].name,
        email: updates.clients[0].email,
        phoneNumber: updates.clients[0].phoneNumber,
      };
    } else if (updates.client) {
      if (!updates.client.name?.trim()) {
        return NextResponse.json({ error: "Client name is required" }, { status: 400 });
      }
      // Convert single client to clients array for backward compatibility
      updates.clients = [{
        name: updates.client.name.trim(),
        email: updates.client.email?.trim() || undefined,
        phoneNumber: updates.client.phoneNumber?.trim() || undefined,
      }];
      // Normalize client data
      updates.client = {
        name: updates.client.name.trim(),
        email: updates.client.email?.trim() || undefined,
        phoneNumber: updates.client.phoneNumber?.trim() || undefined,
      };
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updates,
          lastActivityAt: new Date(),
          lastActivityType: "project_updated",
          lastActivityMessage: "Project details updated",
          lastActivityBy: decoded.userId,
        },
        $unset: {
          lastActivityFileName: 1,
        },
      },
      { new: true, runValidators: true }
    );

    if (updatedProject && updates.clients !== undefined) {
      const previousClientPhoneNumbers = getProjectClientPhones(project);
      const previousClientPhoneSet = new Set(
        previousClientPhoneNumbers.map((phone) => normalizePhoneForComparison(phone))
      );

      const updatedClientPhoneNumbers = getProjectClientPhones(updatedProject);
      const newlyAddedClientPhoneNumbers = updatedClientPhoneNumbers.filter((phone) => {
        const normalizedPhone = normalizePhoneForComparison(phone);
        return normalizedPhone.length > 0 && !previousClientPhoneSet.has(normalizedPhone);
      });

      if (newlyAddedClientPhoneNumbers.length > 0) {
        const newlyAddedClientNames = (updatedProject.clients || [])
          .filter((client: any) => {
            const candidatePhone = typeof client?.phoneNumber === "string" ? client.phoneNumber.trim() : "";
            return (
              candidatePhone.length > 0 &&
              newlyAddedClientPhoneNumbers.some(
                (phone) => normalizePhoneForComparison(phone) === normalizePhoneForComparison(candidatePhone)
              )
            );
          })
          .map((client: any) => client?.name?.trim())
          .filter((name: string | undefined): name is string => Boolean(name));

        const teamMembers = await User.find({ _id: { $in: updatedProject.teamMembers || [] } })
          .select("phoneNumber")
          .lean<Array<{ phoneNumber?: string }>>();
        const teamPhoneNumbers = [...new Set(
          teamMembers
            .map((member) => member.phoneNumber?.trim())
            .filter((phone): phone is string => Boolean(phone))
        )];

        await notifyClientsAdded(
          updatedProject.name,
          newlyAddedClientNames.length > 0 ? newlyAddedClientNames : ["New client"],
          newlyAddedClientPhoneNumbers,
          teamPhoneNumbers
        );
      }
    }

    // Append project input rows to Google Sheets when client/name details are changed.
    if (
      updatedProject &&
      (
        updates.name !== undefined ||
        updates.location !== undefined ||
        sheetProjectType !== undefined ||
        updates.clients !== undefined ||
        updates.client !== undefined
      )
    ) {
      try {
        await appendProjectInputsToStatusSheet({
          projectId: updatedProject.projectId,
          projectName: updatedProject.name,
          location:
            typeof updates.location === "string"
              ? updates.location
              : updatedProject.location,
          projectType: sheetProjectType,
          clients: (updatedProject.clients || []).map((client: any) => ({
            name: client?.name,
            phoneNumber: client?.phoneNumber,
            email: client?.email,
          })),
        });
        console.log(`[Sheet A-F] Appended project input rows for projectId=${updatedProject.projectId} on update`);
      } catch (sheetWriteError) {
        // Log sheet write error but don't fail project update
        console.error("Failed to append updated project input rows to Google Sheets:", sheetWriteError);
      }
    }

    return NextResponse.json(
      {
        message: "Project updated successfully",
        project: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
