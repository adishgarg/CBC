"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProjectFiles from "@/components/projects/ProjectFiles";
import ProjectViewsCarousel from "@/components/projects/ProjectViewsCarousel";
import { useUser } from "@/context/UserContext";
import MeetingMinutesModal from "@/components/common/MeetingMinutesModal";
import ConfirmDialog from "@/components/ui/dialog/ConfirmDialog";
import AlertDialog from "@/components/ui/dialog/AlertDialog";
import ProjectSheetCalendar from "@/components/projects/ProjectSheetCalendar";
import LinkSpreadsheetModal from "@/components/projects/LinkSpreadsheetModal";
import AddMemberModal from "@/components/projects/AddMemberModal";
import {
  getWorkflowIndexFromPhaseId,
  getWorkflowProgressFromPhaseId,
  WORKFLOW_PHASES,
} from "@/components/projects/ProjectWorkflowModal";
import ProjectWorkflowInline from "@/components/projects/ProjectWorkflowInline";
import ProjectWorkflowModal from "@/components/projects/ProjectWorkflowModal";
import { Modal } from "@/components/ui/modal";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface ProjectFile {
  _id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  driveFileId: string;
}

interface MeetingMinute {
  _id: string;
  title: string;
  date: string;
  time: string;
  minutes: string;
  status?: "draft" | "published";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Project {
  _id: string;
  timelineIsRed?: boolean;
  name: string;
  description?: string;
  projectType: "architecture" | "interior" | "both";
  createdBy?: string | { _id: string };
  client?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  clients: Array<{
    name: string;
    email?: string;
    phoneNumber?: string;
  }>;
  teamMembers: TeamMember[];
  status: "active" | "completed" | "on hold";
  timeline: {
    startDate: string;
    endDate?: string;
  };
  files: ProjectFile[];
  architectureFolderId: string;
  interiorFolderId: string;
  viewsFolderId?: string;
  progress: number;
  workflow?: {
    currentPhaseId?: number;
    notOptedPhases?: number[];
    updatedAt?: string;
  };
  createdAt: string;
  meetingMins?: MeetingMinute[];
  spreadsheetId?: string;
  sheetName?: string;
}

interface ProjectViewImage {
  driveFileId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt?: string;
  modifiedAt?: string;
  previewUrl: string;
  viewUrl?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [architectureFiles, setArchitectureFiles] = useState<ProjectFile[]>([]);
  const [interiorFiles, setInteriorFiles] = useState<ProjectFile[]>([]);
  const [viewImages, setViewImages] = useState<ProjectViewImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewImagesLoading, setViewImagesLoading] = useState(false);
  const [uploadingViewImages, setUploadingViewImages] = useState(false);
  const [error, setError] = useState("");
  const [editingMeeting, setEditingMeeting] = useState<MeetingMinute | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    status: "active" as Project["status"],
    startDate: "",
    endDate: "",
  });
  const [updatingProject, setUpdatingProject] = useState(false);
  const [clientForms, setClientForms] = useState<Array<{
    name: string;
    email: string;
    phoneNumber: string;
  }>>([]);
  const [updatingClient, setUpdatingClient] = useState(false);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
    confirmText?: string;
    cancelText?: string;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, variant: "danger" });
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", variant: "info" });
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLinkSpreadsheetModalOpen, setIsLinkSpreadsheetModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState<MeetingMinute | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  

  // Fetch files from available project folders (architecture and/or interior)
  const fetchAllFiles = async (architectureId?: string, interiorId?: string) => {
    try {
      setFilesLoading(true);

      if (!architectureId && !interiorId) {
        setArchitectureFiles([]);
        setInteriorFiles([]);
        setFiles([]);
        return;
      }

      const fetchFolderFiles = async (
        folderId: string,
        folderName: "Architecture" | "Interior"
      ): Promise<ProjectFile[]> => {
        const response = await fetch(`/api/files/list?folderId=${folderId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${folderName.toLowerCase()} files`);
        }

        const data = await response.json();
        return (data.files || []).map((f: ProjectFile) => ({
          ...f,
          folder: folderName,
        }));
      };

      const architecturePromise = architectureId
        ? fetchFolderFiles(architectureId, "Architecture")
        : Promise.resolve([]);
      const interiorPromise = interiorId
        ? fetchFolderFiles(interiorId, "Interior")
        : Promise.resolve([]);

      const [architectureResult, interiorResult] = await Promise.allSettled([
        architecturePromise,
        interiorPromise,
      ]);

      if (architectureResult.status === "rejected") {
        console.error("Error fetching architecture files:", architectureResult.reason);
      }

      if (interiorResult.status === "rejected") {
        console.error("Error fetching interior files:", interiorResult.reason);
      }

      const archFiles =
        architectureResult.status === "fulfilled" ? architectureResult.value : [];
      const intFiles =
        interiorResult.status === "fulfilled" ? interiorResult.value : [];
      
      setArchitectureFiles(archFiles);
      setInteriorFiles(intFiles);
      setFiles([...archFiles, ...intFiles]);
    } catch (err) {
      console.error("Error fetching files:", err);
      setArchitectureFiles([]);
      setInteriorFiles([]);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchProjectViews = useCallback(async () => {
    try {
      setViewImagesLoading(true);

      const response = await fetch(`/api/projects/${projectId}/views`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Project views unavailable:", response.status);
        setViewImages([]);
        return;
      }

      const data = await response.json();
      setViewImages(data.images || []);

      if (data.viewsFolderId) {
        setProject((prev) =>
          prev && prev.viewsFolderId !== data.viewsFolderId
            ? { ...prev, viewsFolderId: data.viewsFolderId }
            : prev
        );
      }
    } catch (err) {
      console.error("Error fetching project views:", err);
      setViewImages([]);
    } finally {
      setViewImagesLoading(false);
    }
  }, [projectId]);

  const ensureViewsFolderId = async () => {
    if (project?.viewsFolderId) {
      return project.viewsFolderId;
    }

    const response = await fetch(`/api/projects/${projectId}/views`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to prepare Views folder");
    }

    const data = await response.json();
    if (data.viewsFolderId) {
      setProject((prev) => (prev ? { ...prev, viewsFolderId: data.viewsFolderId } : prev));
    }

    setViewImages(data.images || []);

    if (!data.viewsFolderId) {
      throw new Error("Views folder not configured for this project");
    }

    return data.viewsFolderId as string;
  };

  const uploadViewImages = async (filesToUpload: File[]) => {
    if (!project) return;

    const imageFiles = filesToUpload.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: "No Images Selected",
        message: "Please select image files to upload to Views.",
        variant: "warning",
      });
      return;
    }

    try {
      setUploadingViewImages(true);
      const viewsFolderId = await ensureViewsFolderId();

      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("parentFolderId", viewsFolderId);
        formData.append("projectId", project._id);

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          let message = "Failed to upload image";

          try {
            const errorData = await response.json();
            message = errorData.error || message;
          } catch {
            try {
              const errorText = await response.text();
              if (errorText) {
                message = errorText;
              }
            } catch {
              // Ignore parsing errors and use default message.
            }
          }

          throw new Error(message);
        }
      }

      await fetchProjectViews();
      setAlertDialog({
        isOpen: true,
        title: "Views Updated",
        message: `Uploaded ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} to Views.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error uploading view images:", err);
      setAlertDialog({
        isOpen: true,
        title: "Upload Failed",
        message: err instanceof Error ? err.message : "Failed to upload views images.",
        variant: "error",
      });
    } finally {
      setUploadingViewImages(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
        
        // Fetch files from whichever folder(s) are configured for this project
        await fetchAllFiles(data.project.architectureFolderId, data.project.interiorFolderId);
        await fetchProjectViews();
      } catch (err) {
        setError("Failed to load project");
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, fetchProjectViews]);

  const refetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      setProject(data.project);
    } catch (err) {
      console.error("Error refetching project:", err);
    }
  };

  const updateWorkflowPhase = async (phaseId: number) => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPhaseId: phaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update workflow phase");
      }

      const data = await response.json();
      const nextProgress =
        typeof data.project?.progress === "number"
          ? data.project.progress
          : getWorkflowProgressFromPhaseId(phaseId);

      setProject((prev) =>
        prev
          ? {
              ...prev,
              progress: nextProgress,
              workflow: {
                ...prev.workflow,
                currentPhaseId: data.project?.workflow?.currentPhaseId ?? phaseId,
                notOptedPhases: Array.isArray(data.project?.workflow?.notOptedPhases)
                  ? data.project.workflow.notOptedPhases
                  : prev.workflow?.notOptedPhases ?? [],
                updatedAt: data.project?.workflow?.updatedAt || prev.workflow?.updatedAt,
              },
            }
          : prev
      );

      setAlertDialog({
        isOpen: true,
        title: "Workflow Updated",
        message: `Project phase updated to phase ${phaseId}.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error updating workflow phase:", err);
      setAlertDialog({
        isOpen: true,
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to update workflow phase.",
        variant: "error",
      });
    }
  };

  const markWorkflowPhaseNotOpted = async (phaseId: number) => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update workflow phase");
      }

      const data = await response.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              workflow: {
                ...prev.workflow,
                currentPhaseId: data.project?.workflow?.currentPhaseId ?? prev.workflow?.currentPhaseId,
                notOptedPhases: Array.isArray(data.project?.workflow?.notOptedPhases)
                  ? data.project.workflow.notOptedPhases
                  : prev.workflow?.notOptedPhases ?? [],
                updatedAt: data.project?.workflow?.updatedAt || prev.workflow?.updatedAt,
              },
            }
          : prev
      );

      setAlertDialog({
        isOpen: true,
        title: "Workflow Updated",
        message: `Phase ${phaseId} marked as not opted.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error marking workflow phase not opted:", err);
      setAlertDialog({
        isOpen: true,
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to mark phase not opted.",
        variant: "error",
      });
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!project) return;

    const creatorId =
      typeof project.createdBy === "string"
        ? project.createdBy
        : project.createdBy?._id;

    const isUserProjectManager =
      !!user &&
      (user.id === creatorId || project.teamMembers.some((member) => member._id === user.id));

    if (!isUserProjectManager) {
      setAlertDialog({
        isOpen: true,
        title: "Not Allowed",
        message: "You are not authorized to remove team members from this project.",
        variant: "error",
      });
      return;
    }

    if (creatorId && memberId === creatorId) {
      setAlertDialog({
        isOpen: true,
        title: "Cannot Remove Creator",
        message: "The project creator cannot be removed from the team.",
        variant: "warning",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Remove Team Member",
      message: `Are you sure you want to remove ${memberName} from this project?`,
      variant: "warning",
      confirmText: "Remove",
      cancelText: "Keep Member",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `/api/projects/${projectId}/members?userId=${memberId}`,
            {
              method: "DELETE",
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to remove member");
          }

          // Refetch project to update the team members list
          await refetchProject();

          setAlertDialog({
            isOpen: true,
            title: "Success",
            message: "Team member removed successfully",
            variant: "success",
          });
        } catch (err: any) {
          console.error("Error removing member:", err);
          setAlertDialog({
            isOpen: true,
            title: "Error",
            message: err.message || "Failed to remove team member. Please try again.",
            variant: "error",
          });
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return parsedDate.toISOString().split("T")[0];
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "success";
      case "on hold":
        return "warning";
      case "completed":
        return "primary";
      default:
        return "light";
    }
  };

  const getStatusDisplay = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "Active";
      case "on hold":
        return "On Hold";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const copyProjectLink = async () => {
    const clientLink = `${window.location.origin}/project/${projectId}`;
    try {
      await navigator.clipboard.writeText(clientLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error || "Project not found"}</p>
            <Link
              href="/dashboard/projects"
              className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creatorId =
    typeof project.createdBy === "string"
      ? project.createdBy
      : project.createdBy?._id;

  const workflowActiveIndex = getWorkflowIndexFromPhaseId(project.workflow?.currentPhaseId);
  const workflowCurrentStage = WORKFLOW_PHASES[workflowActiveIndex]?.title || "Work in progress";

  const canManageMembers =
    !!user &&
    (user.id === creatorId || project.teamMembers.some((member) => member._id === user.id));

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/dashboard/projects" className="hover:text-brand-600 dark:hover:text-brand-400">
          Projects
        </Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200">{project.name}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
            {project.name}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Client: {project.clients?.[0]?.name || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={getStatusColor(project.status)}>{getStatusDisplay(project.status)}</Badge>
          <button 
            onClick={copyProjectLink}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {copiedLink ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={() => {
              setProjectForm({
                name: project.name,
                status: project.status,
                startDate: formatDateForInput(project.timeline.startDate),
                endDate: formatDateForInput(project.timeline.endDate),
              });
              setIsEditProjectModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800"
          >
            Edit Project
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
          <div className="relative">
            <div
              className="mt-2 rounded-lg p-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {project.progress}%
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all dark:bg-brand-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Current stage
                  </div>
                  <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {workflowCurrentStage}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={project.timelineIsRed
            ? "rounded-2xl border border-red-200 bg-red-100 p-5 dark:border-red-900/40 dark:bg-red-900/20"
            : "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          }
        >
          <div
            className={
              project.timelineIsRed
                ? "text-sm text-red-700 dark:text-red-300"
                : "text-sm text-gray-500 dark:text-gray-400"
            }
          >
            Timeline
          </div>
          <div
            className={
              project.timelineIsRed
                ? "mt-2 text-lg font-bold text-red-800 dark:text-red-200"
                : "mt-2 text-lg font-bold text-gray-800 dark:text-white/90"
            }
          >
            {formatDate(project.timeline.startDate)}
          </div>
          {project.timeline.endDate && (
            <div
              className={
                project.timelineIsRed
                  ? "mt-1 text-sm text-red-700 dark:text-red-300"
                  : "mt-1 text-sm text-gray-500 dark:text-gray-400"
              }
            >
              to {formatDate(project.timeline.endDate)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Team Members</div>
          <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {project.teamMembers.length}
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Active members</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Description */}
          {project.description && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Project Description
              </h3>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {/* Project Files */}
          <ProjectFiles
            projectId={project._id}
            files={files}
            architectureFiles={architectureFiles}
            interiorFiles={interiorFiles}
            architectureFolderId={project.architectureFolderId}
            interiorFolderId={project.interiorFolderId}
            projectType={project.projectType}
            onFileUpload={async (file: File, folderId: string) => {
              try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("parentFolderId", folderId);
                formData.append("projectId", project._id);

                const res = await fetch("/api/files/upload", {
                  method: "POST",
                  body: formData,
                  credentials: "include",
                });

                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(errText || "Upload failed");
                }

                const data = await res.json();
                console.log("Uploaded file:", data.file);

                // Refresh files from whichever folder(s) this project has
                await fetchAllFiles(project.architectureFolderId, project.interiorFolderId);
              } catch (err) {
                console.error("File upload error:", err);
                alert("Failed to upload file");
              }
            }}
            onFileDelete={async (driveFileId: string) => {
              try {
                if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
                  return;
                }

                const res = await fetch("/api/files/delete", {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    driveFileId,
                  }),
                  credentials: "include",
                });

                if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.error || "Delete failed");
                }

                console.log("File deleted successfully");

                // Refresh files from whichever folder(s) this project has
                await fetchAllFiles(project.architectureFolderId, project.interiorFolderId);
              } catch (err) {
                console.error("File delete error:", err);
                alert("Failed to delete file");
              }
            }}
          />

          <ProjectViewsCarousel
            images={viewImages}
            loading={viewImagesLoading}
            uploading={uploadingViewImages}
            onUpload={uploadViewImages}
          />

          {/* Project Schedule from Google Sheets */}
          {/* <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-start justify-between mb-4 gap-4">*/
              <div className="flex-1 min-w-0">
                <ProjectWorkflowInline
                  projectName={project.name}
                  projectType={project.projectType}
                  currentProgress={project.progress}
                  currentPhaseId={project.workflow?.currentPhaseId}
                  onViewWorkflow={() => setIsWorkflowModalOpen(true)}
                />
               <ProjectWorkflowModal
                  isOpen={isWorkflowModalOpen}
                  onClose={() => setIsWorkflowModalOpen(false)}
                  projectName={project.name}
                  projectType={project.projectType}
                  currentPhaseId={project.workflow?.currentPhaseId}
                  onUpdatePhase={updateWorkflowPhase}
                  onMarkNotOpted={markWorkflowPhaseNotOpted}
                  notOptedPhases={project.workflow?.notOptedPhases}
                />
              </div>
              /*
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Project Schedule
                </h3>
                {project.spreadsheetId && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Synced from Google Sheets
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsLinkSpreadsheetModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {project.spreadsheetId ? "Manage Link" : "Link Sheet"}
              </button>
            </div>
            <ProjectSheetCalendar 
              projectId={project._id} 
              onLinkSpreadsheet={() => setIsLinkSpreadsheetModalOpen(true)}
            />
          </div> */}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* Client Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Clients ({project?.clients?.length || 0})
              </h3>
              <button
                onClick={() => {
                  setClientForms(project?.clients?.map(c => ({
                    name: c.name,
                    email: c.email || "",
                    phoneNumber: c.phoneNumber || "",
                  })) || []);
                  setIsEditClientModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
            <div className="space-y-4">
              {project?.clients && project.clients.map((client, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Client {index + 1}</p>
                      <p className="mt-0.5 font-semibold text-gray-800 dark:text-gray-200">
                        {client.name}
                      </p>
                    </div>
                  </div>
                  {client.email && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Email: {client.email}
                    </p>
                  )}
                  {client.phoneNumber && (
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      Phone: {client.phoneNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Team Members
            </h3>
            <div className="mt-4 space-y-3">
              {project.teamMembers.map((member: TeamMember) => (
                <div key={member._id} className="flex items-center gap-3 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 text-sm font-medium">
                    {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {member.name || member.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : member.email}
                    </div>
                    {creatorId && member._id === creatorId && (
                      <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                        Project Creator
                      </div>
                    )}
                  </div>
                  {canManageMembers && member._id !== creatorId && (
                    <button
                      onClick={() => removeMember(member._id, member.name || member.email)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Remove member"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canManageMembers && (
              <button 
                onClick={() => setIsAddMemberModalOpen(true)}
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Add Member
              </button>
            )}
          </div>

          {/* Meeting Minutes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Meeting Minutes
            </h3>
            {(() => {
              if (!project.meetingMins || project.meetingMins.length === 0) {
                return (
                  <div className="mt-4 text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No meeting minutes yet
                    </p>
                  </div>
                );
              }

              const filteredMeetings = project.meetingMins.filter((meeting: MeetingMinute) => {
                // Show published meeting minutes to everyone
                if (meeting.status === "published") return true;
                
                // For drafts or records without status
                if (meeting.status === "draft" || !meeting.status) {
                  // If no createdBy field (old records), show to everyone
                  if (!meeting.createdBy) return true;
                  // Show drafts only to the creator
                  return user && meeting.createdBy._id === user.id;
                }
                return false;
              });

              if (filteredMeetings.length === 0) {
                return (
                  <div className="mt-4 text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No meeting minutes yet
                    </p>
                  </div>
                );
              }

              return (
                <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredMeetings.map((meeting: MeetingMinute) => (
                  <div
                    key={meeting._id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      setViewingMeeting(meeting);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {formatDate(meeting.date)}
                          </p>
                          {(meeting.status === "draft" || !meeting.status) && (
                            <Badge color="warning" size="sm">
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {meeting.time}
                        </p>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {(meeting.status === "draft" || !meeting.status) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMeeting(meeting);
                                setIsEditModalOpen(true);
                              }}
                              className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Publish button clicked for meeting:", meeting._id);
                                setConfirmDialog({
                                  isOpen: true,
                                  title: "Publish Meeting Minutes",
                                  message: "Are you sure you want to publish this meeting minutes? Once published, it will be visible to all team members.",
                                  variant: "info",
                                  onConfirm: async () => {
                                    console.log("Confirm called, starting publish for:", meeting._id);
                                    try {
                                      const response = await fetch(
                                        `/api/meeting-minutes/${meeting._id}`,
                                        {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "published" }),
                                        }
                                      );
                                      console.log("Response status:", response.status);
                                      const data = await response.json();
                                      console.log("Response data:", data);
                                      if (!response.ok) throw new Error(data.error || "Failed to publish");
                                      console.log("Success, reloading page");
                                      window.location.reload();
                                    } catch (error) {
                                      console.error("Error publishing meeting minutes:", error);
                                      setAlertDialog({
                                        isOpen: true,
                                        title: "Error",
                                        message: `Failed to publish meeting minutes. ${error instanceof Error ? error.message : "Please try again."}`,
                                        variant: "error",
                                      });
                                    }
                                  },
                                });
                              }}
                              className="text-xs px-2 py-1 rounded bg-success-500 text-white hover:bg-success-600 transition-colors"
                            >
                              Publish
                            </button>
                          </>
                        )}
                        {(meeting.status === "draft" || !meeting.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                isOpen: true,
                                title: "Delete Meeting Minutes",
                                message: "Are you sure you want to delete this meeting minutes? This action cannot be undone.",
                                variant: "danger",
                                onConfirm: async () => {
                                  try {
                                    const response = await fetch(
                                      `/api/meeting-minutes/${meeting._id}`,
                                      { method: "DELETE" }
                                    );
                                    if (!response.ok) throw new Error("Failed to delete");
                                    window.location.reload();
                                  } catch (error) {
                                    console.error("Error deleting meeting minutes:", error);
                                    setAlertDialog({
                                      isOpen: true,
                                      title: "Error",
                                      message: "Failed to delete meeting minutes. Please try again.",
                                      variant: "error",
                                    });
                                  }
                                },
                              });
                            }}
                            className="text-xs px-2 py-1 rounded bg-error-500 text-white hover:bg-error-600 transition-colors"
                          >
                              Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-3">
                      {meeting.minutes}
                    </p>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Edit Meeting Minutes Modal */}
      {editingMeeting && (
        <MeetingMinutesModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingMeeting(null);
          }}
          preSelectedProjectId={projectId}
          editingMeeting={editingMeeting}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />

      {/* Link Spreadsheet Modal */}
      <LinkSpreadsheetModal
        isOpen={isLinkSpreadsheetModalOpen}
        onClose={() => setIsLinkSpreadsheetModalOpen(false)}
        projectId={projectId}
        currentSpreadsheetId={project.spreadsheetId}
        currentSheetName={project.sheetName}
        onLinked={refetchProject}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        projectId={projectId}
        currentMembers={project.teamMembers.map((m) => m._id)}
        onMemberAdded={refetchProject}
      />

      {/* View Meeting Minutes Modal */}
      {viewingMeeting && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingMeeting(null);
          }}
          className="max-w-3xl mx-4 p-6 sm:p-8"
        >
          <div className="space-y-4">
            <div className="pr-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Meeting Minutes
              </h2>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(viewingMeeting.date)} at {viewingMeeting.time}
                </p>
                {(viewingMeeting.status === "draft" || !viewingMeeting.status) && (
                  <Badge color="warning" size="sm">
                    Draft
                  </Badge>
                )}
                {viewingMeeting.status === "published" && (
                  <Badge color="success" size="sm">
                    Published
                  </Badge>
                )}
              </div>
              {viewingMeeting.createdBy && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  By {viewingMeeting.createdBy.name || viewingMeeting.createdBy.email}
                </p>
              )}
            </div>
            
            {(viewingMeeting.status === "draft" || !viewingMeeting.status) && user && viewingMeeting.createdBy?._id === user.id && (
              <button
                onClick={() => {
                  setViewingMeeting(null);
                  setIsViewModalOpen(false);
                  setEditingMeeting(viewingMeeting);
                  setIsEditModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {viewingMeeting.minutes}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectModalOpen}
        onClose={() => {
          setIsEditProjectModalOpen(false);
          setProjectForm({
            name: "",
            status: "active",
            startDate: "",
            endDate: "",
          });
        }}
        className="max-w-md mx-4 p-6"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Edit Project Details
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Update name, status, and project timeline
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!projectForm.name.trim() || !projectForm.startDate) {
                setAlertDialog({
                  isOpen: true,
                  title: "Validation Error",
                  message: "Project name and start date are required.",
                  variant: "error",
                });
                return;
              }

              if (projectForm.endDate && projectForm.endDate < projectForm.startDate) {
                setAlertDialog({
                  isOpen: true,
                  title: "Validation Error",
                  message: "End date cannot be earlier than start date.",
                  variant: "error",
                });
                return;
              }

              try {
                setUpdatingProject(true);

                const response = await fetch(`/api/projects/${projectId}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: projectForm.name.trim(),
                    status: projectForm.status,
                    timeline: {
                      startDate: projectForm.startDate,
                      endDate: projectForm.endDate || undefined,
                    },
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || "Failed to update project details");
                }

                await refetchProject();
                setIsEditProjectModalOpen(false);
                setAlertDialog({
                  isOpen: true,
                  title: "Success",
                  message: "Project details updated successfully",
                  variant: "success",
                });
              } catch (err: any) {
                console.error("Error updating project details:", err);
                setAlertDialog({
                  isOpen: true,
                  title: "Error",
                  message: err.message || "Failed to update project details. Please try again.",
                  variant: "error",
                });
              } finally {
                setUpdatingProject(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                disabled={updatingProject}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={projectForm.status}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    status: e.target.value as Project["status"],
                  })
                }
                disabled={updatingProject}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
              >
                <option value="active">Active</option>
                <option value="on hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={projectForm.startDate}
                onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                disabled={updatingProject}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={projectForm.endDate}
                min={projectForm.startDate || undefined}
                onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                disabled={updatingProject}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditProjectModalOpen(false);
                  setProjectForm({
                    name: "",
                    status: "active",
                    startDate: "",
                    endDate: "",
                  });
                }}
                disabled={updatingProject}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingProject}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                {updatingProject ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditClientModalOpen}
        onClose={() => {
          setIsEditClientModalOpen(false);
          setClientForms([]);
        }}
        className="max-w-2xl mx-4 p-6"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Edit Clients
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage the clients for this project
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              
              const validClients = clientForms.filter(c => c.name.trim());
              if (validClients.length === 0) {
                setAlertDialog({
                  isOpen: true,
                  title: "Validation Error",
                  message: "At least one client with a name is required.",
                  variant: "error",
                });
                return;
              }

              try {
                setUpdatingClient(true);
                
                const response = await fetch(`/api/projects/${projectId}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    clients: validClients.map(c => ({
                      name: c.name.trim(),
                      email: c.email?.trim() || undefined,
                      phoneNumber: c.phoneNumber?.trim() || undefined,
                    })),
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || "Failed to update client information");
                }

                // Update local state
                if (project) {
                  setProject({
                    ...project,
                    clients: validClients.map(c => ({
                      name: c.name.trim(),
                      email: c.email?.trim() || undefined,
                      phoneNumber: c.phoneNumber?.trim() || undefined,
                    })),
                  });
                }

                setIsEditClientModalOpen(false);
                setAlertDialog({
                  isOpen: true,
                  title: "Success",
                  message: "Clients updated successfully",
                  variant: "success",
                });
              } catch (err: any) {
                console.error("Error updating clients:", err);
                setAlertDialog({
                  isOpen: true,
                  title: "Error",
                  message: err.message || "Failed to update clients. Please try again.",
                  variant: "error",
                });
              } finally {
                setUpdatingClient(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Clients <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setClientForms([...clientForms, { name: "", email: "", phoneNumber: "" }])}
                  disabled={updatingClient}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
                >
                  + Add Client
                </button>
              </div>
              <div className="space-y-3">
                {clientForms.map((client, index) => (
                  <div key={index} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={client.name}
                          onChange={(e) => {
                            setClientForms(clientForms.map((c, i) => 
                              i === index ? { ...c, name: e.target.value } : c
                            ));
                          }}
                          disabled={updatingClient}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
                          placeholder="Client name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={client.email}
                          onChange={(e) => {
                            setClientForms(clientForms.map((c, i) => 
                              i === index ? { ...c, email: e.target.value } : c
                            ));
                          }}
                          disabled={updatingClient}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
                          placeholder="client@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={client.phoneNumber}
                          onChange={(e) => {
                            setClientForms(clientForms.map((c, i) => 
                              i === index ? { ...c, phoneNumber: e.target.value } : c
                            ));
                          }}
                          disabled={updatingClient}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-400"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    {clientForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setClientForms(clientForms.filter((_, i) => i !== index))}
                        disabled={updatingClient}
                        className="absolute top-2 right-2 text-gray-400 hover:text-error-500 dark:hover:text-error-400 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditClientModalOpen(false);
                  setClientForms([]);
                }}
                disabled={updatingClient}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingClient}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                {updatingClient ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
