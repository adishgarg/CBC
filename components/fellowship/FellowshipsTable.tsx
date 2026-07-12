"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../tables/Pagination";
import Link from "next/link";

interface Fellowship {
  id: number;
  name: string;
  organization: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Upcoming" | "Endorsed";
  category: string;
}

const fellowshipsData: Fellowship[] = [
  {
    id: 1,
    name: "Research Fellowship in Sustainable Architecture",
    organization: "Green Building Council",
    duration: "12 months",
    startDate: "Jan 01, 2026",
    endDate: "Dec 31, 2026",
    status: "Active",
    category: "Research",
  },
  {
    id: 2,
    name: "Vastu Design Fellowship",
    organization: "Indian Institute of Architecture",
    duration: "6 months",
    startDate: "Mar 01, 2026",
    endDate: "Aug 31, 2026",
    status: "Active",
    category: "Design",
  },
  {
    id: 3,
    name: "Heritage Conservation Fellowship",
    organization: "National Heritage Foundation",
    duration: "9 months",
    startDate: "Sep 01, 2025",
    endDate: "May 31, 2026",
    status: "Endorsed",
    category: "Conservation",
  },
  {
    id: 4,
    name: "Urban Planning Fellowship",
    organization: "City Planning Commission",
    duration: "12 months",
    startDate: "Nov 01, 2025",
    endDate: "Oct 31, 2026",
    status: "Completed",
    category: "Planning",
  },
  {
    id: 5,
    name: "Digital Architecture Fellowship",
    organization: "Tech Architecture Lab",
    duration: "6 months",
    startDate: "Jun 01, 2026",
    endDate: "Nov 30, 2026",
    status: "Upcoming",
    category: "Technology",
  },
];

export default function FellowshipsTable() {
  const [fellowships] = useState<Fellowship[]>(fellowshipsData);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  const filteredFellowships = fellowships.filter(
    (fellowship) =>
      fellowship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fellowship.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fellowship.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFellowships.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFellowships = filteredFellowships.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getStatusColor = (status: Fellowship["status"]) => {
    switch (status) {
      case "Active":
        return "success";
      case "Endorsed":
        return "primary";
      case "Completed":
        return "light";
      case "Upcoming":
        return "info";
      default:
        return "light";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Endorsed Fellowships
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track and manage all your ongoing fellowships
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Search fellowships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter
            </button>
            <Link href="/dashboard/fellowship/create" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-800">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Fellowship
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 pl-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Fellowship Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Organization
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Duration
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Timeline
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Category
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 pr-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFellowships.map((fellowship) => (
              <TableRow
                key={fellowship.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <TableCell className="py-4 pl-6">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fellowship.name}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {fellowship.organization}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {fellowship.duration}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
                    <span>{fellowship.startDate}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      to {fellowship.endDate}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge variant="light" color="info" size="sm">
                    {fellowship.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 pr-6">
                  <Badge
                    variant="light"
                    color={getStatusColor(fellowship.status)}
                    size="sm"
                  >
                    {fellowship.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, filteredFellowships.length)}</span> of{" "}
            <span className="font-medium">{filteredFellowships.length}</span> fellowships
            {searchTerm && <span className="text-gray-500"> (filtered from {fellowships.length})</span>}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
