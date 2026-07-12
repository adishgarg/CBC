"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ClientNavbar from "@/components/client/ClientNavbar";
import ProjectFiles from "@/components/projects/ProjectFiles";
import ProjectViewsCarousel from "@/components/projects/ProjectViewsCarousel";
import ProjectWorkflowInline from "@/components/projects/ProjectWorkflowInline";
import ProjectWorkflowModal from "@/components/projects/ProjectWorkflowModal";
import Badge from "@/components/ui/badge/Badge";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";

interface ProjectFile {
  _id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  driveFileId: string;
  modifiedAt?: string;
  folder?: "Architecture" | "Interior";
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
  name: string;
  description?: string;
  timelineIsRed?: boolean;
  clients: Array<{
    name: string;
    email?: string;
    phoneNumber?: string;
  }>;
  status: "active" | "completed" | "on hold";
  timeline: {
    startDate: string;
    endDate?: string;
  };
  projectType: "architecture" | "interior" | "both";
  architectureFolderId: string;
  interiorFolderId: string;
  progress: number;
  workflow?: {
    currentPhaseId?: number;
    notOptedPhases?: number[];
    updatedAt?: string;
  };
  viewImages?: Array<{
    driveFileId: string;
    name: string;
    previewUrl: string;
    viewUrl?: string;
    modifiedAt?: string;
  }>;
  meetingMins?: MeetingMinute[];
}

export default function ClientProjectViewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [architectureFiles, setArchitectureFiles] = useState<ProjectFile[]>([]);
  const [interiorFiles, setInteriorFiles] = useState<ProjectFile[]>([]);
  const [viewImages, setViewImages] = useState<Project["viewImages"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/public/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
        
        // Set files from API response
        if (data.project.architectureFiles) {
          setArchitectureFiles(data.project.architectureFiles);
        }
        if (data.project.interiorFiles) {
          setInteriorFiles(data.project.interiorFiles);
        }
        if (data.project.viewImages) {
          setViewImages(data.project.viewImages);
        }
      } catch (err) {
        setError("Project not found");
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ClientNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ClientNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Project not found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The project you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter to show only published meeting minutes
  const publishedMeetings = (project.meetingMins || []).filter(
    (meeting) => meeting.status === "published"
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ClientNavbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Project Header */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <Badge color={getStatusColor(project.status)}>
                  {getStatusDisplay(project.status)}
                </Badge>
              </div>
              {project.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Project Info Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Clients
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {project.clients && project.clients.length > 0
                  ? project.clients.map(c => c.name).join(", ")
                  : "No clients"}
              </p>
            </div>
            <div className={project.timelineIsRed ? "rounded-lg bg-red-100 p-4 dark:bg-red-900/20" : "rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50"}>
              <p className={project.timelineIsRed ? "text-sm font-medium text-red-700 dark:text-red-300" : "text-sm font-medium text-gray-500 dark:text-gray-400"}>
                Start Date
              </p>
              <p className={project.timelineIsRed ? "mt-1 text-base font-semibold text-red-800 dark:text-red-200" : "mt-1 text-base font-semibold text-gray-900 dark:text-white"}>
                {formatDate(project.timeline.startDate)}
              </p>
            </div>
            {project.timeline.endDate && (
              <div className={project.timelineIsRed ? "rounded-lg bg-red-100 p-4 dark:bg-red-900/20" : "rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50"}>
                <p className={project.timelineIsRed ? "text-sm font-medium text-red-700 dark:text-red-300" : "text-sm font-medium text-gray-500 dark:text-gray-400"}>
                  End Date
                </p>
                <p className={project.timelineIsRed ? "mt-1 text-base font-semibold text-red-800 dark:text-red-200" : "mt-1 text-base font-semibold text-gray-900 dark:text-white"}>
                  {formatDate(project.timeline.endDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="mb-8">
          <ProjectFiles
            projectId={projectId}
            files={[...architectureFiles, ...interiorFiles]}
            architectureFiles={architectureFiles}
            interiorFiles={interiorFiles}
            architectureFolderId={project.architectureFolderId}
            interiorFolderId={project.interiorFolderId}
            projectType={project.projectType}
            onFileUpload={async () => {}} // No upload for clients
            hideUpload={true} // Hide upload UI for clients
          />

          <div className="mt-6">
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
              onUpdatePhase={async () => {
                console.warn("Client view cannot update workflow phase");
              }}
              notOptedPhases={project.workflow?.notOptedPhases}
              isReadOnly={true}
            />
          </div>
        </div>

        {/* Project Views */}
        <div className="mb-8">
          <ProjectViewsCarousel images={viewImages || []} showDriveLink={false} />
        </div>

        {/* Meeting Minutes */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meeting Minutes
          </h2>
          {publishedMeetings.length === 0 ? (
            <div className="mt-6 text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No meeting minutes available yet
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto">
              {publishedMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {formatDate(meeting.date)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {meeting.time}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {meeting.minutes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
