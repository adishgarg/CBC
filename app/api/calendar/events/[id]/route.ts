import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import CalendarEvent from "@/models/calendarevent";

// PUT - Update a calendar event
export async function PUT(
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
    const body = await req.json();

    await connectDB();

    // Find event and verify ownership
    const event = await CalendarEvent.findOne({
      _id: id,
      user: decoded.userId,
      type: "event", // Only allow updating custom events
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update event
    if (body.title) event.title = body.title;
    if (body.description !== undefined) event.description = body.description;
    if (body.start) event.start = new Date(body.start);
    if (body.end) event.end = new Date(body.end);
    if (body.allDay !== undefined) event.allDay = body.allDay;
    if (body.color) event.color = body.color;

    await event.save();

    const updatedEvent = {
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
    };

    return NextResponse.json({ event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error("Calendar event update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a calendar event
export async function DELETE(
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

    // Find and delete event (verify ownership)
    const event = await CalendarEvent.findOneAndDelete({
      _id: id,
      user: decoded.userId,
      type: "event", // Only allow deleting custom events
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calendar event delete error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
