import { NextRequest, NextResponse } from "next/server";
import { listAllTasks } from "@/lib/tasks/googletasks";
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
    const maxResults = parseInt(searchParams.get("maxResults") || "100");
    const showCompleted = searchParams.get("showCompleted") !== "false";
    const showHidden = searchParams.get("showHidden") === "true";

    console.log("Fetching tasks with showCompleted:", showCompleted, "showHidden:", showHidden);
    const tasks = await listAllTasks(maxResults, showCompleted, showHidden);
    console.log("Total tasks fetched:", tasks.length);
    console.log("Completed tasks:", tasks.filter((t: any) => t.status === "completed").length);

    // Helper function to convert UTC date to local date in YYYY-MM-DD format
    const convertToLocalDate = (isoDateString: string) => {
      if (!isoDateString) return null;
      // Parse the UTC date and convert to local timezone date
      const date = new Date(isoDateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Transform to a format suitable for calendar display
    const transformedTasks = tasks.map((task: any) => ({
      id: task.id,
      title: task.title || "Untitled Task",
      notes: task.notes || "",
      status: task.status || "needsAction",
      due: task.due,
      completed: task.completed,
      updated: task.updated,
      taskListId: task.taskListId,
      taskListName: task.taskListName,
      parent: task.parent,
      position: task.position,
      // For calendar display - convert UTC to local date
      start: convertToLocalDate(task.due || task.updated),
      allDay: true, // Tasks are typically all-day events
    }));

    return NextResponse.json({ 
      success: true, 
      tasks: transformedTasks 
    });
  } catch (error: any) {
    console.error("Error fetching Google Tasks:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch tasks" 
      },
      { status: 500 }
    );
  }
}
