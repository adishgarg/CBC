import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import CalendarEvent from "@/models/calendarevent";
import Project from "@/models/project";
import User from "@/models/user";

// GET - Fetch all calendar events for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    await connectDB();

    // Ensure models are registered
    void User;
    void Project;

    // 1. Fetch custom events created by the user
    const customEvents = await CalendarEvent.find({
      user: decoded.userId,
      type: "event",
    }).lean();

    // 2. Fetch projects where user is a team member
    const projects = await Project.find({
      teamMembers: decoded.userId,
    })
      .select("name timeline status")
      .lean();

    // Transform data to FullCalendar format
    const events = [
      // Custom events
      ...customEvents.map((event) => ({
        id: event._id.toString(),
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        extendedProps: {
          calendar: event.color,
          type: "event",
          description: event.description,
        },
      })),

      // Projects as timeline events (blue color scheme)
      ...projects
        .filter((p) => p.timeline?.startDate)
        .map((project) => ({
          id: `project-${project._id}`,
          title: `📋 ${project.name}`,
          start: project.timeline.startDate,
          end: project.timeline.endDate || project.timeline.startDate,
          allDay: true,
          extendedProps: {
            calendar: "Primary", // Blue for all projects
            type: "project",
            projectId: project._id,
            status: project.status,
          },
        })),
    ];

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Calendar events fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch calendar events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a new custom calendar event
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

    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Event title is required" },
        { status: 400 }
      );
    }

    if (!body.start) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const newEvent = await CalendarEvent.create({
      title: body.title,
      description: body.description,
      start: new Date(body.start),
      end: body.end ? new Date(body.end) : new Date(body.start),
      allDay: body.allDay ?? true,
      color: body.color || "Primary",
      type: "event",
      user: decoded.userId,
    });

    const event = {
      id: newEvent._id.toString(),
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end,
      allDay: newEvent.allDay,
      extendedProps: {
        calendar: newEvent.color,
        type: "event",
        description: newEvent.description,
      },
    };

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Calendar event creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
