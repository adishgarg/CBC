"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";

type ChecklistState = {
  prepared: Record<string, boolean>;
  released: Record<string, boolean>;
};

type ChecklistPhase = {
  id: string;
  label: string;
  sublabel: string;
  code: string;
  drawings: string[];
};

type ChecklistFile = {
  name: string;
  driveFileId?: string;
  url?: string;
  type?: string;
  uploadedAt?: string;
  modifiedAt?: string;
};

const PHASES: ChecklistPhase[] = [
  {
    id: "pre",
    label: "Pre Liminary",
    sublabel: "Understanding Requirements",
    code: "PL",
    drawings: [
      "Client Brief Documentation",
      "Site Visit Report",
      "Topographic Survey",
      "Boundary and Legal Setback Plan",
      "Sun Path and Wind Direction Study",
      "Neighbourhood Context Plan",
      "Vastu Site Orientation Analysis",
      "Understanding Requirements Sign-off Sheet",
    ],
  },
  {
    id: "ph1",
    label: "Phase 1",
    sublabel: "Concept Development",
    code: "CD",
    drawings: [
      "Concept Narrative and Design Intent Sheet",
      "Site Analysis Diagram",
      "Bubble Diagram and Spatial Adjacency Study",
      "Concept Floor Plans",
      "Concept Elevations",
      "Concept Sections",
      "3D Renders - Exterior Views",
      "Landscape Concept Layout",
      "Material Palette Board (Concept)",
    ],
  },
  {
    id: "ph2",
    label: "Phase 2",
    sublabel: "Working Drawings",
    code: "WD",
    drawings: [
      "Structural Grid and Column Layout",
      "Foundation Plan",
      "Structural Beam and Slab Layout",
      "Structural Section Details",
      "Working Drawing - Floor Plans (All Levels)",
      "Working Drawing - Roof Plan",
      "Working Drawing - Site Plan",
      "Working Drawing - Elevations (All Faces)",
      "Working Drawing - Sections (Longitudinal and Cross)",
      "Door and Window Schedule with Jamb Details",
      "Plumbing Layout - Drainage (Level 1)",
      "Plumbing Layout - Water Supply (Level 1)",
      "HVAC and AC Duct Layout Schematic",
      "Boundary Wall Details and Gate Design",
      "Parapet and Terrace Wall Details",
      "Staircase Structural Details",
      "Site Development Plan",
    ],
  },
  {
    id: "ph3",
    label: "Phase 3",
    sublabel: "Interior Development",
    code: "ID",
    drawings: [
      "Interior Concept Mood Boards - Room Wise",
      "Electrical Layout - Level 2",
      "Flooring Layout - All Rooms",
      "Flooring Pattern Details and Inlay Drawings",
      "Reflected Ceiling Plan - All Rooms",
      "Ceiling Design Details (Coffered / Tray / Curved)",
      "False Ceiling Section Details",
      "Feature Wall Elevations",
      "Toilet Interior Elevations - All Toilets",
      "Toilet Tile Layout and Grouting Pattern",
      "Window Treatment Details (Curtain Pocket and Pelmet)",
      "Skirting and Dado Profiles Detail",
      "Material and Finish Schedule",
      "Lighting Design Layout - Decorative and Functional",
      "Furniture Layout Plan",
      "Soft Furnishing Specification Sheet",
      "Electrical Layout - Lighting (Level 1)",
    ],
  },
  {
    id: "ph4",
    label: "Phase 4",
    sublabel: "Specifications and Millwork",
    code: "MM",
    drawings: [
      "Modular Kitchen Layout Plan",
      "Kitchen Elevation - All Four Walls",
      "Kitchen Counter, Backsplash and Shutter Details",
      "Kitchen Appliance Cutout Schedule",
      "Wardrobe Layout and Elevation - Room Wise",
      "Wardrobe Internal Fittings Detail",
      "TV Unit Design and Elevation",
      "Crockery Unit and Bar Unit Design",
      "Study and Bookshelf Unit Details",
      "Paint Scheme - Room Wise Colour Schedule",
      "Paint Specification and Sheen Schedule",
      "Staircase Design Elevation with Railing and Tread Details",
      "Main Door Design and Elevation",
      "Internal Door Design Schedule",
      "Door Hardware Schedule",
      "Balcony Railing and Grill Design",
      "Landscape and Hardscape Detail Drawings",
      "Signage and Wayfinding (if applicable)",
      "Accessibility Compliance Checklist",
      "As-Built Drawing Checklist",
    ],
  },
];

const DEFAULT_STATE: ChecklistState = { prepared: {}, released: {} };

