"use client";
import React from "react";
import PencilIcon from "@/icons/pencil.svg";

interface FloatingMeetingButtonProps {
  onClick: () => void;
}

const FloatingMeetingButton: React.FC<FloatingMeetingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group fixed bottom-4 right-4 z-9999 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-xl active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 hover:cursor-pointer"
      aria-label="Add Meeting Minutes"
    >
      <span className="flex items-center justify-center" style={{ transform: 'translateX(1px) translateY(1px)' }}>
        <PencilIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
      </span>
      
      {/* Tooltip - hidden on mobile */}
      <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-800 sm:block">
        Meeting Minutes
        <span className="absolute left-auto right-4 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-800"></span>
      </span>
    </button>
  );
};

export default FloatingMeetingButton;
