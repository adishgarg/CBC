import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import MeetingMin from "@/models/meetingmin";
import Project from "@/models/project";
import User from "@/models/user";
import { sendBatchEmails } from "@/lib/email";
import { meetingMinutesEmail } from "@/lib/email/templates";
import { notifyProjectUpdate } from "@/lib/whatsapp";

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

// PATCH: Update meeting minutes (publish draft or edit content)
export async function PATCH(
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

    const body = await req.json();
    const { status, content } = body;
    const { id } = await params;

    console.log("PATCH /api/meeting-minutes/[id] - ID:", id);
    console.log("Request body:", { status, content });

    await connectDB();

    // Find meeting minutes
    const meetingMin = await MeetingMin.findById(id);
    
    console.log("Found meeting minute:", meetingMin ? "YES" : "NO");
    
    if (!meetingMin) {
      return NextResponse.json({ error: "Meeting minutes not found" }, { status: 404 });
    }

    const project = await Project.findById(meetingMin.project).select("teamMembers createdBy");
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to update meeting minutes for this project" },
        { status: 403 }
      );
    }

    console.log("Current status:", meetingMin.status, "New status:", status);
    const previousStatus = meetingMin.status;

    // Update fields
    if (status) {
      meetingMin.status = status;
    }
    
    if (content !== undefined) {
      meetingMin.minutes = content.trim();
    }

    await meetingMin.save();

    console.log("Meeting minute saved successfully, new status:", meetingMin.status);

    // Notify only when status transitions to published
    if (previousStatus !== "published" && meetingMin.status === "published") {
      try {
        // Fetch project with populated team members
        const populatedProject = await Project.findById(meetingMin.project)
          .populate("teamMembers", "name email phoneNumber")
          .lean();

        if (populatedProject) {
          // Get creator information
          const creator = await User.findById(meetingMin.createdBy)
            .select("name email")
            .lean();
          const creatorName = creator?.name || creator?.email || "Unknown";

          // Prepare preview text (first 150 characters)
          const minutesText = meetingMin.minutes || "";
          const preview =
            minutesText.substring(0, 150) +
            (minutesText.length > 150 ? "..." : "");

          // Prepare email data
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const projectId = meetingMin.project?.toString();
          const projectUrl = `${appUrl}/dashboard/projects/${projectId}`;

          const meetingDate =
            meetingMin.date instanceof Date
              ? meetingMin.date
              : new Date(meetingMin.date);

          const emailData = meetingMinutesEmail({
            projectName: populatedProject.name,
            meetingDate: meetingDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            meetingTime: meetingMin.time,
            createdBy: creatorName,
            projectUrl,
            preview,
          });

          // Collect recipient emails
          const recipients = new Set<string>();

          // Add all team member emails
          if (populatedProject.teamMembers && Array.isArray(populatedProject.teamMembers)) {
            for (const member of populatedProject.teamMembers) {
              if (typeof member === "object" && member !== null && "email" in member) {
                recipients.add(member.email as string);
              }
            }
          }

          // Send emails if there are recipients
          if (recipients.size > 0) {
            await sendBatchEmails(
              Array.from(recipients).map((email) => ({
                to: email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
              }))
            );
            console.log(
              `Meeting minutes publish notifications sent to ${recipients.size} recipients`
            );
          }

          // Send WhatsApp notifications (non-blocking)
          try {
            const clientPhoneNumbers = getProjectClientPhoneNumbers(populatedProject as {
              client?: { phoneNumber?: string };
              clients?: Array<{ phoneNumber?: string }>;
            });
            const teamMembers = await User.find({ _id: { $in: populatedProject.teamMembers || [] } })
              .select("phoneNumber")
              .lean<Array<{ phoneNumber?: string }>>();
            const teamPhoneNumbers = teamMembers
              .map((member) => member.phoneNumber)
              .filter((phone: string | undefined): phone is string => typeof phone === "string" && phone.trim().length > 0);

            if (clientPhoneNumbers.length > 0 || teamPhoneNumbers.length > 0) {
              await notifyProjectUpdate(
                populatedProject.name,
                "meeting_minutes",
                clientPhoneNumbers,
                teamPhoneNumbers,
                `Meeting minutes ${status === "published" ? "published" : "updated"} by ${creatorName}\n\nPreview: ${preview}`
              );
              console.log(`WhatsApp meeting minutes notifications sent for ${meetingMin.projectId}`);
            }
          } catch (whatsappError) {
            // Log WhatsApp error but don't fail publish action
            console.error("Error sending WhatsApp publish notifications:", whatsappError);
          }
        }
      } catch (emailError) {
        // Log email error but don't fail publish action
        console.error("Error sending publish notifications:", emailError);
      }
    }

    return NextResponse.json(
      {
        message: status === "published" ? "Meeting minutes published successfully" : "Meeting minutes updated successfully",
        meetingMin,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating meeting minutes:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete meeting minutes
export async function DELETE(
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

    // Find the meeting minutes first to check status
    const meetingMin = await MeetingMin.findById(id);
    
    if (!meetingMin) {
      return NextResponse.json({ error: "Meeting minutes not found" }, { status: 404 });
    }

    const project = await Project.findById(meetingMin.project).select("teamMembers createdBy");
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to delete meeting minutes for this project" },
        { status: 403 }
      );
    }

    // Prevent deletion if published
    if (meetingMin.status === "published") {
      return NextResponse.json(
        { error: "Cannot delete published meeting minutes" },
        { status: 403 }
      );
    }

    // Delete if draft or no status
    await MeetingMin.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Meeting minutes deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting meeting minutes:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
