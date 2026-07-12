"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  driveFolderId: string;
  teamMembers: TeamMember[];
}

export default function CreateTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teamMembersOpen, setTeamMembersOpen] = useState(false);
  const teamMemberDropdownRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [status, setStatus] = useState<"todo" | "in-progress" | "review" | "completed">("todo");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError("Failed to load project");
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        teamMemberDropdownRef.current &&
        !teamMemberDropdownRef.current.contains(event.target as Node)
      ) {
        setTeamMembersOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // File dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
    },
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

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
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

  const toggleTeamMember = (memberId: string) => {
    setAssignedTo((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectedTeamMembersText = () => {
    if (assignedTo.length === 0) {
      return "Select team members";
    }
    return project?.teamMembers
      .filter((member) => assignedTo.includes(member._id))
      .map((member) => member.name || member.email)
      .join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    if (assignedTo.length === 0) {
      setError("Please assign at least one team member");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Create task folder in Google Drive
      const folderRes = await fetch("/api/tasks/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskName: title,
          parentFolderId: project?.driveFolderId,
        }),
        credentials: "include",
      });

      if (!folderRes.ok) {
        throw new Error("Failed to create task folder");
      }

      const folderData = await folderRes.json();
      const taskFolderId = folderData.folderId;

      // Step 2: Create task in database
      const taskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          project: projectId,
          assignedTo,
          status,
          priority,
          dueDate: dueDate || undefined,
          driveFolderId: taskFolderId,
        }),
        credentials: "include",
      });

      if (!taskRes.ok) {
        throw new Error("Failed to create task");
      }

      const taskData = await taskRes.json();
      const taskId = taskData.task._id;

      // Step 3: Upload files to task folder
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folderId", taskFolderId);

          const uploadRes = await fetch("/api/tasks/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!uploadRes.ok) {
            console.error(`Failed to upload file: ${file.name}`);
          }
        }
      }

      setSuccess("Task created successfully!");

      setTimeout(() => {
        router.push(`/dashboard/tasks/${taskId}`);
      }, 1200);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              ← Back to Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="hover:text-brand-600 dark:hover:text-brand-400"
        >
          {project?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200">Create Task</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Task</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Add a new task to {project?.name}
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Title */}
            <div className="md:col-span-2">
              <Label>
                Task Title <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label>Description</Label>
              <TextArea
                placeholder="Enter task description"
                rows={4}
                value={description}
                onChange={(value) => setDescription(value)}
                disabled={submitting}
              />
            </div>

            {/* Priority */}
            <div>
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={submitting}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="low" className="dark:bg-gray-900">Low</option>
                <option value="medium" className="dark:bg-gray-900">Medium</option>
                <option value="high" className="dark:bg-gray-900">High</option>
                <option value="critical" className="dark:bg-gray-900">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={submitting}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="todo" className="dark:bg-gray-900">To Do</option>
                <option value="in-progress" className="dark:bg-gray-900">In Progress</option>
                <option value="review" className="dark:bg-gray-900">Review</option>
                <option value="completed" className="dark:bg-gray-900">Completed</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="md:col-span-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Assigned To */}
            <div className="md:col-span-2" ref={teamMemberDropdownRef}>
              <Label>
                Assign To <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTeamMembersOpen((prev) => !prev)}
                  disabled={submitting || !project?.teamMembers || project.teamMembers.length === 0}
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <span className="truncate">{selectedTeamMembersText()}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${teamMembersOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {teamMembersOpen && project?.teamMembers && project.teamMembers.length > 0 && (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="max-h-64 overflow-auto">
                      {project.teamMembers.map((member) => {
                        const checked = assignedTo.includes(member._id);
                        return (
                          <div
                            key={member._id}
                            onClick={() => toggleTeamMember(member._id)}
                            className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 last:border-0 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                          >
                            <Checkbox checked={checked} onChange={() => {}} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Select one or more team members using the checkboxes.
              </p>
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <Label>Attachments (Optional)</Label>
              <div
                {...getRootProps()}
                className={`transition cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
                  isDragActive
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                    : "border-gray-300 bg-gray-50 hover:border-brand-500 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/10"
                } ${submitting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...getInputProps()} disabled={submitting} />
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
                    {submitting
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

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-lg p-2 text-gray-600 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-900/20 dark:hover:text-error-400 ml-2"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedFiles.length === 0 && (
                <div className="mt-4 text-center py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No files selected yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-500/10">
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
              <p className="text-sm text-success-600 dark:text-success-400">{success}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              disabled={submitting}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="sm:w-auto">
              {submitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
