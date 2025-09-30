
"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import CustomSearchSheet from "./CustomSearchSheet";
import MobileDaysRectangle from "./MobileDaysRectangle";

interface SearchMobileHeaderProps {
	showBackButton?: boolean;
	showTitle?: boolean;
	sourceCity?: string;
	destinationCity?: string;
	date?: string;
	activeDate?: string;
	handleDateChange?: (date: string) => void;
}

const SearchMobileHeader: React.FC<SearchMobileHeaderProps> = ({
	showBackButton = true,
	showTitle = true,
	sourceCity = "",
	destinationCity = "",
	date = "",
	activeDate = "",
	handleDateChange
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	// Create the display strings for cities and date
	const citiesInfo = sourceCity && destinationCity ? `${sourceCity} به ${destinationCity}` : "";
	const dateInfo = date || "";

	// Handle search button click - now opens sheet instead of redirecting
	const handleSearchClick = () => {
		setIsSheetOpen(true);
	};


	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 bg-[#0D5990] shadow-md font-IranYekanRegular">
				{/* Increased height of header with min-h-[64px] */}
				<div className="container max-w-[95%] mx-auto p-0 min-h-[64px] flex items-center">
					<div className="flex items-center justify-between w-full px-0">
						{/* Right side: Back button or menu - positioned flush right */}
						<div className="flex-none">
							{showBackButton ? (
								<Button
									variant="ghost"
									onClick={() => router.back()}
									className="text-white h-12 flex items-center gap-2 pr-0 hover:bg-transparent hover:text-white"
								>
									<ArrowRightIcon
										className="transition-transform"
										size={18}
										aria-hidden="true"
									/>
								</Button>
							) : (
								<Button
									variant="ghost"
									size="icon"
									className="text-white h-12 pr-0 hover:bg-transparent hover:text-white"
									asChild
								>
									<Link href="/">
										<Icon icon="majesticons:menu" width="24" height="24" />
									</Link>
								</Button>
							)}
						</div>

						{/* Middle: Search Info */}
						{showTitle ? (
							<div className="flex-1 flex justify-center items-center px-2">
								<div
									className="cursor-pointer flex flex-col justify-center py-1"
									onClick={() => router.push('https://bilit4u.com')}
								>
									{/* First row: Bus ticket with cities info */}
									<div className="font-IranYekanBold text-[14px] text-white truncate text-center">
										{citiesInfo ? `بلیط اتوبوس ${citiesInfo}` : "بلیط اتوبوس انتخاب مبدا و مقصد"}
									</div>

									{/* Second row: Date info */}
									{dateInfo && (
										<div className="font-IranYekanMedium text-[12px] text-white/80 mt-0.5 text-center">
											{dateInfo}
										</div>
									)}
								</div>
							</div>
						) : null}

						{/* Left side: Search button - positioned flush left */}
						<div className="flex-none">
							<Button
								variant="ghost"
								onClick={handleSearchClick}
								className="text-white h-12 flex items-center gap-2 pl-0 hover:bg-transparent hover:text-white"
							>
								<SearchIcon
									size={18}
									aria-hidden="true"
									className="transition-transform"
								/>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Days of Month Rectangle - Mobile Version */}
			{handleDateChange && (
				<MobileDaysRectangle
					activeDate={activeDate}
					handleDateChange={handleDateChange}
				/>
			)}

			{/* Sheet for search functionality */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent
					side="left"
					className="w-[85%] sm:max-w-md p-0 h-full"
				>
					<SheetTitle className="sr-only">جستجوی مجدد</SheetTitle>
					<CustomSearchSheet onClose={() => setIsSheetOpen(false)} />
				</SheetContent>
			</Sheet>
		</>
	);
};

export default SearchMobileHeader;