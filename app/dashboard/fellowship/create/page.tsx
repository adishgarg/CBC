"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import FileInput from "@/components/form/input/FileInput";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";

export default function CreateFellowshipPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name || !formData.email || !file) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Simulate API call (replace with actual API endpoint)
    try {
      // Here you would typically upload the file and send the form data
      // const formDataToSend = new FormData();
      // formDataToSend.append("name", formData.name);
      // formDataToSend.append("email", formData.email);
      // formDataToSend.append("file", file);
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSuccess("Fellowship created successfully!");
      
      // Reset form
      setFormData({ name: "", email: "" });
      setFile(null);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/fellowship");
      }, 2000);
    } catch (err) {
      setError("Failed to create fellowship. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create New Fellowship
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Fill in the details below to create a new fellowship application
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <Label>
              Name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Email Field */}
          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* PDF Upload */}
          <div>
            <Label>
              Upload PDF Document <span className="text-error-500">*</span>
            </Label>
            <FileInput onChange={handleFileChange} />
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Only PDF files are accepted
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-500/10">
              <p className="text-sm text-error-600 dark:text-error-400">
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
              <p className="text-sm text-success-600 dark:text-success-400">
                {success}
              </p>
            </div>
          )}

          {/* Buttons */}
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
            <Button
              type="submit"
              disabled={loading}
              className="sm:w-auto"
            >
              {loading ? "Creating..." : "Create Fellowship"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
