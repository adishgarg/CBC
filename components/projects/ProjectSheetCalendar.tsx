"use client";
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

interface SheetDate {
  date: string;
  title: string;
  description: string;
  columnName: string;
  rowData: any[];
}

interface ProjectSheetCalendarProps {
  projectId: string;
  onLinkSpreadsheet?: () => void;
}

export default function ProjectSheetCalendar({ projectId, onLinkSpreadsheet }: ProjectSheetCalendarProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SheetDate | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchSheetDates();
  }, [projectId]);

  const fetchSheetDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/sheet-dates`);
      const data = await response.json();

      if (data.success) {
        if (data.dates && data.dates.length > 0) {
          // Transform dates to FullCalendar format
          const transformedEvents = data.dates.map((dateItem: SheetDate) => ({
            id: `${dateItem.date}-${dateItem.title}`,
            title: dateItem.title,
            start: dateItem.date,
            allDay: true,
            backgroundColor: "#10b981", // Green color for sheet dates
            borderColor: "#10b981",
            extendedProps: {
              description: dateItem.description,
              columnName: dateItem.columnName,
              rowData: dateItem.rowData,
            },
          }));
          setEvents(transformedEvents);
        }
        setError(null);
      } else {
        if (data.message) {
          setError(null); // No error if no spreadsheet is linked
          setEvents([]);
        } else {
          setError(data.error || "Failed to load dates");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dates from spreadsheet");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      date: event.startStr,
      title: event.title,
      description: event.extendedProps.description || "",
      columnName: event.extendedProps.columnName || "",
      rowData: event.extendedProps.rowData || [],
    });
    openModal();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchSheetDates}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          No dates found in linked spreadsheet
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Make sure your spreadsheet has columns with date-related headers (date, deadline, due date, etc.)
        </p>
        {onLinkSpreadsheet && (
          <button
            onClick={onLinkSpreadsheet}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Link a Spreadsheet
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .project-sheet-calendar .fc {
          font-family: inherit;
        }
        
        .project-sheet-calendar .fc .fc-toolbar-title {
          font-size: 18px;
          font-weight: 600;
        }
        
        .project-sheet-calendar .fc .fc-button {
          padding: 4px 12px;
          font-size: 13px;
        }
        
        .project-sheet-calendar .fc-theme-standard td,
        .project-sheet-calendar .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        
        .dark .project-sheet-calendar .fc-theme-standard td,
        .dark .project-sheet-calendar .fc-theme-standard th {
          border-color: #374151;
        }
      `}</style>

      <div className="project-sheet-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,listMonth",
          }}
          editable={false}
          selectable={false}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          fixedWeekCount={false}
        />
      </div>

      {/* Event Details Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="relative w-full max-w-[600px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          {selectedEvent && (
            <div className="space-y-5 pr-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white lg:text-2xl">
                  {selectedEvent.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  From: {selectedEvent.columnName}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(selectedEvent.date)}
                </p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Details</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.rowData && selectedEvent.rowData.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Row Data</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.rowData.slice(0, 5).map((cell: any, idx: number) => (
                      cell && <div key={idx}>• {cell}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
