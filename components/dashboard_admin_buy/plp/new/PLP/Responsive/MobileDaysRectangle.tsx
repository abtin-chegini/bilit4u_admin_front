"use client";
import React, { useState } from "react";
import useDate from "@/hooks/useDate";
import moment from "moment";
import { cx } from "class-variance-authority";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobileDaysRectangleProps {
	activeDate?: string;
	handleDateChange?: (date: string) => void;
}

const MobileDaysRectangle: React.FC<MobileDaysRectangleProps> = ({
	activeDate = "",
	handleDateChange
}) => {
	const [currentPage, setCurrentPage] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const tilesPerPage = 4;

	// Generate days array starting from today (rightmost) going to the left
	const generateDaysArray = () => {
		const days = [];
		const today = new Date();

		// Start from today (index 0) and go backwards for past days, forwards for future days
		// We'll show today + next 19 days (20 total days)
		for (let i = 0; i < 20; i++) {
			const date = moment(today).add({ day: i }).toDate().toLocaleDateString("fa-IR");
			days.push(date);
		}

		return days;
	};

	const daysArray = generateDaysArray();
	const totalPages = Math.ceil(daysArray.length / tilesPerPage);

	// Get current page tiles
	const getCurrentPageTiles = () => {
		const startIndex = currentPage * tilesPerPage;
		const endIndex = startIndex + tilesPerPage;
		return daysArray.slice(startIndex, endIndex);
	};

	// Navigation functions with animation
	const goToNextPage = () => {
		if (currentPage < totalPages - 1 && !isAnimating) {
			setIsAnimating(true);
			setCurrentPage(currentPage + 1);
			setTimeout(() => setIsAnimating(false), 300);
		}
	};

	const goToPreviousPage = () => {
		if (currentPage > 0 && !isAnimating) {
			setIsAnimating(true);
			setCurrentPage(currentPage - 1);
			setTimeout(() => setIsAnimating(false), 300);
		}
	};

	return (
		<div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-[#CCD6E1] shadow-sm font-IranYekanRegular">
			<div className="container max-w-[95%] mx-auto px-2 py-3">
				<TooltipProvider>
					<div className="flex items-center justify-between">
						{/* Left Arrow Button - Aligned to start */}
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<button
									onClick={goToPreviousPage}
									disabled={currentPage === 0 || isAnimating}
									className={cx([
										"flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ml-2",
										currentPage === 0 || isAnimating
											? "text-gray-300 cursor-not-allowed"
											: "text-[#0D5990] hover:bg-gray-100 cursor-pointer hover:scale-110 active:scale-95"
									])}
								>
									<ChevronRightIcon size={20} />
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
							>
								<p>{currentPage === 0 ? "روزهای قبلی (غیرفعال)" : "روزهای قبلی"}</p>
							</TooltipContent>
						</Tooltip>

						{/* Days Container */}
						<div className={`flex flex-row items-center gap-x-1.5 flex-1 justify-center transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
							{getCurrentPageTiles().map((dateStr, index) => {
								const { month, day, monthText } = useDate(dateStr);

								// Use activeDate if provided, otherwise use today's date
								const currentActiveDate = activeDate || new Date().toLocaleDateString("fa-IR");
								const isSelected = currentActiveDate === dateStr;

								return (
									<div
										key={`day-${currentPage}-${index}`}
										className={cx([
											"flex flex-col items-center justify-center py-2 px-2 border rounded-lg cursor-pointer min-w-[65px] flex-1 transition-all duration-200 hover:scale-105 active:scale-95",
											isSelected
												? "text-white bg-[#0D5990] font-IranYekanRegular text-sm shadow-md"
												: "border border-[#CCD6E1] text-[#0D5990] font-IranYekanRegular text-sm hover:bg-gray-50 hover:shadow-sm",
										])}
										onClick={() => handleDateChange?.(dateStr)}
									>
										<div className="font-IranYekanBold text-xs">{day}</div>
										<div className="font-IranYekanBold text-xs">{monthText}</div>
									</div>
								);
							})}
						</div>

						{/* Right Arrow Button - Aligned to end */}
						<Tooltip delayDuration={300}>
							<TooltipTrigger asChild>
								<button
									onClick={goToNextPage}
									disabled={currentPage === totalPages - 1 || isAnimating}
									className={cx([
										"flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 mr-2",
										currentPage === totalPages - 1 || isAnimating
											? "text-gray-300 cursor-not-allowed"
											: "text-[#0D5990] hover:bg-gray-100 cursor-pointer hover:scale-110 active:scale-95"
									])}
								>
									<ChevronLeftIcon size={20} />
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
							>
								<p>{currentPage === totalPages - 1 ? "روزهای بعدی (غیرفعال)" : "روزهای بعدی"}</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			</div>
		</div>
	);
};

export default MobileDaysRectangle;
