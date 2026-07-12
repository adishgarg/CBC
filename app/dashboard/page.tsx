"use client";
import React from "react";
import ProjectsTable from "@/components/projects/ProjectsTable";
import GoogleCalendar from "@/components/calendar/GoogleCalendar";
import { useUser } from "@/context/UserContext";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
          {user ? `Welcome back, ${user.name || user.email}!` : "Project Management Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your projects, tasks, and team schedules
        </p>
      </div>

      {/* Projects Table */}
      <ProjectsTable />

      {/* Google Calendar - Admin Only */}
      {user?.role === "admin" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Team Calendar
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View team schedule and upcoming events
            </p>
          </div>
          <GoogleCalendar />
        </div>
      )}
    </div>
  );
}
