"use client";

import { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

export default function SettingsPage() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!passwordData.currentPassword.trim()) {
      setError("Current password is required");
      setLoading(false);
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setError("New password is required");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account security and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Change Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your password to keep your account secure
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <Label>
                Current Password <span className="text-error-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Enter your current password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>
                  New Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  disabled={loading}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <Label>
                  Confirm New Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-error-50 p-4 dark:bg-error-500/10">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-success-600 dark:text-success-400">{success}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="sm:w-auto">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>

        {/* Security Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Security Tips
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Best practices for account security
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                  <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Use a strong, unique password
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Combine uppercase and lowercase letters, numbers, and special characters
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                  <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Change your password regularly
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your password every 3-6 months for better security
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                  <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Never share your password
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Keep your login credentials private and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
