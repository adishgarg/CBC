"use client";
import React from "react";
import { Modal } from "../modal";
import Button from "../button/Button";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: "success" | "error" | "warning" | "info";
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  variant = "info",
}) => {
  const iconColors = {
    success: "bg-success-50 text-success-500 dark:bg-success-500/15 dark:text-success-400",
    error: "bg-error-50 text-error-500 dark:bg-error-500/15 dark:text-error-400",
    warning: "bg-warning-50 text-warning-500 dark:bg-warning-500/15 dark:text-warning-400",
    info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  };

  const icons = {
    success: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
    info: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md" showCloseButton={false}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full p-2 ${iconColors[variant]}`}>
            {icons[variant]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Button
            size="sm"
            onClick={onClose}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;
