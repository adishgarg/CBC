import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";
import User from "@/models/user";

// Add a team member to the project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { id } = await params;
    const body = await req.json();

    if (!body.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    // Ensure User model is registered
    void User;

    // Find the project
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is authorized (team member or creator)
    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to modify this project" },
        { status: 403 }
      );
    }

    // Check if user exists
    const userExists = await User.findById(body.userId);
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a team member
    const isAlreadyMember = project.teamMembers.some(
      (member: any) => member.toString() === body.userId
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Add the user to team members
    project.teamMembers.push(body.userId);
    await project.save();

    // Populate and return the updated project
    const updatedProject = await Project.findById(id)
      .populate("teamMembers", "name email role")
      .lean();

    return NextResponse.json(
      {
        message: "Team member added successfully",
        project: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add team member error:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

// Remove a team member from the project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const userIdToRemove = searchParams.get("userId");

    if (!userIdToRemove) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    // Ensure User model is registered
    void User;

    // Find the project
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is authorized (team member or creator)
    const isTeamMember = project.teamMembers.some(
      (member: any) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to modify this project" },
        { status: 403 }
      );
    }

    // Cannot remove the project creator
    if (project.createdBy.toString() === userIdToRemove) {
      return NextResponse.json(
        { error: "Cannot remove the project creator" },
        { status: 400 }
      );
    }

    // Remove the user from team members
    project.teamMembers = project.teamMembers.filter(
      (member: any) => member.toString() !== userIdToRemove
    );
    await project.save();

    // Populate and return the updated project
    const updatedProject = await Project.findById(id)
      .populate("teamMembers", "name email role")
      .lean();

    return NextResponse.json(
      {
        message: "Team member removed successfully",
        project: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
