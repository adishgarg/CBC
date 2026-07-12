"use client";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import FileRemarksModal from "./FileRemarksModal";
import DrawingReleaseChecklistModal from "./DrawingReleaseChecklistModal";
import AlertDialog from "@/components/ui/dialog/AlertDialog";
import Checkbox from "@/components/form/input/Checkbox";

interface ProjectFile {
  _id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  driveFileId: string;
  modifiedAt?: string;
  folder?: "Architecture" | "Interior";
}

interface ProjectFilesProps {
  projectId: string;
  files: ProjectFile[];
  architectureFiles?: ProjectFile[];
  interiorFiles?: ProjectFile[];
  onFileUpload: (file: File, folderId: string) => Promise<void>;
  onFileDelete?: (driveFileId: string) => Promise<void>;
  architectureFolderId?: string;
  interiorFolderId?: string;
  hideUpload?: boolean; // Hide upload functionality for client view
  projectType?: "architecture" | "interior" | "both"; // Specify project type
}

interface NotificationSummary {
  type?: "comment" | "meeting_minutes" | "task_update";
  fileName?: string;
  href?: string;
  isUnread?: boolean;
}

interface FileRemarkSummary {
  createdAt: string;
}

const ProjectFiles: React.FC<ProjectFilesProps> = ({
  projectId,
  files,
  architectureFiles = [],
  interiorFiles = [],
  onFileUpload,
  onFileDelete,
  architectureFolderId,
  interiorFolderId,
  hideUpload = false,
  projectType = "both",

}) => {
  const [uploading, setUploading] = useState(false);
  
  // Set initial folder based on project type
  const getInitialFolder = () => {
    if (projectType === "architecture") return "architecture";
    if (projectType === "interior") return "interior";
    return "architecture"; // Default for "both"
  };
  
  const [selectedFolder, setSelectedFolder] = useState<'architecture' | 'interior'>(getInitialFolder());
  const [viewingFolder, setViewingFolder] = useState<'all' | 'architecture' | 'interior'>('all');
  const [selectedPhase, setSelectedPhase] = useState("ALL");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [unreadCommentFiles, setUnreadCommentFiles] = useState<Set<string>>(new Set());
  const [selectedShareFileIds, setSelectedShareFileIds] = useState<Set<string>>(new Set());
  const [sharingFiles, setSharingFiles] = useState(false);
  const [isDrawingChecklistOpen, setIsDrawingChecklistOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", variant: "info" });

  const handleOpenRemarks = (fileName: string) => {
    setSelectedFile(fileName);
    setIsRemarksModalOpen(true);

    const normalized = fileName.trim().toLowerCase();
    setUnreadCommentFiles((previous) => {
      if (!previous.has(normalized)) return previous;
      const next = new Set(previous);
      next.delete(normalized);
      return next;
    });

    if (isAuthenticated === false && typeof window !== "undefined") {
      window.localStorage.setItem(
        `project-file-comments-seen:${projectId}:${normalized}`,
        new Date().toISOString()
      );
    }
  };

  const handleCloseRemarks = () => {
    setIsRemarksModalOpen(false);
    setSelectedFile(null);
  };

  useEffect(() => {
    let isCancelled = false;

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!isCancelled) {
          setIsAuthenticated(response.ok);
        }
      } catch {
        if (!isCancelled) setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) {
      return;
    }

    let isCancelled = false;

    const getSeenStorageKey = (fileName: string) =>
      `project-file-comments-seen:${projectId}:${fileName.trim().toLowerCase()}`;

    const fetchPublicUnreadCommentFiles = async () => {
      const next = new Set<string>();
      const candidateFiles = files.filter((file) => !isFolder(file));

      await Promise.all(
        candidateFiles.map(async (file) => {
          try {
            const response = await fetch(
              `/api/projects/public/${projectId}/remarks?fileName=${encodeURIComponent(file.name)}`,
              { cache: "no-store" }
            );

            if (!response.ok) {
              return;
            }

            const data = (await response.json()) as { remarks?: FileRemarkSummary[] };
            const remarks = Array.isArray(data.remarks) ? data.remarks : [];
            if (remarks.length === 0) {
              return;
            }

            const latestCommentTime = new Date(remarks[0].createdAt).getTime();
            const seenValue = window.localStorage.getItem(getSeenStorageKey(file.name));
            const seenTime = seenValue ? new Date(seenValue).getTime() : 0;

            if (latestCommentTime > seenTime) {
              next.add(file.name.trim().toLowerCase());
            }
          } catch {
            return;
          }
        })
      );

      if (!isCancelled) {
        setUnreadCommentFiles(next);
      }
    };

    const fetchUnreadCommentFiles = async () => {
      if (!isAuthenticated) {
        await fetchPublicUnreadCommentFiles();
        return;
      }

      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          if (!isCancelled) setUnreadCommentFiles(new Set());
          return;
        }

        const data = await response.json();
        const notifications: NotificationSummary[] = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        const next = new Set<string>();
        for (const notification of notifications) {
          if (!notification?.isUnread) continue;
          if (notification.type !== "comment") continue;
          if (!notification.fileName || !notification.href) continue;

          const isForCurrentProject = notification.href.endsWith(`/dashboard/projects/${projectId}`);
          if (!isForCurrentProject) continue;

          next.add(notification.fileName.trim().toLowerCase());
        }

        if (!isCancelled) {
          setUnreadCommentFiles(next);
        }
      } catch {
        if (!isCancelled) setUnreadCommentFiles(new Set());
      }
    };

    fetchUnreadCommentFiles();
    const interval = setInterval(fetchUnreadCommentFiles, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [projectId, files, isAuthenticated]);

  const hasUnreadComments = (fileName: string) => {
    return unreadCommentFiles.has(fileName.trim().toLowerCase());
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const folderId = selectedFolder === 'architecture' ? architectureFolderId : interiorFolderId;
    if (!folderId) {
      setAlertDialog({
        isOpen: true,
        title: "No Folder Selected",
        message: "Please select a folder first",
        variant: "warning",
      });
      return;
    }
    
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await onFileUpload(file, folderId);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
      "application/zip": [".zip"],
    },
    maxSize: 10485760, // 10MB
  });

  const isFolder = (file: ProjectFile) => {
    return file.type === "application/vnd.google-apps.folder";
  };

  const getFileSelectionKey = (file: ProjectFile) => {
    return file.driveFileId || file._id || file.name;
  };
