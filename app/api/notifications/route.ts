import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";
import Project from "@/models/project";
import Remark from "@/models/remark";
import MeetingMin from "@/models/meetingmin";
import Task from "@/models/task";

interface AuthPayload {
  userId: string;
  email: string;
}

type NotificationType =
  | "comment"
  | "meeting_minutes"
  | "task_update"
  | "file_upload"
  | "project_update";

interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fileName?: string;
  projectName: string;
  createdAt: string;
  isUnread: boolean;
  href: string;
}

function getTokenPayload(request: NextRequest): AuthPayload | null {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = getTokenPayload(request);
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(payload.userId);
    } catch {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const userDoc = await User.collection.findOne(
      { _id: userObjectId },
      { projection: { _id: 1, notificationLastSeenAt: 1, role: 1 } }
    );

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userProjects = await Project.find(
      {
        $or: [{ teamMembers: userObjectId }, { createdBy: userObjectId }],
      }
    )
      .select("_id name lastActivityAt lastActivityType lastActivityMessage lastActivityFileName lastActivityBy")
      .populate("lastActivityBy", "name email")
      .lean();

    const projectIds = userProjects.map((project) => project._id);
    const projectNameById = new Map(
      userProjects.map((project) => [String(project._id), project.name || "Project"])
    );
    if (projectIds.length === 0) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
    }

    const [remarks, meetingMinutes, tasks] = await Promise.all([
      Remark.find({
        project: { $in: projectIds },
      })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
      MeetingMin.find({
        project: { $in: projectIds },
        createdBy: { $ne: userObjectId },
      })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      Task.find({
        project: { $in: projectIds },
        createdBy: { $ne: userObjectId },
        isArchived: false,
      })
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1 })
        .limit(40)
        .lean(),
    ]);

    const lastSeenTime = userDoc.notificationLastSeenAt
      ? new Date(userDoc.notificationLastSeenAt).getTime()
      : 0;

    const commentNotifications: NotificationPayload[] = remarks.map((remark) => {
      const createdAt = new Date(remark.createdAt);
      const creator = remark.createdBy as { name?: string; email?: string } | null | undefined;
      const commenterName = creator?.name || creator?.email || (remark.clientName as string) || "Someone";
      const projectId = String(remark.project);
      const projectName = projectNameById.get(projectId) || "Project";

      return {
        id: `comment-${String(remark._id)}`,
        type: "comment",
        title: `${commenterName} added a comment`,
        message: `${projectName} - ${remark.fileName}`,
        fileName: remark.fileName,
        projectName,
        createdAt: createdAt.toISOString(),
        isUnread: createdAt.getTime() > lastSeenTime,
        href: `/dashboard/projects/${projectId}`,
      };
    });

    const meetingNotifications: NotificationPayload[] = meetingMinutes.map((meeting) => {
      const createdAt = new Date(meeting.createdAt);
      const creator = meeting.createdBy as { name?: string; email?: string } | null | undefined;
      const authorName = creator?.name || creator?.email || "A team member";
      const projectId = meeting.project ? String(meeting.project) : "";
      const projectName = projectNameById.get(projectId) || "Project";

      return {
        id: `meeting-${String(meeting._id)}`,
        type: "meeting_minutes",
        title: `${authorName} added meeting minutes`,
        message: `${projectName} - ${meeting.title}`,
        projectName,
        createdAt: createdAt.toISOString(),
        isUnread: createdAt.getTime() > lastSeenTime,
        href: projectId ? `/dashboard/projects/${projectId}` : "/dashboard/projects",
      };
    });

    const taskNotifications: NotificationPayload[] = tasks.map((task) => {
      const activityDate = new Date(task.updatedAt || task.createdAt);
      const creator = task.createdBy as { name?: string; email?: string } | null | undefined;
      const actorName = creator?.name || creator?.email || "A team member";
      const projectId = String(task.project);
      const projectName = projectNameById.get(projectId) || "Project";
      const isStatusChange = new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime();

      return {
        id: `task-${String(task._id)}-${isStatusChange ? "updated" : "created"}`,
        type: "task_update",
        title: isStatusChange
          ? `${actorName} updated a task`
          : `${actorName} created a task`,
        message: `${projectName} - ${task.title}`,
        projectName,
        createdAt: activityDate.toISOString(),
        isUnread: activityDate.getTime() > lastSeenTime,
        href: `/dashboard/projects/${projectId}`,
      };
    });

    const activityNotifications: NotificationPayload[] = userProjects
      .map((project) => {
        const activityAt = (project as any).lastActivityAt
          ? new Date((project as any).lastActivityAt)
          : null;
        const activityType = (project as any).lastActivityType as
          | "file_uploaded"
          | "project_updated"
          | undefined;

        if (!activityAt || !activityType) {
          return null;
        }

        const activityBy = (project as any).lastActivityBy as
          | { _id?: mongoose.Types.ObjectId; name?: string; email?: string }
          | null
          | undefined;
        const actorName = activityBy?.name || activityBy?.email || "A team member";
        const projectId = String((project as any)._id);
        const projectName = (project as any).name || "Project";
        const activityFileName = (project as any).lastActivityFileName as string | undefined;
        const activityMessage = (project as any).lastActivityMessage as string | undefined;

        if (activityType === "file_uploaded") {
          return {
            id: `activity-file-${projectId}-${activityAt.getTime()}`,
            type: "file_upload" as NotificationType,
            title: `${actorName} uploaded a file`,
            message: `${projectName} - ${activityFileName || "New file uploaded"}`,
            fileName: activityFileName,
            projectName,
            createdAt: activityAt.toISOString(),
            isUnread: activityAt.getTime() > lastSeenTime,
            href: `/dashboard/projects/${projectId}`,
          };
        }

        return {
          id: `activity-project-${projectId}-${activityAt.getTime()}`,
          type: "project_update" as NotificationType,
          title: `${actorName} updated project details`,
          message: `${projectName} - ${activityMessage || "Project updated"}`,
          projectName,
          createdAt: activityAt.toISOString(),
          isUnread: activityAt.getTime() > lastSeenTime,
          href: `/dashboard/projects/${projectId}`,
        };
      })
      .filter((item): item is NotificationPayload => Boolean(item));

    const notifications = [
      ...commentNotifications,
      ...meetingNotifications,
      ...taskNotifications,
      ...activityNotifications,
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    const unreadCount = notifications.reduce((count, notification) => {
      return notification.isUnread ? count + 1 : count;
    }, 0);

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = getTokenPayload(request);
    if (!payload) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(payload.userId);
    } catch {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const now = new Date();

    const updateResult = await User.collection.updateOne(
      { _id: userObjectId },
      { $set: { notificationLastSeenAt: now } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        notificationLastSeenAt: now,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating notification read status:", error);
    return NextResponse.json(
      { error: "Failed to update notification status" },
      { status: 500 }
    );
  }
}
