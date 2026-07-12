import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongoose";
import Project from "@/models/project";

interface WorkflowPatchPayload {
  currentPhaseId?: number;
  phaseId?: number;
}

const WORKFLOW_PHASE_COUNT = 22;

function normalizePhaseId(value: unknown): number | null {
  const phaseId = Number(value);
  if (!Number.isInteger(phaseId) || phaseId < 1 || phaseId > WORKFLOW_PHASE_COUNT) {
    return null;
  }

  return phaseId;
}

function getProgressForPhase(phaseId: number): number {
  if (WORKFLOW_PHASE_COUNT <= 1) {
    return 100;
  }

  return Math.round(((phaseId - 1) / (WORKFLOW_PHASE_COUNT - 1)) * 100);
}

export async function PATCH(
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
    const body = (await req.json()) as WorkflowPatchPayload;

    const currentPhaseId = normalizePhaseId(body.currentPhaseId);
    const notOptedPhaseId = normalizePhaseId(body.phaseId);

    if (currentPhaseId === null && notOptedPhaseId === null) {
      return NextResponse.json(
        { error: "Valid currentPhaseId or phaseId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isTeamMember = project.teamMembers.some(
      (member: { toString: () => string }) => member.toString() === decoded.userId
    );
    const isCreator = project.createdBy.toString() === decoded.userId;

    if (!isTeamMember && !isCreator) {
      return NextResponse.json(
        { error: "Not authorized to update this project" },
        { status: 403 }
      );
    }

    if (!project.workflow || typeof project.workflow !== "object") {
      project.workflow = { currentPhaseId: 1, notOptedPhases: [], updatedAt: new Date() };
    }

    if (currentPhaseId !== null) {
      project.workflow.currentPhaseId = currentPhaseId;
      project.progress = getProgressForPhase(currentPhaseId);
    }

    if (notOptedPhaseId !== null) {
      const existingNotOpted = Array.isArray(project.workflow.notOptedPhases)
        ? project.workflow.notOptedPhases
        : [];

      if (!existingNotOpted.includes(notOptedPhaseId)) {
        existingNotOpted.push(notOptedPhaseId);
        project.workflow.notOptedPhases = existingNotOpted;
      }
    }

    project.workflow.updatedAt = new Date();
    await project.save();

    return NextResponse.json(
      {
        message: "Workflow phase updated successfully",
        project,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Project workflow update error:", error);
    return NextResponse.json(
      { error: "Failed to update project workflow" },
      { status: 500 }
    );
  }
}
