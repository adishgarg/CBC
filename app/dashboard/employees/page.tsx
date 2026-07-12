"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import ConfirmDialog from "@/components/ui/dialog/ConfirmDialog";
import { useUser } from "@/context/UserContext";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function EmployeesPage() {
  const { user } = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        
        if (response.ok) {
          setEmployees(data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    return matchesSearch && employee.role?.toLowerCase() === filter.toLowerCase();
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "primary";
      case "user":
        return "success";
      default:
        return "light";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const removeEmployeeFromState = (employeeId: string) => {
    setEmployees((currentEmployees) => currentEmployees.filter((employee) => employee._id !== employeeId));
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (user?.id && user.id === employee._id) {
      setActionMessage("You cannot delete your own account from the employees list.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Employee",
      message: `Are you sure you want to delete ${employee.name || employee.email}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Keep Employee",
      onConfirm: async () => {
        const response = await fetch(`/api/users/${employee._id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          setActionMessage(data?.error || "Failed to delete employee.");
          return;
        }

        removeEmployeeFromState(employee._id);
        setActionMessage(data?.message || "Employee deleted successfully.");
      },
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
          Employees
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage all your employees in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Employees</div>
          <div className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            {employees.length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Admins</div>
          <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
            {employees.filter((e) => e.role === "admin").length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-sm text-gray-500 dark:text-gray-400">Users</div>
          <div className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400">
            {employees.filter((e) => e.role === "user").length}
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Employee List
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <Link
                href="/dashboard/employees/create"
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
                New Employee
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No employees found
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 pl-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Role
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Joined
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 pr-6 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee._id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                          {employee.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {employee.name || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                      {employee.email}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge color={getRoleBadgeColor(employee.role) as "primary" | "success" | "light"}>
                        {employee.role || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(employee.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/employees/${employee._id}/edit`}
                          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(employee)}
                          className="inline-flex items-center rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm font-medium text-error-700 transition-colors hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          {actionMessage}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant="danger"
      />
    </div>
  );
}
