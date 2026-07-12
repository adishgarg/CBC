"use client";
import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: any[];
  htmlLink: string;
  status: string;
  allDay: boolean;
  type?: string;
  notes?: string;
  taskListName?: string;
  completed?: string;
}

export default function GoogleCalendar() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch both calendar events and tasks in parallel
      const [eventsResponse, tasksResponse] = await Promise.all([
        fetch("/api/calendar/google"),
        fetch("/api/calendar/google-tasks?showCompleted=true&showHidden=true")
      ]);
      
      const eventsData = await eventsResponse.json();
      const tasksData = await tasksResponse.json();

      const allItems: EventInput[] = [];

      // Add calendar events
      if (eventsData.success && eventsData.events) {
        const transformedEvents = eventsData.events.map((event: CalendarEvent) => ({
          id: `event-${event.id}`,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: "var(--color-brand-600)",
          borderColor: "var(--color-brand-600)",
          extendedProps: {
            type: "event",
            description: event.description,
            location: event.location,
            attendees: event.attendees,
            htmlLink: event.htmlLink,
            status: event.status,
          },
        }));
        allItems.push(...transformedEvents);
      }

      // Add tasks
      if (tasksData.success && tasksData.tasks) {
        const transformedTasks = tasksData.tasks
          .filter((task: any) => task.start) // Only show tasks with a due date
          .map((task: any) => ({
            id: `task-${task.id}`,
            title: `✓ ${task.title}`,
            start: task.start,
            allDay: task.allDay,
            backgroundColor: task.status === "completed" ? "#10b981" : "#f59e0b",
            borderColor: task.status === "completed" ? "#10b981" : "#f59e0b",
            className: task.status === "completed" ? "completed-task" : "pending-task",
            extendedProps: {
              type: "task",
              notes: task.notes,
              status: task.status,
              taskListName: task.taskListName,
              completed: task.completed,
            },
          }));
        allItems.push(...transformedTasks);
      }

      setEvents(allItems);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title.replace(/^✓ /, ""), // Remove task checkmark for display
      description: event.extendedProps.description || "",
      start: event.startStr,
      end: event.endStr || event.startStr,
      location: event.extendedProps.location || "",
      attendees: event.extendedProps.attendees || [],
      htmlLink: event.extendedProps.htmlLink || "",
      status: event.extendedProps.status || "",
      allDay: event.allDay,
      type: event.extendedProps.type || "event",
      notes: event.extendedProps.notes || "",
      taskListName: event.extendedProps.taskListName || "",
      completed: event.extendedProps.completed || "",
    });
    openModal();
  };

  const formatDate = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr);
    if (allDay) {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchEvents}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Google Calendar-like styling */
        .fc {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        
        .fc .fc-toolbar-title {
          font-size: 22px;
          font-weight: 400;
          color: #3c4043;
        }
        
        .dark .fc .fc-toolbar-title {
          color: #e8eaed;
        }
        
        .fc .fc-button {
          background: transparent;
          border: 1px solid #dadce0;
          color: #3c4043;
          font-weight: 500;
          text-transform: capitalize;
          padding: 6px 16px;
          border-radius: 4px;
          box-shadow: none;
        }

        .fc .fc-button.fc-today-button,
        .fc .fc-button.fc-today-button:disabled {
          background: var(--color-brand-600) !important;
          border-color: var(--color-brand-600) !important;
          color: white !important;
          opacity: 1 !important;
        }

        .fc .fc-button.fc-today-button:hover {
          background: var(--color-brand-700) !important;
          border-color: var(--color-brand-700) !important;
          color: white !important;
        }
        
        .dark .fc .fc-button {
          border-color: #5f6368;
          color: #e8eaed;
        }

        .dark .fc .fc-button.fc-today-button,
        .dark .fc .fc-button.fc-today-button:disabled {
          background: var(--color-brand-600) !important;
          border-color: var(--color-brand-600) !important;
          color: white !important;
          opacity: 1 !important;
        }

        .dark .fc .fc-button.fc-today-button:hover {
          background: var(--color-brand-700) !important;
          border-color: var(--color-brand-700) !important;
          color: white !important;
        }
        
        .fc .fc-button:hover {
          background: var(--color-brand-50);
          border-color: var(--color-brand-50);
          color: var(--color-brand-600);
        }

        .dark .fc .fc-button:hover {
          background: var(--color-brand-50);
          border-color: var(--color-brand-50);
          color: var(--color-brand-600);
        }
    
        
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background: var(--color-brand-50);
          color: var(--color-brand-600);
          border-color: var(--color-brand-50);
        }
        
        .dark .fc .fc-button-primary:not(:disabled).fc-button-active,
        .dark .fc .fc-button-primary:not(:disabled):active {
          background: var(--color-brand-50);
          color: var(--color-brand-600);
          border-color: var(--color-brand-50);
        }
        
        .fc .fc-button:focus {
          box-shadow: none;
        }
        
        .fc .fc-daygrid-day-number {
          color: #3c4043;
          font-size: 12px;
          padding: 8px;
        }
        
        .dark .fc .fc-daygrid-day-number {
          color: #e8eaed;
        }
        
        .fc .fc-col-header-cell {
          background: transparent;
          border-color: #dadce0;
          padding: 10px 0;
        }
        
        .dark .fc .fc-col-header-cell {
          border-color: #5f6368;
        }
        
        .fc .fc-col-header-cell-cushion {
          color: #70757a;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .dark .fc .fc-col-header-cell-cushion {
          color: #9aa0a6;
        }
        
        .fc .fc-daygrid-day {
          background: transparent;
        }
        
        .fc .fc-daygrid-day:hover {
          background: #f1f3f4;
        }
        
        .dark .fc .fc-daygrid-day:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        
        .fc .fc-daygrid-day.fc-day-today {
          background: var(--color-brand-50) !important;
        }
        
        .dark .fc .fc-daygrid-day.fc-day-today {
          background: rgba(138, 180, 248, 0.12) !important;
        }
        
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: var(--color-brand-600);
          color: white;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
        }
        
        .dark .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: var(--color-brand-600);
          color: #202124;
        }
        
        .fc-theme-standard td, 
        .fc-theme-standard th {
          border-color: #dadce0;
        }
        
        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: #5f6368;
        }
        
        .fc .fc-daygrid-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          margin: 1px 2px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .fc .fc-daygrid-event:hover {
          filter: brightness(0.95);
        }
        
        /* Completed task styling with strikethrough */
        .fc .completed-task .fc-event-title {
          text-decoration: line-through;
          opacity: 0.8;
        }
        
        .fc .completed-task {
          opacity: 0.85;
        }
        
        .fc .fc-event-title {
          font-weight: 400;
        }
        
        .fc .fc-daygrid-more-link {
          color: var(--color-brand-600);
          font-size: 11px;
          font-weight: 500;
        }
        
        .dark .fc .fc-daygrid-more-link {
          color: var(--color-brand-600);
        }
        
        .fc .fc-scrollgrid {
          border-color: #dadce0;
        }
        
        .dark .fc .fc-scrollgrid {
          border-color: #5f6368;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 12px;
          }
          
          .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          
          .fc .fc-toolbar-title {
            font-size: 18px;
          }
          
          .fc .fc-button {
            padding: 5px 10px;
            font-size: 12px;
          }
          
          .fc .fc-daygrid-day-number {
            font-size: 11px;
            padding: 4px;
          }
          
          .fc .fc-col-header-cell-cushion {
            font-size: 10px;
          }
          
          .fc .fc-daygrid-event {
            font-size: 11px;
            padding: 1px 3px;
          }
          
          .fc .fc-daygrid-more-link {
            font-size: 10px;
          }
          
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            width: 22px;
            height: 22px;
            font-size: 11px;
          }
        }
        
        @media (max-width: 640px) {
          .fc .fc-toolbar-title {
            font-size: 16px;
          }
          
          .fc .fc-button {
            padding: 4px 8px;
            font-size: 11px;
          }
          
          .fc .fc-col-header-cell {
            padding: 6px 0;
          }
          
          .fc .fc-daygrid-day-number {
            font-size: 10px;
            padding: 3px;
          }
        }
      `}</style>
      
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'short' }
            }
          }}
          editable={false}
          selectable={false}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={2}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          windowResize={() => {
            if (calendarRef.current) {
              calendarRef.current.getApi().updateSize();
            }
          }}
        />
      </div>

      {/* Event/Task Details Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[650px] mx-4 my-4 sm:m-4">
        <div className="relative w-full max-w-[650px] rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900">
          {selectedEvent && (
            <>
              {/* Header with colored accent */}
              <div 
                className="rounded-t-2xl sm:rounded-t-3xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
                style={{
                  backgroundColor: selectedEvent.type === "task" 
                    ? (selectedEvent.status === "completed" ? "#d1fae5" : "#fef3c7")
                    : "#dbeafe",
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl"
                    style={{
                      backgroundColor: selectedEvent.type === "task"
                        ? (selectedEvent.status === "completed" ? "#10b981" : "#f59e0b")
                        : "var(--color-brand-600)",
                    }}
                  >
                    {selectedEvent.type === "task" ? (
                      selectedEvent.status === "completed" ? (
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )
                    ) : (
                      <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 pr-6 sm:pr-8">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span 
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: selectedEvent.type === "task"
                            ? (selectedEvent.status === "completed" ? "#059669" : "#d97706")
                            : "#2563eb",
                          color: "white",
                        }}
                      >
                        {selectedEvent.type === "task" ? "Task" : "Event"}
                      </span>
                      {selectedEvent.type === "task" && selectedEvent.status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-600">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 
                      className="text-lg sm:text-xl font-bold leading-tight lg:text-2xl"
                      style={{
                        color: selectedEvent.type === "task"
                          ? (selectedEvent.status === "completed" ? "#065f46" : "#78350f")
                          : "#1e40af",
                      }}
                    >
                      {selectedEvent.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
                <div className="space-y-5">
                  {/* Task List Name */}
                  {selectedEvent.type === "task" && selectedEvent.taskListName && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Task List</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEvent.taskListName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Date/Time */}
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {selectedEvent.type === "task" ? "Due Date" : "Time"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedEvent.start, selectedEvent.allDay)}
                        {selectedEvent.end && selectedEvent.end !== selectedEvent.start && (
                          <span className="text-gray-500 dark:text-gray-400"> → {formatDate(selectedEvent.end, selectedEvent.allDay)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Completed Date */}
                  {selectedEvent.type === "task" && selectedEvent.completed && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Completed On</p>
                        <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-500">
                          {formatDate(selectedEvent.completed, false)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location - Events only */}
                  {selectedEvent.type === "event" && selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedEvent.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description - Events */}
                  {selectedEvent.description && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          {selectedEvent.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes - Tasks */}
                  {selectedEvent.type === "task" && selectedEvent.notes && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          {selectedEvent.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Attendees - Events */}
                  {selectedEvent.type === "event" && selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Attendees ({selectedEvent.attendees.length})
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {selectedEvent.attendees.slice(0, 5).map((attendee: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                                  {attendee.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{attendee.email}</span>
                            </div>
                          ))}
                          {selectedEvent.attendees.length > 5 && (
                            <p className="pl-8 text-xs text-gray-500 dark:text-gray-400">
                              +{selectedEvent.attendees.length - 5} more attendees
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="border-t border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-800 lg:px-8">
                {selectedEvent.type === "event" && selectedEvent.htmlLink ? (
                  <a
                    href={selectedEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-700 hover:shadow-md dark:bg-brand-700 dark:hover:bg-brand-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Open in Google Calendar
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : selectedEvent.type === "task" ? (
                  <a
                    href="https://tasks.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-amber-700 hover:shadow-md dark:bg-amber-700 dark:hover:bg-amber-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Open in Google Tasks
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
