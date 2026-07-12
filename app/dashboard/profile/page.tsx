"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your profile information and account details
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white">
              {profile?.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {profile?.name || "User"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
            
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {profile?.role === "admin" ? "Administrator" : "User"}
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
            <div className="flex items-center gap-3 text-sm">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Member since</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {profile?.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your personal details and information
                </p>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Label>
                  Full Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="bg-gray-50 dark:bg-gray-900"
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Email address cannot be changed
                </p>
              </div>

              <div>
                <Label>Role</Label>
                <Input
                  type="text"
                  value={profile?.role === "admin" ? "Administrator" : "User"}
                  disabled={true}
                  className="bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg bg-error-50 p-4 dark:bg-error-500/10">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-6 rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
                <p className="text-sm text-success-600 dark:text-success-400">{success}</p>
              </div>
            )}

            {isEditing && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
