"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface CreateEmployeeFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "admin" | "user";
}

const initialFormData: CreateEmployeeFormData = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "user",
};

export default function CreateEmployeePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateEmployeeFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateFormField = <K extends keyof CreateEmployeeFormData>(
    key: K,
    value: CreateEmployeeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const generateRandomPassword = () => {
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    updateFormField("password", password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim() || undefined,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create employee.");
      }

      setSuccess("Employee created successfully!");
      setFormData(initialFormData);

      setTimeout(() => {
        router.push("/dashboard/employees");
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create employee. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create New Employee
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Add a new employee to your organization
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="Enter phone number (optional)"
              value={formData.phoneNumber}
              onChange={(e) => updateFormField("phoneNumber", e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Enter password (min. 6 characters)"
                  value={formData.password}
                  onChange={(e) => updateFormField("password", e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={generateRandomPassword}
                disabled={loading}
                className="flex h-11 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800 dark:focus:border-brand-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Generate
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 6 characters long
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>Role</Label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => updateFormField("role", e.target.value as "admin" | "user")}
                  disabled={loading}
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
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Select user access level
              </p>
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
              disabled={loading}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="sm:w-auto">
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
