import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { uploadFileToFolder } from "@/lib/drive/googledrive";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import User from "@/models/user";
import { sendBatchEmails } from "@/lib/email";
import { fileUploadEmail } from "@/lib/email/templates";
import { notifyProjectUpdate } from "@/lib/whatsapp";

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

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

export async function POST(req: NextRequest) {
  try {
    // Auth (same pattern as your project route)
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const parentFolderId = formData.get("parentFolderId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!parentFolderId || !parentFolderId.trim()) {
      return NextResponse.json(
        { error: "parentFolderId is required" },
        { status: 400 }
      );
    }

    if (!projectId || !projectId.trim()) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const projectAccess = await Project.findById(projectId).select("teamMembers createdBy");
    if (!projectAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = projectAccess.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = projectAccess.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to upload files for this project" },
        { status: 403 }
      );
    }

    // Convert file to buffer (Node-compatible)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive inside the provided parent folder
    const uploadedFile = await uploadFileToFolder(
      file.name,
      file.type || "application/octet-stream",
      buffer,
      parentFolderId
    );

    // Send email notifications to client and team members
    try {
      // Fetch project with populated team members
      const project = await Project.findById(projectId)
        .populate('teamMembers', 'name email phoneNumber')
        .lean();

      if (project) {
        // Get uploader information
        const uploader = await User.findById(decoded.userId).select('name email').lean();
        const uploaderName = uploader?.name || uploader?.email || 'Unknown';

        // Prepare email data
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const projectUrl = `${appUrl}/dashboard/projects/${projectId}`;
        
        const emailData = fileUploadEmail({
          projectName: project.name,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          uploadedBy: uploaderName,
          projectUrl,
        });

        // Collect recipient emails
        const recipients: string[] = [];
        
        // Add all team member emails
        if (project.teamMembers && Array.isArray(project.teamMembers)) {
          for (const member of project.teamMembers) {
            if (typeof member === 'object' && member !== null && 'email' in member) {
              recipients.push(member.email as string);
            }
          }
        }

        // Send emails if there are recipients
        if (recipients.length > 0) {
          await sendBatchEmails(
            recipients.map(email => ({
              to: email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            }))
          );
          console.log(`File upload notifications sent to ${recipients.length} recipients`);
        }

        // Send WhatsApp notifications (non-blocking)
        try {
          const clientPhoneNumbers = getProjectClientPhoneNumbers(project as {
            client?: { phoneNumber?: string };
            clients?: Array<{ phoneNumber?: string }>;
          });
          const teamMembers = await User.find({ _id: { $in: project.teamMembers || [] } })
            .select("phoneNumber")
            .lean<Array<{ phoneNumber?: string }>>();
          const teamPhoneNumbers = teamMembers
            .map((member) => member.phoneNumber)
            .filter((phone: string | undefined): phone is string => typeof phone === "string" && phone.trim().length > 0);

          if (clientPhoneNumbers.length > 0 || teamPhoneNumbers.length > 0) {
            await notifyProjectUpdate(
              project.name,
              "file_uploaded",
              clientPhoneNumbers,
              teamPhoneNumbers,
              `File uploaded: ${file.name} (${formatFileSize(file.size)}) by ${uploaderName}`
            );
            console.log(`WhatsApp file upload notifications sent for ${projectId}`);
          }
        } catch (whatsappError) {
          // Log WhatsApp error but don't fail the upload
          console.error("Error sending WhatsApp file upload notifications:", whatsappError);
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the upload
      console.error('Error sending file upload notifications:', emailError);
    }

    try {
      await Project.findByIdAndUpdate(projectId, {
        $set: {
          lastActivityAt: new Date(),
          lastActivityType: "file_uploaded",
          lastActivityMessage: `File uploaded by ${decoded.email}`,
          lastActivityFileName: file.name,
          lastActivityBy: decoded.userId,
        },
      });
    } catch (activityError) {
      console.error("Error recording project file upload activity:", activityError);
    }

    // No need to save to MongoDB - files are fetched dynamically from Drive folder
    
    return NextResponse.json(
      {
        message: "File uploaded successfully",
        file: uploadedFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
