"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentMembers: string[]; // Array of member IDs
  onMemberAdded: () => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  projectId,
  currentMembers,
  onMemberAdded,
}: AddMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(false);
      setSearchTerm("");
      setSelectedUserId("");
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      setSuccess(true);
      setSelectedUserId("");
      setTimeout(() => {
        onMemberAdded();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  // Filter out users who are already members
  const availableUsers = users.filter(
    (user) => !currentMembers.includes(user._id)
  );

  // Further filter by search term
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Add Team Member
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Select a user to add to the project team
          </p>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Users
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            disabled={loading || adding}
          />
        </div>

        {/* User List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Users
          </label>
          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {availableUsers.length === 0
                  ? "All users are already team members"
                  : "No users found matching your search"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedUserId === user._id
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={user._id}
                      checked={selectedUserId === user._id}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                      disabled={adding}
                    />
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase() ||
                        user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/10 dark:border-red-900/50">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-900/10 dark:border-green-900/50">
            <p className="text-sm text-green-600 dark:text-green-400">
              Member added successfully!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={adding}
          >
            Cancel
          </button>
          <button
            onClick={handleAddMember}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={adding || !selectedUserId || loading}
          >
            {adding ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Adding...
              </span>
            ) : (
              "Add Member"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
