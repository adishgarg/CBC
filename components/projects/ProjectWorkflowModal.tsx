"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

export type WorkflowPhaseCategory = 1 | 2 | 3 | 4;

export type WorkflowPhase = {
  id: number;
  title: string;
  category: WorkflowPhaseCategory;
  items: Array<{ text: string; note?: string }>;
};

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 1,
    title: "Site preparation & earthwork",
    category: 1,
    items: [
      { text: "Site clearing & demolition" },
      { text: "Temporary water/electricity connections", note: "Before works begin" },
      { text: "Setting out, levelling & excavation" },
      { text: "Anti-termite treatment & dewatering", note: "If applicable" },
    ],
  },
  {
    id: 2,
    title: "Foundation works",
    category: 2,
    items: [
      { text: "PCC bed" },
      { text: "Footing / raft / pile casting", note: "As per structural design" },
      { text: "Foundation waterproofing" },
      { text: "Backfilling & compaction" },
    ],
  },
  {
    id: 3,
    title: "Plumbing - vertical pipes",
    category: 3,
    items: [
      { text: "Vertical soil & waste pipe stacks" },
      { text: "Underground drainage lines" },
      { text: "Inspection chambers & clean-out points" },
    ],
  },
  {
    id: 4,
    title: "Plinth & basement",
    category: 2,
    items: [
      { text: "Plinth beam casting" },
      { text: "Plinth filling & compaction" },
      { text: "Basement walls & retaining walls", note: "If basement is included" },
      { text: "Damp-proof course (DPC)" },
    ],
  },
  {
    id: 5,
    title: "Superstructure - RCC frame",
    category: 2,
    items: [
      { text: "Columns - reinforcement & casting" },
      { text: "Beams & slab shuttering / casting" },
      { text: "Staircase casting" },
      { text: "Lift pit & lift shaft structure", note: "If applicable" },
    ],
  },
  {
    id: 6,
    title: "Masonry & external envelope",
    category: 2,
    items: [
      { text: "External & internal brick / block masonry" },
      { text: "Door & window frames fixed during masonry" },
      { text: "Parapet walls & lintel beams" },
      { text: "External waterproofing & cladding" },
    ],
  },
  {
    id: 7,
    title: "MEP rough-in",
    category: 3,
    items: [
      { text: "Electrical conduit laying & point wiring" },
      { text: "HVAC ducts and service chases" },
      { text: "Fire sprinkler / hydrant rough-in" },
      { text: "Ceiling false-work frame" },
    ],
  },
  {
    id: 8,
    title: "Plastering & external finishes",
    category: 4,
    items: [
      { text: "Internal wall plaster" },
      { text: "External wall plaster / texture finish" },
      { text: "Ceiling plaster" },
      { text: "Primer & exterior paint" },
    ],
  },
  {
    id: 9,
    title: "Flooring - base & finish",
    category: 4,
    items: [
      { text: "Floor screed / levelling course" },
      { text: "Waterproofing for wet areas" },
      { text: "Stone / tile / marble laying" },
      { text: "Skirting & staircase finish" },
    ],
  },
  {
    id: 10,
    title: "Plumbing - horizontal pipes",
    category: 3,
    items: [
      { text: "Horizontal supply & waste lines" },
      { text: "Floor traps & drains" },
      { text: "Testing & flushing of buried lines" },
    ],
  },
  {
    id: 11,
    title: "MEP services & ceiling",
    category: 3,
    items: [
      { text: "HVAC units and grilles" },
      { text: "Light fixture wiring & points" },
      { text: "Fire sprinkler heads positioning" },
      { text: "Ceiling cladding & profiles" },
    ],
  },
  {
    id: 12,
    title: "Doors & windows",
    category: 4,
    items: [
      { text: "Wooden door shutters & frames" },
      { text: "Aluminium window shutters" },
      { text: "Sliding / folding systems" },
      { text: "Grilles, shutters & screens" },
    ],
  },
  {
    id: 13,
    title: "Wall putty & surface prep",
    category: 4,
    items: [
      { text: "Wall putty for all internal surfaces" },
      { text: "Sanding & surface levelling" },
      { text: "Primer coat - walls & ceiling" },
    ],
  },
  {
    id: 14,
    title: "Glazing - glass panels",
    category: 4,
    items: [
      { text: "Clear / frosted / tinted glass" },
      { text: "Fixed glass panels & partitions" },
      { text: "Shower screens & sealing" },
    ],
  },
  {
    id: 15,
    title: "Joinery & custom millwork",
    category: 4,
    items: [
      { text: "Kitchen cabinetry & countertop" },
      { text: "Wardrobes / storage units" },
      { text: "TV unit / study / vanity joinery" },
      { text: "Miscellaneous carpentry details" },
    ],
  },
  {
    id: 16,
    title: "Interior wall finishes",
    category: 4,
    items: [
      { text: "Wall panelling - wood / stone / fluted detail" },
      { text: "Wallpaper / texture / microtopping" },
      { text: "Feature cladding & mirrors" },
    ],
  },
  {
    id: 17,
    title: "Plumbing fixtures & fittings",
    category: 3,
    items: [
      { text: "CP fittings - taps, mixers, showers" },
      { text: "Sanitary ware - basins, WC, tubs" },
      { text: "Hot water system connections" },
      { text: "Leak testing & commissioning" },
    ],
  },
  {
    id: 18,
    title: "Electrical final fix",
    category: 3,
    items: [
      { text: "Switch boards, outlets & DB fitting" },
      { text: "Light fixtures - installation & testing" },
      { text: "Fire alarm & safety commissioning" },
      { text: "Data / AV / security systems" },
    ],
  },
  {
    id: 19,
    title: "Hardware & accessories",
    category: 4,
    items: [
      { text: "Door hardware - handles, locks, hinges" },
      { text: "Window hardware & mechanisms" },
      { text: "Bathroom accessories" },
      { text: "Kitchen pull-outs & accessories" },
    ],
  },
  {
    id: 20,
    title: "Final paint - interior",
    category: 4,
    items: [
      { text: "Final interior wall coats" },
      { text: "Ceiling finish coat" },
      { text: "Touch-ups & paint corrections" },
    ],
  },
  {
    id: 21,
    title: "Landscape & external development",
    category: 1,
    items: [
      { text: "Boundary wall & gate" },
      { text: "Driveway & paving" },
      { text: "Soft landscaping & lighting" },
      { text: "Permanent utility connections" },
    ],
  },
  {
    id: 22,
    title: "Snag & handover",
    category: 4,
    items: [
      { text: "Snagging inspection & rectification" },
      { text: "Deep cleaning - post-construction" },
      { text: "FF&E installation", note: "If in scope" },
      { text: "Final walkthrough & handover" },
    ],
  },
];