const PHASES = [
  {
    code: "PL",
    name: "Preliminary",
  },
  {
    code: "CD",
    name: "Concept Development",
  },
  {
    code: "WD",
    name: "Working Drawings",
  },
  {
    code: "ID",
    name: "Interior Development",
  },
  {
    code: "MM",
    name: "Specifications & Millwork",
  },
];

const getFilePhaseCode = (fileName: string) => {
  const match = fileName.match(/^(PL|CD|WD|ID|MM)\d+/i);

  return match ? match[1].toUpperCase() : null;
};

  const getVisibleFiles = () => {
  let displayFiles = files;

  if (viewingFolder === "architecture") {
    displayFiles = architectureFiles;
  } else if (viewingFolder === "interior") {
    displayFiles = interiorFiles;
  }

  if (selectedPhase !== "ALL") {
    displayFiles = displayFiles.filter(
      (file) => getFilePhaseCode(file.name) === selectedPhase
    );
  }

  return displayFiles.filter((file) => !isFolder(file));
};

  const visibleFiles = [...getVisibleFiles()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  const selectedVisibleFiles = visibleFiles.filter((file) =>
    selectedShareFileIds.has(getFileSelectionKey(file))
  );

  useEffect(() => {
    const allFileKeys = new Set(
      [...files, ...architectureFiles, ...interiorFiles]
        .filter((file) => !isFolder(file))
        .map((file) => getFileSelectionKey(file))
    );

    setSelectedShareFileIds((previous) => {
      const next = new Set([...previous].filter((key) => allFileKeys.has(key)));
      return next.size === previous.size ? previous : next;
    });
  }, [files, architectureFiles, interiorFiles]);

  const toggleFileSelection = (file: ProjectFile) => {
    const key = getFileSelectionKey(file);
    setSelectedShareFileIds((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleKeys = visibleFiles.map((file) => getFileSelectionKey(file));
    const allSelected =
      visibleKeys.length > 0 && visibleKeys.every((key) => selectedShareFileIds.has(key));

    setSelectedShareFileIds((previous) => {
      const next = new Set(previous);
      if (allSelected) {
        visibleKeys.forEach((key) => next.delete(key));
      } else {
        visibleKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  };

  const getShareableFile = async (file: ProjectFile) => {
    const response = await fetch(`/api/files/${encodeURIComponent(file.driveFileId)}/download`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to prepare ${file.name} for sharing`);
    }

    const blob = await response.blob();
    const safeFileName = file.name
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "file";

    return new File([blob], safeFileName, {
      type: blob.type || file.type || "application/octet-stream",
      lastModified: file.modifiedAt
        ? new Date(file.modifiedAt).getTime()
        : file.uploadedAt
          ? new Date(file.uploadedAt).getTime()
          : Date.now(),
    });
  };

  const shareOnWhatsApp = async (filesToShare: ProjectFile[]) => {
    if (filesToShare.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: "No Files Selected",
        message: "Select at least one file to share.",
        variant: "warning",
      });
      return;
    }

    setSharingFiles(true);

    try {
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (typeof nav.share !== "function") {
        throw new Error("Native sharing is not supported on this browser.");
      }

      const shareFiles = await Promise.all(filesToShare.map(getShareableFile));
      if (shareFiles.length === 0) {
        throw new Error("No files available to share.");
      }

      if (typeof nav.canShare === "function" && !nav.canShare({ files: shareFiles })) {
        throw new Error("This device does not support sharing file attachments.");
      }

      await nav.share({
        title: "Project Files",
        text: filesToShare.length === 1 ? "Project file" : "Project files",
        files: shareFiles,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("WhatsApp share failed:", error);
      setAlertDialog({
        isOpen: true,
        title: "Share Failed",
        message:
          "Could not share file attachments. Use a browser/device with native file sharing and choose WhatsApp in the share sheet.",
        variant: "error",
      });
    } finally {
      setSharingFiles(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === "application/pdf") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (type.includes("word") || type.includes("document")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (type.includes("excel") || type.includes("spreadsheet")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Project Files {files.filter(f => !isFolder(f)).length > 0 && `(${files.filter(f => !isFolder(f)).length})`}
      </h3>

      {/* Folder Selection for Upload */}
      {!hideUpload && (
        <>
          {projectType === "both" && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload to:</span>
              <button
                onClick={() => setSelectedFolder('architecture')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedFolder === 'architecture'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Architecture
              </button>
              <button
                onClick={() => setSelectedFolder('interior')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedFolder === 'interior'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Interior
              </button>
            </div>
          )}
          {projectType !== "both" && (
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Uploading to: <span className="ml-1 font-semibold capitalize">{projectType}</span>
              </span>
            </div>
          )}

          {/* Upload Area */}
          <div className="mt-4">
            <div
              {...getRootProps()}
              className={`transition cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
                isDragActive
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                  : "border-gray-300 bg-gray-50 hover:border-brand-500 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/10"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} disabled={uploading} />
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {uploading
                    ? "Uploading..."
                    : isDragActive
                    ? "Drop files here"
                    : "Drag & drop files here"}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  or <span className="text-brand-600 dark:text-brand-400">browse</span> to choose files
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Supports: Images, PDFs, Documents (Max 10MB)
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Folder Filter for Viewing */}
      <div className={`flex flex-col gap-2 ${hideUpload ? 'mt-4' : 'mt-6'}`}>
        <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
        {projectType === "both" && (
          <button
            onClick={() => setViewingFolder('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              viewingFolder === 'all'
                ? 'bg-gray-800 text-white dark:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All Files ({files.filter(f => !isFolder(f)).length})
          </button>
        )}
        {(projectType === "architecture" || projectType === "both") && (
          <button
            onClick={() => setViewingFolder('architecture')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              viewingFolder === 'architecture'
                ? 'bg-gray-800 text-white dark:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Architecture ({architectureFiles.filter(f => !isFolder(f)).length})
          </button>
        )}
        {(projectType === "interior" || projectType === "both") && (
          <button
            onClick={() => setViewingFolder('interior')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              viewingFolder === 'interior'
                ? 'bg-gray-800 text-white dark:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Interior ({interiorFiles.filter(f => !isFolder(f)).length})
          </button>
        )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Phase:
          </span>

          <button
            onClick={() => setSelectedPhase("ALL")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              selectedPhase === "ALL"
                ? "bg-gray-800 text-white dark:bg-gray-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>

          {PHASES.map((phase) => (
            <button
              key={phase.code}
              onClick={() => setSelectedPhase(phase.code)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                selectedPhase === phase.code
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {phase.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setIsDrawingChecklistOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300 dark:hover:bg-amber-900/20"
          type="button"
        >
          Drawing Release Checklist
        </button>
      </div>

      {visibleFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAllVisible}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            type="button"
          >
            {visibleFiles.every((file) => selectedShareFileIds.has(getFileSelectionKey(file)))
              ? "Deselect All"
              : "Select All"}
          </button>
          <button
            onClick={() => shareOnWhatsApp(selectedVisibleFiles)}
            disabled={selectedVisibleFiles.length === 0 || sharingFiles}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {sharingFiles
              ? "Preparing..."
              : `Share ${selectedVisibleFiles.length > 0 ? selectedVisibleFiles.length : ""} on WhatsApp`.trim()}
          </button>
        </div>
      )}

      {/* Files List */}
      {visibleFiles.length > 0 ? (
        <div className="mt-6 space-y-2">
          {visibleFiles.map((file: any) => (
            <div
              key={file._id || file.driveFileId || file.name}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (file.url) {
                  window.open(file.url, "_blank", "noopener,noreferrer");
                } else if (file.driveFileId) {
                  window.open(`/api/files/${encodeURIComponent(file.driveFileId)}/preview`, "_blank", "noopener,noreferrer");
                } else {
                  setAlertDialog({ isOpen: true, title: "Cannot open file", message: "This file cannot be opened directly.", variant: "info" });
                }
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (file.url) {
                    window.open(file.url, "_blank", "noopener,noreferrer");
                  } else if (file.driveFileId) {
                    window.open(`/api/files/${encodeURIComponent(file.driveFileId)}/preview`, "_blank", "noopener,noreferrer");
                  } else {
                    setAlertDialog({ isOpen: true, title: "Cannot open file", message: "This file cannot be opened directly.", variant: "info" });
                  }
                }
              }}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 hover:shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedShareFileIds.has(getFileSelectionKey(file))}
                    onChange={() => toggleFileSelection(file)}
                    id={`share-file-${getFileSelectionKey(file)}`}
                  />
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {viewingFolder === 'all' && file.folder && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        file.folder === 'Architecture'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}>
                        {file.folder === 'Architecture' ? 'ARCH' : 'INT'}
                      </span>
                    )}
                    <p className="truncate">
                      {formatFileSize(file.size)}
                      {file.uploadedBy && (
                        <>
                          {" "}• Uploaded by{" "}
                          {file.uploadedBy?.name || file.uploadedBy?.email || "Unknown"}
                        </>
                      )}
                      {" "}• {formatDate(file.modifiedAt || file.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenRemarks(file.name); }}
                  className="relative rounded-lg p-2 text-gray-600 hover:bg-amber-50 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                  title="Comments"
                  type="button"
                >
                  {hasUnreadComments(file.name) ? (
                    <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                    </span>
                  ) : null}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                {file.url && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); shareOnWhatsApp([file]); }}
                      className="rounded-lg p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                      title="Share on WhatsApp"
                      type="button"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9M17 7v8" />
                      </svg>
                    </button>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </>
                )}
                {onFileDelete && file.driveFileId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onFileDelete(file.driveFileId); }}
                    className="rounded-lg p-2 text-gray-600 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                    title="Delete"
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No files uploaded yet
          </p>
        </div>
      )}

      <DrawingReleaseChecklistModal
        isOpen={isDrawingChecklistOpen}
        onClose={() => setIsDrawingChecklistOpen(false)}
        projectId={projectId}
        files={[...files, ...architectureFiles, ...interiorFiles]}
      />

      {/* Remarks Modal */}
      {selectedFile && (
        <FileRemarksModal
          isOpen={isRemarksModalOpen}
          onClose={handleCloseRemarks}
          projectId={projectId}
          fileName={selectedFile}
        />
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
};

export default ProjectFiles;
