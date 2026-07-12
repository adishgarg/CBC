"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface NotificationItem {
  id: string;
  type: "comment" | "meeting_minutes" | "task_update" | "file_upload" | "project_update";
  title: string;
  message: string;
  fileName: string;
  projectName: string;
  createdAt: string;
  isUnread: boolean;
  href: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const hasUnread = unreadCount > 0;

  const getNotificationLabel = (type: NotificationItem["type"]) => {
    if (type === "meeting_minutes") return "Meeting minutes";
    if (type === "task_update") return "Task update";
    if (type === "file_upload") return "File upload";
    if (type === "project_update") return "Project update";
    return "File comment";
  };

  const formatRelativeTime = (isoDate: string) => {
    const now = Date.now();
    const time = new Date(isoDate).getTime();
    const diffSeconds = Math.max(1, Math.floor((now - time) / 1000));

    if (diffSeconds < 60) return "just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) return;

      const data = await response.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!hasUnread || isMarkingRead) return;

    try {
      setIsMarkingRead(true);
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Failed to mark notifications as read:", payload || response.status);
        return;
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    const handleWindowFocus = () => {
      fetchNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const visibleNotifications = useMemo(() => notifications.slice(0, 12), [notifications]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    const nextOpenState = !isOpen;
    if (nextOpenState) {
      fetchNotifications();
    }
    setIsOpen(nextOpenState);
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ${
            !hasUnread ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="!fixed bottom-3 left-3 right-3 top-[76px] z-[60] flex h-auto w-auto max-w-none flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 text-gray-800 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 sm:!absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-auto sm:mt-[17px] sm:h-[480px] sm:w-[361px]"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <div className="flex items-center gap-2">
            {hasUnread ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
                {unreadCount} new
              </span>
            ) : null}
            <button
              onClick={markNotificationsAsRead}
              disabled={!hasUnread || isMarkingRead}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isMarkingRead ? "Marking..." : "Mark as read"}
            </button>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain dark:bg-gray-900">
          {visibleNotifications.length === 0 ? (
            <li className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
              No notifications yet.
            </li>
          ) : (
            visibleNotifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onClick={() => {
                    closeDropdown();
                    if (typeof window !== "undefined") {
                      window.location.assign(notification.href);
                      return;
                    }
                    router.push(notification.href);
                  }}
                  baseClassName="block w-full text-left"
                  className="flex gap-3 rounded-lg border-b border-gray-100 px-4.5 py-3 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800/70"
                >
                  {notification.isUnread ? (
                    <span className="relative mt-1 block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                    </span>
                  ) : (
                    <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  )}

                  <span className="block min-w-0 flex-1">
                    <span className="mb-1 block text-theme-sm text-gray-700 dark:text-gray-200">
                      {notification.title}
                    </span>
                    <span className="mb-1 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </span>
                    <span className="flex items-center gap-2 text-gray-400 text-theme-xs dark:text-gray-500">
                      <span>{getNotificationLabel(notification.type)}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
