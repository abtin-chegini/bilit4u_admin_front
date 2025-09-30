"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SourceSearchBox from "@/components/ui/SourceSearchbox/SourceSearchbox";
import DestinationSearchBox from "@/components/ui/DestinationSearchbox/DestinationSearchbox";
import CustomDatePicker from "@/components/ui/customDatePicker/CustomDatePicker";
import { useTravelDateStore } from "@/store/TravelDateStore";
import { useSourceStore } from "@/store/SourceStore";
import { useDestinationStore } from "@/store/DestinationStore";
import { cityMapping } from "@/lib/utils";
import moment from "jalali-moment";
import { LoaderCircleIcon } from "lucide-react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomSearchSheetProps {
	onClose?: () => void;
}

const CustomSearchSheet: React.FC<CustomSearchSheetProps> = ({ onClose }) => {
	const router = useRouter();
	const [errorTitle, setErrorTitle] = useState("");
	const { travelDate, isDateValid, getTravelDateAsMoment } = useTravelDateStore();
	const [isRotating, setIsRotating] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	// Get source and destination store functions
	const {
		sourceID,
		sourceCity,
		setSourceCity,
		setValue: setSourceValue,
		value: sourceValue
	} = useSourceStore();

	const {
		destinationID,
		destinationCity,
		setDestinationCity,
		setValue: setDestinationValue,
		value: destinationValue
	} = useDestinationStore();

	useEffect(() => {
		// Check if there's a valid date in the Zustand store
		if (!travelDate || !isDateValid()) {
			// Try to get from localStorage first
			const localStorageDate = localStorage.getItem("TravelDate");

			if (localStorageDate) {
				// If found in localStorage, the DatePickerBig component will handle syncing this
				console.log("Found date in localStorage, DatePickerBig will handle this");
			} else {
				// If not in localStorage either, set to today
				console.log("No date found, setting to today");
			}
		}
	}, []);

	// Handle switching source and destination
	const handleSwitchCities = () => {
		// Trigger rotation animation
		setIsRotating(true);

		// Get current values from stores
		const tempSourceID = sourceID;
		const tempSourceCity = sourceCity;
		const tempSourceValue = sourceValue;

		const tempDestID = destinationID;
		const tempDestCity = destinationCity;
		const tempDestValue = destinationValue;

		// Check if we have valid values to swap
		if (tempSourceCity && tempSourceCity !== "شهر مبداء" &&
			tempDestCity && tempDestCity !== "شهر مقصد") {

			// Swap the values
			setSourceCity(tempDestID || "", tempDestCity);
			setSourceValue(tempDestCity);

			setDestinationCity(tempSourceID || "", tempSourceCity);
			setDestinationValue(tempSourceCity);

			console.log("Cities swapped:", {
				newSource: tempDestCity,
				newDestination: tempSourceCity
			});
		}

		// Reset rotation after animation completes
		setTimeout(() => {
			setIsRotating(false);
		}, 300);
	};

	const handleRedirect = () => {
		const sourceCityId = localStorage.getItem("sourceCityId");
		const destinationCityId = localStorage.getItem("destinationCityId");

		setIsSearching(true);
		let currentTravelDate;
		let searchDate;

		// Check if we have a valid date in the store
		if (travelDate && isDateValid()) {
			searchDate = travelDate;
			console.log("Using date from Zustand store:", searchDate);
		} else {
			// Fallback to localStorage
			searchDate = localStorage.getItem("travel-date-storage");
			console.log("Using date from localStorage:", searchDate);
		}

		// If no date is found anywhere, use today's date
		if (!searchDate) {
			searchDate = moment().format("jYYYYjMMjDD");
			console.log("No date found, using today:", searchDate);
		}

		// Helper function to safely parse searchDate
		const parseSearchDate = (dateString: string): string => {
			try {
				// First, try to parse as JSON
				const parsed = JSON.parse(dateString);
				// If it's an object with a value property, return the value
				if (parsed && typeof parsed === 'object' && parsed.value) {
					return parsed.value;
				}
				// If it's not an object with value property, return the original string
				return dateString;
			} catch (error) {
				// If JSON parsing fails, it's a simple string, return as is
				return dateString;
			}
		};

		// Parse the searchDate safely
		const TrueDate = parseSearchDate(searchDate);
		console.log("Parsed date:", TrueDate);

		// Check if the selected date is in the past
		const today = moment().startOf('day');
		const selectedDate = moment.from(TrueDate, 'fa', 'YYYYMMDD').startOf('day');

		// Check if date is in the past
		if (selectedDate.isBefore(today)) {
			setErrorTitle("شما مجاز به انتخاب روزهای گذشته نیستید");
			setIsSearching(false); // Reset loading state on error
			return;
		}

		// Check if date is more than 15 days in the future
		const maxAllowedDate = moment().add(15, 'days').startOf('day');
		if (selectedDate.isAfter(maxAllowedDate)) {
			setErrorTitle("اطلاعات بیش از ۱۵ روز موجود نیست");
			setIsSearching(false);
			return;
		}

		if (sourceCityId && destinationCityId) {
			const sourceCity = Object.keys(cityMapping).find(
				(key) => cityMapping[key] === sourceCityId
			);
			const destinationCity = Object.keys(cityMapping).find(
				(key) => cityMapping[key] === destinationCityId
			);

			if (sourceCity && destinationCity) {
				// Close the sheet first
				if (onClose) {
					onClose();
				}
				// Then navigate
				router.push(`/bus/${sourceCity}/${destinationCity}/${TrueDate}`);
			} else {
				setErrorTitle("شهرهای انتخاب شده یافت نشد");
				setIsSearching(false);
			}
		} else {
			setErrorTitle("لطفا شهرهای مبدا و مقصد را انتخاب کنید");
			setIsSearching(false);
		}
	};

	return (
		<div className="h-full flex flex-col bg-white font-IranYekanRegular">
			{/* Header with close button */}
			<div className="flex items-center justify-between p-4 border-b bg-[#0D5990] text-white" dir="rtl">
				<button
					onClick={onClose}
					className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
				>
					<Icon icon="lucide:x" width="20" height="20" />
				</button>
				<h3 className="font-IranYekanBold text-lg text-white">
					جستجوی مجدد
				</h3>
				<div className="w-8"></div> {/* Spacer for centering */}
			</div>

			{/* Search Form */}
			<div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto flex flex-col items-center">
				{/* All Inputs Container */}
				<div className="relative bg-gray-50 rounded-lg p-4 w-full max-w-md mx-auto">
					{/* Centered Inputs Wrapper - Using NavbarResponsive logic */}
					<div className="w-full flex flex-col gap-y-2 items-center">
						{/* Source and Destination with Switch Button - Same structure as NavbarResponsive */}
						<div className="relative w-full">
							<div className="flex flex-col gap-y-2">
								<SourceSearchBox />
								<DestinationSearchBox />
							</div>

							{/* Switch Button - Exact same positioning as NavbarResponsive */}
							<TooltipProvider>
								<Tooltip delayDuration={300}>
									<TooltipTrigger asChild>
										<button
											onClick={handleSwitchCities}
											className={`
												absolute left-[10px] top-1/2 transform -translate-y-1/2
												w-[42px] h-[42px] xs:w-[36px] xs:h-[36px]
												rounded-md bg-white border-2 border-gray-300
												hover:bg-gray-50 hover:border-gray-400
												active:bg-gray-100
												transition-all duration-200
												flex items-center justify-center
												shadow-md hover:shadow-lg
												disabled:opacity-50 disabled:cursor-not-allowed
												z-10
											`}
											disabled={
												!sourceCity || sourceCity === "شهر مبداء" ||
												!destinationCity || destinationCity === "شهر مقصد"
											}
										>
											<Icon
												icon="tabler:switch-vertical"
												className={`
													w-5 h-5 text-gray-700
													transition-transform duration-300
													${isRotating ? 'rotate-180' : ''}
												`}
											/>
										</button>
									</TooltipTrigger>
									<TooltipContent
										side="right"
										className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
									>
										<p>جابه جایی مبدا و مقصد</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						{/* Date picker */}
						<div className="w-full">
							<CustomDatePicker />
						</div>
					</div>
				</div>

				{/* Search Button */}
				<div className="w-full flex justify-center">
					<div className="w-full max-w-md">
						<button
							className="w-full h-14 rounded-xl justify-center items-center hover:bg-blue-700 border-0 flex flex-row gap-2 bg-[#0D5990] disabled:opacity-70 disabled:hover:bg-[#0D5990] transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
							onClick={handleRedirect}
							disabled={isSearching}
						>
							{isSearching ? (
								<>
									<LoaderCircleIcon className="h-5 w-5 animate-spin text-white" />
									<p className="text-base font-IranYekanBold text-white">
										در حال جستجو...
									</p>
								</>
							) : (
								<>
									<Icon icon="lucide:search" width="20" height="20" className="text-white" />
									<p className="text-base font-IranYekanBold text-white">
										جستجو
									</p>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Error Message */}
				{errorTitle && (
					<div className="w-full flex justify-center">
						<div className="w-full max-w-md">
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-center gap-2">
									<Icon icon="lucide:alert-circle" width="20" height="20" className="text-red-500" />
									<p className="text-red-600 text-sm font-IranYekanRegular">
										{errorTitle}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CustomSearchSheet;