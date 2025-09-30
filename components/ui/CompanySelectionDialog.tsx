"use client";

import React, { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import companies from "@/constants/companies";
import { Company } from "@/constants/interfaces";

interface CompanySelectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedCompanies: string[];
	onSelectCompany: (companyId: string) => void;
	isMobile?: boolean; // New prop to determine if it's mobile mode
}

const CompanySelectionDialog: React.FC<CompanySelectionDialogProps> = ({
	open,
	onOpenChange,
	selectedCompanies,
	onSelectCompany,
	isMobile = false,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	// Filter companies based on search query
	const filteredCompanies = useMemo(() => {
		// In mobile mode, include "همه ی شرکت‌ها" option, in desktop mode exclude it
		const availableCompanies = isMobile
			? companies // Include all companies including "همه ی شرکت‌ها"
			: companies.filter(company => company.id !== "0"); // Exclude "همه ی شرکت‌ها"

		if (!searchQuery.trim()) return availableCompanies;

		const query = searchQuery.toLowerCase();
		return availableCompanies.filter((company) =>
			company.name.toLowerCase().includes(query)
		);
	}, [searchQuery, isMobile]);

	const handleSelectCompany = (companyId: string) => {
		if (isMobile) {
			// In mobile mode, close dialog immediately after selection
			onSelectCompany(companyId);
			handleClose();
		} else {
			// In desktop mode, keep current behavior
			onSelectCompany(companyId);
		}
	};

	const handleClose = () => {
		onOpenChange(false);
		setSearchQuery("");
	};


	return (
		<>
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[420px] w-[92vw] max-h-[75vh] p-0 [&>button]:hidden overflow-hidden sm:rounded-xl border shadow-xl">
				<DialogHeader className="px-4 py-3 border-b sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
					<div className="flex items-center justify-between">
						<button
							onClick={handleClose}
							className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition ring-1 ring-gray-200"
							aria-label="بستن"
						>
							<X className="h-4 w-4" />
						</button>
						<DialogTitle className="text-lg font-IranYekanBold text-right flex-1">
							انتخاب شرکت
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="px-4 py-3">
					{/* Search Input */}
					<div className="relative mb-3">
						<Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							placeholder="جستجوی شرکت..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pr-10 pl-10 text-right font-IranYekanRegular h-10 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 border-gray-300"
							dir="rtl"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-150 animate-fade-in"
								aria-label="پاک کردن جستجو"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>

					{/* Companies List */}
					<ScrollArea className="h-[300px]">
						<div className="space-y-2">
							{filteredCompanies.map((company, idx) => {
								const isSelected = selectedCompanies.includes(company.id);
								return (
									<div
										key={company.id}
										className={cn(
											"flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 animate-fade-in-up will-change-transform",
											isSelected
												? "bg-blue-50 border-blue-500"
												: "border-gray-200"
										)}
										onClick={() => handleSelectCompany(company.id)}
										style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleSelectCompany(company.id);
											}
										}}
									>
										{/* Selection indicator on the left */}
										<div className="flex items-center">
											<input
												type={isMobile ? "radio" : "checkbox"}
												name={isMobile ? "company-selection" : undefined}
												checked={isSelected}
												onChange={() => handleSelectCompany(company.id)}
												className={cn(
													"w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2",
													isMobile ? "rounded-full" : "rounded"
												)}
											/>
										</div>

										{/* Company Logo and Name on the right */}
										<div className="flex items-center gap-2 flex-1 justify-end">
											{/* Company Name */}
											<div className="text-right">
												<p className="font-IranYekanRegular text-gray-900 text-sm">
													{company.name}
												</p>
											</div>

											{/* Company Logo */}
											{company.logoUrl ? (
												<div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
													<img
														src={company.logoUrl}
														alt={company.name}
														className="w-full h-full object-contain"
														onError={(e) => {
															// Fallback to initial letter if image fails to load
															const target = e.target as HTMLImageElement;
															target.style.display = 'none';
															const parent = target.parentElement;
															if (parent) {
																parent.innerHTML = `<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">${company.name.charAt(0)}</div>`;
															}
														}}
													/>
												</div>
											) : (
												<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
													{company.name.charAt(0)}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{filteredCompanies.length === 0 && (
							<div className="text-center py-10 text-gray-500">
								<Search className="mx-auto mb-2 h-6 w-6 opacity-60" />
								<p className="font-IranYekanRegular">هیچ شرکتی یافت نشد</p>
							</div>
						)}
					</ScrollArea>
				</div>

					{/* Footer */}
					<div className="px-4 py-3 border-t sticky bottom-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
					<div className="text-xs text-gray-600 font-IranYekanRegular text-center">
						<p>{filteredCompanies.length} شرکت موجود</p>
						{!isMobile && selectedCompanies.length > 0 && (
							<p className="text-blue-600">{selectedCompanies.length} شرکت انتخاب شده</p>
						)}
					</div>

						<div className="mt-3">
						<Button
							type="button"
							onClick={handleClose}
								className="w-full h-10 rounded-lg font-IranYekanBold bg-[#0D5990]  text-white animate-fade-in-up"
						>
					بستن پنجره
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
		<style jsx>{`
			.animate-fade-in-up { animation: fade-in-up 240ms ease-out both; }
			.animate-fade-in { animation: fade-in 140ms ease-out both; }
			@keyframes fade-in-up {
				from { opacity: 0; transform: translateY(6px); }
				to { opacity: 1; transform: translateY(0); }
			}
			@keyframes fade-in {
				from { opacity: 0; transform: scale(0.98); }
				to { opacity: 1; transform: scale(1); }
			}
			@media (prefers-reduced-motion: reduce) {
				.animate-fade-in-up, .animate-fade-in { animation: none !important; }
			}
		`}</style>
		</>
	);
};

export default CompanySelectionDialog;
