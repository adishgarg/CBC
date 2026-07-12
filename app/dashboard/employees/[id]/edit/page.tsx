"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface EmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "admin" | "user";
}

const initialFormData: EmployeeFormData = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "user",
};

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await fetch(`/api/users/${employeeId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load employee");
        }

        setFormData({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phoneNumber: data.user?.phoneNumber || "",
          password: "",
          role: data.user?.role || "user",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const updateFormField = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
    setFormData((currentFormData) => ({ ...currentFormData, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      setSaving(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      setSaving(false);
      return;
    }

    if (formData.password.trim() && formData.password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim() || undefined,
          password: formData.password.trim() || undefined,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update employee.");
      }

      setSuccess("Employee updated successfully!");
      setTimeout(() => {
        router.push("/dashboard/employees");
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        Loading employee...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit Employee
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Update employee details and leave the password blank to keep it unchanged
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Full Name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <Label>
              Email Address <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => updateFormField("email", e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="Enter phone number (optional)"
              value={formData.phoneNumber}
              onChange={(e) => updateFormField("phoneNumber", e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={(e) => updateFormField("password", e.target.value)}
              disabled={saving}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Optional. Use this only if you want to reset the employee password.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>Role</Label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => updateFormField("role", e.target.value as "admin" | "user")}
                  disabled={saving}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="user" className="bg-white py-2 hover:bg-brand-50 dark:bg-gray-900 dark:hover:bg-brand-900/30">
                    User
                  </option>
                  <option value="admin" className="bg-white py-2 hover:bg-brand-50 dark:bg-gray-900 dark:hover:bg-brand-900/30">
                    Admin
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-500/10">
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
              <p className="text-sm text-success-600 dark:text-success-400">{success}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="sm:w-auto">
              {saving ? "Saving..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}