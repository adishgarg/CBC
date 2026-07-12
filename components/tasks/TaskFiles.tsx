"use client";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

interface TaskFile {
  _id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  driveFileId: string;
  modifiedAt?: string;
}

interface TaskFilesProps {
  taskId: string;
  files: TaskFile[];
  onFileUpload: (file: File) => Promise<void>;
  onFileDelete?: (driveFileId: string) => Promise<void>;
}

const TaskFiles: React.FC<TaskFilesProps> = ({
  taskId,
  files,
  onFileUpload,
  onFileDelete,
}) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await onFileUpload(file);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
      "application/zip": [".zip"],
    },
    maxSize: 10485760, // 10MB
  });

  const isFolder = (file: TaskFile) => {
    return file.type === "application/vnd.google-apps.folder";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === "application/pdf") {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (type.includes("word") || type.includes("document")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (type.includes("excel") || type.includes("spreadsheet")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Task Files {files.filter(f => !isFolder(f)).length > 0 && `(${files.filter(f => !isFolder(f)).length})`}
      </h3>

      {/* Upload Area */}
      <div className="mt-4">
        <div
          {...getRootProps()}
          className={`transition cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${
            isDragActive
              ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
              : "border-gray-300 bg-gray-50 hover:border-brand-500 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/10"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} disabled={uploading} />
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">
              {uploading
                ? "Uploading..."
                : isDragActive
                ? "Drop files here"
                : "Drag & drop files here"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              or <span className="text-brand-600 dark:text-brand-400">browse</span> to choose files
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Supports: Images, PDFs, Documents (Max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.filter(file => !isFolder(file)).length > 0 && (
        <div className="mt-6 space-y-2">
          {files.filter(file => !isFolder(file)).map((file) => (
            <div
              key={file._id || file.driveFileId || file.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                    {file.uploadedBy && (
                      <>
                        {" "}• Uploaded by{" "}
                        {file.uploadedBy?.name || file.uploadedBy?.email || "Unknown"}
                      </>
                    )}
                    {" "}• {formatDate(file.modifiedAt || file.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {file.url && (
                  <>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                      title="View in Google Drive"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </>
                )}
                {onFileDelete && file.driveFileId && (
                  <button
                    onClick={() => onFileDelete(file.driveFileId)}
                    className="rounded-lg p-2 text-gray-600 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.filter(file => !isFolder(file)).length === 0 && (
        <div className="mt-6 text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No files uploaded yet
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskFiles;
