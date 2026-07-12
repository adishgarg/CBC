"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";

interface LinkSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentSpreadsheetId?: string;
  currentSheetName?: string;
  onLinked: () => void;
}

export default function LinkSpreadsheetModal({isOpen,
  onClose,
  projectId,
  currentSpreadsheetId,
  currentSheetName,
  onLinked,
}: LinkSpreadsheetModalProps) {
  const [spreadsheetId, setSpreadsheetId] = useState(currentSpreadsheetId || "");
  const [sheetName, setSheetName] = useState(currentSheetName || "");
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSpreadsheetId(currentSpreadsheetId || "");
      setSheetName(currentSheetName || "");
      setError("");
      setSuccess(false);
      setAvailableSheets([]);
    }
  }, [isOpen, currentSpreadsheetId, currentSheetName]);

  const extractSpreadsheetId = (input: string): string => {
    // If it's a full URL, extract the ID
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    // Otherwise assume it's already an ID
    return input.trim();
  };

  const fetchSheetNames = async (id: string) => {
    try {
      setLoadingSheets(true);
      const response = await fetch(`/api/sheets/${id}/metadata`);
      if (response.ok) {
        const data = await response.json();
        if (data.sheets && data.sheets.length > 0) {
          const names = data.sheets.map((sheet: any) => sheet.title);
          setAvailableSheets(names);
          // Auto-select first sheet if no sheet name is set
          if (!sheetName && names.length > 0) {
            setSheetName(names[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch sheet names:", err);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSpreadsheetIdChange = async (input: string) => {
    setSpreadsheetId(input);
    const id = extractSpreadsheetId(input);
    if (id && id.length > 20) {
      // Looks like a valid ID, try to fetch sheet names
      await fetchSheetNames(id);
    } else {
      setAvailableSheets([]);
    }
  };

  const handleLink = async () => {
    const id = extractSpreadsheetId(spreadsheetId);
    
    if (!id) {
      setError("Please enter a valid spreadsheet ID or URL");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          spreadsheetId: id,
          sheetName: sheetName || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to link spreadsheet");
      }

      setSuccess(true);
      setTimeout(() => {
        onLinked();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to link spreadsheet");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spreadsheetId: null, sheetName: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink spreadsheet");
      }

      setSuccess(true);
      setTimeout(() => {
        onLinked();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to unlink spreadsheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="relative w-full max-w-[500px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white lg:text-2xl">
            {currentSpreadsheetId ? "Update" : "Link"} Google Sheet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Connect a Google Spreadsheet to display project dates on the calendar
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Spreadsheet ID or URL
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
              placeholder="Paste spreadsheet URL or ID"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              disabled={loading}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Example: https://docs.google.com/spreadsheets/d/<strong>1abc123...</strong>/edit
            </p>
          </div>

          {loadingSheets && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
              Loading sheet tabs...
            </div>
          )}

          {availableSheets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sheet Tab <span className="text-red-500">*</span>
              </label>
              <select
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                disabled={loading}
              >
                <option value="">Select a sheet tab</option>
                {availableSheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Select the tab/sheet that contains your project dates
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/10 dark:border-red-900/50">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-900/10 dark:border-green-900/50">
              <p className="text-sm text-green-600 dark:text-green-400">
                Spreadsheet {currentSpreadsheetId ? "updated" : "linked"} successfully!
              </p>
            </div>
          )}

          <div className="pt-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How to find your Spreadsheet ID:
            </h4>
            <ol className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>1. Open your Google Spreadsheet</li>
              <li>2. Copy the URL from your browser</li>
              <li>3. Paste it here - we'll extract the ID automatically</li>
            </ol>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sheet Requirements:
            </h4>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• Include columns with date-related headers (e.g., "Date", "Deadline", "Due Date")</li>
              <li>• Dates should be in a recognized format (ISO, US, or European)</li>
              <li>• The spreadsheet must be accessible by the authorized Google account</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {currentSpreadsheetId && (
            <button
              onClick={handleUnlink}
              disabled={loading}
              className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/10"
            >
              {loading ? "Unlinking..." : "Unlink"}
            </button>
          )}
          <button
            onClick={handleLink}
            disabled={loading || !spreadsheetId.trim()}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-700 dark:hover:bg-brand-800"
          >
            {loading ? "Linking..." : currentSpreadsheetId ? "Update Link" : "Link Spreadsheet"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
