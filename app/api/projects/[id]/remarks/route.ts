import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Remark from "@/models/remark";
import Project from "@/models/project";
import User from "@/models/user";
import { sendBatchEmails } from "@/lib/email";
import { commentEmail } from "@/lib/email/templates";
import { notifyProjectUpdate } from "@/lib/whatsapp";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/projects/[id]/remarks?fileName=xxx - Get all remarks for a file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { error: "fileName query parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all remarks for this file
    const remarks = await Remark.find({
      project: projectId,
      fileName: fileName,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ remarks });
  } catch (error) {
    console.error("Error fetching remarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch remarks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/remarks - Create a new remark
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check for authentication (required)
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
    const userId = decoded.userId;

    const { id: projectId } = await params;
    const body = await request.json();
    const { comment, fileName } = body;

    if (!comment || !fileName) {
      return NextResponse.json(
        { error: "comment and fileName are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create the remark with appropriate fields
    const remarkData: any = {
      comment,
      fileName,
      project: projectId,
    };

    remarkData.createdBy = userId;

    const remark = await Remark.create(remarkData);

    // Populate the createdBy field if present
    if (userId) {
      await remark.populate("createdBy", "name email");
    }

    // Send email notifications to client and team members
    try {
      // Fetch project with populated team members
      const populatedProject = await Project.findById(projectId)
        .populate('teamMembers', 'name email')
        .lean();

      if (populatedProject) {
        // Determine commenter name
        const commenter = await User.findById(userId).select('name email').lean();
        const commenterName = commenter?.name || commenter?.email || 'Team Member';

        // Prepare email data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const projectUrl = `${appUrl}/dashboard/projects/${projectId}`;
        
        const emailData = commentEmail({
          projectName: populatedProject.name,
          fileName,
          comment,
          commentBy: commenterName,
          projectUrl,
        });

        // Collect recipient emails
        const recipients = new Set<string>();

        // Add all team member emails
        if (populatedProject.teamMembers && Array.isArray(populatedProject.teamMembers)) {
          for (const member of populatedProject.teamMembers) {
            if (typeof member === 'object' && member !== null && 'email' in member) {
              recipients.add(member.email as string);
            }
          }
        }

        // Send emails if there are recipients
        if (recipients.size > 0) {
          await sendBatchEmails(
            Array.from(recipients).map(email => ({
              to: email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            }))
          );
          console.log(`Comment notifications sent to ${recipients.size} recipients`);
        }

        // Send WhatsApp notifications (non-blocking)
        try {
          const teamMembers = await User.find({ _id: { $in: populatedProject.teamMembers || [] } })
            .select("phoneNumber")
            .lean<Array<{ phoneNumber?: string }>>();
          const teamPhoneNumbers = teamMembers
            .map((member) => member.phoneNumber)
            .filter((phone: string | undefined): phone is string => typeof phone === "string" && phone.trim().length > 0);
          const clientPhoneNumbers = [
            ...(populatedProject.clients?.map((client: any) => client?.phoneNumber) || []),
            populatedProject.client?.phoneNumber,
          ].filter((phone): phone is string => typeof phone === "string" && phone.trim().length > 0);

          if (clientPhoneNumbers.length > 0 || teamPhoneNumbers.length > 0) {
            await notifyProjectUpdate(
              populatedProject.name,
              "other",
              clientPhoneNumbers,
              teamPhoneNumbers,
              `New comment on ${fileName} by ${commenterName}: ${String(comment).slice(0, 120)}`
            );
            console.log("WhatsApp comment notifications queued");
          }
        } catch (whatsappError) {
          console.error("Error sending WhatsApp comment notifications:", whatsappError);
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the creation
      console.error('Error sending comment notifications:', emailError);
    }

    return NextResponse.json({ remark }, { status: 201 });
  } catch (error) {
    console.error("Error creating remark:", error);
    return NextResponse.json(
      { error: "Failed to create remark" },
      { status: 500 }
    );
  }
}
