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

interface CreateMeetingMinPayload {
  projectId: string;
  content: string;
  status?: "draft" | "published";
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

    const body = (await req.json()) as CreateMeetingMinPayload;

    if (!body?.projectId?.trim()) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!body?.content?.trim()) {
      return NextResponse.json({ error: "Meeting minutes content is required" }, { status: 400 });
    }

    await connectDB();

    // Verify project exists
    const project = await Project.findById(body.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to create meeting minutes for this project" },
        { status: 403 }
      );
    }

    // Create meeting minutes
    const now = new Date();
    const meetingMin = await MeetingMin.create({
      title: `Meeting Minutes - ${now.toLocaleDateString()}`,
      date: now,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      minutes: body.content.trim(),
      status: body.status || "draft",
      createdBy: decoded.userId,
      project: body.projectId,
    });

    // Add meeting minutes reference to project
    project.meetingMins = project.meetingMins || [];
    project.meetingMins.push(meetingMin._id);
    await project.save();

    // Notify only when meeting minutes are created as published
    if (meetingMin.status === "published") {
      try {
        // Fetch project with populated team members
        const populatedProject = await Project.findById(body.projectId)
          .populate("teamMembers", "name email phoneNumber")
          .lean();

        if (populatedProject) {
          // Get creator information
          const creator = await User.findById(decoded.userId).select("name email").lean();
          const creatorName = creator?.name || creator?.email || "Unknown";

          // Prepare preview text (first 150 characters)
          const preview =
            body.content.trim().substring(0, 150) +
            (body.content.length > 150 ? "..." : "");

          // Prepare email data
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const projectUrl = `${appUrl}/dashboard/projects/${body.projectId}`;

          const emailData = meetingMinutesEmail({
            projectName: populatedProject.name,
            meetingDate: now.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            meetingTime: now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
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
            console.log(`Meeting minutes notifications sent to ${recipients.size} recipients`);
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
                `Meeting minutes added by ${creatorName}\n\nPreview: ${preview}`
              );
              console.log(`WhatsApp meeting minutes notifications sent for ${body.projectId}`);
            }
          } catch (whatsappError) {
            // Log WhatsApp error but don't fail the creation
            console.error("Error sending WhatsApp meeting minutes notifications:", whatsappError);
          }
        }
      } catch (emailError) {
        // Log email error but don't fail the creation
        console.error("Error sending meeting minutes notifications:", emailError);
      }
    }

    return NextResponse.json(
      {
        message: "Meeting minutes created successfully",
        meetingMin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating meeting minutes:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
