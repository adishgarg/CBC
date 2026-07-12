"use client";
import React, { useState, useEffect } from "react";

interface Remark {
  _id: string;
  comment: string;
  fileName: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  clientName?: string; // For unauthenticated client comments
  createdAt: string;
  updatedAt: string;
}

interface FileRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  fileName: string;
}

const FileRemarksModal: React.FC<FileRemarksModalProps> = ({
  isOpen,
  onClose,
  projectId,
  fileName,
}) => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [newComment, setNewComment] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Check if user is authenticated and load saved client name
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
        
        // If not authenticated, try to load saved client name
        if (!response.ok) {
          const savedName = localStorage.getItem("clientName");
          if (savedName) {
            setClientName(savedName);
          }
        }
      } catch {
        setIsAuthenticated(false);
        const savedName = localStorage.getItem("clientName");
        if (savedName) {
          setClientName(savedName);
        }
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isOpen && fileName) {
      fetchRemarks();
    }
  }, [isOpen, fileName, projectId]);

  const fetchRemarks = async () => {
    setLoading(true);
    try {
      // Use public endpoint if not authenticated
      const endpoint = isAuthenticated
        ? `/api/projects/${projectId}/remarks?fileName=${encodeURIComponent(fileName)}`
        : `/api/projects/public/${projectId}/remarks?fileName=${encodeURIComponent(fileName)}`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setRemarks(data.remarks || []);
      }
    } catch (error) {
      console.error("Error fetching remarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on authentication status
    if (!newComment.trim()) return;
    if (!isAuthenticated && !clientName.trim()) return;

    setSubmitting(true);
    try {
      // Save client name to localStorage for future comments (if unauthenticated)
      if (!isAuthenticated && clientName.trim()) {
        localStorage.setItem("clientName", clientName.trim());
      }

      const endpoint = isAuthenticated
        ? `/api/projects/${projectId}/remarks`
        : `/api/projects/public/${projectId}/remarks`;

      const body: Record<string, string> = {
        comment: newComment.trim(),
        fileName: fileName,
      };

      // Add client name if not authenticated
      if (!isAuthenticated) {
        body.clientName = clientName.trim();
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setRemarks([data.remark, ...remarks]);
        setNewComment("");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding remark:", error);
      alert("Error adding comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getCommenterName = (remark: Remark) => {
    if (remark.createdBy) {
      return remark.createdBy.name || remark.createdBy.email;
    }
    return remark.clientName || "Anonymous";
  };

  const getCommenterInitial = (remark: Remark) => {
    const name = getCommenterName(remark);
    return name.charAt(0).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-2xl mx-4 flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Comments
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600 dark:border-gray-700 dark:border-t-brand-400"></div>
            </div>
          ) : remarks.length > 0 ? (
            <div className="space-y-4">
              {remarks.map((remark) => (
                <div
                  key={remark._id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                        {getCommenterInitial(remark)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCommenterName(remark)}
                          </p>
                          {remark.clientName && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Client
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(remark.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {remark.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to add one!
              </p>
            </div>
          )}
        </div>

        {/* Footer - Add Comment */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isAuthenticated && (
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name"
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting || !newComment.trim() || (!isAuthenticated && !clientName.trim())}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                {submitting ? "Adding..." : "Add Comment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileRemarksModal;
