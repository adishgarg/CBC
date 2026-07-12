import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import { extractDatesFromSheet } from "@/lib/sheets/googlesheets";

export async function GET(
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

    // Get project with spreadsheet ID and sheet name
    const project = await Project.findById(id)
      .select("spreadsheetId sheetName name teamMembers createdBy")
      .lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = (project as any).teamMembers?.some(
      (member: any) => member?.toString?.() === decoded.userId
    );
    const isCreator = (project as any).createdBy?.toString?.() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.spreadsheetId) {
      return NextResponse.json(
        { success: true, dates: [], message: "No spreadsheet linked to this project" },
        { status: 200 }
      );
    }

    // Extract dates from the spreadsheet, optionally from a specific sheet
    const dates = await extractDatesFromSheet(
      project.spreadsheetId, 
      project.sheetName || undefined
    );

    return NextResponse.json(
      {
        success: true,
        dates,
        spreadsheetId: project.spreadsheetId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching sheet dates:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch dates from spreadsheet" 
      },
      { status: 500 }
    );
  }
}
