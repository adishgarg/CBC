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
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../tables/Pagination";

interface Project {
  _id: string;
  projectId?: number;
  timelineIsRed?: boolean;
  name: string;
  description?: string;
  projectType?: "architecture" | "interior" | "both";
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

export default function ProjectsTable() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

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

  const filteredProjects = projects.filter(
    (project) =>
      String(project.projectId ?? "").includes(searchTerm.trim()) ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clients?.[0]?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Active Projects
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track and manage all your ongoing projects
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentProjects.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? "No projects found matching your search" : "No projects yet"}
                </div>
              </div>
            ) : (
              currentProjects.map((project) => (
                <Link
                  key={project._id}
                  href={`/dashboard/projects/${project._id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                        {project.name}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        ID: {project.projectId ?? "--"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {project.clients?.[0]?.name || "N/A"}
                      </p>
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          project.projectType === 'architecture' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : project.projectType === 'interior'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {project.projectType === 'architecture' && '🏗️ Architecture'}
                          {project.projectType === 'interior' && '🪑 Interior'}
                          {project.projectType === 'both' && '🏢 Both'}
                          {!project.projectType && '🏢 Both'}
                        </span>
                      </div>
                    </div>
                    <Badge size="sm" color={getStatusColor(project.status)}>
                      {getStatusDisplay(project.status)}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 relative">
                    <div
                      className="flex items-center gap-2 rounded-lg p-2"
                    >
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {project.progress}%
                      </span>
                    </div>
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
                Type
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
                className="py-3 pr-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No projects found matching your search" : "No projects yet"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentProjects.map((project) => (
                <TableRow
                  key={project._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/dashboard/projects/${project._id}`);
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-white/[0.02] dark:focus:bg-white/[0.02]"
                >
                  <TableCell className="py-4 pl-6">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {project.projectId ?? "--"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-medium text-gray-800 dark:text-white/90">
                      {project.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.clients?.[0]?.name || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.projectType === 'architecture' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : project.projectType === 'interior'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {project.projectType === 'architecture' && '🏗️ Architecture'}
                      {project.projectType === 'interior' && '🪑 Interior'}
                      {project.projectType === 'both' && '🏢 Both'}
                      {!project.projectType && '🏢 Both'}
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
                    <div className="relative">
                      <div
                        className="flex items-center gap-2 rounded-lg p-2"
                      >
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.teamMembers.length} {project.teamMembers.length === 1 ? "member" : "members"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 pr-6">
                    <Badge size="sm" color={getStatusColor(project.status)}>
                      {getStatusDisplay(project.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, filteredProjects.length)}</span> of{" "}
            <span className="font-medium">{filteredProjects.length}</span> projects
            {searchTerm && <span className="text-gray-500"> (filtered from {projects.length})</span>}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
