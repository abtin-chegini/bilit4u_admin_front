"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import TicketCardLg from "./ticket-card-lg";
import TicketCardSm from "./ticket-card-sm";
import { ServiceDetails, OrderData } from "./ticket-card-lg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import moment from 'jalali-moment';
import { useToast } from "@/hooks/use-toast";
// import CleanRefundDialog from "./ZibalCardValidation/CleanRefundDialog";
import { motion, HTMLMotionProps } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";

// Persian digits utility
const toPersianDigits = (input: string | number): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match, 10)]);
};

// Convert Persian digits to English for search
const toEnglishDigits = (input: string): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.replace(/[۰-۹]/g, (match) => persianDigits.indexOf(match).toString());
};

// Format date to Persian
const formatToPersianDate = (dateString: string): string => {
	try {
		if (!dateString) return 'تاریخ نامشخص';

		const date = moment(dateString);
		if (!date.isValid()) {
			return dateString;
		}

		const persianMonths = [
			'فروردین', 'اردیبهشت', 'خرداد',
			'تیر', 'مرداد', 'شهریور',
			'مهر', 'آبان', 'آذر',
			'دی', 'بهمن', 'اسفند'
		];

		const jalaliDate = date.locale('fa');
		const jalaliDay = parseInt(jalaliDate.format('jD'));
		const jalaliMonth = parseInt(jalaliDate.format('jM')) - 1;
		const jalaliYear = parseInt(jalaliDate.format('jYYYY'));

		const dayOfWeek = getPersianDayOfWeek(date.day());
		const formattedDate = `${toPersianDigits(jalaliDay)} ${persianMonths[jalaliMonth]} ${toPersianDigits(jalaliYear)}`;

		return `${dayOfWeek}، ${formattedDate}`;
	} catch (error) {
		// console.error('Error formatting date to Persian:', error);
		return dateString;
	}
};

// Helper function to get Persian day of week
const getPersianDayOfWeek = (dayIndex: number): string => {
	const persianDays = [
		'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه',
		'پنج‌شنبه', 'جمعه', 'شنبه'
	];
	const safeIndex = ((dayIndex % 7) + 7) % 7;
	return persianDays[safeIndex];
};

// Helper function to check if ticket should be dimmed (only refunded tickets)
const shouldDimTicket = (ticket: any, order: any): boolean => {
	// Only check if refunded
	const isRefunded = (
		order?.LastStatus === 'Refunded' ||
		order?.LastStatus === 'REFUNDED' ||
		order?.LastStatus === 'refunded'
	);

	return isRefunded;
};

// Static variable to track if we've logged once
let hasLoggedOnce = false;

// Get payment status in Persian
const getPaymentStatusPersian = (order?: any): { text: string; color: string } => {
	// Only log for the last/most recent ticket (first one in the sorted list)
	if (!hasLoggedOnce) {
		console.log('🔍 Last ticket status debug - Order:', order?.refNum);
		console.log('📋 LastStatus:', order?.LastStatus);
		console.log('✅ isVerified:', order?.isVerified);
		console.log('🔄 Inquery:', order?.Inquery);
		console.log('💳 paymentStatus:', order?.paymentStatus);
		console.log('📊 All properties:', Object.keys(order || {}));
		hasLoggedOnce = true;
	}

	// Check if order is refunded: check LastStatus for "Refunded"
	const isRefunded = (
		order?.LastStatus === 'Refunded' ||
		order?.LastStatus === 'REFUNDED' ||
		order?.LastStatus === 'refunded'
	);

	if (isRefunded) {
		return { text: 'استرداد شده', color: 'text-yellow-600' };
	}

	// Check if paid with wallet
	if (order?.LastStatus === 'WALLET_PAID_VERIFIED') {
		return { text: 'پرداخت شده با کیف پول', color: 'text-green-600' };
	}

	// Check if order is successful: lastStatus === "DONE" and isVerified === true
	if (order?.LastStatus === 'DONE' && order?.isVerified === true) {
		return { text: 'پرداخت موفق', color: 'text-green-600' };
	}

	// Default case - unknown status
	return { text: 'نامشخص', color: 'text-red-600' };
};


