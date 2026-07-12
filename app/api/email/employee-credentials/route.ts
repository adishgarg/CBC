import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEmail, employeeCreatedEmail } from "@/lib/email";

/**
 * API endpoint to send employee credentials email
 * POST /api/email/employee-credentials
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
    const { employeeEmail, employeeName, password, role } = body;

    // Validate required fields
    if (!employeeEmail || !employeeName || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare email template data
    const emailData = {
      name: employeeName,
      email: employeeEmail,
      password: password,
      role: role,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
    };

    // Generate email content
    const emailContent = employeeCreatedEmail(emailData);

    // Send email
    const result = await sendEmail({
      to: employeeEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      success: true,
      message: "Employee credentials email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error sending employee credentials email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
