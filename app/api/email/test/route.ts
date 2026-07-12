import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyEmailConnection, sendEmail, welcomeEmail } from "@/lib/email";

/**
 * API endpoint to test email configuration and send a test email
 * GET /api/email/test - Verify SMTP connection
 * POST /api/email/test - Send a test email
 */

export async function GET(req: NextRequest) {
  try {
    // Verify authentication (admin only)
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Verify SMTP connection
    const isConnected = await verifyEmailConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "SMTP connection verified successfully",
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "SMTP connection verification failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying email connection:", error);
    return NextResponse.json(
      {
        error: "Failed to verify email connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication (admin only)
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
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email address is required" },
        { status: 400 }
      );
    }

    // Prepare test email
    const emailData = {
      name: "Test User",
      email: testEmail,
    };

    const emailContent = welcomeEmail(emailData);

    // Send test email
    const result = await sendEmail({
      to: testEmail,
      subject: `${emailContent.subject} (Test Email)`,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
