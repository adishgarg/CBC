"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Select from "../form/Select";
import TextArea from "../form/input/TextArea";
import Label from "../form/Label";

interface Project {
  _id: string;
  name: string;
}

interface EditingMeeting {
  _id: string;
  minutes: string;
  status?: "draft" | "published";
}

interface MeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProjectId?: string;
  editingMeeting?: EditingMeeting | null;
}

const MeetingMinutesModal: React.FC<MeetingMinutesModalProps> = ({
  isOpen,
  onClose,
  preSelectedProjectId,
  editingMeeting,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(preSelectedProjectId || "");
  const [content, setContent] = useState<string>(editingMeeting?.minutes || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      // Reset and set project based on preSelectedProjectId
      setSelectedProject(preSelectedProjectId || "");
      if (editingMeeting) {
        setContent(editingMeeting.minutes);
      } else {
        setContent("");
      }
      setError("");
      setSuccess(false);
    }
  }, [isOpen, preSelectedProjectId, editingMeeting]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
    }
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!editingMeeting && !selectedProject) {
      setError("Please select a project");
      return;
    }
    if (!content.trim()) {
      setError("Please enter meeting minutes content");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Edit mode - update existing meeting minutes
      if (editingMeeting) {
        const response = await fetch(`/api/meeting-minutes/${editingMeeting._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content.trim(),
            status,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update meeting minutes");
        }
      } else {
        // Create mode - create new meeting minutes
        const response = await fetch("/api/meeting-minutes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: selectedProject,
            content: content.trim(),
            status,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create meeting minutes");
        }
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        window.location.reload(); // Refresh to show updated meeting minutes
      }, 1000);
    } catch (err: any) {
      console.error("Error saving meeting minutes:", err);
      setError(err.message || "Failed to save meeting minutes");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProject(preSelectedProjectId || "");
    setContent("");
    setError("");
    setSuccess(false);
    onClose();
  };

  const projectOptions = projects.map((project) => ({
    value: project._id,
    label: project.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-2xl p-6 sm:p-8"
    >
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {editingMeeting ? "Edit Meeting Minutes" : "Add Meeting Minutes"}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {editingMeeting 
            ? "Update your meeting minutes content." 
            : "Document important discussions and decisions from your meeting."}
        </p>

        <div className="mt-6 space-y-5">
          {/* Project Selection - Only show in create mode */}
          {!editingMeeting && (
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                options={projectOptions}
                placeholder="Select a project"
                onChange={setSelectedProject}
                defaultValue={selectedProject}
                className="mt-1.5"
              />
              {preSelectedProjectId && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Project is automatically selected from the current page. You can change it if needed.
                </p>
              )}
            </div>
          )}

          {/* Meeting Minutes Content */}
          <div>
            <Label htmlFor="content">Meeting Minutes</Label>
            <TextArea
              placeholder="Enter the meeting minutes, key points, decisions, and action items..."
              rows={8}
              value={content}
              onChange={setContent}
              className="mt-1.5"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-success-50 p-4 dark:bg-success-900/20">
              <p className="text-sm text-success-600 dark:text-success-400">
                {editingMeeting 
                  ? "Meeting minutes updated successfully!" 
                  : "Meeting minutes added successfully!"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit("published")}
            disabled={loading}
          >
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MeetingMinutesModal;