interface TicketWithOrder {
	ticket: ServiceDetails;
	order?: OrderData & {
		orderId?: number;
		creationDate?: string;
		factorUrl?: string;
		seatMapURL?: string;
		totalAmount?: number;
		paymentStatus?: string;
		LastStatus?: string; // Payment status from backend (e.g., "DONE")
		Inquery?: boolean; // Whether the ticket has been refunded
		isVerified?: boolean; // Whether the order is verified
	};
}

// Filter categories with icons
const filterCategories = [
	{
		name: "all",
		displayName: "همه بلیط‌ها",
		icon: "solar:list-bold",
		apiFilter: "ALL"
	},
	{
		name: "upcoming",
		displayName: "سفرهای آینده",
		icon: "solar:calendar-bold",
		apiFilter: "Future"
	},
	{
		name: "past",
		displayName: "سفرهای گذشته",
		icon: "solar:history-bold",
		apiFilter: "Past"
	},
	{
		name: "inquiry",
		displayName: "استرداد شده",
		icon: "solar:refresh-bold",
		apiFilter: "Inquiry"
	}
];

interface TicketManagerProps {
	tickets: TicketWithOrder[];
	itemsPerPage?: number;
	showSearch?: boolean;
	showFilter?: boolean;
	busCapacity?: number;
	onFilterChange?: (filter: string) => void;
	currentApiFilter?: string;
	onRefresh?: () => void;
	isRefreshing?: boolean;
}

