"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface Project {
  _id: string;
  projectId?: number;
  timelineIsRed?: boolean;
  name: string;
  description?: string;
  client?: {
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  clients?: Array<{
    name: string;
    email?: string;
    phoneNumber?: string;
  }>;
  teamMembers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  status: "active" | "completed" | "on hold";
  timeline: {
    startDate: string;
    endDate?: string;
  };
  progress: number;
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError("Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    return project.status === filter;
  });

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
      <div className="space-y-4 md:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
            All Projects
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View and manage all your projects in one place
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
            All Projects
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View and manage all your projects in one place
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-4 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
          All Projects
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          View and manage all your projects in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Projects</div>
          <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{projects.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
          <div className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400">
            {projects.filter((p) => p.status === "active").length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
            {projects.filter((p) => p.status === "completed").length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">On Hold</div>
          <div className="mt-2 text-2xl font-bold text-error-600 dark:text-error-400">
            {projects.filter((p) => p.status === "on hold").length}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Projects List
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="on hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
              <Link
                href="/dashboard/projects/create"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Project
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredProjects.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No projects found
                  </div>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/dashboard/projects/${project._id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-brand-600 dark:text-brand-400 truncate">
                          {project.name}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {project.clients?.[0]?.name || "N/A"}
                        </p>
                      </div>
                      <Badge size="sm" color={getStatusColor(project.status)}>
                        {getStatusDisplay(project.status)}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-brand-600 dark:bg-brand-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {project.progress}%
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''}</span>
                      <span
                        className={project.timelineIsRed
                          ? "rounded bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : ""
                        }
                      >
                        {formatDate(project.timeline.startDate)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <Table className="hidden sm:table">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 pl-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Project ID
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Project Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Client
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Timeline
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Progress
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Team
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 pr-6 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No projects found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow
                    key={project._id}
                    onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="py-4 pl-6">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {project.projectId ?? "--"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-medium text-brand-600 dark:text-brand-400">
                        {project.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.clients?.[0]?.name || project.client?.name || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className={project.timelineIsRed
                          ? "rounded-md bg-red-100 px-2 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "text-sm text-gray-600 dark:text-gray-400"
                        }
                      >
                        <div>{formatDate(project.timeline.startDate)}</div>
                        {project.timeline.endDate && (
                          <div className={project.timelineIsRed ? "text-xs text-red-700 dark:text-red-300" : "text-xs text-gray-500 dark:text-gray-500"}>
                            to {formatDate(project.timeline.endDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-brand-600 dark:bg-brand-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.teamMembers.length} {project.teamMembers.length === 1 ? "member" : "members"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge size="sm" color={getStatusColor(project.status)}>
                        {getStatusDisplay(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                        View Details →
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
