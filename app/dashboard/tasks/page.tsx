"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface Task {
  id: number;
  name: string;
  project: string;
  assignee: string;
  status: "To Do" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  description: string;
}

const tasksData: Task[] = [
  {
    id: 1,
    name: "Site Preparation & Excavation",
    project: "Riverside Luxury Residences",
    assignee: "Sarah Johnson",
    status: "Done",
    priority: "High",
    dueDate: "Jan 20, 2026",
    description: "Clear site, level ground, and complete excavation work",
  },
  {
    id: 2,
    name: "Foundation & Basement Work",
    project: "Riverside Luxury Residences",
    assignee: "Mike Chen",
    status: "Done",
    priority: "High",
    dueDate: "Feb 28, 2026",
    description: "Complete foundation pouring and basement construction",
  },
  {
    id: 3,
    name: "Structural Steel Erection",
    project: "Riverside Luxury Residences",
    assignee: "Mike Chen",
    status: "In Progress",
    priority: "High",
    dueDate: "May 15, 2026",
    description: "Install structural steel framework for all 15 floors",
  },
  {
    id: 4,
    name: "Concrete Slab Pouring",
    project: "Downtown Office Complex",
    assignee: "David Lee",
    status: "In Progress",
    priority: "High",
    dueDate: "Mar 20, 2026",
    description: "Pour concrete slabs for ground and first floor levels",
  },
  {
    id: 5,
    name: "Heritage Facade Restoration",
    project: "Heritage Museum Renovation",
    assignee: "Maria Garcia",
    status: "Review",
    priority: "Medium",
    dueDate: "Mar 18, 2026",
    description: "Restore and preserve historical building facade elements",
  },
  {
    id: 6,
    name: "Exterior Facade Installation",
    project: "Riverside Luxury Residences",
    assignee: "Emily Davis",
    status: "In Progress",
    priority: "Medium",
    dueDate: "Jul 10, 2026",
    description: "Install glass curtain wall and exterior cladding",
  },
  {
    id: 7,
    name: "Structural Safety Inspection",
    project: "International Convention Center",
    assignee: "Robert Kim",
    status: "To Do",
    priority: "High",
    dueDate: "Apr 05, 2026",
    description: "Conduct comprehensive structural safety assessment",
  },
  {
    id: 8,
    name: "Interior Fit-out Specification",
    project: "Boutique Hotel & Spa",
    assignee: "Lisa Anderson",
    status: "To Do",
    priority: "Medium",
    dueDate: "Apr 15, 2026",
    description: "Finalize interior design specifications and materials",
  },
  {
    id: 9,
    name: "MEP System Design",
    project: "University Science Building",
    assignee: "James Wilson",
    status: "To Do",
    priority: "Low",
    dueDate: "Apr 20, 2026",
    description: "Design mechanical, electrical, and plumbing systems",
  },
  {
    id: 10,
    name: "Parking Structure Completion",
    project: "Downtown Office Complex",
    assignee: "David Lee",
    status: "To Do",
    priority: "Medium",
    dueDate: "May 25, 2026",
    description: "Complete underground parking structure and drainage",
  },
];

export default function TasksPage() {
  const [tasks] = useState<Task[]>(tasksData);
  const [filter, setFilter] = useState<string>("all");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status.toLowerCase().replace(" ", "-") === filter;
  });

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Done":
        return "success";
      case "In Progress":
        return "info";
      case "Review":
        return "warning";
      case "To Do":
        return "light";
      default:
        return "light";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "light";
    }
  };

  const tasksByStatus = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "To Do").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    review: tasks.filter((t) => t.status === "Review").length,
    done: tasks.filter((t) => t.status === "Done").length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
          All Tasks
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage and track all tasks across projects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {tasksByStatus.total}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">To Do</div>
          <div className="mt-2 text-2xl font-bold text-gray-600 dark:text-gray-400">
            {tasksByStatus.todo}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
          <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
            {tasksByStatus.inProgress}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Review</div>
          <div className="mt-2 text-2xl font-bold text-error-600 dark:text-error-400">
            {tasksByStatus.review}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Done</div>
          <div className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400">
            {tasksByStatus.done}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Tasks List
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                <option value="all">All Status</option>
                <option value="to-do">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800">
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
                New Task
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 pl-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Task Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Project
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Assignee
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Due Date
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Priority
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
              {filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="py-4 pl-6">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white/90">
                        {task.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        {task.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.project}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.assignee}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.dueDate}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge size="sm" color={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 pr-6">
                    <Badge size="sm" color={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
