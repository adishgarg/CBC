"use client";
import React from "react";
import FellowshipsTable from "@/components/fellowship/FellowshipsTable";

export default function FellowshipPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
          Fellowship Management
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage and track endorsed fellowships
        </p>
      </div>

      {/* Fellowships Table */}
      <FellowshipsTable />
    </div>
  );
}