export function getWorkflowIndexFromPhaseId(phaseId?: number | null): number {
  if (!Number.isInteger(phaseId) || !phaseId) {
    return 0;
  }

  return Math.max(0, Math.min(WORKFLOW_PHASES.length - 1, phaseId - 1));
}

export function getWorkflowProgressFromPhaseId(phaseId?: number | null): number {
  const activeIndex = getWorkflowIndexFromPhaseId(phaseId);
  if (WORKFLOW_PHASES.length <= 1) {
    return 100;
  }

  return Math.round((activeIndex / (WORKFLOW_PHASES.length - 1)) * 100);
}

function getCategoryTheme(category: WorkflowPhaseCategory) {
  switch (category) {
    case 1:
      return { bar: "#639922", badgeBg: "#EAF3DE", badgeText: "#3B6D11", dot: "#639922" };
    case 2:
      return { bar: "#D85A30", badgeBg: "#FAECE7", badgeText: "#993C1D", dot: "#D85A30" };
    case 3:
      return { bar: "#1D9E75", badgeBg: "#E1F5EE", badgeText: "#0F6E56", dot: "#1D9E75" };
    case 4:
    default:
      return { bar: "#7F77DD", badgeBg: "#EEEDFE", badgeText: "#3C3489", dot: "#7F77DD" };
  }
}

function getCategoryLabel(category: WorkflowPhaseCategory) {
  switch (category) {
    case 1:
      return "Prep Civil Works";
    case 2:
      return "Civil Structure";
    case 3:
      return "MEP";
    case 4:
    default:
      return "Civil Finishings";
  }
}

function getStatusLabel(index: number, activeIndex: number, isNotOpted: boolean) {
  if (isNotOpted) return "Not opted";
  if (index < activeIndex) return "Completed";
  if (index === activeIndex) return "Current";
  return "Upcoming";
}

