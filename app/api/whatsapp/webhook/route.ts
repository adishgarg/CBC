import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import User from "@/models/user";
import { notifyProjectUpdate } from "@/lib/whatsapp";

type AppsScriptWebhookPayload = {
  projectId?: number | string;
  fileUrl?: string;
  fileName?: string;
  note?: string;
  secret?: string;
};

function parseNumericProjectId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function uniqueNonEmptyPhoneNumbers(phoneNumbers: Array<string | undefined>): string[] {
  const normalized = phoneNumbers
    .map((phone) => (typeof phone === "string" ? phone.trim() : ""))
    .filter((phone) => phone.length > 0);

  return [...new Set(normalized)];
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      endpoint: "/api/whatsapp/webhook",
      method: "POST",
      message: "Webhook route is reachable",
      requiredBody: ["projectId", "fileUrl"],
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AppsScriptWebhookPayload;

    const numericProjectId = parseNumericProjectId(body.projectId);
    if (numericProjectId === null) {
      return NextResponse.json(
        { error: "Valid numeric projectId is required" },
        { status: 400 }
      );
    }

    const fileUrl = String(body.fileUrl || "").trim();
    if (!fileUrl || !isValidHttpUrl(fileUrl)) {
      return NextResponse.json(
        { error: "Valid fileUrl is required" },
        { status: 400 }
      );
    }

    const configuredSecret = process.env.APPS_SCRIPT_WEBHOOK_SECRET?.trim();
    const providedSecret =
      req.headers.get("x-apps-script-secret") ||
      req.headers.get("x-webhook-secret") ||
      (typeof body.secret === "string" ? body.secret.trim() : "");

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findOne({ projectId: numericProjectId })
      .select("name projectId client clients teamMembers")
      .lean<{
        name?: string;
        projectId?: number;
        client?: { phoneNumber?: string };
        clients?: Array<{ phoneNumber?: string }>;
        teamMembers?: string[];
      }>();

    if (!project) {
      return NextResponse.json(
        { error: `Project not found for projectId ${numericProjectId}` },
        { status: 404 }
      );
    }

    const clientPhoneNumbers = uniqueNonEmptyPhoneNumbers([
      ...(project.clients?.map((client) => client.phoneNumber) || []),
      project.client?.phoneNumber,
    ]);

    const teamMembers = await User.find({ _id: { $in: project.teamMembers || [] } })
      .select("phoneNumber")
      .lean<Array<{ phoneNumber?: string }>>();

    const teamPhoneNumbers = uniqueNonEmptyPhoneNumbers(
      teamMembers.map((member) => member.phoneNumber)
    );

    if (clientPhoneNumbers.length === 0 && teamPhoneNumbers.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No recipient phone numbers found for this project",
          projectId: numericProjectId,
          recipients: 0,
        },
        { status: 200 }
      );
    }

    const detailsParts = [
      body.fileName ? `File: ${String(body.fileName).trim()}` : "",
      `URL: ${fileUrl}`,
      body.note ? `Note: ${String(body.note).trim()}` : "",
    ].filter(Boolean);

    const details = detailsParts.join(" | ");

    await notifyProjectUpdate(
      project.name || `Project ${numericProjectId}`,
      "file_uploaded",
      clientPhoneNumbers,
      teamPhoneNumbers,
      details
    );

    return NextResponse.json(
      {
        success: true,
        message: "WhatsApp notifications queued",
        projectId: numericProjectId,
        recipients: clientPhoneNumbers.length + teamPhoneNumbers.length,
        clientRecipients: clientPhoneNumbers.length,
        teamRecipients: teamPhoneNumbers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Apps Script WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook request" },
      { status: 500 }
    );
  }
}