interface DrawingReleaseChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  files: ChecklistFile[];
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function extractPhaseCode(fileName: string) {
  const prefix = fileName.split("_")[0];
  const match = prefix.match(/^(PL|CD|WD|ID|MM)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractChecklistIndex(fileName: string) {
  const prefix = fileName.split("_")[0];
  const match = prefix.match(/^(PL|CD|WD|ID|MM)(\d{1,2})$/i);
  return match?.[2] ? Number(match[2]) : null;
}

function createStorageKey(projectId: string) {
  return `CBC__drawing-checklist:${projectId}`;
}

function cloneChecklistState(state: ChecklistState): ChecklistState {
  return {
    prepared: { ...state.prepared },
    released: { ...state.released },
  };
}

function getPhaseProgress(phase: ChecklistPhase, state: ChecklistState) {
  const total = phase.drawings.length;
  const prepared = phase.drawings.reduce(
    (count: number, _item: string, index: number) => count + (state.prepared[`${phase.id}-${index}`] ? 1 : 0),
    0
  );
  const released = phase.drawings.reduce(
    (count: number, _item: string, index: number) => count + (state.released[`${phase.id}-${index}`] ? 1 : 0),
    0
  );
  return {
    total,
    prepared,
    released,
    pct: total ? Math.round((released / total) * 100) : 0,
  };
}

export default function DrawingReleaseChecklistModal({
  isOpen,
  onClose,
  projectId,
  files,
}: DrawingReleaseChecklistModalProps) {
  const [activePhaseId, setActivePhaseId] = useState(PHASES[0].id);
  const [projectName, setProjectName] = useState("");
  const [checklistState, setChecklistState] = useState<ChecklistState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  const storageKey = useMemo(() => createStorageKey(projectId), [projectId]);

  const checklistFiles = useMemo(
    () =>
      Array.from(
        new Map(
          files
            .filter((file) => file?.name)
            .map((file) => [
              file.driveFileId || file.name,
              file,
            ])
        ).values()
      ),
    [files]
  );
  const phaseFileMap = useMemo(() => {
    return PHASES.reduce((map, phase) => {
      map[phase.code] = checklistFiles.filter((file) => extractPhaseCode(file.name) === phase.code);
      return map;
    }, {} as Record<string, ChecklistFile[]>);
  }, [checklistFiles]);

  const openChecklistFile = (file: ChecklistFile) => {
    if (typeof window === "undefined") {
      return;
    }

    if (file.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (file.driveFileId) {
      window.open(`/api/files/${encodeURIComponent(file.driveFileId)}/preview`, "_blank", "noopener,noreferrer");
    }
  };

  const getItemMatches = (phase: ChecklistPhase, item: string, itemIndex: number) => {
    const normalizedItem = normalizeText(item);
    const phaseFiles = phaseFileMap[phase.code] || [];
    const expectedIndex = itemIndex + 1;

    return phaseFiles.filter((file) => {
    const normalizedFile = normalizeText(file.name);
    const fileIndex = extractChecklistIndex(file.name);

    // Files following the PL1_, WD3_, etc. convention are matched
    // solely by their prefix before the underscore.
    if (fileIndex !== null) {
        return fileIndex === expectedIndex;
    }

    // Fallback for legacy files that don't follow the convention.
    return normalizedFile.includes(normalizedItem);
    });
  };

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    setIsHydrated(false);

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue as string) as {
          projectName?: string;
          activePhaseId?: string;
          state?: ChecklistState;
        };

        setProjectName(parsed.projectName || "");
        setActivePhaseId(PHASES.some((phase) => phase.id === parsed.activePhaseId) ? parsed.activePhaseId || PHASES[0].id : PHASES[0].id);
        setChecklistState(parsed.state || DEFAULT_STATE);
      } else {
        setProjectName("");
        setActivePhaseId(PHASES[0].id);
        setChecklistState(DEFAULT_STATE);
      }
    } catch {
      setProjectName("");
      setActivePhaseId(PHASES[0].id);
      setChecklistState(DEFAULT_STATE);
    } finally {
      setIsHydrated(true);
    }
  }, [isOpen, storageKey]);

  useEffect(() => {
    if (!isOpen || !isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        projectName,
        activePhaseId,
        state: checklistState,
        updatedAt: new Date().toISOString(),
      })
    );

    setSavedAt(true);
    const timer = window.setTimeout(() => setSavedAt(false), 1400);

    return () => window.clearTimeout(timer);
  }, [activePhaseId, checklistState, isHydrated, isOpen, projectName, storageKey]);

  const activePhase = PHASES.find((phase) => phase.id === activePhaseId) || PHASES[0];
  const activeProgress = getPhaseProgress(activePhase, checklistState);
  const activeUploadedItems = activePhase.drawings.filter((item, index) => getItemMatches(activePhase, item, index).length > 0).length;
  const overallProgress = PHASES.reduce(
    (summary, phase) => {
      const progress = getPhaseProgress(phase, checklistState);
      summary.total += progress.total;
      summary.released += progress.released;
      summary.prepared += progress.prepared;
      return summary;
    },
    { total: 0, released: 0, prepared: 0 }
  );
  const overallUploaded = PHASES.reduce(
    (count, phase) =>
      count + phase.drawings.filter((item, index) => getItemMatches(phase, item, index).length > 0).length,
    0
  );

  const togglePrepared = (phaseId: string, itemIndex: number) => {
    const key = `${phaseId}-${itemIndex}`;
    setChecklistState((previous) => {
      const next = cloneChecklistState(previous);

      if (next.prepared[key]) {
        delete next.prepared[key];
        delete next.released[key];
      } else {
        next.prepared[key] = true;
      }

      return next;
    });
  };

  const toggleReleased = (phaseId: string, itemIndex: number) => {
    const key = `${phaseId}-${itemIndex}`;
    setChecklistState((previous) => {
      const next = cloneChecklistState(previous);

      if (next.released[key]) {
        delete next.released[key];
      } else {
        next.prepared[key] = true;
        next.released[key] = true;
      }

      return next;
    });
  };

  const resetChecklist = () => {
    if (!window.confirm("Reset all tick marks for this project? This cannot be undone.")) {
      return;
    }

    setChecklistState(DEFAULT_STATE);
    setProjectName("");
    setActivePhaseId(PHASES[0].id);
  };

  const renderItemRow = (phase: ChecklistPhase, item: string, index: number) => {
    const key = `${phase.id}-${index}`;
    const prepared = !!checklistState.prepared[key];
    const released = !!checklistState.released[key];
    const matchedFiles = getItemMatches(phase, item, index);

    return (
      <div
        key={key}
        className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 transition sm:flex-row sm:items-center sm:justify-between ${
          released
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10"
            : prepared
              ? "border-brand-200 bg-brand-50 dark:border-brand-900/40 dark:bg-brand-900/10"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
            {phase.code} {index + 1}
          </div>
          <div className={`mt-1 font-serif text-[15px] leading-6 ${released ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
            {item}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] ${matchedFiles.length > 0 ? "bg-brand-600 text-white dark:bg-brand-500" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
              {matchedFiles.length > 0 ? `Uploaded ${matchedFiles.length}` : "Not uploaded"}
            </span>
            {matchedFiles.slice(0, 2).map((file) => (
              <span key={file.driveFileId || file.name} className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                {file.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => togglePrepared(phase.id, index)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
              prepared
                ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                : "border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            }`}
          >
            Prepared
          </button>
          <button
            type="button"
            onClick={() => toggleReleased(phase.id, index)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
              released
                ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                : "border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            }`}
          >
            Released
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[calc(100vw-1.5rem)] max-w-[1280px] overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-gray-900">
      <div className="flex max-h-[calc(100vh-2rem)] min-h-0 flex-col overflow-hidden rounded-[28px] bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-brand-600 px-5 py-4 text-white sm:px-6 lg:flex-row lg:items-start lg:justify-between dark:border-gray-800 dark:bg-brand-700">
          <div className="min-w-0">
            <h3 className="mt-1 font-serif text-2xl font-normal sm:text-3xl">
              Drawing Release Checklist
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-white sm:min-w-[320px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <div className="text-2xl leading-none">{overallProgress.prepared}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">Prepared</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <div className="text-2xl leading-none">{overallProgress.released}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">Released</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <div className="text-2xl leading-none">{overallUploaded}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">Uploaded</div>
            </div>
          </div>
        </div>

        

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-3xl border border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-brand-600 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-brand-500">
                  {activePhase.label}
                </div>
                <div className="mt-2 font-serif text-2xl font-normal text-gray-900 dark:text-white sm:text-[26px]">
                  {activePhase.sublabel}
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-3xl leading-none text-gray-900 dark:text-white">
                    {activeProgress.released}
                    <span className="text-base text-gray-500 dark:text-gray-400">/{activeProgress.total}</span>
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    {activeUploadedItems} uploaded
                  </div>
                </div>
                <div className="w-32 sm:w-40">
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-brand-600 transition-all dark:bg-brand-500" style={{ width: `${activeProgress.pct}%` }} />
                  </div>
                  <div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {activeProgress.pct}% complete
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {PHASES.map((phase) => {
              const progress = getPhaseProgress(phase, checklistState);
              const isActive = phase.id === activePhaseId;

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setActivePhaseId(phase.id)}
                  className={`min-w-[170px] rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-500 dark:bg-brand-500"
                      : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="text-[9px] font-semibold uppercase tracking-[0.22em] opacity-75">
                    {phase.code}
                  </div>
                  <div className="mt-1 font-serif text-base">{phase.label}</div>
                  <div className={`mt-1 text-[9px] uppercase tracking-[0.18em] ${isActive ? "text-white/75" : "text-gray-500 dark:text-gray-400"}`}>
                    {progress.released}/{progress.total} released
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${isActive ? "bg-white" : "bg-brand-600 dark:bg-brand-500"}`}
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {activePhase.drawings.map((item, index) => renderItemRow(activePhase, item, index))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
