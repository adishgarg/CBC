"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import TaskFiles from "@/components/tasks/TaskFiles";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
}

interface TaskFile {
  driveFileId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  modifiedAt: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  project: Project;
  assignedTo: User[];
  createdBy: User;
  status: "todo" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  driveFolderId: string;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch files from task's Drive folder
  const fetchFiles = async (folderId: string) => {
    try {
      setFilesLoading(true);
      const response = await fetch(`/api/tasks/files?folderId=${folderId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch task");
        }
        const data = await response.json();
        setTask(data.task);

        // Fetch files from Drive folder
        if (data.task.driveFolderId) {
          await fetchFiles(data.task.driveFolderId);
        }
      } catch (err) {
        setError("Failed to load task");
        console.error("Error fetching task:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!task?.driveFolderId) {
      throw new Error("Task folder not found");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", task.driveFolderId);

    const response = await fetch("/api/tasks/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    // Refresh files after upload
    await fetchFiles(task.driveFolderId);
  };

  // Handle file delete
  const handleFileDelete = async (driveFileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch("/api/tasks/delete-file", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driveFileId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Refresh files after delete
      if (task?.driveFolderId) {
        await fetchFiles(task.driveFolderId);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete file");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return "light";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "error";
      default:
        return "light";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "light";
      case "in-progress":
        return "info";
      case "review":
        return "warning";
      case "completed":
        return "success";
      default:
        return "light";
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("video")) return "🎥";
    if (type.includes("audio")) return "🎵";
    return "📎";
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-sm text-error-600 dark:text-error-400">{error || "Task not found"}</p>
            <Link
              href="/dashboard/tasks"
              className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              ← Back to Tasks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href={`/dashboard/projects/${task.project._id}`}
          className="hover:text-brand-600 dark:hover:text-brand-400"
        >
          {task.project.name}
        </Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200">{task.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
            {task.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge color={getStatusColor(task.status)} size="sm">
              {task.status.replace("-", " ").toUpperCase()}
            </Badge>
            <Badge color={getPriorityColor(task.priority)} size="sm">
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
            {task.dueDate && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Due: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Description
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {task.description || "No description provided"}
            </p>
          </div>

          {/* Files */}
          <TaskFiles
            taskId={task._id}
            files={files}
            onFileUpload={handleFileUpload}
            onFileDelete={handleFileDelete}
          />
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4 md:space-y-6">
          {/* Task Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Task Details
            </h2>
            <div className="space-y-4">
              {/* Assigned To */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Assigned To
                </p>
                <div className="space-y-1">
                  {task.assignedTo.map((user) => (
                    <div key={user._id} className="text-sm text-gray-800 dark:text-gray-200">
                      {user.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Created By */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Created By
                </p>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {task.createdBy.name}
                </div>
              </div>

              {/* Created At */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Created
                </p>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {formatDate(task.createdAt)}
                </div>
              </div>

              {/* Updated At */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Last Updated
                </p>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {formatDate(task.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Project Link */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
              Project
            </h2>
            <Link
              href={`/dashboard/projects/${task.project._id}`}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {task.project.name} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
