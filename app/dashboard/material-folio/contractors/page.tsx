export default function MaterialHubPage() {
	return (
		<div className="space-y-6 md:space-y-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 md:text-3xl">
					Orders
				</h1>
				<p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
					Create and Manage all supply orders
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
					<div className="mb-5">
						<h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
							Overview
						</h2>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Add the key resources your team uses most often.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
							<p className="text-sm font-medium text-gray-800 dark:text-white/90">
								Upload assets
							</p>
							<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Store logos, brand kits, and campaign files.
							</p>
						</div>

						<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
							<p className="text-sm font-medium text-gray-800 dark:text-white/90">
								Shared references
							</p>
							<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Keep common docs and templates easy to find.
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
					<h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
						Quick Actions
					</h2>

					<div className="mt-5 space-y-3">
						<div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
							Add a new material
						</div>
						<div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
							Review recent uploads
						</div>
						<div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-white/[0.02] dark:text-gray-300">
							Organize by category
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
