import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Task from "@/models/task";
import Project from "@/models/project";
import User from "@/models/user";
import { notifyTaskCreated } from "@/lib/whatsapp";

function getProjectClientPhoneNumbers(project: {
  client?: { phoneNumber?: string };
  clients?: Array<{ phoneNumber?: string }>;
}): string[] {
  return [...new Set([
    ...(project.clients || []).map((client) => client?.phoneNumber),
    project.client?.phoneNumber,
  ]
    .filter((phone): phone is string => typeof phone === "string" && phone.trim().length > 0)
    .map((phone) => phone.trim()))];
}

interface CreateTaskPayload {
  title: string;
  description?: string;
  project: string;
  assignedTo: string[];
  status?: "todo" | "in-progress" | "review" | "completed";
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  driveFolderId: string;
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

    const body = (await req.json()) as CreateTaskPayload;

    // Validate required fields
    if (!body?.title?.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    if (!body?.project) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!Array.isArray(body?.assignedTo) || body.assignedTo.length === 0) {
      return NextResponse.json(
        { error: "At least one team member must be assigned" },
        { status: 400 }
      );
    }

    if (!body?.driveFolderId) {
      return NextResponse.json(
        { error: "Drive folder ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify project exists
    const project = await Project.findById(body.project);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to create tasks for this project" },
        { status: 403 }
      );
    }

    // Verify all assigned users exist
    const users = await User.find({ _id: { $in: body.assignedTo } });
    if (users.length !== body.assignedTo.length) {
      return NextResponse.json(
        { error: "One or more assigned users not found" },
        { status: 400 }
      );
    }

    // Create task
    const task = await Task.create({
      title: body.title.trim(),
      description: body.description?.trim() || "",
      project: body.project,
      assignedTo: body.assignedTo,
      createdBy: decoded.userId,
      status: body.status || "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      driveFolderId: body.driveFolderId,
      progress: 0,
      isArchived: false,
    });

    // Update project with task reference
    await Project.findByIdAndUpdate(
      body.project,
      { $push: { tasks: task._id } },
      { new: true }
    );

    // Populate task with assigned users and project info
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email phoneNumber")
      .populate("createdBy", "name email")
      .populate("project", "name clients");

    // Send WhatsApp notifications (non-blocking)
    try {
      const projectForNotification = await Project.findById(body.project);
      if (projectForNotification) {
        const clientPhoneNumbers = getProjectClientPhoneNumbers(projectForNotification as {
          client?: { phoneNumber?: string };
          clients?: Array<{ phoneNumber?: string }>;
        });

        // Get team member phone numbers
        const assignedUsers = await User.find({ _id: { $in: body.assignedTo } });
        const teamPhoneNumbers = assignedUsers
          .map((u: any) => u.phoneNumber)
          .filter((p: any) => p) || [];

        // Format due date
        const formattedDueDate = body.dueDate
          ? new Date(body.dueDate).toLocaleDateString("en-IN")
          : undefined;

        await notifyTaskCreated(
          body.title,
          projectForNotification.name,
          clientPhoneNumbers,
          teamPhoneNumbers,
          formattedDueDate
        );
      }
    } catch (whatsappError) {
      // Log WhatsApp error but don't fail task creation
      console.error("Failed to send WhatsApp task creation notifications:", whatsappError);
    }

    return NextResponse.json(
      {
        message: "Task created successfully",
        task: populatedTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create task" },
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project");
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assignedToMe");

    const accessibleProjects = await Project.find({
      $or: [{ teamMembers: decoded.userId }, { createdBy: decoded.userId }],
    })
      .select("_id")
      .lean<Array<{ _id: any }>>();

    const accessibleProjectIds = accessibleProjects.map((project) => project._id);

    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({ tasks: [] }, { status: 200 });
    }

    // Build query
    const query: any = { isArchived: false, project: { $in: accessibleProjectIds } };

    if (projectId) {
      const hasAccessToProject = accessibleProjectIds.some(
        (id) => id.toString() === projectId
      );
      if (!hasAccessToProject) {
        return NextResponse.json({ tasks: [] }, { status: 200 });
      }
      query.project = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (assignedToMe === "true") {
      query.assignedTo = decoded.userId;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
