import { NextRequest, NextResponse } from "next/server";
import { getSheetMetadata } from "@/lib/sheets/googlesheets";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Spreadsheet ID required" }, { status: 400 });
    }

    const metadata = await getSheetMetadata(id);

    return NextResponse.json(metadata, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching sheet metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sheet metadata" },
      { status: 500 }
    );
  }
}
