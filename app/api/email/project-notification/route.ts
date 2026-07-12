import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendBatchEmails, projectCreatedEmail } from "@/lib/email";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";

/**
 * API endpoint to send project creation notifications to team members
 * POST /api/email/project-notification
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Parse request body
    const body = await req.json();
    const { projectId, projectName, clientName, startDate, teamMemberIds } = body;

    // Validate required fields
    if (!projectName || !clientName || !startDate || !teamMemberIds || !Array.isArray(teamMemberIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database and fetch team members
    await connectDB();
    const teamMembers = await User.find({ _id: { $in: teamMemberIds } }).select("name email");

    if (teamMembers.length === 0) {
      return NextResponse.json(
        { error: "No team members found" },
        { status: 404 }
      );
    }

    // Prepare project URL
    const projectUrl = projectId
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/${projectId}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects`;

    // Create email for each team member
    const emails = teamMembers.map((member) => {
      const emailData = {
        projectName,
        clientName,
        teamMemberName: member.name || member.email,
        startDate: new Date(startDate).toLocaleDateString("en-US", {
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

    // Send batch emails
    const results = await sendBatchEmails(emails);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      message: `Project notifications sent: ${successful} successful, ${failed} failed`,
      results: results.map((r) => ({
        email: r.email.to,
        status: r.status,
        error: r.error ? (r.error instanceof Error ? r.error.message : "Unknown error") : null,
      })),
    });
  } catch (error) {
    console.error("Error sending project notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to send notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
