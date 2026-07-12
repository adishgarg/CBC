"use client";

import React, { useMemo } from "react";
import { WORKFLOW_PHASES, getWorkflowIndexFromPhaseId, WorkflowPhase } from "./ProjectWorkflowModal";

interface ProjectWorkflowSummaryProps {
  currentPhaseId?: number;
  notOptedPhases?: number[];
}

function getCategoryTheme(category: number) {
  switch (category) {
    case 1:
      return { border: "#639922", badgeBg: "#EAF3DE", badgeText: "#3B6D11", dot: "#639922" };
    case 2:
      return { border: "#D85A30", badgeBg: "#FAECE7", badgeText: "#993C1D", dot: "#D85A30" };
    case 3:
      return { border: "#1D9E75", badgeBg: "#E1F5EE", badgeText: "#0F6E56", dot: "#1D9E75" };
    case 4:
    default:
      return { border: "#7F77DD", badgeBg: "#EEEDFE", badgeText: "#3C3489", dot: "#7F77DD" };
  }
}

function getStatusLabel(index: number, activeIndex: number, isNotOpted: boolean) {
  if (isNotOpted) return "Not opted";
  if (index < activeIndex) return "Completed";
  if (index === activeIndex) return "Current";
  return "Upcoming";
}

function getStatusColorLabel(status: string) {
  switch (status) {
    case "Completed":
      return { bg: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300" };
    case "Current":
      return { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" };
    case "Not opted":
      return { bg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    default:
      return { bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" };
  }
}

const ProjectWorkflowSummary: React.FC<ProjectWorkflowSummaryProps> = ({
  currentPhaseId,
  notOptedPhases = [],
}) => {
  const activeIndex = useMemo(() => getWorkflowIndexFromPhaseId(currentPhaseId), [currentPhaseId]);
  const notOptedSet = useMemo(() => new Set(notOptedPhases), [notOptedPhases]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project Workflow</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All workflow stages are shown below. Stages marked as not opted are shown in grey.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {WORKFLOW_PHASES.length} stages
        </div>
      </div>

      <div className="space-y-3">
        {WORKFLOW_PHASES.map((phase: WorkflowPhase, index: number) => {
          const isNotOpted = notOptedSet.has(phase.id);
          const status = getStatusLabel(index, activeIndex, isNotOpted);
          const statusStyles = getStatusColorLabel(status);
          const theme = getCategoryTheme(phase.category);

          return (
            <div
              key={phase.id}
              className={`overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all dark:bg-gray-950 ${
                isNotOpted ? "border-gray-200 opacity-60 dark:border-gray-700" : "border-gray-200 dark:border-gray-800"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: theme.border }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Stage {phase.id}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                    >
                      {phase.items.length} items
                    </span>
                  </div>
                  <h3 className={`mt-2 text-sm font-semibold ${isNotOpted ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                    {phase.title}
                  </h3>
                  <p className={`mt-1 text-xs uppercase tracking-wide ${
                    isNotOpted ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Category {phase.category}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles.bg}`}>
                    {status}
                  </span>
                  {isNotOpted && (
                    <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Not opted
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {phase.items.map((item, itemIndex) => (
                  <div key={`${phase.id}-${itemIndex}`} className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.border }}
                    />
                    <div>
                      <p className={`text-sm ${isNotOpted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                        {item.text}
                      </p>
                      {item.note && (
                        <p className={`mt-0.5 text-xs ${isNotOpted ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectWorkflowSummary;
