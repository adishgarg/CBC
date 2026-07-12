import { NextRequest, NextResponse } from "next/server";
import { listCalendarEvents } from "@/lib/calendar/googlecalendar";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    await connectDB();
    const user = await User.findById(decoded.userId).select("role");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    
    // Get events from now to 3 months in the future
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 3);

    const events = await listCalendarEvents(maxResults, timeMin, timeMax);

    // Transform to a format suitable for display
    const transformedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.summary || "No Title",
      description: event.description || "",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || "",
      attendees: event.attendees || [],
      htmlLink: event.htmlLink,
      status: event.status,
      allDay: !event.start?.dateTime, // If no time, it's an all-day event
    }));

    return NextResponse.json({ 
      success: true, 
      events: transformedEvents 
    });
  } catch (error: any) {
    console.error("Error fetching Google Calendar events:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch calendar events" 
      },
      { status: 500 }
    );
  }
}
