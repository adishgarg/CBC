"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";

type ProjectStatus = "active" | "completed" | "on hold";
type ProjectType = "architecture" | "interior" | "both";

interface CreateProjectFormData {
	name: string;
	location: string;
	sheetProjectType: string;
	description: string;
	projectType: ProjectType;
	status: ProjectStatus;
	startDate: string;
	endDate: string;
}

interface ClientData {
	name: string;
	email: string;
	phoneNumber: string;
}

interface WorkerOption {
	id: string;
	name: string;
	email: string;
	role?: string;
}

const initialFormData: CreateProjectFormData = {
	name: "",
	location: "",
	sheetProjectType: "",
	description: "",
	projectType: "both",
	status: "active",
	startDate: "",
	endDate: "",
};

const initialClientData: ClientData = {
	name: "",
	email: "",
	phoneNumber: "",
};

export default function CreateProjectPage() {
	const router = useRouter();
	const [formData, setFormData] = useState<CreateProjectFormData>(initialFormData);
	const [clients, setClients] = useState<ClientData[]>([initialClientData]);
	const [workers, setWorkers] = useState<WorkerOption[]>([]);
	const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
	const [workersLoading, setWorkersLoading] = useState(true);
	const [workersOpen, setWorkersOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const workerDropdownRef = useRef<HTMLDivElement>(null);

	const selectedWorkersText = useMemo(() => {
		if (selectedTeamMembers.length === 0) {
			return "Select workers";
		}

		return workers
			.filter((worker) => selectedTeamMembers.includes(worker.id))
			.map((worker) => worker.name || worker.email)
			.join(", ");
	}, [selectedTeamMembers, workers]);

	useEffect(() => {
		const fetchWorkers = async () => {
			try {
				const response = await fetch("/api/users/workers");
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data?.error || "Failed to fetch workers");
				}

				setWorkers(
					(data?.workers || []).map((worker: { _id: string; name?: string; email: string; role?: string }) => ({
						id: worker._id,
						name: worker.name || worker.email,
						email: worker.email,
						role: worker.role,
					}))
				);
			} catch {
				setWorkers([]);
			} finally {
				setWorkersLoading(false);
			}
		};

		fetchWorkers();
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				workerDropdownRef.current &&
				!workerDropdownRef.current.contains(event.target as Node)
			) {
				setWorkersOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleTeamMember = (workerId: string) => {
		setSelectedTeamMembers((prev) =>
			prev.includes(workerId)
				? prev.filter((memberId) => memberId !== workerId)
				: [...prev, workerId]
		);
	};

	const updateFormField = <K extends keyof CreateProjectFormData>(
		key: K,
		value: CreateProjectFormData[K]
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		const teamMembers = selectedTeamMembers;

		if (!formData.name.trim()) {
			setError("Project name is required.");
			setLoading(false);
			return;
		}

		// Validate clients
		const validClients = clients.filter(c => c.name.trim());
		if (validClients.length === 0) {
			setError("At least one client with a name is required.");
			setLoading(false);
			return;
		}

		if (!formData.startDate) {
			setError("Project start date is required.");
			setLoading(false);
			return;
		}

		if (teamMembers.length === 0) {
			setError("Please select at least one team member.");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					location: formData.location.trim() || undefined,
					sheetProjectType: formData.sheetProjectType.trim() || undefined,
					description: formData.description.trim() || undefined,
					projectType: formData.projectType,
					clients: validClients.map(c => ({
						name: c.name.trim(),
						email: c.email?.trim() || undefined,
						phoneNumber: c.phoneNumber?.trim() || undefined,
					})),
					teamMembers,
					status: formData.status,
					timeline: {
						startDate: formData.startDate,
						endDate: formData.endDate || undefined,
					},
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || "Failed to create project.");
			}

			setSuccess("Project created successfully!");
			setFormData(initialFormData);
			setClients([initialClientData]);
			setSelectedTeamMembers([]);

			setTimeout(() => {
				router.push("/dashboard/projects");
			}, 1200);
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Failed to create project. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Project</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Add project details based on your project schema.
				</p>
			</div>

			<div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="md:col-span-2">
							<Label>
								Project Name <span className="text-error-500">*</span>
							</Label>
							<Input
								type="text"
								placeholder="Enter project name"
								value={formData.name}
								onChange={(e) => updateFormField("name", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div>
							<Label>Location</Label>
							<Input
								type="text"
								placeholder="Enter project location"
								value={formData.location}
								onChange={(e) => updateFormField("location", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div>
							<Label>Project Type (Sheet)</Label>
							<Input
								type="text"
								placeholder="Enter project type for sheet"
								value={formData.sheetProjectType}
								onChange={(e) => updateFormField("sheetProjectType", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div className="md:col-span-2">
							<Label>Description</Label>
							<TextArea
								placeholder="Enter project description"
								rows={4}
								value={formData.description}
								onChange={(value) => updateFormField("description", value)}
								disabled={loading}
							/>
						</div>
					<div className="md:col-span-2">
						<Label>
							Folder Type <span className="text-error-500">*</span>
						</Label>
						<select
							value={formData.projectType}
							onChange={(e) => updateFormField("projectType", e.target.value as ProjectType)}
							disabled={loading}
							className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
						>
							<option value="both">Both (Architecture & Interior)</option>
							<option value="architecture">Architecture Only</option>
							<option value="interior">Interior Only</option>
						</select>
						<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
							Select the architecture/interior folder setup for Google Drive.
						</p>
					</div>
						<div className="md:col-span-2">
							<div className="flex items-center justify-between mb-3">
								<Label>
									Clients <span className="text-error-500">*</span>
								</Label>
								<button
									type="button"
									onClick={() => setClients([...clients, initialClientData])}
									disabled={loading}
									className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
								>
									+ Add Client
								</button>
							</div>
							<div className="space-y-4">
								{clients.map((client, index) => (
									<div key={index} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
										<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
											<div>
												<Label className="text-xs">
													Name <span className="text-error-500">*</span>
												</Label>
												<Input
													type="text"
													placeholder="Client name"
													value={client.name}
													onChange={(e) => {
														setClients(clients.map((c, i) => 
															i === index ? { ...c, name: e.target.value } : c
														));
													}}
													disabled={loading}
													className="mt-1"
												/>
											</div>
											<div>
												<Label className="text-xs">Email (Optional)</Label>
												<Input
													type="email"
													placeholder="client@example.com"
													value={client.email}
													onChange={(e) => {
														setClients(clients.map((c, i) => 
															i === index ? { ...c, email: e.target.value } : c
														));
													}}
													disabled={loading}
													className="mt-1"
												/>
											</div>
											<div>
												<Label className="text-xs">Phone Number</Label>
												<Input
													type="text"
													placeholder="Phone number"
													value={client.phoneNumber}
													onChange={(e) => {
														setClients(clients.map((c, i) => 
															i === index ? { ...c, phoneNumber: e.target.value } : c
														));
													}}
													disabled={loading}
													className="mt-1"
												/>
											</div>
										</div>
										{clients.length > 1 && (
											<button
												type="button"
												onClick={() => setClients(clients.filter((_, i) => i !== index))}
												disabled={loading}
												className="absolute top-2 right-2 text-gray-400 hover:text-error-500 dark:hover:text-error-400 disabled:opacity-50"
											>
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										)}
									</div>
								))}
							</div>
						</div>

						<div>
							<Label>Status</Label>
							<select
								value={formData.status}
								onChange={(e) => updateFormField("status", e.target.value as ProjectStatus)}
								disabled={loading}
								className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
							>
								<option value="active" className="dark:bg-gray-900">Active</option>
								<option value="on hold" className="dark:bg-gray-900">On Hold</option>
								<option value="completed" className="dark:bg-gray-900">Completed</option>
							</select>
						</div>

						<div>
							<Label>
								Start Date <span className="text-error-500">*</span>
							</Label>
							<Input
								type="date"
								value={formData.startDate}
								onChange={(e) => updateFormField("startDate", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div>
							<Label>End Date</Label>
							<Input
								type="date"
								value={formData.endDate}
								onChange={(e) => updateFormField("endDate", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div className="md:col-span-2" ref={workerDropdownRef}>
							<Label>
								Team Members <span className="text-error-500">*</span>
							</Label>
							<div className="relative">
								<button
									type="button"
									onClick={() => setWorkersOpen((prev) => !prev)}
									disabled={loading || workersLoading || workers.length === 0}
									className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
								>
									<span className="truncate">
										{workersLoading
											? "Loading workers..."
											: workers.length === 0
											? "No workers available"
											: selectedWorkersText}
									</span>
									<svg
										className={`h-4 w-4 transition-transform ${workersOpen ? "rotate-180" : ""}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>

								{workersOpen && workers.length > 0 && (
									<div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
										<div className="max-h-64 overflow-auto">
											{/* Table Header */}
											<div className="sticky top-0 z-10 grid min-w-[600px] grid-cols-[48px_minmax(200px,2fr)_120px] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
												<div className="text-center"></div>
												<div>Name</div>
												<div>Role</div>
											</div>
											{/* Table Body */}
											<div>
												{workers.map((worker) => {
													const checked = selectedTeamMembers.includes(worker.id);
													return (
														<div
															key={worker.id}
															onClick={() => toggleTeamMember(worker.id)}
															className="grid min-w-[600px] grid-cols-[48px_minmax(200px,2fr)_120px_120px] gap-3 cursor-pointer items-center border-b border-gray-100 px-3 py-3 hover:bg-gray-50 last:border-0 dark:border-gray-800 dark:hover:bg-white/[0.03]"
														>
															<div className="flex justify-center">
																<Checkbox
																	checked={checked}
																	onChange={() => {}}
																/>
															</div>
															<div>
																<p className="text-sm font-medium text-gray-800 dark:text-white/90">
																	{worker.name}
																</p>
																<p className="text-xs text-gray-500 dark:text-gray-400">{worker.email}</p>
															</div>
															<div className="text-sm text-gray-600 dark:text-gray-400">
																<span className="capitalize">{worker.role || "N/A"}</span>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									</div>
								)}
							</div>
							<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
								Select one or more workers using the checkboxes.
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
							{loading ? "Creating..." : "Create Project"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
