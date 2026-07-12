"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { useUser } from "@/context/UserContext";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    type?: "event" | "project";
    description?: string;
    projectId?: string;
    status?: string;
  };
}

const Calendar: React.FC = () => {
  const { user } = useUser();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();

  const calendarsEvents = {
    High: "danger",
    Medium: "warning",
    Low: "primary",
    Completed: "success",
  };

  // Fetch events from API
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const eventType = event.extendedProps.type;

    // Only allow editing custom events
    if (eventType && eventType !== "event") {
      // Show details modal for projects
      setSelectedEvent(event as unknown as CalendarEvent);
      openViewModal();
      return;
    }

    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventDescription(event.extendedProps.description || "");
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(
      event.end?.toISOString().split("T")[0] ||
        event.start?.toISOString().split("T")[0] ||
        ""
    );
    
    // Map database enum values back to display priority names
    const colorToPriorityMap: Record<string, string> = {
      Danger: "High",
      Warning: "Medium",
      Primary: "Low",
      Success: "Completed",
    };
    setEventLevel(colorToPriorityMap[event.extendedProps.calendar] || "Low");
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle.trim()) {
      alert("Please enter an event title");
      return;
    }

    if (!eventStartDate) {
      alert("Please select a start date");
      return;
    }

    // Map display priority names to database enum values
    const priorityToColorMap: Record<string, string> = {
      High: "Danger",
      Medium: "Warning",
      Low: "Primary",
      Completed: "Success",
    };

    const dbColor = priorityToColorMap[eventLevel] || "Primary";

    try {
      if (selectedEvent) {
        // Update existing event
        const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            start: eventStartDate,
            end: eventEndDate,
            color: dbColor,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to update event");
        }

        const data = await response.json();
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id ? data.event : event
          )
        );
      } else {
        // Add new event
        const response = await fetch("/api/calendar/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            start: eventStartDate,
            end: eventEndDate,
            color: dbColor,
            allDay: true,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }

        const data = await response.json();
        setEvents((prevEvents) => [...prevEvents, data.event]);
      }

      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    // Only allow deleting custom events
    if (selectedEvent.extendedProps.type !== "event") {
      alert("Only custom events can be deleted.");
      return;
    }

    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== selectedEvent.id)
      );

      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventDescription("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Low"); // Default to Low priority
    setSelectedEvent(null);
  };

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="custom-calendar p-2 sm:p-4">
        <style jsx global>{`
          /* Mobile responsive calendar styles */
          @media (max-width: 640px) {
            .fc .fc-toolbar {
              flex-direction: column !important;
              gap: 0.75rem !important;
              padding: 0.75rem !important;
            }
            
            .fc .fc-toolbar-chunk {
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
            }
            
            .fc .fc-toolbar-title {
              font-size: 1.125rem !important;
              margin: 0 !important;
            }
            
            .fc .fc-button {
              padding: 0.375rem 0.625rem !important;
              font-size: 0.75rem !important;
            }
            
            .fc .fc-button-group {
              gap: 0.25rem !important;
            }
            
            .fc .fc-daygrid-day-number {
              font-size: 0.875rem !important;
              padding: 0.25rem !important;
            }
            
            .fc .fc-col-header-cell {
              padding: 0.375rem 0.125rem !important;
              font-size: 0.75rem !important;
            }
            
            .fc .fc-daygrid-event {
              font-size: 0.625rem !important;
              padding: 0.125rem 0.25rem !important;
              margin: 0.125rem 0 !important;
            }
            
            .fc .fc-event-title {
              font-size: 0.625rem !important;
            }
            
            .fc-direction-ltr .fc-daygrid-event {
              margin-left: 0.125rem !important;
              margin-right: 0.125rem !important;
            }
            
            .fc .fc-daygrid-day-frame {
              min-height: 3rem !important;
            }
            
            .fc .fc-scrollgrid {
              border: none !important;
            }
            
            .fc .fc-view-harness {
              overflow-x: auto !important;
            }
            
            /* Footer toolbar on mobile */
            .fc .fc-toolbar.fc-footer-toolbar {
              padding: 0.5rem 0.75rem !important;
              margin-top: 0.5rem !important;
            }
            
            /* More compact view buttons on mobile */
            .fc .fc-toolbar.fc-footer-toolbar .fc-button {
              font-size: 0.688rem !important;
              padding: 0.313rem 0.5rem !important;
            }
            
            /* Hide "Add Event" button text on very small screens */
            @media (max-width: 375px) {
              .fc .fc-addEventButton-button {
                font-size: 0.688rem !important;
              }
            }
          }
          
          /* Base calendar styles - theme aware */
          .custom-calendar .fc {
            --fc-border-color: rgb(229 231 235);
            --fc-button-bg-color: #e05d3a;
            --fc-button-hover-bg-color: #c73e1f;
            --fc-button-active-bg-color: #a32f15;
            --fc-button-text-color: white;
            --fc-small-font-size: 0.875rem;
            --fc-page-bg-color: transparent;
          }
          
          .dark .custom-calendar .fc {
            --fc-border-color: rgb(41 37 36);
            --fc-neutral-bg-color: rgb(28 25 23 / 0.03);
          }
          
          .custom-calendar .fc .fc-toolbar-title {
            color: rgb(28 25 23);
            font-weight: 600;
          }
          
          .dark .custom-calendar .fc .fc-toolbar-title {
            color: rgb(249 250 251 / 0.9);
          }
          
          .custom-calendar .fc .fc-col-header-cell {
            background-color: transparent;
            color: rgb(120 113 108);
            font-weight: 500;
          }
          
          .dark .custom-calendar .fc .fc-col-header-cell {
            color: rgb(168 162 158);
          }
          
          .custom-calendar .fc .fc-daygrid-day-number {
            color: rgb(28 25 23);
          }
          
          .dark .custom-calendar .fc .fc-daygrid-day-number {
            color: rgb(249 250 251 / 0.9);
          }
          
          .custom-calendar .fc .fc-daygrid-day.fc-day-today {
            background-color: rgb(254 237 232 / 0.3) !important;
          }
          
          .dark .custom-calendar .fc .fc-daygrid-day.fc-day-today {
            background-color: rgb(163 47 21 / 0.1) !important;
          }
          
          /* Event color styles */
          .fc-bg-danger,
          .fc-event.fc-bg-danger {
            background-color: #ef4444 !important;
            border-color: #ef4444 !important;
            color: white !important;
          }
          
          .fc-bg-success,
          .fc-event.fc-bg-success {
            background-color: #22c55e !important;
            border-color: #22c55e !important;
            color: white !important;
          }
          
          .fc-bg-primary,
          .fc-event.fc-bg-primary {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: white !important;
          }
          
          .fc-bg-warning,
          .fc-event.fc-bg-warning {
            background-color: #f59e0b !important;
            border-color: #f59e0b !important;
            color: white !important;
          }
          
          /* Override FullCalendar default event styling */
          .fc-event {
            border-left: none !important;
          }
          
          .fc-daygrid-event {
            border: none !important;
          }
          
          /* Dark mode event colors */
          .dark .fc-bg-danger,
          .dark .fc-event.fc-bg-danger {
            background-color: #dc2626 !important;
            border-color: #dc2626 !important;
          }
          
          .dark .fc-bg-success,
          .dark .fc-event.fc-bg-success {
            background-color: #16a34a !important;
            border-color: #16a34a !important;
          }
          
          .dark .fc-bg-primary,
          .dark .fc-event.fc-bg-primary {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }
          
          .dark .fc-bg-warning,
          .dark .fc-event.fc-bg-warning {
            background-color: #d97706 !important;
            border-color: #d97706 !important;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "addEventButton",
          }}
          footerToolbar={{
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          customButtons={{
            addEventButton: {
              text: "+ Add Event",
              click: openModal,
            },
          }}
          height="auto"
          contentHeight="auto"
          dayMaxEvents={2}
        />
        </div>
      )}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedEvent ? "Edit Event" : "Add Event"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedEvent
                ? "Update your event details"
                : "Create a new calendar event to stay organized"}
            </p>
          </div>
          <div className="mt-8">
            <div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title <span className="text-error-500">*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Description (Optional)
              </label>
              <textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Add event details..."
                rows={3}
                className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div className="mt-6">
              <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                Priority Level
              </label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {Object.entries(calendarsEvents).map(([key, value]) => (
                  <div key={key} className="n-chk">
                    <div
                      className={`form-check form-check-${value} form-check-inline`}
                    >
                      <label
                        className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        htmlFor={`modal${key}`}
                      >
                        <span className="relative">
                          <input
                            className="sr-only form-check-input"
                            type="radio"
                            name="event-level"
                            value={key}
                            id={`modal${key}`}
                            checked={eventLevel === key}
                            onChange={() => setEventLevel(key)}
                          />
                          <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                            <span
                              className={`h-2 w-2 rounded-full bg-white ${
                                eventLevel === key ? "block" : "hidden"
                              }`}  
                            ></span>
                          </span>
                        </span>
                        {key}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Start Date <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="event-start-date"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                End Date
              </label>
              <div className="relative">
                <input
                  id="event-end-date"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            {selectedEvent && selectedEvent.extendedProps.type === "event" && (
              <button
                onClick={handleDeleteEvent}
                type="button"
                className="flex justify-center rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-700 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-900/20"
              >
                Delete
              </button>
            )}
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              type="button"
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              {selectedEvent ? "Update Event" : "Add Event"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Project Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        className="max-w-[600px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              📋 Project Details
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View full project details and team collaboration
            </p>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Project Name
              </label>
              <p className="text-base font-medium text-gray-800 dark:text-white/90">
                {selectedEvent?.title?.replace(/^📋\s/, "")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <p className="text-base text-gray-800 dark:text-white/90">
                  {selectedEvent?.start ? new Date(selectedEvent.start as string).toLocaleDateString() : "N/A"}
                </p>
              </div>
              
              {selectedEvent?.end && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <p className="text-base text-gray-800 dark:text-white/90">
                    {new Date(selectedEvent.end as string).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {selectedEvent?.extendedProps.status && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedEvent.extendedProps.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={closeViewModal}
              type="button"
              className="flex flex-1 justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (selectedEvent?.extendedProps.projectId) {
                  window.location.href = `/dashboard/projects/${selectedEvent.extendedProps.projectId}`;
                }
              }}
              type="button"
              className="flex flex-1 justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              View Full Details →
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
