"use client";

import React, { useMemo } from "react";
import { WORKFLOW_PHASES, getWorkflowIndexFromPhaseId } from "./ProjectWorkflowModal";

export type ProjectWorkflowInlineProps = {
  projectName: string;
  projectType: string;
  currentProgress: number;
  currentPhaseId?: number;
  workflowStatus?: "active" | "completed" | "not_opted";
  onViewWorkflow?: () => void;
};

function getCategoryTheme(category: number) {
  switch (category) {
    case 1:
      return { bar: "#639922", badgeBg: "#EAF3DE", badgeText: "#3B6D11", dot: "#639922" };
    case 2:
      return { bar: "#D85A30", badgeBg: "#FAECE7", badgeText: "#993C1D", dot: "#D85A30" };
    case 3:
      return { bar: "#1D9E75", badgeBg: "#E1F5EE", badgeText: "#0F6E56", dot: "#1D9E75" };
    default:
      return { bar: "#7F77DD", badgeBg: "#EEEDFE", badgeText: "#3C3489", dot: "#7F77DD" };
  }
}

const ProjectWorkflowInline: React.FC<ProjectWorkflowInlineProps> = ({
  projectName,
  projectType,
  currentProgress,
  currentPhaseId,
  workflowStatus = "active",
  onViewWorkflow,
}) => {
  const activeIndex = useMemo(() => getWorkflowIndexFromPhaseId(currentPhaseId), [currentPhaseId]);
  const currentPhase = WORKFLOW_PHASES[activeIndex];
  const previousPhase = activeIndex > 0 ? WORKFLOW_PHASES[activeIndex - 1] : null;
  const nextPhase = activeIndex < WORKFLOW_PHASES.length - 1 ? WORKFLOW_PHASES[activeIndex + 1] : null;
  const theme = currentPhase
    ? getCategoryTheme(currentPhase.category as number)
    : getCategoryTheme(1);

  const statusConfig =
    workflowStatus === "not_opted"
      ? {
          label: "Not Opted",
          bg: "#F3F4F6",
          text: "#6B7280",
        }
      : currentProgress >= 100
      ? {
          label: "Completed",
          bg: theme.badgeBg,
          text: theme.badgeText,
        }
      : {
          label: "In Progress",
          bg: theme.badgeBg,
          text: theme.badgeText,
        };

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
      style={{ borderLeftWidth: 4, borderLeftColor: theme.bar }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 truncate">
              {projectName} workflow
            </h4>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
            >
              {projectType.toUpperCase()}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Current active task
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                {currentPhase?.title}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Previous task
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                {previousPhase?.title ?? "Project started"}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Workflow stage
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                {activeIndex + 1} / {WORKFLOW_PHASES.length}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Upcoming task
              </div>
              <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                {nextPhase?.title ?? "Project completion"}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </div>
              </div>
              <div
                className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
              >
                {statusConfig.label}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewWorkflow}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium dark:border-gray-700"
            style={{
              borderColor: theme.bar,
              color: theme.badgeText,
              backgroundColor: theme.badgeBg,
            }}
          >
            View workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkflowInline;