interface ProjectWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectType: string;
  currentPhaseId?: number;
  onUpdatePhase: (phaseId: number) => Promise<void> | void;
  onMarkNotOpted?: (phaseId: number) => Promise<void> | void;
  notOptedPhases?: number[];
  isReadOnly?: boolean;
}

const ProjectWorkflowModal: React.FC<ProjectWorkflowModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectType,
  currentPhaseId,
  onUpdatePhase,
  onMarkNotOpted,
  notOptedPhases = [],
  isReadOnly = false,
}) => {
  const [updatingPhaseId, setUpdatingPhaseId] = useState<number | null>(null);
  const notOptedSet = useMemo(() => new Set(notOptedPhases), [notOptedPhases]);

  useEffect(() => {
  if (!isOpen) return;
  setUpdatingPhaseId(null);
}, [isOpen]);

  const activeIndex = useMemo(() => getWorkflowIndexFromPhaseId(currentPhaseId), [currentPhaseId]);
  const currentPhase = WORKFLOW_PHASES[activeIndex];
  const currentTheme = getCategoryTheme(currentPhase.category);

  const handleSetStage = async (phaseIndex: number) => {
    const phase = WORKFLOW_PHASES[phaseIndex];
    if (!phase) return;

    try {
      setUpdatingPhaseId(phase.id);
      await Promise.resolve(onUpdatePhase(phase.id));
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl p-0 overflow-hidden">
      <div className="max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <div
          className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6"
          style={{ borderLeftWidth: 4, borderLeftColor: currentTheme.bar }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: currentTheme.badgeBg, color: currentTheme.badgeText }}
            >
              {projectType.toUpperCase()}
            </span>

            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: currentTheme.badgeBg, color: currentTheme.badgeText }}
            >
              Stage {activeIndex + 1} / {WORKFLOW_PHASES.length}
            </span>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white/90 sm:text-3xl">
              {projectName} workflow
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Use the phase buttons below to update the active project phase. Progress is calculated from the selected phase.
            </p>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-3 w-3 rounded-sm bg-[#639922]" /> Prep Civil Works
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-3 w-3 rounded-sm bg-[#D85A30]" /> Civil Structure
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-3 w-3 rounded-sm bg-[#1D9E75]" /> MEP
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="h-3 w-3 rounded-sm bg-[#7F77DD]" /> Civil Finishings
            </div>
          </div>

          <div className="space-y-3">
            {WORKFLOW_PHASES.map((phase, index) => {
              const theme = getCategoryTheme(phase.category);
              const isNotOpted = notOptedSet.has(phase.id);
              const status = getStatusLabel(index, activeIndex, isNotOpted);
              const isCurrent = index === activeIndex;
              const isDone = index < activeIndex;

              return (
                <div
                  key={phase.id}
                  className={`flex overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${
                    isNotOpted ? "opacity-80 bg-gray-50 dark:bg-gray-950" : ""
                  }`}
                >
                  <div className="w-2 flex-shrink-0" style={{ backgroundColor: theme.bar }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                        >
                          {String(phase.id).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white/90">
                            {phase.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                            >
                              {getCategoryLabel(phase.category)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {phase.items.length} checklist items
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={isCurrent ? "info" : isDone ? "success" : "light"} size="sm">
                          {status}
                        </Badge>

                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => handleSetStage(index)}
                              disabled={updatingPhaseId === phase.id}
                              className="inline-flex cursor-pointer items-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900"
                            >
                              {updatingPhaseId === phase.id ? "Saving..." : "Set current"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!onMarkNotOpted) {
                                  console.warn("onMarkNotOpted handler not provided");
                                  return;
                                }
                                onMarkNotOpted(phase.id);
                              }}
                              disabled={!onMarkNotOpted}
                              className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              Not opted
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 px-4 py-3">
                      {phase.items.map((item, itemIndex) => (
                        <div key={`${phase.id}-${itemIndex}`} className="flex items-start gap-3">
                          <span
                            className="mt-2 h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-700 dark:text-gray-300">{item.text}</div>
                            {item.note && (
                              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.note}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
            Client-facing status uses this active phase. Updating a phase here updates project progress on the details page.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectWorkflowModal;