export const TicketManager: React.FC<TicketManagerProps> = ({
	tickets,
	itemsPerPage = 10,
	showSearch = true,
	showFilter = true,
	busCapacity = 44,
	onFilterChange,
	currentApiFilter = 'ALL',
	onRefresh,
	isRefreshing = false
}) => {
	// Reset logging flag when tickets change
	React.useEffect(() => {
		hasLoggedOnce = false;
	}, [tickets, currentApiFilter]);

	// console.log('Tickets:', tickets);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("creation");
	const [filterStatus, setFilterStatus] = useState("all");
	const { toast } = useToast();

	// Update filter status when currentApiFilter changes
	useEffect(() => {
		const getFilterStatusFromApiFilter = (apiFilter: string): string => {
			switch (apiFilter) {
				case 'ALL':
					return 'all';
				case 'Past':
					return 'past';
				case 'Future':
					return 'upcoming';
				case 'Uninquiry':
					return 'uninquiry';
				case 'Inquiry':
					return 'inquiry';
				default:
					return 'all';
			}
		};

		const newFilterStatus = getFilterStatusFromApiFilter(currentApiFilter);
		if (newFilterStatus !== filterStatus) {
			setFilterStatus(newFilterStatus);
		}
	}, [currentApiFilter, filterStatus]);

	// Handle API filter change
	const handleApiFilterChange = (value: string) => {
		// console.log('Filter changed to:', value);

		// Update local state immediately
		setFilterStatus(value);
		setCurrentPage(1);

		// Call API with appropriate filter
		if (onFilterChange) {
			let apiFilter = 'ALL';
			switch (value) {
				case 'all':
					apiFilter = 'ALL';
					break;
				case 'past':
					apiFilter = 'Past';
					break;
				case 'upcoming':
					apiFilter = 'Future';
					break;
				case 'uninquiry':
					apiFilter = 'Uninquiry';
					break;
				case 'inquiry':
					apiFilter = 'Inquiry';
					break;
				default:
					// For local filters (confirmed, pending, refunded), use ALL endpoint
					apiFilter = 'ALL';
					break;
			}
			// console.log('Calling API with filter:', apiFilter);
			onFilterChange(apiFilter);
		}
	};


	// Search and filter logic
	const filteredAndSortedTickets = useMemo(() => {
		let filtered = [...tickets];

		// Debug: Log initial tickets order
		// console.log('Initial tickets order:', tickets.map(t => ({ 
		//   refNum: t.order?.refNum, 
		//   creationDate: t.order?.creationDate,
		//   sortBy 
		// })));

		// Search functionality
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			const englishQuery = toEnglishDigits(query);

			filtered = filtered.filter(({ ticket, order }) => {
				const searchFields = [
					ticket.CoName,
					ticket.SrcCityName,
					ticket.DesCityName,
					ticket.DepartDate,
					ticket.DepartTime,
					ticket.ServiceNo,
					ticket.TicketNo,
					order?.refNum,
					order?.orderId?.toString(),
					order?.passengers?.map(p => p.name).join(' '),
					order?.passengers?.map(p => p.seatNo).join(' '),
					order?.passengers?.map(p => p.nationalCode).join(' '),
				].filter(Boolean).join(' ').toLowerCase();

				return searchFields.includes(query) ||
					searchFields.includes(englishQuery) ||
					toEnglishDigits(searchFields).includes(englishQuery);
			});
		}

		// Filter by status (only local filters when using ALL endpoint)
		if (filterStatus !== "all" && !["past", "upcoming", "uninquiry", "inquiry"].includes(filterStatus)) {
			filtered = filtered.filter(({ order }) => {
				switch (filterStatus) {
					case "confirmed":
						return order?.LastStatus === 'DONE' && order?.isVerified === true;
					case "pending":
						return !(order?.LastStatus === 'DONE' && order?.isVerified === true) &&
							!(order?.LastStatus === 'Refunded' || order?.LastStatus === 'REFUNDED' || order?.LastStatus === 'refunded');
					case "refunded":
						return order?.LastStatus === 'Refunded' || order?.LastStatus === 'REFUNDED' || order?.LastStatus === 'refunded';
					default:
						return true;
				}
			});
		}

		// Sort functionality
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "date":
					const dateA = a.ticket.DepartDate?.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) || "";
					const dateB = b.ticket.DepartDate?.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) || "";
					return new Date(dateB).getTime() - new Date(dateA).getTime();
				case "price":
					return parseInt(b.ticket.FullPrice || "0") - parseInt(a.ticket.FullPrice || "0");
				case "company":
					return (a.ticket.CoName || "").localeCompare(b.ticket.CoName || "");
				case "city":
					return (a.ticket.SrcCityName || "").localeCompare(b.ticket.SrcCityName || "");
				case "creation":
					// Debug logging for date parsing
					const creationDateA = new Date(a.order?.creationDate || 0);
					const creationDateB = new Date(b.order?.creationDate || 0);
					// console.log('Sorting by creation date:', { 
					//   a: a.order?.creationDate, 
					//   b: b.order?.creationDate, 
					//   creationDateA: creationDateA.toISOString(), 
					//   creationDateB: creationDateB.toISOString() 
					// });
					return creationDateB.getTime() - creationDateA.getTime();
				default:
					return 0;
			}
		});

		// Debug: Log final sorted order
		// console.log('Final sorted order:', filtered.map(t => ({ 
		//   refNum: t.order?.refNum, 
		//   creationDate: t.order?.creationDate,
		//   sortBy 
		// })));

		return filtered;
	}, [tickets, searchQuery, sortBy, filterStatus]);

	// Pagination logic
	const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentTickets = filteredAndSortedTickets.slice(startIndex, endIndex);

	// Pagination handlers
	const goToPage = useCallback((page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	}, [totalPages]);

	const goToFirstPage = () => goToPage(1);
	const goToLastPage = () => goToPage(totalPages);
	const goToPreviousPage = () => goToPage(currentPage - 1);
	const goToNextPage = () => goToPage(currentPage + 1);

	// Clear search and filters
	const clearFilters = () => {
		setSearchQuery("");
		setSortBy("creation");
		setFilterStatus("all");
		setCurrentPage(1);
		if (onFilterChange) {
			onFilterChange('ALL');
		}
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		const delta = 2;
		const range = [];
		const rangeWithDots = [];

		if (totalPages <= 1) return [1];

		for (let i = Math.max(2, currentPage - delta);
			i <= Math.min(totalPages - 1, currentPage + delta);
			i++) {
			range.push(i);
		}

		if (currentPage - delta > 2) {
			rangeWithDots.push(1, '...');
		} else {
			rangeWithDots.push(1);
		}

		rangeWithDots.push(...range);

		if (currentPage + delta < totalPages - 1) {
			rangeWithDots.push('...', totalPages);
		} else if (totalPages > 1) {
			rangeWithDots.push(totalPages);
		}

		return rangeWithDots;
	};

	return (
		<div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
			{/* Header */}
			<motion.div
				className="mb-6 md:mb-8"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.1 }}
			>
				<motion.h1
					className="text-xl md:text-2xl font-IranYekanBold text-gray-800 mb-2"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					سفرهای من
				</motion.h1>
				<motion.p
					className="text-sm md:text-base text-gray-600 font-IranYekanRegular"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
				>
					مجموع {toPersianDigits(filteredAndSortedTickets.length)} بلیط از {toPersianDigits(tickets.length)} بلیط
				</motion.p>
			</motion.div>

			{/* Search and Filter Section - Always visible */}
			<motion.div
				className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-4 md:mb-6 shadow-sm"
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.4 }}
			>
				<div className="space-y-6">
					{/* Mobile Layout */}
					<motion.div
						className="space-y-4 md:hidden"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						{/* Mobile Search and Clear Filters */}
						<div className="grid grid-cols-1 gap-4">
							<div className="relative">
								<Input
									type="text"
									placeholder="جستجو در نام شرکت، شهر، نام مسافر، شماره صندلی، کد ملی..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 pr-4 py-2 text-right border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular"
								/>
								<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#767676]">
										<circle cx="11" cy="11" r="8" />
										<path d="m21 21-4.35-4.35" />
									</svg>
								</div>
							</div>
						</div>

						{/* Mobile Sort and Filter */}
						<div className="grid grid-cols-2 gap-3">
							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="text-right border-[#ccd6e1] focus:border-[#0d5990] [&>span]:text-right [&>span]:w-full font-IranYekanRegular">
									<SelectValue placeholder="مرتب‌سازی" />
								</SelectTrigger>
								<SelectContent className="text-right font-IranYekanRegular" dir="rtl">
									<SelectItem value="date" className="text-right">تاریخ حرکت</SelectItem>
									<SelectItem value="creation" className="text-right">تاریخ خرید</SelectItem>
									<SelectItem value="price" className="text-right">قیمت</SelectItem>
									<SelectItem value="company" className="text-right">نام شرکت</SelectItem>
									<SelectItem value="city" className="text-right">شهر مبدا</SelectItem>
								</SelectContent>
							</Select>

							<Select value={filterCategories.find(c => c.apiFilter === currentApiFilter)?.displayName || "همه بلیط‌ها"} onValueChange={(displayName) => {
								const category = filterCategories.find(c => c.displayName === displayName);
								if (category && onFilterChange) {
									onFilterChange(category.apiFilter);
								}
							}}>
								<SelectTrigger className="text-right border-[#ccd6e1] focus:border-[#0d5990] [&>span]:text-right [&>span]:w-full font-IranYekanRegular">
									<SelectValue placeholder="فیلتر" />
								</SelectTrigger>
								<SelectContent className="text-right font-IranYekanRegular" dir="rtl">
									{filterCategories.map((category) => (
										<SelectItem key={category.name} value={category.displayName} className="text-right">
											<div className="flex items-center gap-2 flex-row-reverse">
												<Icon icon={category.icon} width="14" height="14" className="text-[#0d5990]" />
												<span>{category.displayName}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Mobile Action Buttons */}
						<div className="flex justify-between gap-3">
							<Button
								variant="outline"
								onClick={clearFilters}
								disabled={!searchQuery && sortBy === "creation" && filterStatus === "all"}
								className={`h-10 px-3 py-2 border-[#ccd6e1] transition-all duration-200 font-IranYekanRegular ${(!searchQuery && sortBy === "creation" && filterStatus === "all")
									? "text-[#ccd6e1] bg-gray-50 cursor-not-allowed opacity-60"
									: "hover:bg-[#f6f9ff] text-[#767676] hover:border-[#0d5990] cursor-pointer"
									}`}
							>
								<Icon icon="solar:close-circle-bold" className="h-4 w-4 ml-2" />
								حذف فیلتر
							</Button>

							<Button
								onClick={onRefresh}
								disabled={isRefreshing}
								className="h-10 px-3 py-2 font-IranYekanRegular bg-[#0D5990] hover:bg-[#0a4a7a] text-white"
							>
								{isRefreshing ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										بروزرسانی...
									</>
								) : (
									<>
										<Icon icon="solar:refresh-bold" className="ml-2 h-4 w-4" />
										بروزرسانی
									</>
								)}
							</Button>
						</div>
					</motion.div>

					{/* Desktop Layout */}
					<motion.div
						className="hidden md:grid md:grid-cols-4 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
					>
						{/* Search Input */}
						<motion.div
							className="relative md:col-span-2"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.6 }}
						>
							<Input
								type="text"
								placeholder="جستجو در نام شرکت، شهر، نام مسافر، شماره صندلی، کد ملی..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 pr-4 py-2 text-right border-[#ccd6e1] focus:border-[#0d5990] font-IranYekanRegular"
							/>
							<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#767676]">
									<circle cx="11" cy="11" r="8" />
									<path d="m21 21-4.35-4.35" />
								</svg>
							</div>
						</motion.div>

						{/* Sort Select */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.7 }}
						>
							<Select dir="rtl" value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="text-right border-[#ccd6e1] focus:border-[#0d5990] [&>span]:text-right [&>span]:w-full font-IranYekanRegular">
									<SelectValue placeholder="مرتب‌سازی بر اساس" />
								</SelectTrigger>
								<SelectContent className="text-right font-IranYekanRegular" dir="rtl">
									<SelectItem value="date" className="text-right">تاریخ حرکت</SelectItem>
									<SelectItem value="creation" className="text-right">تاریخ خرید</SelectItem>
									<SelectItem value="price" className="text-right">قیمت</SelectItem>
									<SelectItem value="company" className="text-right">نام شرکت</SelectItem>
									<SelectItem value="city" className="text-right">شهر مبدا</SelectItem>
								</SelectContent>
							</Select>
						</motion.div>

						{/* Clear Filters Button */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.8 }}
						>
							<Button
								variant="outline"
								onClick={clearFilters}
								disabled={!searchQuery && sortBy === "creation" && filterStatus === "all"}
								className={`w-full border-[#ccd6e1] transition-all duration-200 font-IranYekanRegular ${(!searchQuery && sortBy === "creation" && filterStatus === "all")
									? "text-[#ccd6e1] bg-gray-50 cursor-not-allowed opacity-60"
									: "hover:bg-[#f6f9ff] text-[#767676] hover:border-[#0d5990] cursor-pointer"
									}`}
							>
								<Icon icon="solar:close-circle-bold" className="h-4 w-4 ml-2" />
								حذف فیلتر
							</Button>
						</motion.div>
					</motion.div>

					{/* Desktop Filter Buttons */}
					<motion.div
						className="hidden md:block mt-4 mb-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.7 }}
					>
						<div className="flex flex-wrap gap-2 justify-between items-center">
							<div className="flex flex-wrap gap-2 justify-start items-center">
								{filterCategories.map((category) => {
									const isActive = currentApiFilter === category.apiFilter;
									return (
										<FilterButton
											key={category.name}
											isActive={isActive}
											onClick={() => onFilterChange && onFilterChange(category.apiFilter)}
										>
											<Icon icon={category.icon} width="14" height="14" />
											<span className="font-IranYekanMedium text-sm">{category.displayName}</span>
										</FilterButton>
									);
								})}
							</div>

							{/* Desktop Refresh Button */}
							<Button
								onClick={onRefresh}
								disabled={isRefreshing}
								className="font-IranYekanRegular bg-[#0D5990] hover:bg-[#0a4a7a] text-white px-4 py-2"
							>
								{isRefreshing ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										بروزرسانی...
									</>
								) : (
									<>
										<Icon icon="solar:refresh-bold" className="ml-2 h-4 w-4" />
										بروزرسانی
									</>
								)}
							</Button>
						</div>
					</motion.div>
				</div>
			</motion.div>

			{/* Results Info */}
			<motion.div
				className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.8 }}
			>
				<div className="text-xs md:text-sm text-gray-600 font-IranYekanRegular">
					{filteredAndSortedTickets.length > 0 ? (
						<>نمایش {toPersianDigits(startIndex + 1)} تا {toPersianDigits(Math.min(endIndex, filteredAndSortedTickets.length))} از {toPersianDigits(filteredAndSortedTickets.length)} بلیط</>
					) : (
						<>نمایش {toPersianDigits(0)} بلیط از {toPersianDigits(tickets.length)} بلیط</>
					)}
				</div>

				{totalPages > 1 && (
					<div className="text-xs md:text-sm text-gray-600 font-IranYekanRegular">
						صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
					</div>
				)}
			</motion.div>

			{/* Tickets Grid or Empty State */}
			{currentTickets.length > 0 ? (
				<motion.div
					className="space-y-4 md:space-y-6 mb-6 md:mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.9 }}
				>
					{currentTickets.map((item, index) => {
						const isDimmed = shouldDimTicket(item.ticket, item.order);
						return (
							<motion.div
								key={`${item.order?.refNum || 'ticket'}-${startIndex + index}`}
								className={`transition-all duration-200 ${isDimmed ? 'opacity-40 grayscale' : ''}`}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.4, delay: 1.0 + (index * 0.1) }}
							>
								{/* Order Info Card - Improved responsive design */}
								<div className={`bg-white border rounded-lg p-3 md:p-4 mb-3 md:mb-4 shadow-sm ${isDimmed ? 'border-gray-300 bg-gray-100' : 'border-gray-200'}`}>
									{/* Desktop Layout */}
									<div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-center">
										{/* Reference Number */}
										<div className="flex flex-col">
											<span className="text-xs md:text-sm text-gray-600 font-IranYekanRegular mb-1">شماره پیگیری</span>
											<span className="text-sm md:text-base text-gray-800 font-IranYekanBold">
												{item.order?.refNum || 'نامشخص'}
											</span>
										</div>

										{/* Payment Status */}
										<div className="flex flex-col">
											<span className="text-xs md:text-sm text-gray-600 font-IranYekanRegular mb-1">وضعیت پرداخت</span>
											<span className={`text-sm md:text-base font-IranYekanBold ${getPaymentStatusPersian(item.order).color}`}>
												{getPaymentStatusPersian(item.order).text}
											</span>
										</div>

										{/* Purchase Date */}
										<div className="flex flex-col">
											<span className="text-xs md:text-sm text-gray-600 font-IranYekanRegular mb-1">تاریخ خرید</span>
											<span className="text-sm md:text-base text-gray-800 font-IranYekanBold">
												{item.order?.creationDate ? formatToPersianDate(item.order.creationDate) : 'نامشخص'}
											</span>
										</div>
									</div>

									{/* Mobile Layout - Stacked Cards */}
									<div className="md:hidden space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex flex-col">
												<span className="text-xs text-gray-600 font-IranYekanRegular">شماره پیگیری</span>
												<span className="text-sm text-gray-800 font-IranYekanBold">
													{item.order?.refNum || 'نامشخص'}
												</span>
											</div>
											<div className="flex flex-col items-end">
												<span className="text-xs text-gray-600 font-IranYekanRegular">وضعیت پرداخت</span>
												<span className={`text-sm font-IranYekanBold ${getPaymentStatusPersian(item.order).color}`}>
													{getPaymentStatusPersian(item.order).text}
												</span>
											</div>
										</div>

										<div className="flex items-center justify-between">
											<div className="flex flex-col">
												<span className="text-xs text-gray-600 font-IranYekanRegular">تاریخ خرید</span>
												<span className="text-sm text-gray-800 font-IranYekanBold">
													{item.order?.creationDate ? formatToPersianDate(item.order.creationDate) : 'نامشخص'}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Mobile View - Use TicketCardSm */}
								<div className={`block md:hidden ${isDimmed ? 'pointer-events-none' : ''}`}>
									<TicketCardSm
										ticketDetails={item.ticket}
										orderData={item.order}
										busCapacity={busCapacity}
										isDimmed={isDimmed}
									/>
								</div>

								{/* Desktop View - Use TicketCardLg */}
								<div className={`hidden md:block transition-shadow duration-200 ${isDimmed ? 'pointer-events-none' : 'hover:shadow-lg'}`}>
									<TicketCardLg
										ticketDetails={item.ticket}
										orderData={item.order}
										isDimmed={isDimmed}
									/>
								</div>
							</motion.div>
						);
					})}
				</motion.div>
			) : (
				<div className="text-center py-12 md:py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
					<div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 md:w-6 md:h-6">
							<path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h2" />
							<path d="M20 16v-3a2 2 0 0 0-2-2h-4" />
							<path d="M4 15v-3a2 2 0 0 1 2-2h2" />
							<path d="M20 8v3a2 2 0 0 1-2 2h-2" />
							<path d="M9 11V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
						</svg>
					</div>
					<h3 className="text-base md:text-lg font-IranYekanBold text-gray-600 mb-2">
						{tickets.length === 0 ? "هنوز بلیطی خریداری نکرده‌اید" : "هیچ بلیطی یافت نشد"}
					</h3>
					<p className="text-sm md:text-base text-gray-500 font-IranYekanRegular px-4">
						{tickets.length === 0 ?
							"برای خرید بلیط به صفحه جستجو بروید." :
							searchQuery ?
								"نتیجه‌ای برای جستجوی شما پیدا نشد. لطفاً کلمات کلیدی دیگری امتحان کنید." :
								filterStatus === "inquiry" ?
									"در حال حاضر هیچ بلیط استرداد شده‌ای موجود نیست." :
									filterStatus === "uninquiry" ?
										"در حال حاضر هیچ بلیط فعالی موجود نیست." :
										filterStatus === "past" ?
											"در حال حاضر هیچ سفر گذشته‌ای موجود نیست." :
											filterStatus === "upcoming" ?
												"در حال حاضر هیچ سفر آینده‌ای موجود نیست." :
												"در حال حاضر هیچ بلیطی موجود نیست."
						}
					</p>
					{tickets.length === 0 ? (
						<Button
							onClick={() => window.location.href = '/'}
							className="mt-4 font-IranYekanRegular text-sm"
							size="sm"
						>
							خرید بلیط
						</Button>
					) : (
						(searchQuery || filterStatus !== "all") && (
							<Button
								onClick={clearFilters}
								className="mt-4 font-IranYekanRegular text-sm"
								variant="outline"
								size="sm"
							>
								{searchQuery ? "پاک کردن جستجو" : "مشاهده همه بلیط‌ها"}
							</Button>
						)
					)}
				</div>
			)}

			{/* Pagination - Only show if there are tickets */}
			{totalPages > 1 && currentTickets.length > 0 && (
				<motion.div
					className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 1.5 }}
				>
					<div className="flex flex-col items-center space-y-4">
						{/* Desktop Pagination */}
						<div className="hidden md:flex items-center space-x-2 space-x-reverse">
							<Button
								variant="outline"
								size="sm"
								onClick={goToFirstPage}
								disabled={currentPage === 1}
								className="font-IranYekanRegular"
							>
								اولین
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={goToPreviousPage}
								disabled={currentPage === 1}
								className="font-IranYekanRegular"
							>
								قبلی
							</Button>

							<div className="flex space-x-1 space-x-reverse">
								{getPageNumbers().map((pageNum, index) => (
									<React.Fragment key={index}>
										{pageNum === '...' ? (
											<span className="px-3 py-2 text-gray-500">...</span>
										) : (
											<Button
												variant={currentPage === pageNum ? "default" : "outline"}
												size="sm"
												onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
												className={`font-IranYekanRegular ${currentPage === pageNum
													? "bg-[#0D5990] text-white"
													: "text-gray-700"
													}`}
											>
												{toPersianDigits(pageNum)}
											</Button>
										)}
									</React.Fragment>
								))}
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={goToNextPage}
								disabled={currentPage === totalPages}
								className="font-IranYekanRegular"
							>
								بعدی
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={goToLastPage}
								disabled={currentPage === totalPages}
								className="font-IranYekanRegular"
							>
								آخرین
							</Button>
						</div>

						{/* Mobile Pagination */}
						<div className="md:hidden flex items-center justify-between w-full max-w-sm px-4">
							<Button
								variant="outline"
								size="sm"
								onClick={goToPreviousPage}
								disabled={currentPage === 1}
								className="font-IranYekanRegular text-xs px-3"
							>
								قبلی
							</Button>

							<div className="flex items-center space-x-2 space-x-reverse">
								<Select value={currentPage.toString()} onValueChange={(value) => goToPage(parseInt(value))}>
									<SelectTrigger className="w-16 h-8 font-IranYekanRegular text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
											<SelectItem key={page} value={page.toString()}>
												{toPersianDigits(page)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<span className="text-xs text-gray-600 font-IranYekanRegular">
									از {toPersianDigits(totalPages)}
								</span>
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={goToNextPage}
								disabled={currentPage === totalPages}
								className="font-IranYekanRegular text-xs px-3"
							>
								بعدی
							</Button>
						</div>

						{/* Page Size Info */}
						<div className="text-xs md:text-sm text-gray-500 font-IranYekanRegular">
							{toPersianDigits(itemsPerPage)} بلیط در هر صفحه
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
};


// Filter Button Component
const FilterButton = ({
	isActive = false,
	children,
	onClick,
	disabled = false,
	...props
}: {
	isActive?: boolean;
	onClick?: () => void;
	disabled?: boolean;
} & HTMLMotionProps<"div">) => {
	return (
		<motion.div
			className={`
				flex items-center justify-center gap-1.5 
				px-3 py-1.5 rounded-lg transition-all duration-200
				shadow-sm border-2 font-medium text-sm
				${disabled
					? "cursor-not-allowed opacity-50 border-gray-200 bg-gray-100 text-gray-400"
					: isActive
						? "cursor-pointer border-[#c4deff] bg-gradient-to-r from-[#f0f7ff] to-[#f8fbff] text-[#1a74b4] shadow-md hover:shadow-lg"
						: "cursor-pointer border-gray-200 bg-white text-gray-600 hover:border-[#c4deff] hover:bg-gray-50 hover:shadow-md"
				}
			`}
			onClick={disabled ? undefined : onClick}
			{...props}
		>
			{children}
		</motion.div>
	);
};

export default TicketManager;